import React, { useEffect, useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Input, Select, Badge, Banner, Tick, Modal, useHeadingFocus } from '../ui/Primitives.jsx';
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
  const [open, setOpen] = useState(() => ['social', 'crm', 'revenue'].find((k) => !platformItems(s)[k]) || '__none');
  const [flow, setFlow] = useState(null);
  const [otherCrm, setOtherCrm] = useState(p.crm.other);
  const [amt, setAmt] = useState(p.revenue.amount);
  useHeadingFocus('platform');

  const cur = open === '__none' ? null : open;
  const toggle = (k) => setOpen(cur === k ? '__none' : k);

  useEffect(() => {
    if (done === 6 && !p.doneAt) mut((d) => { d.platform.doneAt = now(); });
  }, [done]); // eslint-disable-line

  const b = s.biz, l0 = b.locations[0];
  const connectSocial = (k, acc) => { mut((d) => { d.platform[k] = { status: 'connected', account: acc }; }); setFlow(null); say('Connected.'); };
  const crmConnect = (acc) => { mut((d) => { d.platform.crm.state = 'connected'; }); setFlow(null); say(p.crm.choice + ' is connected.'); };

  const crmState = p.crm.state;
  const crmLabel = { connected: p.crm.choice + ' connected', no_software: 'You don’t use business software', other: 'Noted: ' + p.crm.other, selected: p.crm.choice + ' selected. Not connected yet', deferred: 'Decide later', none: '' }[crmState];

  const features = [
    { t: 'Reviews and your Google listing', need: 'Connect Google Business Profile', on: p.google.status === 'connected', icon: 'star' },
    { t: 'Social posts', need: 'Connect Facebook or Instagram', on: p.facebook.status === 'connected' || p.instagram.status === 'connected', icon: 'megaphone' },
    { t: 'Inquiry tracking in your software', need: 'Connect your business software', on: crmState === 'connected', icon: 'inbox' },
    { t: 'Progress toward your goal', need: 'Enter your revenue goal', on: p.revenue.saved, icon: 'trendingUp' },
  ];

  return (
    <div className="screen">
      <Head eyebrow="AI MAX · Your setup" title="Finish setting up AI MAX." lede="Your website is live. Connect what you use and skip what you don’t. Your progress saves as you go." />
      {p.doneAt && <div style={{ marginBottom: 20 }}><Banner tone="good" icon="checkCircle" title="Your setup is complete.">Everything is connected or marked as not needed. Completed {fmtTime(p.doneAt)}.</Banner></div>}
      <div className="plat">
        <div className="setup">
          <Item id="d" icon="briefcase" title="Business details" done doneLabel={b.name + ' · ' + l0.city + ', ' + l0.state} open={cur === 'd'} onToggle={() => toggle('d')}>
            <p className="muted">Confirmed during launch. Nothing to do here.</p>
            <div>{b.locations.map((l) => <div key={l.id}><b>{l.label}</b> · {l.street}{l.suite ? ', ' + l.suite : ''}, {l.city}, {l.state} {l.zip}</div>)}<div className="muted">{b.phone} · {b.email}</div></div>
          </Item>
          <Item id="h" icon="clock" title="Business hours" done doneLabel={'Mon to Fri ' + fmtHours(l0.hours.weekdays)} open={cur === 'h'} onToggle={() => toggle('h')}>
            <p className="muted">Confirmed during launch.</p>
            <div>Mon to Fri: {fmtHours(l0.hours.weekdays)} · Sat: {fmtHours(l0.hours.sat)} · Sun: {fmtHours(l0.hours.sun)} · {l0.tz} time</div>
          </Item>
          <Item id="s" icon="list" title="What you do" done doneLabel={b.services.length + ' practice areas'} open={cur === 's'} onToggle={() => toggle('s')}>
            <p className="muted">Confirmed during launch.</p>
            <div className="row">{b.services.map((x) => <span key={x.name} className="chip">{x.priority && <Icon name="star" size={14} />}{x.name}</span>)}</div>
          </Item>

          <Item id="social" icon="mapPin" title="Google Business Profile and socials" done={pi.social} state={SOCIALS.some((x) => p[x.key].status === 'connected') ? 'warn' : ''} open={cur === 'social'} onToggle={() => toggle('social')}
            doneLabel={pi.social ? 'All set' : SOCIALS.filter((x) => ['connected', 'none'].includes(p[x.key].status)).length + ' of 3 handled'}>
            <p className="muted">Connect each account so AI MAX can help with reviews and posts. We’ll only ask you to pick the right business or page.</p>
            {SOCIALS.map((x) => (
              <Row key={x.key} item={x} status={p[x.key].status} account={p[x.key].account} onHelp={onHelp}
                onConnect={() => setFlow(x)} onNone={() => mut((d) => { d.platform[x.key] = { status: 'none', account: null }; })}
                onUndo={() => mut((d) => { d.platform[x.key] = { status: 'idle', account: null }; })} />
            ))}
          </Item>

          <Item id="crm" icon="plug" title="Your business software" done={pi.crm} state={crmState === 'selected' ? 'warn' : ''} open={cur === 'crm'} onToggle={() => toggle('crm')}
            doneLabel={crmLabel || 'Choose what you use'}>
            <p className="muted">This is where you keep track of people who contact you. Choosing one is not the same as connecting it.</p>
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
            {crmState === 'selected' && <div className="banner banner--warn"><Icon name="plug" size={22} /><div><b>{p.crm.choice} is selected, but not connected yet.</b>Connect it so inquiries can flow into it.<div style={{ marginTop: 10 }}><button className="btn btn--primary btn--sm" onClick={() => setFlow({ crm: true })}><Icon name="plug" size={18} /> Connect {p.crm.choice}</button></div></div></div>}
            {crmState === 'other' && <Banner tone="warn" icon="info" title="Noted. It isn’t connected.">We’ll let you know if AI MAX can connect to {p.crm.other}. Features that need it stay off for now.</Banner>}
            {crmState === 'connected' && <Banner tone="good" icon="checkCircle" title={p.crm.choice + ' is connected.'} />}
            {crmState === 'deferred' && <Banner icon="clock" title="No problem.">Come back when you’re ready. This step stays open.</Banner>}
          </Item>

          <Item id="rev" icon="trendingUp" title="Revenue goal" done={pi.revenue} open={cur === 'revenue'} onToggle={() => toggle('revenue')}
            doneLabel={pi.revenue ? '$' + Number(p.revenue.amount).toLocaleString('en-US') + ' per ' + p.revenue.period : 'What would you like to grow toward?'}>
            <p className="muted">A goal helps AI MAX show your progress in plain numbers.</p>
            <div className="grid2">
              <Input label="My goal" inputMode="numeric" placeholder="50,000" value={amt ? Number(amt).toLocaleString('en-US') : ''} onChange={(e) => setAmt(e.target.value.replace(/\D/g, ''))} />
              <Select label="How often" value={p.revenue.period} onChange={(e) => mut((d) => { d.platform.revenue.period = e.target.value; d.platform.revenue.saved = false; })}><option value="month">Per month</option><option value="quarter">Per quarter</option><option value="year">Per year</option></Select>
            </div>
            <div><button className="btn btn--primary" disabled={!amt} onClick={() => { mut((d) => { d.platform.revenue.amount = amt; d.platform.revenue.saved = true; }); say('Goal saved.'); }}>{pi.revenue ? 'Update goal' : 'Save my goal'}</button></div>
          </Item>
        </div>

        <aside className="stack" style={{ position: 'sticky', top: 100 }}>
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}><b>Your setup</b><b>{done} of 6</b></div>
            <div className="prog" style={{ marginTop: 10 }} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={6}><i style={{ width: (done / 6) * 100 + '%' }} /></div>
            <p className="muted small" style={{ marginTop: 10 }}>{done === 6 ? 'All done.' : 'Come back any time. We’ll keep your place.'}</p>
          </div>
          <div className="card">
            <b>Turns on as you connect</b>
            <div style={{ marginTop: 6 }}>
              {features.map((f) => (
                <div key={f.t} className="locked" style={{ opacity: f.on ? 1 : 0.6 }}>
                  <Icon name={f.on ? f.icon : 'lock'} size={20} />
                  <div className="grow"><div style={{ fontWeight: 600 }}>{f.t}</div><div className="small muted">{f.on ? 'On' : f.need}</div></div>
                  {f.on && <Badge tone="good">On</Badge>}
                </div>
              ))}
            </div>
          </div>
          <div className="card card--tight">
            <b>Need a change to your website?</b>
            <p className="muted small" style={{ margin: '6px 0 12px' }}>From now on, ask for website changes right here in AI MAX.</p>
            <button className="btn btn--ghost btn--sm" onClick={() => say('In AI MAX, this opens your website request form.')}><Icon name="message" size={18} /> Ask for a change</button>
          </div>
        </aside>
      </div>

      {flow && flow.crm && <ConnectFlow name={p.crm.choice} pick="Choose your account" accounts={[CLIENT.firm + ' (main account)']} scopes={['See your contacts and matters', 'Add new inquiries for you']} onDone={crmConnect} onClose={() => setFlow(null)} />}
      {flow && flow.key && <ConnectFlow name={flow.name} pick={flow.pick} accounts={flow.accounts} scopes={flow.key === 'google' ? ['See and manage your business listing', 'Read and reply to reviews'] : ['See your page', 'Publish posts you approve']} onDone={(a) => connectSocial(flow.key, a)} onClose={() => setFlow(null)} />}
    </div>
  );
}
