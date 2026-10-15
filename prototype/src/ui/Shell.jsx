import React, { useEffect, useState } from 'react';
import { Icon } from './Icons.jsx';
import { Modal } from './Primitives.jsx';
import { EmailPreview } from './Emails.jsx';
import { useApp, stageRoute, canGoStage, stageDone, nextRoute, describeRoute, platformItems } from '../store.jsx';
import { STAGES, HELP, CLIENT } from '../data.js';

export function Mark() {
  return (
    <svg viewBox="0 0 112 108" fill="currentColor" aria-hidden="true">
      <path d="M 48.106 3.825 L 56.006 0 L 63.906 3.825 L 56.006 27.162 L 48.106 3.825 Z" />
      <path d="M 56.007 31.754 L 59.862 44.267 L 59.851 44.267 C 64.166 58.244 73.221 70.261 85.436 78.217 L 61.761 95.039 L 55.995 86.232 L 50.229 95.039 L 26.554 78.217 C 38.781 70.261 47.824 58.244 52.14 44.267 L 55.995 31.754 L 55.995 31.707 L 56.007 31.731 L 56.007 31.754 Z" />
      <path d="M 66.299 97.518 L 98.111 74.924 L 112 79.421 L 106.682 100.398 L 84.481 108 L 88.56 97.518 L 66.299 97.518 Z" />
      <path d="M 13.889 74.924 L 0 79.421 L 5.318 100.398 L 27.508 108 L 23.44 97.518 L 45.701 97.518 L 13.889 74.924 Z" />
    </svg>
  );
}

