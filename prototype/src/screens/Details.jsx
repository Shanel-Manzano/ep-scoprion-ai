import React, { useEffect, useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Input, Select, Check, Toggle, Banner, ActionBar, useHeadingFocus } from '../ui/Primitives.jsx';
import { DetailTile, Progress, Sheet } from '../ui/Cards.jsx';
import { useApp, diffBiz, planUpdate, now, fmtHours, fmtTime, rid, clone } from '../store.jsx';
import { TIMEZONES, TIMES, SERVICE_SUGGESTIONS } from '../data.js';

const addrLine = (l) => [l.street, l.suite].filter(Boolean).join(', ') + ' · ' + l.city + ', ' + l.state + ' ' + l.zip;
const CARDS = [
  { key: 'biz', icon: 'briefcase', title: 'Business name', changed: ['name'] },
  { key: 'loc', icon: 'mapPin', title: 'Locations', changed: ['addr', 'vis', 'new', 'rm', 'areas'] },
  { key: 'contact', icon: 'phone', title: 'Phone and email', changed: ['phone', 'email', 'showPhone', 'showEmail'] },
  { key: 'hours', icon: 'clock', title: 'Hours', changed: ['hrs', 'tz'] },
  { key: 'svc', icon: 'list', title: 'Practice areas', changed: ['svc', 'pri'] },
  { key: 'team', icon: 'users', title: 'Your team', changed: ['tm'] },
];

