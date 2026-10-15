import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Input, Select, Badge, Banner, ActionBar, Tick, Skip, Spinner, useHeadingFocus } from '../ui/Primitives.jsx';
import { EmailPreview } from '../ui/Emails.jsx';
import { TaskCard, Progress, Sheet } from '../ui/Cards.jsx';
import ScaledSite from '../site/ScaledSite.jsx';
import { useApp, launchItems, launchDetailsDone, publishChecks, siteFromBiz, approvalCurrent, pendingUpdate, unresolvedSent, now, fmtTime } from '../store.jsx';
import { CLIENT } from '../data.js';

const digits = (v) => v.replace(/\D/g, '');

function Item({ id, icon, title, done, summary, open, onToggle, children, warn, next }) {
  return (
    <section className={'acc__item' + (open ? ' is-open' : '')}>
      <button className="acc__head" onClick={onToggle} aria-expanded={open} aria-controls={'p-' + id}>
        <Tick state={done ? 'done' : warn ? 'warn' : 'todo'} />
        <span className="grow">
          <span className="acc__t">{title}</span>
          <div className="acc__s">{done ? summary : warn || 'Needs your attention'}</div>
        </span>
        {done ? <Badge tone="good">Done</Badge> : <Badge tone="warn">To do</Badge>}
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={22} />
      </button>
      {open && <div className="acc__body" id={'p-' + id}>{children}{done && next && <div><button className="btn btn--soft" onClick={next.go}>Next: {next.title} <Icon name="arrowRight" size={18} /></button></div>}</div>}
    </section>
  );
}

function Calls() {
  const { s, mut } = useApp();
  const c = s.launch.calls;
  const [busy, setBusy] = useState(false);
  const test = () => {
    setBusy(true);
    mut((d) => { d.launch.calls.error = ''; });
    setTimeout(() => {
      mut((d) => {
        const r = digits(d.launch.calls.receiving), t = digits(d.launch.calls.tracking);
        if (r.length < 10) d.launch.calls.error = 'That number looks too short. Enter all 10 digits, including the area code.';
        else if (r === t) d.launch.calls.error = 'That is your tracking number. Enter the phone that should ring.';
        else { d.launch.calls.tested = true; }
      });
      setBusy(false);
    }, 2200);
  };
  return (
    <>
      <p className="muted">People call your public number. AI MAX counts the call, then rings the phone you choose.</p>
      <div className="numgrid">
        <div className="numcard"><small>Public number</small><b>{s.biz.phone}</b><div className="hint">Shown on your website</div></div>
        <div className="numcard"><small>Tracking number</small><b>{c.tracking}</b><div className="hint">Counts calls. Set up for you.</div></div>
        <div className="numcard is-edit"><small>Receiving number</small>
          <input className={'input' + (c.error ? ' is-bad' : '')} aria-label="Receiving number" inputMode="tel" value={c.receiving} style={{ marginTop: 6, minHeight: 48 }}
            onChange={(e) => mut((d) => { d.launch.calls.receiving = e.target.value; d.launch.calls.tested = false; d.launch.calls.error = ''; })} />
          <div className="hint" style={{ marginTop: 4 }}>Where calls ring</div></div>
      </div>
      {c.error && <div className="banner banner--bad" role="alert"><Icon name="alert" size={22} /><div><b>The test didn’t work.</b>{c.error}</div></div>}
      {c.tested
        ? <Banner tone="good" icon="checkCircle" title="Test passed.">We rang {c.receiving} and the call connected.</Banner>
        : <div><button className="btn btn--primary" onClick={test} disabled={busy}>{busy ? <>Calling {c.receiving}…</> : <><Icon name="phone" size={20} /> Ring my phone to test</>}</button></div>}
    </>
  );
}