export function Topbar({ onHelp, onLater }) {
  const { s, go, saving } = useApp();
  const stage = s.route.stage;
  const idx = Math.max(0, STAGES.findIndex((x) => x.key === stage));
  const inPlatform = stage === 'platform';
  const paid = !!s.signup.paidAt;
  const pi = platformItems(s);
  const pdone = Object.values(pi).filter(Boolean).length;
  const cur = STAGES[idx];

  return (
    <header className="topbar">
      <div className="brand" aria-label="AI MAX">
        <Mark />
        <div>AI MAX{inPlatform && s.signup.paidAt ? <small>{CLIENT.firm}</small> : <small>Website setup</small>}</div>
      </div>

      {!inPlatform ? (
        <>
          <nav aria-label="Your progress">
            <ol className="tracker">
              {STAGES.map((st, i) => {
                const done = stageDone(s, st.key);
                const active = stage === st.key;
                const can = canGoStage(s, st.key) && !active;
                return (
                  <li key={st.key} className={'tstep' + (done ? ' is-done' : '') + (active ? ' is-active' : '')}>
                    <button className="tbtn" disabled={!can} onClick={() => go(stageRoute(s, st.key))} aria-current={active ? 'step' : undefined}
                      title={!can && !active && !done ? 'Not yet. Finish the step before this one.' : undefined}>
                      <span className="tdot">{done ? <Icon name="check" size={16} stroke={3.2} /> : i + 1}</span>
                      {st.label}
                      {done && <span className="sr"> (done)</span>}
                      {active && <span className="sr"> (you are here)</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </>
      ) : (
        <div className="pcenter"><b>Set up AI MAX</b>{pdone} of 6 done</div>
      )}

      <div className="topbar__right">
        {paid && <span className="saved" aria-live="polite"><Icon name={saving ? 'refresh' : 'checkCircle'} size={18} /><span>{saving ? 'Saving…' : 'Progress saved'}</span></span>}
        {paid && !inPlatform && s.route.view !== 'live' && (
          <button className="toplink" onClick={onLater}><Icon name="save" size={16} /> <span className="hide-sm">Finish later</span></button>
        )}
        <button className="toplink toplink--strong" onClick={onHelp}><Icon name="helpCircle" size={17} /> Help</button>
      </div>
      <div className="mprog">
        {inPlatform
          ? <><b>Set up AI MAX · {pdone} of 6 done</b><div className="tbar"><i style={{ width: (pdone / 6) * 100 + '%' }} /></div></>
          : <><b>Step {idx + 1} of {STAGES.length} · {cur.label}</b><div className="tbar"><i style={{ width: ((idx + (stageDone(s, cur.key) ? 1 : 0.5)) / STAGES.length) * 100 + '%' }} /></div></>}
      </div>
    </header>
  );
}

const TIPS = {
  'signup/form': ['You pay once to start, then the monthly price is shown on the right.', 'Your account is created only after your payment goes through.', 'If your card doesn’t work, nothing is lost. Your answers stay here so you can try again.'],
  'details/form': ['We filled in what we know. Only change what looks wrong.', 'Tap Edit on any box to fix it.', 'You only confirm once. Your team handles the rest.'],
  'website/review': ['Choose Leave edits, then click anything on your website.', 'Switch to Browse any time to look around freely.', 'Nothing changes on your website until your team does the work.'],
  'website/send': ['Check each edit. You can still add or change them.', 'Sending edits does not approve your website.'],
  'website/tracking': ['Each edit shows where it stands.', 'If your team asks a question, answer it right here.'],
  'website/updating': ['You can finish your launch details while we work.', 'We’ll email you the moment your updated website is ready.'],
  'launch/details': ['Fill in only the boxes that need attention.', 'Not sure about your domain? Choose Get help. We’ll take care of it.'],
  'launch/publish': ['Anything missing is listed with a button to fix it.', 'Your website goes live when you press Approve & launch.'],
  'platform/setup': ['Connect what you have. Skip what you don’t.', 'Come back any time. Your progress is saved.'],
};

export function HelpPanel({ onClose }) {
  const { s } = useApp();
  const key = s.route.stage + '/' + s.route.view;
  const tips = TIPS[key] || TIPS['details/form'];
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  return (
    <Modal onClose={onClose} label="Help">
      <h2 className="h2">Need a hand?</h2>
      <p className="muted">A real person can help with any step. No call is needed to finish setup.</p>
      <div className="card card--tight">
        <b>On this screen</b>
        <ul style={{ margin: '8px 0 0', paddingLeft: 22, display: 'grid', gap: 6 }}>{tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      {!sent ? (
        <div className="stack">
          <textarea className="textarea" placeholder="Write your question here." value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Your question" />
          <button className="btn btn--primary" disabled={!msg.trim()} onClick={() => setSent(true)}><Icon name="send" size={18} /> Send to my team</button>
        </div>
      ) : (
        <div className="banner banner--good"><Icon name="checkCircle" size={22} /><div><b>Sent.</b>Your team will reply by email. You can keep going in the meantime.</div></div>
      )}
      <div className="row muted small" style={{ justifyContent: 'space-between' }}>
        <span><Icon name="phone" size={16} /> {HELP.phone}</span><span><Icon name="mail" size={16} /> {HELP.email}</span>
      </div>
      <p className="muted small">{HELP.hours}</p>
    </Modal>
  );
}

export function FinishLater({ onClose }) {
  const { s, go, say, logEmail } = useApp();
  const [mail, setMail] = useState(false);
  const r = nextRoute(s);
  const open = () => { setMail(false); onClose(); go(r); say('Welcome back. You’re on: ' + describeRoute(r) + '.'); };
  if (mail) return <EmailPreview kind="resume" onClose={() => setMail(false)} onOpen={open} />;
  return (
    <Modal onClose={onClose} label="Finish later">
      <div className="center" style={{ minHeight: 0, gap: 12 }}>
        <div className="bigcheck" style={{ width: 72, height: 72 }}><Icon name="save" size={32} /></div>
        <h2 className="h2">Your progress is saved.</h2>
        <p className="muted">We emailed a private link to <b style={{ color: 'var(--ink)' }}>{s.signup.email}</b>. It brings you back to <b style={{ color: 'var(--ink)' }}>{describeRoute(r)}</b>. No password needed.</p>
      </div>
      <div className="banner"><Icon name="shield" size={22} /><div>Nothing has been sent to your team, approved, or published.</div></div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn btn--primary" onClick={() => { logEmail('resume'); onClose(); }}>Keep going now</button>
        <button className="btn btn--ghost" onClick={() => { logEmail('resume'); setMail(true); }}><Icon name="mail" size={18} /> See the email</button>
      </div>
    </Modal>
  );
}

export function Toast() {
  const { toast, setToast } = useApp();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast, setToast]);
  if (!toast) return null;
  return (
    <div className={'toast toast--' + toast.tone} role="status" aria-live="polite">
      <Icon name={toast.tone === 'warn' ? 'alert' : 'checkCircle'} size={22} />
      <span>{toast.msg}</span>
    </div>
  );
}
