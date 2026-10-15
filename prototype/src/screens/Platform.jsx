import React, { useEffect, useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Input, Select, Badge, Banner, Tick, Modal, useHeadingFocus } from '../ui/Primitives.jsx';
import { TaskCard, Progress, Sheet } from '../ui/Cards.jsx';
import { useApp, platformItems, now, fmtHours, fmtTime } from '../store.jsx';
import { SOCIALS, CRM_OPTIONS, CLIENT } from '../data.js';

// A stand-in for the provider's own sign-in and permission screens.
function ConnectFlow({ name, pick, accounts, scopes, onDone, onClose }) {
  const [step, setStep] = useState('auth');
  const [sel, setSel] = useState(accounts && accounts[0]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (step === 'work') { const t = setTimeout(() => setStep('pick'), 1400); return () => clearTimeout(t); } return undefined; }, [step]);
  return (
    <div className="modal">
      <div className="scrim" onClick={onClose} />
      <div className="oauth" role="dialog" aria-modal="true" aria-label={'Connect ' + name} style={{ position: 'relative', zIndex: 2 }}>
        {step === 'auth' && (
          <>
            <h3>{name} is asking for permission.</h3>
            <p>AI MAX would like to:</p>
            <ul style={{ paddingLeft: 20, display: 'grid', gap: 6, margin: 0 }}>{scopes.map((x) => <li key={x}>{x}</li>)}</ul>
            <p style={{ fontSize: 15 }}>You can disconnect at any time.</p>
            <div className="row"><button className="btn btn--primary" onClick={() => setStep('work')}>Allow</button><button className="btn btn--ghost" style={{ color: '#1f1f1f', borderColor: '#c9cce0' }} onClick={onClose}>Cancel</button></div>
          </>
        )}
        {step === 'work' && <div className="center" style={{ minHeight: 180, color: '#1f1f1f' }}><Spinner2 /><b>Connecting…</b></div>}
        {step === 'pick' && (
          <>
            <h3>{pick}.</h3>
            <p>We found these. Pick the one that matches your business.</p>
            <div className="optlist" role="radiogroup">
              {accounts.map((a) => <button key={a} role="radio" aria-checked={sel === a} className={'opt' + (sel === a ? ' is-on' : '')} onClick={() => setSel(a)}><span className="radio" />{a}</button>)}
            </div>
            <div className="row"><button className="btn btn--primary" disabled={!sel || busy} onClick={() => { setBusy(true); onDone(sel); }}>Connect this one</button><button className="btn btn--ghost" style={{ color: '#1f1f1f', borderColor: '#c9cce0' }} onClick={onClose}>Cancel</button></div>
          </>
        )}
      </div>
    </div>
  );
}
function Spinner2() { return <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4, borderColor: '#dfe2ef', borderTopColor: '#1566e0' }} />; }

function Row({ item, status, account, onConnect, onNone, onUndo, onHelp }) {
  return (
    <div className="acct">
      <span className="acct__ico"><Icon name={item.icon} size={22} /></span>
      <div className="grow">
        <b>{item.name}</b>
        <div className="small muted">
          {status === 'connected' ? <>Connected · {account}</> : status === 'none' ? 'You don’t have this account.' : 'Not connected yet.'}
        </div>
      </div>
      {status === 'connected' && <><Badge tone="good" icon="check">Connected</Badge><button className="btn btn--ghost btn--xs" onClick={onUndo}>Change</button></>}
      {status === 'none' && <><Badge>No account</Badge><button className="btn btn--ghost btn--xs" onClick={onUndo}>I have one now</button></>}
      {status === 'idle' && (
        <div className="row">
          <button className="btn btn--primary btn--sm" onClick={onConnect}><Icon name="plug" size={18} /> Connect</button>
          <button className="btn btn--ghost btn--sm" onClick={onNone}>I don’t have this</button>
          <button className="linkbtn small" onClick={onHelp}>Need help?</button>
        </div>
      )}
    </div>
  );
}

