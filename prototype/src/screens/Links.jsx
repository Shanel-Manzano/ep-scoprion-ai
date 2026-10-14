import React, { useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Banner, useHeadingFocus } from '../ui/Primitives.jsx';
import { EmailPreview } from '../ui/Emails.jsx';
import { useApp, nextRoute, describeRoute } from '../store.jsx';
import { CLIENT } from '../data.js';

// Someone follows an old setup link after launch: show the finished state, never the editing tools.
export function CompletedLaunch() {
  const { s, go } = useApp();
  const domain = s.launch.domain.choice === 'other' ? s.launch.domain.other : s.launch.domain.name;
  useHeadingFocus('completed');
  return (
    <div className="screen center" style={{ gap: 18 }}>
      <div className="bigcheck"><Icon name="check" size={48} stroke={3} /></div>
      <h1 className="h1" tabIndex={-1} data-heading>Your website is already live.</h1>
      <p className="lede" style={{ marginTop: 0, maxWidth: 520 }}>This link was for setting up your website, and that’s done. Your website is at <b>{domain}</b>. From here, everything happens in AI MAX, including future website requests.</p>
      <button className="btn btn--primary" style={{ minHeight: 62, fontSize: 20 }} onClick={() => go({ stage: 'platform', view: 'setup' })}>Continue to AI MAX <Icon name="arrowRight" size={22} /></button>
    </div>
  );
}

// A secure return link has expired; ask for a fresh one (no new login).
export function ExpiredLink() {
  const { s, go, say, logEmail } = useApp();
  const [sentMail, setSentMail] = useState(false);
  const [view, setView] = useState(false);
  useHeadingFocus('expired');
  const r = nextRoute(s);
  return (
    <div className="screen center" style={{ gap: 18 }}>
      <div className="bigcheck" style={{ background: 'var(--warn)', boxShadow: '0 0 0 12px var(--warn-soft)' }}><Icon name="clock" size={44} /></div>
      <h1 className="h1" tabIndex={-1} data-heading>This link has expired.</h1>
      <p className="lede" style={{ marginTop: 0, maxWidth: 520 }}>For your safety, setup links stop working after a while. Nothing is lost. We can send a fresh one to <b>{s.signup.email}</b>.</p>
      {!sentMail
        ? <button className="btn btn--primary" onClick={() => { setSentMail(true); logEmail('resume'); }}><Icon name="mail" size={20} /> Email me a new link</button>
        : <>
            <Banner tone="good" icon="checkCircle" title="A new link is on its way.">It brings you back to: {describeRoute(r)}.</Banner>
            <button className="btn btn--ghost" onClick={() => setView(true)}><Icon name="mail" size={18} /> See the email</button>
          </>}
      {view && <EmailPreview kind="resume" onClose={() => setView(false)} onOpen={() => { setView(false); go(r); say('Welcome back.'); }} />}
    </div>
  );
}
