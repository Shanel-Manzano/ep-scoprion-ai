import React, { useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Input, Select, Check, Toggle, Badge, ActionBar, Banner, useHeadingFocus } from '../ui/Primitives.jsx';
import { useApp, diffBiz, planUpdate, now, fmtHours, fmtTime, rid, clone } from '../store.jsx';
import { TIMEZONES, TIMES, SERVICE_SUGGESTIONS } from '../data.js';

function Group({ icon, title, summary, children, open, onToggle, changed, id }) {
  return (
    <section className={'card' + (open ? ' card--accent' : '')} aria-labelledby={id}>
      <div className="group__head">
        <span className="group__ico"><Icon name={icon} size={24} /></span>
        <div className="grow">
          <div className="group__t" id={id}>{title}</div>
          {changed && <Badge tone="warn" icon="pencil">You changed this</Badge>}
        </div>
        <button className={'btn btn--sm ' + (open ? 'btn--primary' : 'btn--ghost')} onClick={onToggle} aria-expanded={open}>
          {open ? <><Icon name="check" size={18} /> Done</> : <><Icon name="pencil" size={18} /> Edit</>}
        </button>
      </div>
      {!open && <div className="group__sum">{summary}</div>}
      {open && <div className="group__edit">{children}</div>}
    </section>
  );
}

const addrLine = (l) => [l.street, l.suite].filter(Boolean).join(', ') + ' · ' + l.city + ', ' + l.state + ' ' + l.zip;