function Item({ id, icon, title, done, state, children, open, onToggle, doneLabel }) {
  return (
    <section className={'setup__item' + (open ? ' is-open' : '')}>
      <button className="acc__head" onClick={onToggle} aria-expanded={open}>
        <Tick state={done ? 'done' : state === 'warn' ? 'warn' : 'todo'} />
        <span className="grow"><span className="acc__t">{title}</span>{doneLabel && <div className="acc__s">{doneLabel}</div>}</span>
        {done ? <Badge tone="good">Done</Badge> : state === 'warn' ? <Badge tone="warn">Almost</Badge> : <Badge>To do</Badge>}
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={22} />
      </button>
      {open && <div className="acc__body">{children}</div>}
    </section>
  );
}

export function Platform({ onHelp }) {
  const { s, mut, say } = useApp();
  const p = s.platform;
  const pi = platformItems(s);
  const done = Object.values(pi).filter(Boolean).length;
  const [sheet, setSheet] = useState(null);
  const [flow, setFlow] = useState(null);
  const [otherCrm, setOtherCrm] = useState(p.crm.other);
  const [amt, setAmt] = useState(p.revenue.amount);
  useHeadingFocus('platform');

  useEffect(() => {
    if (done === 6 && !p.doneAt) mut((d) => { d.platform.doneAt = now(); });
  }, [done]); // eslint-disable-line

  const b = s.biz, l0 = b.locations[0];
  const connectSocial = (k, acc) => { mut((d) => { d.platform[k] = { status: 'connected', account: acc }; }); setFlow(null); say('Connected.'); };
  const crmConnect = () => { mut((d) => { d.platform.crm.state = 'connected'; }); setFlow(null); say(p.crm.choice + ' is connected.'); };
  const crmState = p.crm.state;
  const socialCount = SOCIALS.filter((x) => ['connected', 'none'].includes(p[x.key].status)).length;
  const crmLabel = { connected: p.crm.choice + ' is connected.', no_software: 'You don’t use business software.', other: 'Noted: ' + p.crm.other + '. Not connected.', selected: p.crm.choice + ' chosen. Not connected yet.', deferred: 'You’ll decide later.', none: 'Choose the software you use.' }[crmState];

  const cards = [
    { key: 'd', icon: 'briefcase', title: 'Business details', done: true, text: <><b>{b.name}</b><div className="dim">{l0.city}, {l0.state}</div></> },
    { key: 'h', icon: 'clock', title: 'Business hours', done: true, text: <><b>Mon to Fri {fmtHours(l0.hours.weekdays)}</b><div className="dim">{l0.tz} time</div></> },
    { key: 's', icon: 'list', title: 'What you do', done: true, text: <><b>{b.services.length} practice areas</b><div className="dim">{b.services.slice(0, 3).map((x) => x.name).join(', ')} and more</div></> },
    { key: 'social', icon: 'mapPin', title: 'Google and social accounts', meta: '2 min', done: pi.social, warn: !pi.social && socialCount > 0, badge: pi.social ? 'Done' : socialCount ? socialCount + ' of 3' : 'To do',
      text: <><b>{pi.social ? 'All set.' : 'Connect Google, Facebook, and Instagram.'}</b><div className="dim">{pi.social ? 'Connected or marked as not used.' : 'Connect what you use. Skip what you don’t.'}</div></> },
    { key: 'crm', icon: 'plug', title: 'Your business software', meta: '3 min', done: pi.crm, warn: crmState === 'selected' || crmState === 'deferred', badge: pi.crm ? 'Done' : crmState === 'selected' ? 'Not connected' : crmState === 'deferred' ? 'Later' : 'To do',
      text: <><b>{crmLabel}</b><div className="dim">Where you keep track of people who contact you.</div></> },
    { key: 'revenue', icon: 'trendingUp', title: 'Revenue goal', meta: '2 min', done: pi.revenue,
      text: pi.revenue ? <><b>${Number(p.revenue.amount).toLocaleString('en-US')} per {p.revenue.period}</b><div className="dim">AI MAX shows your progress toward this.</div></> : <><b>What would you like to grow toward?</b><div className="dim">Takes about a minute.</div></> },
  ];
  const view = (k) => ['d', 'h', 's'].includes(k);
  const features = [
    { t: 'Reviews and your Google listing', need: 'Connect Google', on: p.google.status === 'connected' },
    { t: 'Social posts', need: 'Connect Facebook or Instagram', on: p.facebook.status === 'connected' || p.instagram.status === 'connected' },
    { t: 'Inquiries in your software', need: 'Connect your software', on: crmState === 'connected' },
    { t: 'Progress toward your goal', need: 'Enter your revenue goal', on: p.revenue.saved },
  ];
  const open = cards.find((c) => c.key === sheet);

  return (
    <div className="screen">
      <Head eyebrow="AI MAX · Your setup" title="Finish setting up AI MAX." lede="Your website is live. Connect what you use and skip what you don’t. Your progress saves as you go.">
        {p.doneAt && <div style={{ marginTop: 16 }}><Banner tone="good" icon="checkCircle" title="Your setup is complete.">Everything is connected or marked as not needed.</Banner></div>}
      </Head>
      <Progress done={done} total={6} label={done + ' of 6 done'} />

      <div className="tgrid">
        {cards.map((c) => (
          <TaskCard key={c.key} icon={c.icon} title={c.title} meta={c.done ? null : c.meta} status={c.done ? 'done' : c.warn ? 'warn' : 'todo'} badge={c.badge}
            actions={<button className={'btn btn--sm ' + (c.done ? 'btn--ghost' : 'btn--primary')} onClick={() => setSheet(c.key)}>{view(c.key) ? 'View' : c.done ? 'Change' : c.warn ? 'Continue' : 'Start'}</button>}>
            {c.text}
          </TaskCard>
        ))}
      </div>

      <h2 className="h2" style={{ marginTop: 36 }}>Turns on as you connect</h2>
      <div className="unlocks">
        {features.map((f) => (
          <div key={f.t} className={'unlock' + (f.on ? ' is-on' : '')}>
            <Icon name={f.on ? 'checkCircle' : 'lock'} size={22} />
            <b>{f.t}</b>
            <span>{f.on ? 'On' : f.need}</span>
          </div>
        ))}
      </div>
      <div className="banner" style={{ marginTop: 28 }}>
        <Icon name="message" size={22} />
        <div><b>Need a change to your website?</b>From now on, ask for website changes right here in AI MAX. <button className="linkbtn" onClick={() => say('In AI MAX, this opens your website request form.')}>Ask for a change</button></div>
      </div>

      {open && (
        <Sheet label="AI MAX setup" title={open.title} icon={open.icon} onClose={() => setSheet(null)}>
          {view(open.key) && <p className="muted">Confirmed during launch. Nothing to do here.</p>}
          {open.key === 'd' && <div>{b.locations.map((l) => <div key={l.id}><b>{l.label}</b> · {l.street}{l.suite ? ', ' + l.suite : ''}, {l.city}, {l.state} {l.zip}</div>)}<div className="muted">{b.phone} · {b.email}</div></div>}
          {open.key === 'h' && <div>Mon to Fri: {fmtHours(l0.hours.weekdays)} · Sat: {fmtHours(l0.hours.sat)} · Sun: {fmtHours(l0.hours.sun)} · {l0.tz} time</div>}
          {open.key === 's' && <div className="row">{b.services.map((x) => <span key={x.name} className="chip">{x.priority && <Icon name="star" size={14} />}{x.name}</span>)}</div>}
          {open.key === 'social' && <>
            <p className="muted">Connect each account so AI MAX can help with reviews and posts. You’ll only pick the right business or page.</p>
            {SOCIALS.map((x) => (
              <Row key={x.key} item={x} status={p[x.key].status} account={p[x.key].account} onHelp={onHelp}
                onConnect={() => setFlow(x)} onNone={() => mut((d) => { d.platform[x.key] = { status: 'none', account: null }; })}
                onUndo={() => mut((d) => { d.platform[x.key] = { status: 'idle', account: null }; })} />
            ))}
          </>}
          {open.key === 'crm' && <>
            <p className="muted">Choosing a system is not the same as connecting it.</p>
            <div className="optlist" role="radiogroup" aria-label="Business software">
              {CRM_OPTIONS.map((o) => (
                <button key={o} role="radio" aria-checked={p.crm.choice === o} className={'opt' + (p.crm.choice === o ? ' is-on' : '')}
                  onClick={() => mut((d) => { d.platform.crm.choice = o; d.platform.crm.state = o === 'Other' ? 'none' : 'selected'; })}><span className="radio" />{o === 'Other' ? 'Something else' : o}</button>
              ))}
              <button role="radio" aria-checked={crmState === 'no_software'} className={'opt' + (crmState === 'no_software' ? ' is-on' : '')} onClick={() => mut((d) => { d.platform.crm = { state: 'no_software', choice: null, other: '' }; })}><span className="radio" />I don’t use any</button>
              <button role="radio" aria-checked={crmState === 'deferred'} className={'opt' + (crmState === 'deferred' ? ' is-on' : '')} onClick={() => mut((d) => { d.platform.crm = { state: 'deferred', choice: null, other: '' }; })}><span className="radio" />I’ll decide later</button>
            </div>
            {p.crm.choice === 'Other' && (
              <div className="row">
                <input className="input" style={{ flex: 1, minWidth: 200 }} aria-label="Your software" placeholder="What do you use?" value={otherCrm} onChange={(e) => setOtherCrm(e.target.value)} />
                <button className="btn btn--soft" disabled={!otherCrm.trim()} onClick={() => mut((d) => { d.platform.crm.other = otherCrm.trim(); d.platform.crm.state = 'other'; })}>Save</button>
              </div>
            )}
            {crmState === 'selected' && <div className="banner banner--warn"><Icon name="plug" size={22} /><div><b>{p.crm.choice} is chosen, but not connected yet.</b>Connect it so inquiries can flow into it.<div style={{ marginTop: 10 }}><button className="btn btn--primary btn--sm" onClick={() => setFlow({ crm: true })}><Icon name="plug" size={18} /> Connect {p.crm.choice}</button></div></div></div>}
            {crmState === 'other' && <Banner tone="warn" icon="info" title="Noted. It isn’t connected.">We’ll let you know if AI MAX can connect to {p.crm.other}.</Banner>}
            {crmState === 'connected' && <Banner tone="good" icon="checkCircle" title={p.crm.choice + ' is connected.'} />}
            {crmState === 'deferred' && <Banner icon="clock" title="No problem.">Come back when you’re ready.</Banner>}
          </>}
          {open.key === 'revenue' && <>
            <p className="muted">A goal helps AI MAX show your progress in plain numbers.</p>
            <Input label="My goal" inputMode="numeric" placeholder="50,000" value={amt ? Number(amt).toLocaleString('en-US') : ''} onChange={(e) => setAmt(e.target.value.replace(/\D/g, ''))} />
            <Select label="How often" value={p.revenue.period} onChange={(e) => mut((d) => { d.platform.revenue.period = e.target.value; d.platform.revenue.saved = false; })}><option value="month">Per month</option><option value="quarter">Per quarter</option><option value="year">Per year</option></Select>
            <div><button className="btn btn--primary" disabled={!amt} onClick={() => { mut((d) => { d.platform.revenue.amount = amt; d.platform.revenue.saved = true; }); say('Goal saved.'); }}>{pi.revenue ? 'Update goal' : 'Save my goal'}</button></div>
          </>}
        </Sheet>
      )}

      {flow && flow.crm && <ConnectFlow name={p.crm.choice} pick="Choose your account" accounts={[CLIENT.firm + ' (main account)']} scopes={['See your contacts and matters', 'Add new inquiries for you']} onDone={crmConnect} onClose={() => setFlow(null)} />}
      {flow && flow.key && <ConnectFlow name={flow.name} pick={flow.pick} accounts={flow.accounts} scopes={flow.key === 'google' ? ['See and manage your business listing', 'Read and reply to reviews'] : ['See your page', 'Publish posts you approve']} onDone={(a) => connectSocial(flow.key, a)} onClose={() => setFlow(null)} />}
    </div>
  );
}
