import React from 'react';
import { Modal } from './Primitives.jsx';
import { Icon } from './Icons.jsx';
import { useApp, nextRoute, describeRoute, fmtTime, money } from '../store.jsx';
import { PLAN, CLIENT } from '../data.js';

// Email previews: what the client receives, and where each secure link lands.
// Links carry the customer record, so there is no second login.

const COPY = {
  receipt: {
    subject: 'Your AI MAX receipt and next step',
    title: 'You’re all set.',
    body: (s) => [
      'Thank you, ' + s.signup.name.split(' ')[0] + '. Your payment of ' + money(PLAN.dueToday) + ' went through and your AI MAX account is ready.',
      'Your setup is saved automatically. Close this window any time and pick up exactly where you left off.',
    ],
    cta: 'Continue your website setup',
    extra: (s) => (
      <div style={{ border: '1px solid #e6e8f2', borderRadius: 12, padding: '12px 16px', fontSize: 15 }}>
        <b>Receipt</b> · {PLAN.name} · {money(PLAN.price)} per month, {PLAN.term}<br />
        Paid today: {money(PLAN.dueToday)} · Next bill {PLAN.nextBill} · <a href="#receipt" onClick={(e) => e.preventDefault()}>View receipt</a>
      </div>
    ),
  },
  resume: {
    subject: 'Your website setup is saved',
    title: 'Your progress is saved.',
    body: (s) => ['Nothing has been sent, approved, or published. Use the button below to pick up where you left off: ' + describeRoute(nextRoute(s)) + '.', 'This link is just for you and works without a password.'],
    cta: 'Continue your website setup',
  },
  ready: {
    subject: 'Your updated website is ready to review',
    title: 'Your updated website is ready.',
    body: () => ['We applied your confirmed details. Take a look and tell us if anything needs a change.'],
    cta: 'Review your website',
  },
  question: {
    subject: 'One quick question about your website',
    title: 'We have a question for you.',
    body: () => ['Your team needs one answer before they can finish. It takes about a minute.'],
    cta: 'Answer the question',
  },
  launch: {
    subject: 'Your website is live',
    title: 'Your website is live!',
    body: () => ['Your website is now published at ' + CLIENT.site + '. The next step is setting up AI MAX, and you can do it yourself.'],
    cta: 'Continue to AI MAX',
    extra: () => (
      <div style={{ fontSize: 15 }}><Icon name="globe" size={16} /> Your website: <a href="#live" onClick={(e) => e.preventDefault()}>{CLIENT.site}</a></div>
    ),
  },
};

export function EmailPreview({ kind, onClose, onOpen }) {
  const { s } = useApp();
  const c = COPY[kind];
  return (
    <Modal onClose={onClose} wide label="Email preview">
      <div className="eyebrow" style={{ marginBottom: 0 }}><Icon name="mail" size={16} /> Email preview</div>
      <div className="email">
        <div className="email__meta">
          <span><b>From:</b> AI MAX &lt;hello@aimax.example&gt;</span>
          <span><b>To:</b> {s.signup.email}</span>
          <span><b>Subject:</b> {c.subject}</span>
        </div>
        <div className="email__body">
          <h3>{c.title}</h3>
          {c.body(s).map((p, i) => <p key={i}>{p}</p>)}
          {c.extra && c.extra(s)}
          <button className="email__btn" onClick={onOpen}>{c.cta}</button>
          <div className="email__fine">This secure link opens your own setup. It expires after 14 days, and you can always ask for a fresh one. Sent {fmtTime(Date.now())}.</div>
        </div>
      </div>
      <p className="muted small">Clicking the button in the email takes the client straight to their next unfinished step. No separate login.</p>
    </Modal>
  );
}