export function DetailsForm() {
  const { s, mut, go, say } = useApp();
  const b = s.biz;
  const [open, setOpen] = useState(null);
  const [ack, setAck] = useState(!!s.confirmedAt);
  const [err, setErr] = useState('');
  const [newSvc, setNewSvc] = useState('');
  const [newArea, setNewArea] = useState('');
  useHeadingFocus('details');

  const base = s.applied;
  const toggle = (k) => setOpen(open === k ? null : k);
  const upd = (fn) => mut((d) => { fn(d.biz); });
  const changedIn = (keys) => diffBiz(base, b).some((c) => keys.some((k) => c.id.startsWith(k)));

  function confirm() {
    const bad = b.locations.find((l) => !l.street.trim() || !l.city.trim() || !l.zip.trim());
    if (bad) { setOpen('loc'); setErr('Please finish the address for ' + bad.label + '.'); return; }
    if (!b.name.trim()) { setOpen('biz'); setErr('Please enter your business name.'); return; }
    if (b.locations.length > 1 && b.locations.some((l) => !l.confirmed)) { setOpen('loc'); setErr('Please confirm each location with the check box.'); return; }
    if (!ack) return;
    setErr('');
    const changes = diffBiz(base, b);
    const plan = planUpdate(changes, s.demo.scenario);
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

  // ----- summaries -----
  const loc0 = b.locations[0];
  return (
    <div className="screen">
      <Head eyebrow="Step 2 of 4 · Details" title="Confirm your business details." lede="We’ve filled in what we know. Update anything that needs correcting.">
        {s.confirmedAt && <div style={{ marginTop: 16 }}><Banner tone="good" icon="checkCircle" title={'Confirmed ' + fmtTime(s.confirmedAt) + '.'}>You can change anything below and confirm again.</Banner></div>}
      </Head>

      <div className="groups">
        <Group id="g-biz" icon="briefcase" title="Business" open={open === 'biz'} onToggle={() => toggle('biz')} changed={changedIn(['name'])}
          summary={<b>{b.name}</b>}>
          <Input label="Business name as it should appear publicly" value={b.name} onChange={(e) => upd((x) => { x.name = e.target.value; })} />
        </Group>

        <Group id="g-loc" icon="mapPin" title={b.locations.length > 1 ? 'Locations' : 'Location'} open={open === 'loc'} onToggle={() => toggle('loc')} changed={changedIn(['addr', 'vis', 'new', 'rm', 'areas'])}
          summary={<>
            {b.locations.map((l) => (
              <div key={l.id}>
                <b>{l.label}</b><div className="dim">{addrLine(l)} · {l.showAddress ? 'Shown on your website' : 'Not shown publicly'}</div>
              </div>
            ))}
            <div className="dim">Areas you serve: {b.serviceAreas.join(', ') || 'None yet'}</div>
          </>}>
          {b.locations.map((l, i) => (
            <div className="loc" key={l.id}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <Input label="Name for this office" value={l.label} onChange={(e) => upd((x) => { x.locations[i].label = e.target.value; })} />
                {b.locations.length > 1 && <button className="btn btn--ghost btn--xs" onClick={() => upd((x) => { x.locations.splice(i, 1); })}><Icon name="trash" size={16} /> Remove</button>}
              </div>
              <div className="grid2">
                <Input label="Street address" autoComplete="street-address" value={l.street} onChange={(e) => upd((x) => { x.locations[i].street = e.target.value; })} />
                <Input label="Suite or unit (if any)" value={l.suite} onChange={(e) => upd((x) => { x.locations[i].suite = e.target.value; })} />
              </div>
              <div className="grid3">
                <Input label="City" value={l.city} onChange={(e) => upd((x) => { x.locations[i].city = e.target.value; })} />
                <Input label="State" value={l.state} onChange={(e) => upd((x) => { x.locations[i].state = e.target.value.toUpperCase().slice(0, 2); })} />
                <Input label="ZIP code" inputMode="numeric" value={l.zip} onChange={(e) => upd((x) => { x.locations[i].zip = e.target.value.replace(/\D/g, '').slice(0, 5); })} />
              </div>
              <Select label="Country" value={l.country} onChange={(e) => upd((x) => { x.locations[i].country = e.target.value; })}>
                <option>United States</option><option>Canada</option>
              </Select>
              <Toggle checked={l.showAddress} onChange={(e) => upd((x) => { x.locations[i].showAddress = e.target.checked; })}>Show this address on my website</Toggle>
              {b.locations.length > 1 && <Check checked={!!l.confirmed} onChange={(e) => upd((x) => { x.locations[i].confirmed = e.target.checked; })}>This location is correct.</Check>}
            </div>
          ))}
          <div><button className="btn btn--ghost btn--sm" onClick={() => upd((x) => { x.locations.push({ ...clone(x.locations[0]), id: 'loc' + rid(), label: 'New office', street: '', suite: '', city: '', zip: '', confirmed: false }); })}><Icon name="plus" size={18} /> Add another office</button></div>
          <div className="field">
            <label>Areas you serve</label>
            <div className="hint">Cities or counties you work in. These are separate from your office addresses.</div>
            <div className="row">
              {b.serviceAreas.map((a) => <span className="chip" key={a}>{a}<button aria-label={'Remove ' + a} onClick={() => upd((x) => { x.serviceAreas = x.serviceAreas.filter((y) => y !== a); })}><Icon name="x" size={16} /></button></span>)}
            </div>
            <div className="row">
              <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Add a city or county" value={newArea} onChange={(e) => setNewArea(e.target.value)} aria-label="Add an area you serve"
                onKeyDown={(e) => { if (e.key === 'Enter' && newArea.trim()) { upd((x) => { x.serviceAreas.push(newArea.trim()); }); setNewArea(''); } }} />
              <button className="btn btn--soft btn--sm" disabled={!newArea.trim()} onClick={() => { upd((x) => { x.serviceAreas.push(newArea.trim()); }); setNewArea(''); }}><Icon name="plus" size={18} /> Add</button>
            </div>
          </div>
        </Group>

        <Group id="g-contact" icon="phone" title="Contact" open={open === 'contact'} onToggle={() => toggle('contact')} changed={changedIn(['phone', 'email', 'showPhone', 'showEmail'])}
          summary={<>
            <div><b>{b.phone}</b> <span className="dim">· {b.showPhone ? 'Shown on your website' : 'Hidden'}</span></div>
            <div><b>{b.email}</b> <span className="dim">· {b.showEmail ? 'Shown on your website' : 'Hidden'}</span></div>
          </>}>
          <Input label="Public phone number" type="tel" value={b.phone} onChange={(e) => upd((x) => { x.phone = e.target.value; })} hint="The number people see. You choose where calls ring later, in Launch." />
          <Toggle checked={b.showPhone} onChange={(e) => upd((x) => { x.showPhone = e.target.checked; })}>Show this phone number</Toggle>
          <Input label="Public email" type="email" value={b.email} onChange={(e) => upd((x) => { x.email = e.target.value; })} hint="Only needed if you want an email shown on your website." />
          <Toggle checked={b.showEmail} onChange={(e) => upd((x) => { x.showEmail = e.target.checked; })}>Show this email</Toggle>
        </Group>

        <Group id="g-hours" icon="clock" title="Hours" open={open === 'hours'} onToggle={() => toggle('hours')} changed={changedIn(['hrs', 'tz'])}
          summary={b.locations.map((l) => (
            <div key={l.id}>
              {b.locations.length > 1 && <b>{l.label}</b>}
              <div className="dim">Mon to Fri: {fmtHours(l.hours.weekdays)} · Sat: {fmtHours(l.hours.sat)} · Sun: {fmtHours(l.hours.sun)} · {l.tz} time</div>
            </div>
          ))}>
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
        </Group>

        <Group id="g-svc" icon="list" title="Practice areas" open={open === 'svc'} onToggle={() => toggle('svc')} changed={changedIn(['svc', 'pri'])}
          summary={<>
            <div>{b.services.map((x) => x.name).join(', ')}</div>
            <div className="dim">{b.services.filter((x) => x.priority).length ? 'Featured: ' + b.services.filter((x) => x.priority).map((x) => x.name).join(', ') : 'Nothing featured yet'} · Free first consultation: {b.freeConsult ? 'Yes' : 'No'}</div>
          </>}>
          <div className="field">
            <label>What you offer</label>
            <div className="row">
              {b.services.map((x) => <span className="chip" key={x.name}>{x.name}<button aria-label={'Remove ' + x.name} onClick={() => upd((y) => { y.services = y.services.filter((z) => z.name !== x.name); })}><Icon name="x" size={16} /></button></span>)}
            </div>
            <div className="row">
              <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Add a practice area" value={newSvc} onChange={(e) => setNewSvc(e.target.value)} aria-label="Add a practice area"
                onKeyDown={(e) => { if (e.key === 'Enter' && newSvc.trim()) { upd((x) => { x.services.push({ name: newSvc.trim(), priority: false }); }); setNewSvc(''); } }} />
              <button className="btn btn--soft btn--sm" disabled={!newSvc.trim()} onClick={() => { upd((x) => { x.services.push({ name: newSvc.trim(), priority: false }); }); setNewSvc(''); }}><Icon name="plus" size={18} /> Add</button>
            </div>
            <div className="row">
              {SERVICE_SUGGESTIONS.filter((n) => !b.services.find((x) => x.name === n)).slice(0, 3).map((n) => (
                <button key={n} className="chip" onClick={() => upd((x) => { x.services.push({ name: n, priority: false }); })}><Icon name="plus" size={15} /> {n}</button>
              ))}
            </div>
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
        </Group>

        <Group id="g-team" icon="users" title="Your team" open={open === 'team'} onToggle={() => toggle('team')} changed={changedIn(['tm'])}
          summary={b.team.map((t) => <div key={t.id}><b>{t.name}</b> <span className="dim">· {t.cred}</span></div>)}>
          {b.team.map((t, i) => (
            <div className="loc" key={t.id}>
              <div className="grid2">
                <Input label="Name" value={t.name} onChange={(e) => upd((x) => { x.team[i].name = e.target.value; })} />
                <Input label="Title or credentials" value={t.cred} onChange={(e) => upd((x) => { x.team[i].cred = e.target.value; })} />
              </div>
              <div><button className="btn btn--ghost btn--xs" onClick={() => upd((x) => { x.team.splice(i, 1); })}><Icon name="trash" size={16} /> Remove</button></div>
            </div>
          ))}
          <div><button className="btn btn--ghost btn--sm" onClick={() => upd((x) => { x.team.push({ id: 't' + rid(), name: '', cred: '' }); })}><Icon name="plus" size={18} /> Add a team member</button></div>
        </Group>
      </div>

      {err && <div style={{ marginTop: 14 }}><Banner tone="bad" icon="alert">{err}</Banner></div>}

      <ActionBar msg={
        <div className="confirmbar">
          <Check checked={ack} onChange={(e) => { setAck(e.target.checked); setErr(''); }}>
            <b>These details are correct.</b><span className="muted"> We’ll use them on your website and in AI MAX.</span>
          </Check>
        </div>}>
        <button className="btn btn--primary" disabled={!ack} onClick={confirm}>{s.confirmedAt ? 'Save & Continue' : 'Confirm & Continue'} <Icon name="arrowRight" size={20} /></button>
      </ActionBar>
    </div>
  );
}