function Forms() {
  const { s, mut } = useApp();
  const f = s.launch.forms;
  const [busy, setBusy] = useState(false);
  const test = () => {
    setBusy(true);
    mut((d) => { d.launch.forms.error = ''; });
    setTimeout(() => {
      mut((d) => {
        if (!/^\S+@\S+\.\S+$/.test(d.launch.forms.dest)) d.launch.forms.error = 'That email address doesn’t look right. Check it and try again.';
        else d.launch.forms.tested = true;
      });
      setBusy(false);
    }, 1800);
  };
  return (
    <>
      <p className="muted">When someone fills out a form on your website, it goes here. Choose the inbox your team actually checks.</p>
      <Input label="Send form inquiries to" type="email" value={f.dest} error={f.error}
        onChange={(e) => mut((d) => { d.launch.forms.dest = e.target.value; d.launch.forms.tested = false; d.launch.forms.error = ''; })}
        hint={f.dest.toLowerCase() === s.signup.email.toLowerCase() ? 'This is also your account email. Make sure it’s the inbox you want.' : 'This is separate from your AI MAX account email (' + s.signup.email + ').'} />
      {f.tested
        ? <Banner tone="good" icon="checkCircle" title="Test delivered.">We sent a sample inquiry to {f.dest}.</Banner>
        : <div><button className="btn btn--primary" onClick={test} disabled={busy}>{busy ? 'Sending a test…' : <><Icon name="send" size={20} /> Send a test inquiry</>}</button></div>}
    </>
  );
}

function Followup() {
  const { s, mut } = useApp();
  const f = s.launch.followup;
  const [busy, setBusy] = useState(false);
  const setMode = (m) => mut((d) => { d.launch.followup.mode = m; d.launch.followup.confirmed = false; });
  const testCal = () => { setBusy(true); setTimeout(() => { mut((d) => { d.launch.followup.calendar = 'tested'; }); setBusy(false); }, 2200); };
  return (
    <>
      <p className="muted">When someone asks for a consultation, what happens next?</p>
      <div className="optlist" role="radiogroup" aria-label="Consultation follow-up">
        <button role="radio" aria-checked={f.mode === 'request'} className={'opt' + (f.mode === 'request' ? ' is-on' : '')} onClick={() => setMode('request')}>
          <span className="radio" /><span><b>Consultation requests</b> <Badge tone="good">Works today</Badge><div className="muted small">People send a short request. Your team follows up by phone or email.</div></span>
        </button>
        <button role="radio" aria-checked={f.mode === 'booking'} className={'opt' + (f.mode === 'booking' ? ' is-on' : '')} onClick={() => setMode('booking')}>
          <span className="radio" /><span><b>Online booking</b><div className="muted small">People choose a time on your calendar. We turn this on only after we test your calendar.</div></span>
        </button>
      </div>
      {f.mode === 'booking' && (
        f.calendar === 'tested'
          ? <Banner tone="good" icon="checkCircle" title="Calendar tested.">A practice booking went through.</Banner>
          : <div><button className="btn btn--soft" onClick={testCal} disabled={busy}>{busy ? 'Testing your calendar…' : <><Icon name="calendar" size={20} /> Connect &amp; test my calendar</>}</button></div>
      )}
      <div className="banner"><Icon name="info" size={22} /><div><b>What visitors will see.</b>{f.mode === 'booking' && f.calendar === 'tested' ? 'A “Book a consultation” button that opens your calendar.' : 'A “Request a free consultation” form. Your team follows up.'}</div></div>
      {!f.confirmed
        ? <div><button className="btn btn--primary" disabled={f.mode === 'booking' && f.calendar !== 'tested'} onClick={() => mut((d) => { d.launch.followup.confirmed = true; })}>Use this for launch</button></div>
        : <Banner tone="good" icon="checkCircle">Saved. You can change this any time.</Banner>}
    </>
  );
}

