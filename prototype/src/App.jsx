import React, { useEffect, useState } from 'react';
import { AppProvider, useApp, isPaid, nextRoute } from './store.jsx';
import { Topbar, HelpPanel, FinishLater, Toast } from './ui/Shell.jsx';
import { EmailPreview } from './ui/Emails.jsx';
import { Demo } from './ui/Demo.jsx';
import { SignupForm, Processing, Welcome } from './screens/Signup.jsx';
import { DetailsForm } from './screens/Details.jsx';
import { Applying, Updating } from './screens/Updating.jsx';
import { Review } from './screens/Review.jsx';
import { SendReview, Tracking } from './screens/Tracking.jsx';
import { LaunchDetails, Publish, Live } from './screens/Launch.jsx';
import { Platform } from './screens/Platform.jsx';
import { CompletedLaunch, ExpiredLink } from './screens/Links.jsx';

function Screen({ onHelp }) {
  const { s } = useApp();
  const { stage, view } = s.route;
  const paid = isPaid(s);

  if (stage === 'link') return <ExpiredLink />;
  // Old pre-platform links never reopen the editing workflow after launch.
  if (s.liveAt && ['signup', 'details', 'website'].includes(stage)) return <CompletedLaunch />;
  if (s.liveAt && stage === 'launch' && view !== 'live') return <CompletedLaunch />;
  if (stage === 'signup') {
    if (view === 'processing') return <Processing />;
    if (view === 'welcome') return <Welcome />;
    return <SignupForm />;
  }
  if (stage === 'details') return <DetailsForm />;
  if (stage === 'website') {
    return { applying: <Applying />, updating: <Updating />, send: <SendReview />, tracking: <Tracking /> }[view] || <Review />;
  }
  if (stage === 'launch') return { publish: <Publish />, live: <Live /> }[view] || <LaunchDetails />;
  if (stage === 'platform') return <Platform onHelp={onHelp} />;
  return null;
}

function Shell() {
  const { s, go, welcomeLight } = useApp();
  const [help, setHelp] = useState(false);
  const [later, setLater] = useState(false);
  const [email, setEmail] = useState(null);
  const { stage, view } = s.route;
  const paid = isPaid(s);

  // Guards: nobody lands on a screen whose earlier steps aren't done.
  useEffect(() => {
    if (!paid && stage !== 'signup' && stage !== 'link') go({ stage: 'signup', view: 'form' });
    else if (paid && !s.confirmedAt && ['website', 'launch'].includes(stage)) go({ stage: 'details', view: 'form' });
  }, [stage, view, paid, s.confirmedAt]); // eslint-disable-line

  const [pref, setPref] = useState(() => { try { return localStorage.getItem('aimax-theme') || ''; } catch (e) { return ''; } });
  const dark = stage === 'signup' && view !== 'welcome';
  const auto = view === 'welcome' && stage === 'signup' ? (welcomeLight ? 'light' : 'dark') : dark ? 'dark' : 'light';
  const tone = pref || auto;
  const toggleTheme = () => { const n = tone === 'dark' ? 'light' : 'dark'; setPref(n); try { localStorage.setItem('aimax-theme', n); } catch (e) { /* noop */ } };
  const wide = stage === 'website' && (view === 'review' || !view);
  const bleed = stage === 'signup' && (view === 'form' || !view);
  const mid = stage === 'details';

  useEffect(() => { document.title = 'AI MAX · Website setup'; }, []);
  useEffect(() => { document.body.style.background = tone === 'dark' ? '#0d0a1e' : '#f4f1ff'; document.body.style.transition = 'background 2.4s'; }, [tone]);

  return (
    <div className="app" data-tone={tone} data-brand={tone === 'dark' && stage === 'signup' ? 'aimax' : 'platform'}>
      <a className="sr" href="#main">Skip to main content</a>
      <Topbar onHelp={() => setHelp(true)} onLater={() => setLater(true)} tone={tone} onToggleTheme={toggleTheme} />
      <main id="main" className={'main' + (wide ? ' main--wide' : '') + (bleed ? ' main--bleed' : '') + (mid ? ' main--mid' : '')} key={stage + '/' + view}>
        <Screen onHelp={() => setHelp(true)} />
      </main>
      <Toast />
      <Demo onEmail={setEmail} />
      {help && <HelpPanel onClose={() => setHelp(false)} />}
      {later && <FinishLater onClose={() => setLater(false)} />}
      {email && <EmailPreview kind={email} onClose={() => setEmail(null)} onOpen={() => { setEmail(null); go(nextRoute(s)); }} />}
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
