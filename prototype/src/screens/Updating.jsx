import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Badge, Banner, ActionBar, Tick, Skip, Spinner, useHeadingFocus } from '../ui/Primitives.jsx';
import { EmailPreview } from '../ui/Emails.jsx';
import { useApp, finishUpdate, now } from '../store.jsx';

// Applying confirmed details automatically, then opening the refreshed preview.
export function Applying() {
  const { s, mut, say } = useApp();
  const [n, setN] = useState(0);
  const total = s.changes.length + 1;
  const fired = useRef(false);
  useHeadingFocus('applying');
  useEffect(() => {
    const ts = [];
    for (let i = 1; i <= total; i++) ts.push(setTimeout(() => setN(i), 800 * i));
    ts.push(setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      mut((d) => { finishUpdate(d); d.route = { stage: 'website', view: 'review' }; });
      say('Your updated website is ready to review.');
    }, 800 * total + 700));
    return () => ts.forEach(clearTimeout);
  }, []); // eslint-disable-line
  return (
    <div className="screen center">
      <Spinner />
      <div className="eyebrow">Step 3 of 4 · Website</div>
      <h1 className="h1" tabIndex={-1} data-heading style={{ fontSize: 38 }}>Applying your details.</h1>
      <p className="lede" style={{ marginTop: 0 }}>This takes a few seconds. Your website opens when it’s ready.</p>
      <ul className="steps-list" aria-live="polite">
        {s.changes.map((c, i) => <li key={c.id} className={i < n ? 'is-done' : ''}><Tick state={i < n ? 'done' : 'todo'} /> {c.label}</li>)}
        <li className={n >= total ? 'is-done' : ''}><Tick state={n >= total ? 'done' : 'todo'} /> Checking every page</li>
      </ul>
    </div>
  );
}

// Team work or a clarification question is holding the updated draft.
export function Updating() {
  const { s, mut, go, say } = useApp();
  const [mail, setMail] = useState(false);
  const [pick, setPick] = useState('');
  const [other, setOther] = useState('');
  useHeadingFocus('updating');
  const q = s.changes.find((c) => c.kind === 'question' && c.status === 'pending');

  function answer() {
    const text = pick === '__other' ? other.trim() : pick;
    if (!text) return;
    mut((d) => {
      const c = d.changes.find((x) => x.id === q.id);
      c.answer = text; c.kind = 'team';
      d.update.state = d.changes.some((x) => x.kind === 'question' && x.status === 'pending') ? 'question' : 'team';
    });
    say('Thank you. Your team has your answer.');
  }
  function ready() {
    mut((d) => { finishUpdate(d); d.route = { stage: 'website', view: 'review' }; });
    say('Your updated website is ready to review.');
  }

  const statusOf = (c) => (c.kind === 'question' && c.status === 'pending' ? ['warn', 'Needs your answer'] : c.kind === 'team' ? ['', 'Team is working on it'] : ['', 'Being applied']);

  return (
    <div className="screen main--narrow" style={{ margin: '0 auto' }}>
      <Head eyebrow="Step 3 of 4 · Website" title="We’re updating your website." lede="We’re applying your confirmed details before you review it. We’ll email you when it’s ready." />

      {q && (
        <div className="card card--accent" style={{ marginBottom: 20 }} role="group" aria-label="A question from your team">
          <div className="row" style={{ marginBottom: 10 }}><Badge tone="warn" icon="message">Needs your answer</Badge></div>
          <h2 className="h2" style={{ marginBottom: 6 }}>{q.question.text}</h2>
          <p className="muted small" style={{ marginBottom: 16 }}>About: {q.label}</p>
          <div className="optlist" role="radiogroup" aria-label="Your answer">
            {q.question.options.map((o) => (
              <button key={o} role="radio" aria-checked={pick === o} className={'opt' + (pick === o ? ' is-on' : '')} onClick={() => setPick(o)}><span className="radio" />{o}</button>
            ))}
            <button role="radio" aria-checked={pick === '__other'} className={'opt' + (pick === '__other' ? ' is-on' : '')} onClick={() => setPick('__other')}><span className="radio" />Something else</button>
          </div>
          {pick === '__other' && <textarea className="textarea" style={{ marginTop: 12 }} aria-label="Your answer" placeholder="Tell us what you’d like." value={other} onChange={(e) => setOther(e.target.value)} />}
          <button className="btn btn--primary" style={{ marginTop: 16 }} disabled={!pick || (pick === '__other' && !other.trim())} onClick={answer}>Send my answer</button>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 className="h2">What we’re updating</h2>
          <Badge icon="clock">In progress</Badge>
        </div>
        <ul className="checklist">
          {s.changes.map((c) => {
            const [tone, label] = statusOf(c);
            return (
              <li key={c.id}>
                <Tick state={c.status === 'done' ? 'done' : tone === 'warn' ? 'warn' : 'todo'} />
                <div className="grow">
                  <div className="checklist__t">{c.label}</div>
                  {(c.from || c.to) && <div className="checklist__d">{c.from ? <><s>{c.from}</s> </> : null}{c.from && c.to ? '→ ' : ''}{c.to}</div>}
                  {c.answer && <div className="checklist__d">Your answer: {c.answer}</div>}
                </div>
                <Badge tone={tone}>{label}</Badge>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="banner" style={{ marginTop: 20 }}>
        <Icon name="shield" size={22} />
        <div><b>Nothing for you to approve yet.</b>We won’t ask you to review a draft that’s missing your confirmed details. You can finish your launch details while you wait.</div>
      </div>

      <div className="row" style={{ marginTop: 20 }}>
        <Skip onClick={ready}>Skip ahead: updated website is ready</Skip>
        <Skip onClick={() => setMail(true)}>See the “ready” email</Skip>
      </div>

      <ActionBar size="narrow" msg={<>Step 3 of 4 · <b>Website</b>. We’ll email you when it’s ready.</>}>
        <button className="btn btn--primary" onClick={() => go({ stage: 'launch', view: 'details' })}>Complete launch details <Icon name="arrowRight" size={20} /></button>
      </ActionBar>
      {mail && <EmailPreview kind="ready" onClose={() => setMail(false)} onOpen={() => { setMail(false); ready(); }} />}
    </div>
  );
}