const PROVIDERS = ['GoDaddy', 'Namecheap', 'Squarespace or Google Domains', 'Cloudflare', 'Network Solutions', 'Other', 'I’m not sure'];
function Domain() {
  const { s, mut } = useApp();
  const d0 = s.launch.domain;
  const [busy, setBusy] = useState(false);
  const name = d0.choice === 'other' ? d0.other : d0.name;
  const set = (fn) => mut((d) => { fn(d.launch.domain); });
  const check = () => {
    setBusy(true);
    setTimeout(() => { mut((d) => { const x = d.launch.domain; x.checks += 1; x.status = x.checks >= 2 ? 'connected' : 'waiting'; }); setBusy(false); }, 2000);
  };
  const choose = (c) => set((x) => { x.choice = c; if (c === 'help') { x.helpRequested = true; x.status = 'none'; } else { x.helpRequested = false; } });
  return (
    <>
      <p className="muted">Your website needs a web address. We found one for you.</p>
      <div className="optlist" role="radiogroup" aria-label="Your domain">
        <button role="radio" aria-checked={d0.choice === 'confirmed'} className={'opt' + (d0.choice === 'confirmed' ? ' is-on' : '')} onClick={() => choose('confirmed')}><span className="radio" /><span><b>Use {d0.name}</b><div className="muted small">The address we found for your business.</div></span></button>
        <button role="radio" aria-checked={d0.choice === 'other'} className={'opt' + (d0.choice === 'other' ? ' is-on' : '')} onClick={() => choose('other')}><span className="radio" /><span><b>Use a different address</b></span></button>
        {d0.choice === 'other' && <input className="input" aria-label="Your domain" placeholder="yourbusiness.com" value={d0.other} onChange={(e) => set((x) => { x.other = e.target.value.trim().toLowerCase(); x.status = 'none'; x.checks = 0; })} />}
        <button role="radio" aria-checked={d0.choice === 'help'} className={'opt' + (d0.choice === 'help' ? ' is-on' : '')} onClick={() => choose('help')}><span className="radio" /><span><b>I need help with this</b><div className="muted small">Your team will take care of it with you.</div></span></button>
      </div>

      {d0.choice === 'help' && <Banner tone="warn" icon="helpCircle" title="Help requested. Your domain is not connected yet.">Your team will contact you at {s.signup.email}. You can also pick one of the choices above and do it yourself.</Banner>}

      {(d0.choice === 'confirmed' || (d0.choice === 'other' && d0.other.includes('.'))) && (
        <>
          <Select label={'Where did you buy ' + name + '?'} value={d0.provider} onChange={(e) => set((x) => { x.provider = e.target.value; })} hint="We only ask so we can show the right steps.">
            <option value="">Choose one</option>{PROVIDERS.map((p) => <option key={p}>{p}</option>)}
          </Select>
          {d0.provider && (
            <>
              <div className="banner"><Icon name="info" size={22} /><div><b>Add these two settings at {d0.provider === 'I’m not sure' ? 'your domain company' : d0.provider}.</b>Look for “DNS” or “Domain settings”. This is the part most people ask us to do, and that’s fine.</div></div>
              <div className="dns" aria-label="Settings to add">
                <div><span>Type</span><b>A</b></div><div><span>Name</span><b>@</b></div><div><span>Value</span><b>203.0.113.42</b></div>
                <hr style={{ border: 0, borderTop: '1px solid var(--cardline)', width: '100%' }} />
                <div><span>Type</span><b>CNAME</b></div><div><span>Name</span><b>www</b></div><div><span>Value</span><b>sites.aimax.example</b></div>
              </div>
              <div className="row">
                <button className="btn btn--primary" onClick={check} disabled={busy || d0.status === 'connected'}>{busy ? 'Checking…' : <><Icon name="refresh" size={20} /> Check my connection</>}</button>
                {d0.status === 'waiting' && <Skip onClick={() => set((x) => { x.status = 'connected'; })}>Skip ahead: connected</Skip>}
              </div>
              <div aria-live="polite">
                {d0.status === 'none' && <Badge icon="clock">Not connected yet</Badge>}
                {d0.status === 'waiting' && <Banner tone="warn" icon="clock" title="Not connected yet.">We can’t see the settings yet. This can take a few hours. Check again later, or move on and come back.</Banner>}
                {d0.status === 'connected' && <Banner tone="good" icon="checkCircle" title="Connected.">{name} points to your new website.</Banner>}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

export function LaunchDetails() {
  const { s, go } = useApp();
  const it = launchItems(s);
  const c = s.launch;
  const [sheet, setSheet] = useState(s.flags.open || null);
  useHeadingFocus('launch');
  const done = Object.values(it).filter(Boolean).length;
  const ready = launchDetailsDone(s);
  const waitingOnTeam = pendingUpdate(s) || unresolvedSent(s).length > 0;
  const domain = c.domain.choice === 'other' ? c.domain.other : c.domain.name;

  const cards = [
    { key: 'calls', icon: 'phone', title: 'Calls', status: it.calls ? 'done' : 'todo',
      text: it.calls ? <><b>Calls ring {c.calls.receiving}</b><div className="dim">Public number {s.biz.phone}. Tested.</div></> : <><b>Where should calls ring?</b><div className="dim">We’ll ring your phone to test it.</div></> },
    { key: 'forms', icon: 'inbox', title: 'Form inquiries', status: it.forms ? 'done' : 'todo',
      text: it.forms ? <><b>Inquiries go to {c.forms.dest}</b><div className="dim">Test delivered.</div></> : <><b>Where should inquiries go?</b><div className="dim">We’ll send a test to make sure.</div></> },
    { key: 'followup', icon: 'calendar', title: 'Consultation follow-up', status: it.followup ? 'done' : 'todo',
      text: it.followup ? <><b>{c.followup.mode === 'booking' ? 'Online booking' : 'Consultation requests'}</b><div className="dim">{c.followup.mode === 'booking' ? 'Calendar tested.' : 'Your team follows up by phone or email.'}</div></> : <><b>What happens after someone asks?</b><div className="dim">Choose how consultations are handled.</div></> },
    { key: 'domain', icon: 'globe', title: 'Your web address', status: it.domain ? 'done' : (c.domain.helpRequested || c.domain.status === 'waiting') ? 'warn' : 'todo',
      badge: it.domain ? 'Done' : c.domain.helpRequested ? 'Help requested' : c.domain.status === 'waiting' ? 'Waiting' : 'To do',
      text: it.domain ? <><b>{domain}</b><div className="dim">Connected.</div></> : c.domain.helpRequested ? <><b>We’ll help you with this.</b><div className="dim">Your address isn’t connected yet.</div></> : c.domain.status === 'waiting' ? <><b>{domain}</b><div className="dim">Not connected yet. This can take a few hours.</div></> : <><b>{domain}</b><div className="dim">Connect it so people can find your website.</div></> },
    { key: 'approval', icon: 'shieldCheck', title: 'Website approval', status: it.approval ? 'done' : waitingOnTeam ? 'warn' : 'todo', badge: it.approval ? 'Done' : waitingOnTeam ? 'Waiting' : 'To do',
      text: it.approval ? <><b>Version {s.approval.version} approved</b><div className="dim">{fmtTime(s.approval.at)}</div></> : waitingOnTeam ? <><b>Your team is still working.</b><div className="dim">We’ll email you when you can approve.</div></> : <><b>Look over your website one more time.</b><div className="dim">Then choose Looks good.</div></> },
  ];
  const label = (st, k) => (st === 'done' ? (k === 'approval' ? 'View' : 'Change') : 'Start');

  return (
    <div className="screen">
      <Head eyebrow="Step 4 of 4 · Launch" title="Get ready to launch." lede="Five quick checks so calls and inquiries reach you the moment your website is live." />
      <Progress done={done} total={5} label={done + ' of 5 done'} />
      <div className="tgrid">
        {cards.map((k) => (
          <TaskCard key={k.key} icon={k.icon} title={k.title} status={k.status} badge={k.badge}
            actions={<button className={'btn btn--sm ' + (k.status === 'done' ? 'btn--ghost' : 'btn--primary')}
              onClick={() => (k.key === 'approval' ? go({ stage: 'website', view: waitingOnTeam ? (unresolvedSent(s).length ? 'tracking' : 'updating') : 'review' }) : setSheet(k.key))}>
              {k.key === 'approval' && k.status !== 'done' ? (waitingOnTeam ? 'See progress' : 'Review website') : label(k.status, k.key)}</button>}>
            {k.text}
          </TaskCard>
        ))}
      </div>

      {sheet && (
        <Sheet label="Step 4 of 4 · Launch" title={cards.find((x) => x.key === sheet).title} icon={cards.find((x) => x.key === sheet).icon} onClose={() => setSheet(null)}>
          {sheet === 'calls' && <Calls />}
          {sheet === 'forms' && <Forms />}
          {sheet === 'followup' && <Followup />}
          {sheet === 'domain' && <Domain />}
        </Sheet>
      )}

      <ActionBar msg={ready ? <>Your launch details are <b>done</b>. One last look.</> : <>Step 4 of 4 · <b>Launch</b>. {4 - [it.calls, it.forms, it.followup, it.domain].filter(Boolean).length} left to finish.</>}>
        <button className="btn btn--primary" disabled={!ready} onClick={() => go({ stage: 'launch', view: 'publish' })}>Continue <Icon name="arrowRight" size={20} /></button>
      </ActionBar>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function Publish() {
  const { s, mut, go, say } = useApp();
  const checks = publishChecks(s);
  const ok = checks.every((c) => c.ok);
  const domain = s.launch.domain.choice === 'other' ? s.launch.domain.other : s.launch.domain.name;
  const p = s.pub;
  const timers = useRef([]);
  useHeadingFocus('publish' + p.state);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // resume a publish that was in flight
  useEffect(() => { if (p.state === 'publishing') run(); }, []); // eslint-disable-line

  function launch() {
    if (!ok || p.state === 'publishing') return;
    mut((d) => { d.pub = { state: 'publishing', step: 0 }; });
    run();
  }
  function run() {
    timers.current.forEach(clearTimeout);
    [1, 2, 3].forEach((i) => timers.current.push(setTimeout(() => mut((d) => { if (d.pub.state === 'publishing') d.pub.step = i; }), 1200 * i)));
    timers.current.push(setTimeout(() => {
      mut((d) => {
        const out = d.demo.pubOutcome || 'live';
        d.demo.pubOutcome = 'live';
        if (out === 'live') { d.pub = { state: 'live', step: 3 }; d.liveAt = now(); d.route = { stage: 'launch', view: 'live' }; d.emails.push({ kind: 'launch', at: now() }); }
        else d.pub = { state: out, step: 3 };
      });
    }, 1200 * 3 + 900));
  }
  const finish = () => mut((d) => { d.pub = { state: 'live', step: 3 }; d.liveAt = now(); d.route = { stage: 'launch', view: 'live' }; d.emails.push({ kind: 'launch', at: now() }); });

  if (p.state === 'publishing') {
    const steps = ['Publishing your pages', 'Connecting ' + domain, 'Checking calls and forms'];
    return (
      <div className="screen center">
        <Spinner />
        <div className="eyebrow">Step 4 of 4 · Launch</div>
        <h1 className="h1" tabIndex={-1} data-heading style={{ fontSize: 38 }}>Publishing your website.</h1>
        <p className="lede" style={{ marginTop: 0 }}>Please keep this page open. It takes less than a minute.</p>
        <ul className="steps-list" aria-live="polite">{steps.map((t, i) => <li key={t} className={i < p.step ? 'is-done' : ''}><Tick state={i < p.step ? 'done' : 'todo'} /> {t}</li>)}</ul>
      </div>
    );
  }
  if (p.state === 'waiting') {
    return (
      <div className="screen main--narrow" style={{ margin: '0 auto' }}>
        <Head eyebrow="Step 4 of 4 · Launch" title="Almost there. We’re waiting on one thing." lede={'Your website is published, but ' + domain + ' hasn’t finished connecting. We keep checking and will email you the moment it’s live.'} />
        <Banner tone="warn" icon="clock" title="Waiting on your domain.">This can take a few hours. You don’t need to do anything.</Banner>
        <div className="row" style={{ marginTop: 18 }}><Skip onClick={finish}>Skip ahead: domain connected</Skip></div>
        <ActionBar size="narrow"><button className="btn btn--ghost" onClick={() => go({ stage: 'launch', view: 'details', open: 'domain' })}>Check my domain</button></ActionBar>
      </div>
    );
  }
  if (p.state === 'action') {
    return (
      <div className="screen main--narrow" style={{ margin: '0 auto' }}>
        <Head eyebrow="Step 4 of 4 · Launch" title="One thing needs you." lede="We stopped before going live so your website doesn’t miss any calls." />
        <Banner tone="bad" icon="alert" title="The final call check failed.">We couldn’t reach {s.launch.calls.receiving}. Check the number, then test again.</Banner>
        <div className="row" style={{ marginTop: 18 }}><Skip onClick={finish}>Skip ahead: fixed, go live</Skip></div>
        <ActionBar size="narrow">
          <button className="btn btn--primary" onClick={() => { mut((d) => { d.pub = { state: 'idle', step: 0 }; d.launch.calls.tested = false; }); go({ stage: 'launch', view: 'details', open: 'calls' }); }}>Fix my call settings <Icon name="arrowRight" size={20} /></button>
        </ActionBar>
      </div>
    );
  }

  return (
    <div className="screen main--narrow" style={{ margin: '0 auto' }}>
      <Head eyebrow="Step 4 of 4 · Launch" title={ok ? 'Your website is ready to publish at ' + domain + '.' : 'Almost ready to publish.'}
        lede={ok ? 'Everything is checked. When you choose Approve & launch, your website goes live.' : 'A few things still need you. Each one has a button to take care of it.'} />
      <div className="card">
        <ul className="checklist">
          {checks.map((c) => (
            <li key={c.key}>
              <Tick state={c.ok ? 'done' : 'warn'} />
              <div className="grow checklist__t">{c.label}</div>
              {!c.ok && <button className="btn btn--soft btn--xs" onClick={() => go(c.fix)}>{c.fixLabel}</button>}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 20 }}><div className="minisite"><div className="minisite__bar"><i /><i /><i /><span>{domain}</span></div><ScaledSite site={siteFromBiz(s.applied)} height={220} /></div></div>
      <ActionBar size="narrow" msg={ok ? <>This is the last step. <b>You’re in control.</b></> : <><b>{checks.filter((c) => !c.ok).length} thing{checks.filter((c) => !c.ok).length === 1 ? '' : 's'}</b> left before launch.</>}>
        <button className="btn btn--ghost" onClick={() => go({ stage: 'launch', view: 'details' })}><Icon name="arrowLeft" size={18} /> Back</button>
        <button className="btn btn--primary" disabled={!ok} onClick={launch} style={{ minHeight: 62, fontSize: 20 }}><Icon name="rocket" size={22} /> Approve &amp; launch</button>
      </ActionBar>
    </div>
  );
}

export function Live() {
  const { s, go } = useApp();
  const [mail, setMail] = useState(false);
  const domain = s.launch.domain.choice === 'other' ? s.launch.domain.other : s.launch.domain.name;
  useHeadingFocus('live');
  return (
    <div className="screen center" style={{ gap: 20 }}>
      <div className="bigcheck"><Icon name="check" size={48} stroke={3} /></div>
      <h1 className="h1" tabIndex={-1} data-heading>Your website is live!</h1>
      <div className="preview-live" style={{ width: '100%' }}>
        <div className="livechip"><i /> Live</div>
        <div className="minisite__bar"><i /><i /><i /><span>{domain}</span></div>
        <ScaledSite site={siteFromBiz(s.applied)} height={340} />
      </div>
      <a className="linkbox" href={'https://' + domain} onClick={(e) => e.preventDefault()}><Icon name="globe" size={22} /> {domain} <Icon name="external" size={18} /></a>
      <div className="card card--tight" style={{ maxWidth: 560, textAlign: 'left' }}>
        <b>What’s next</b>
        <p className="muted" style={{ marginTop: 6 }}>Set up AI MAX so it can help bring in more inquiries. You choose what to connect, and you can do it at your own pace. No call needed.</p>
      </div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn btn--primary" style={{ minHeight: 62, fontSize: 20 }} onClick={() => go({ stage: 'platform', view: 'setup' })}>Continue to AI MAX <Icon name="arrowRight" size={22} /></button>
        <button className="btn btn--ghost" onClick={() => setMail(true)}><Icon name="mail" size={18} /> See the email</button>
      </div>
      {mail && <EmailPreview kind="launch" onClose={() => setMail(false)} onOpen={() => { setMail(false); go({ stage: 'platform', view: 'setup' }); }} />}
    </div>
  );
}