export function DetailsForm() {
  const { s, mut, go } = useApp();
  const b = s.biz;
  const [sheet, setSheet] = useState(null);
  const [err, setErr] = useState('');
  const [newSvc, setNewSvc] = useState('');
  const [newArea, setNewArea] = useState('');
  useHeadingFocus('details');

  const base = s.applied;
  const reviewed = s.flags.reviewed || {};
  const doneCount = CARDS.filter((c) => reviewed[c.key]).length;
  const all = doneCount === CARDS.length;
  const upd = (fn) => mut((d) => { fn(d.biz); });
  const mark = (k, v = true) => mut((d) => { d.flags.reviewed = { ...(d.flags.reviewed || {}), [k]: v }; });
  const markAll = () => mut((d) => { d.flags.reviewed = Object.fromEntries(CARDS.map((c) => [c.key, true])); });
  const diffs = diffBiz(base, b);
  const changedIn = (keys) => diffs.some((c) => keys.some((k) => c.id.startsWith(k)));

  // coming back after confirming: everything already counts as checked
  useEffect(() => { if (s.confirmedAt && !s.flags.reviewed) markAll(); }, []); // eslint-disable-line

  function confirm() {
    const bad = b.locations.find((l) => !l.street.trim() || !l.city.trim() || !l.zip.trim());
    if (bad) { setSheet('loc'); setErr('Please finish the address for ' + bad.label + '.'); return; }
    if (!b.name.trim()) { setSheet('biz'); setErr('Please enter your business name.'); return; }
    setErr('');
    const plan = planUpdate(diffs, s.demo.scenario);
    mut((d) => {
      d.confirmedAt = now();
      d.changes = plan.list;
      d.update = { state: plan.state, startedAt: now() };
      if (plan.state === 'none') { d.draftedAt = now(); d.applied = clone(d.biz); d.route = { stage: 'website', view: 'review' }; }
      else if (plan.state === 'applying') d.route = { stage: 'website', view: 'applying' };
      else d.route = { stage: 'website', view: 'updating' };
      d.flags.justConfirmed = plan.state;
    });
    window.scrollTo(0, 0);
  }

  const loc0 = b.locations[0];
  const summaries = {
    biz: <b>{b.name}</b>,
    loc: <><b>{loc0.label}</b><div className="dim">{loc0.street}{loc0.suite ? ', ' + loc0.suite : ''}</div><div className="dim">{b.locations.length > 1 ? '+ ' + (b.locations.length - 1) + ' more · ' : ''}{b.serviceAreas.length} areas served</div></>,
    contact: <><b>{b.phone}</b><div className="dim">{b.email}</div></>,
    hours: <><b>Mon to Fri {fmtHours(loc0.hours.weekdays)}</b><div className="dim">Sat {fmtHours(loc0.hours.sat)} · Sun {fmtHours(loc0.hours.sun)}</div></>,
    svc: <><b>{b.services.length} practice areas</b><div className="dim">{b.services.filter((x) => x.priority).map((x) => x.name).join(', ') || b.services.slice(0, 2).map((x) => x.name).join(', ')}</div></>,
    team: <><b>{b.team.map((t) => t.name).join(', ')}</b><div className="dim">{b.team.length} on your website</div></>,
  };

  const editors = {
    biz: <Input label="Business name as it should appear publicly" value={b.name} onChange={(e) => upd((x) => { x.name = e.target.value; })} />,
    loc: <>
      {b.locations.map((l, i) => (
        <div className="loc" key={l.id}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <div className="grow"><Input label="Name for this office" value={l.label} onChange={(e) => upd((x) => { x.locations[i].label = e.target.value; })} /></div>
            {b.locations.length > 1 && <button className="btn btn--ghost btn--xs" onClick={() => upd((x) => { x.locations.splice(i, 1); })}><Icon name="trash" size={16} /> Remove</button>}
          </div>
          <Input label="Street address" autoComplete="street-address" value={l.street} onChange={(e) => upd((x) => { x.locations[i].street = e.target.value; })} />
          <Input label="Suite or unit (if any)" value={l.suite} onChange={(e) => upd((x) => { x.locations[i].suite = e.target.value; })} />
          <div className="grid3">
            <Input label="City" value={l.city} onChange={(e) => upd((x) => { x.locations[i].city = e.target.value; })} />
            <Input label="State" value={l.state} onChange={(e) => upd((x) => { x.locations[i].state = e.target.value.toUpperCase().slice(0, 2); })} />
            <Input label="ZIP code" inputMode="numeric" value={l.zip} onChange={(e) => upd((x) => { x.locations[i].zip = e.target.value.replace(/\D/g, '').slice(0, 5); })} />
          </div>
          <Select label="Country" value={l.country} onChange={(e) => upd((x) => { x.locations[i].country = e.target.value; })}><option>United States</option><option>Canada</option></Select>
          <Toggle checked={l.showAddress} onChange={(e) => upd((x) => { x.locations[i].showAddress = e.target.checked; })}>Show this address on my website</Toggle>
        </div>
      ))}
      <div><button className="btn btn--ghost btn--sm" onClick={() => upd((x) => { x.locations.push({ ...clone(x.locations[0]), id: 'loc' + rid(), label: 'New office', street: '', suite: '', city: '', zip: '' }); })}><Icon name="plus" size={18} /> Add another office</button></div>
      <div className="field">
        <label>Areas you serve</label>
        <div className="hint">Cities or counties you work in. These are separate from your office addresses.</div>
        <div className="row">{b.serviceAreas.map((a) => <span className="chip" key={a}>{a}<button aria-label={'Remove ' + a} onClick={() => upd((x) => { x.serviceAreas = x.serviceAreas.filter((y) => y !== a); })}><Icon name="x" size={16} /></button></span>)}</div>
        <div className="row">
          <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Add a city or county" value={newArea} onChange={(e) => setNewArea(e.target.value)} aria-label="Add an area you serve"
            onKeyDown={(e) => { if (e.key === 'Enter' && newArea.trim()) { upd((x) => { x.serviceAreas.push(newArea.trim()); }); setNewArea(''); } }} />
          <button className="btn btn--soft btn--sm" disabled={!newArea.trim()} onClick={() => { upd((x) => { x.serviceAreas.push(newArea.trim()); }); setNewArea(''); }}><Icon name="plus" size={18} /> Add</button>
        </div>
      </div>
    </>,
    contact: <>
      <Input label="Phone number" type="tel" value={b.phone} onChange={(e) => upd((x) => { x.phone = e.target.value; })} hint="The number people see. You choose where calls ring later." />
      <Toggle checked={b.showPhone} onChange={(e) => upd((x) => { x.showPhone = e.target.checked; })}>Show this phone number</Toggle>
      <Input label="Email" type="email" value={b.email} onChange={(e) => upd((x) => { x.email = e.target.value; })} hint="Only needed if you want an email shown on your website." />
      <Toggle checked={b.showEmail} onChange={(e) => upd((x) => { x.showEmail = e.target.checked; })}>Show this email</Toggle>
    </>,
    hours: <>
      {b.locations.map((l, i) => (
        <div className="loc" key={l.id}>
          {b.locations.length > 1 && <b>{l.label}</b>}
          {[['weekdays', 'Mon to Fri'], ['sat', 'Saturday'], ['sun', 'Sunday']].map(([k, nm]) => (
            <div className="hoursrow" key={k}>
              <b>{nm}</b>
              <select className="select" aria-label={nm + ' opens'} disabled={l.hours[k].closed} value={l.hours[k].open} onChange={(e) => upd((x) => { x.locations[i].hours[k].open = e.target.value; })}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select>
              <select className="select" aria-label={nm + ' closes'} disabled={l.hours[k].closed} value={l.hours[k].close} onChange={(e) => upd((x) => { x.locations[i].hours[k].close = e.target.value; })}>{TIMES.map((t) => <option key={t}>{t}</option>)}</select>
              <Toggle checked={l.hours[k].closed} onChange={(e) => upd((x) => { x.locations[i].hours[k].closed = e.target.checked; })}>Closed</Toggle>
            </div>
          ))}
          <Select label="Time zone" value={l.tz} onChange={(e) => upd((x) => { x.locations[i].tz = e.target.value; })}>{TIMEZONES.map((t) => <option key={t}>{t}</option>)}</Select>
        </div>
      ))}
    </>,
    svc: <>
      <div className="field">
        <label>What you offer</label>
        <div className="row">{b.services.map((x) => <span className="chip" key={x.name}>{x.name}<button aria-label={'Remove ' + x.name} onClick={() => upd((y) => { y.services = y.services.filter((z) => z.name !== x.name); })}><Icon name="x" size={16} /></button></span>)}</div>
        <div className="row">
          <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Add a practice area" value={newSvc} onChange={(e) => setNewSvc(e.target.value)} aria-label="Add a practice area"
            onKeyDown={(e) => { if (e.key === 'Enter' && newSvc.trim()) { upd((x) => { x.services.push({ name: newSvc.trim(), priority: false }); }); setNewSvc(''); } }} />
          <button className="btn btn--soft btn--sm" disabled={!newSvc.trim()} onClick={() => { upd((x) => { x.services.push({ name: newSvc.trim(), priority: false }); }); setNewSvc(''); }}><Icon name="plus" size={18} /> Add</button>
        </div>
        <div className="row">{SERVICE_SUGGESTIONS.filter((n) => !b.services.find((x) => x.name === n)).slice(0, 3).map((n) => <button key={n} className="chip" onClick={() => upd((x) => { x.services.push({ name: n, priority: false }); })}><Icon name="plus" size={15} /> {n}</button>)}</div>
      </div>
      <div className="field">
        <label>Which ones matter most?</label>
        <div className="hint">Tap up to three. They get extra room on your website.</div>
        <div className="row">
          {b.services.map((x) => {
            const count = b.services.filter((y) => y.priority).length;
            return <button key={x.name} className={'chip' + (x.priority ? ' is-on' : '')} aria-pressed={x.priority} disabled={!x.priority && count >= 3}
              onClick={() => upd((y) => { const t = y.services.find((z) => z.name === x.name); t.priority = !t.priority; })}><Icon name={x.priority ? 'star' : 'plus'} size={15} /> {x.name}</button>;
          })}
        </div>
      </div>
      <div className="field">
        <label>Do you offer a free first consultation?</label>
        <div><div className="seg" role="group" aria-label="Free first consultation">
          <button className={b.freeConsult ? 'is-on' : ''} onClick={() => upd((x) => { x.freeConsult = true; })}>Yes</button>
          <button className={!b.freeConsult ? 'is-on' : ''} onClick={() => upd((x) => { x.freeConsult = false; })}>No</button>
        </div></div>
      </div>
    </>,
    team: <>
      {b.team.map((t, i) => (
        <div className="loc" key={t.id}>
          <Input label="Name" value={t.name} onChange={(e) => upd((x) => { x.team[i].name = e.target.value; })} />
          <Input label="Title or credentials" value={t.cred} onChange={(e) => upd((x) => { x.team[i].cred = e.target.value; })} />
          <div><button className="btn btn--ghost btn--xs" onClick={() => upd((x) => { x.team.splice(i, 1); })}><Icon name="trash" size={16} /> Remove</button></div>
        </div>
      ))}
      <div><button className="btn btn--ghost btn--sm" onClick={() => upd((x) => { x.team.push({ id: 't' + rid(), name: '', cred: '' }); })}><Icon name="plus" size={18} /> Add a team member</button></div>
    </>,
  };

  const open = CARDS.find((c) => c.key === sheet);
  return (
    <div className="screen">
      <Head eyebrow="Step 2 of 4 · Details" title="Confirm your business details." lede="We’ve filled in what we know. Confirm each one, or change what isn’t right.">
        {s.confirmedAt && <div style={{ marginTop: 16 }}><Banner tone="good" icon="checkCircle" title={'Confirmed ' + fmtTime(s.confirmedAt) + '.'}>You can change anything and confirm again.</Banner></div>}
      </Head>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="grow" style={{ minWidth: 240 }}><Progress done={doneCount} total={CARDS.length} label={doneCount + ' of ' + CARDS.length + ' checked'} /></div>
        {!all && <button className="btn btn--tint btn--sm" style={{ marginBottom: 26 }} onClick={markAll}><Icon name="check" size={18} stroke={3} /> Everything looks right</button>}
      </div>

      <div className="dgrid">
        {CARDS.map((c) => (
          <DetailTile key={c.key} icon={c.icon} title={c.title} checked={!!reviewed[c.key]}
            onYes={() => mark(c.key)} onChange={() => setSheet(c.key)}>
            {summaries[c.key]}
          </DetailTile>
        ))}
      </div>

      {err && <div style={{ marginTop: 18 }}><Banner tone="bad" icon="alert">{err}</Banner></div>}

      {open && (
        <Sheet title={open.title} icon={open.icon} doneLabel="Save and close" onClose={() => setSheet(null)} onDone={() => { mark(open.key); setSheet(null); setErr(''); }}>
          {editors[open.key]}
        </Sheet>
      )}

      <ActionBar msg={all ? <>All checked. <b>One last click</b> and we’ll use these details.</> : <><b>{CARDS.length - doneCount} left</b> to check.</>}>
        <button className="btn btn--primary" disabled={!all} onClick={confirm}>{s.confirmedAt ? 'Save & Continue' : 'Confirm & Continue'} <Icon name="arrowRight" size={20} /></button>
      </ActionBar>
    </div>
  );
}
