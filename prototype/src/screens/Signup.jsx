import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Input, Check, Banner, Modal, Spinner, Tick, Kicker, useHeadingFocus } from '../ui/Primitives.jsx';
import { EmailPreview } from '../ui/Emails.jsx';
import ScaledSite from '../site/ScaledSite.jsx';
import { useApp, siteFromBiz, money, now, rid, nextRoute, isPaid } from '../store.jsx';
import { PLAN, CLIENT } from '../data.js';

function Terms({ onClose }) {
  return (
    <Modal onClose={onClose} label="Service agreement">
      <h2 className="h2">Service agreement, in plain words.</h2>
      <ul style={{ paddingLeft: 22, display: 'grid', gap: 10 }}>
        <li>Today you pay {money(PLAN.dueToday)}. After that, {money(PLAN.price)} a month for {PLAN.term}, billed on the {PLAN.billDay}.</li>
        <li>Your website goes live only after you approve it.</li>
        <li>AI MAX handles your website requests after launch.</li>
        <li>The full agreement is emailed to you with your receipt.</li>
      </ul>
      <button className="btn btn--primary" onClick={onClose}>Got it</button>
    </Modal>
  );
}

function PlanSummary() {
  return (
    <div className="plan" aria-label="What you pay">
      <div className="plan__row plan__row--due"><span>Due today</span><b>{money(PLAN.dueToday)}</b></div>
    </div>
  );
}

function SignupPreview({ site }) {
  const [dev, setDev] = useState('desktop');
  return (
    <aside className="spane" aria-label="Your new website">
      <div className="spane__top">
        <div>
          <div className="mono">Step one · Your website</div>
          <div className="spane__url">{CLIENT.site}</div>
        </div>
        <div className="seg seg--dark" role="group" aria-label="Preview size">
          <button className={dev === 'desktop' ? 'is-on' : ''} aria-pressed={dev === 'desktop'} onClick={() => setDev('desktop')}>Computer</button>
          <button className={dev === 'mobile' ? 'is-on' : ''} aria-pressed={dev === 'mobile'} onClick={() => setDev('mobile')}>Phone</button>
        </div>
      </div>
      <div className={'spane__frame' + (dev === 'mobile' ? ' is-phone' : '')}>
        <div className="minisite__bar"><i /><i /><i /><span>{CLIENT.site}</span></div>
        <div className="spane__view">
          <div style={{ width: dev === 'mobile' ? 300 : '100%', margin: '0 auto', height: '100%' }}>
            <ScaledSite site={site} height="100%" device={dev} />
          </div>
        </div>
      </div>
      <p className="spane__note">Built from your business details. It’s your way into AI MAX, and it goes live only when you approve it.</p>
    </aside>
  );
}

export function SignupForm() {
  const { s, mut, go } = useApp();
  const f = s.signup;
  const [errs, setErrs] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const busy = useRef(false);
  useHeadingFocus('signup');

  // Already paid? Resume, never charge twice.
  useEffect(() => {
    if (isPaid(s)) go(nextRoute(s));
  }, []); // eslint-disable-line

  const set = (k, v) => mut((d) => { d.signup[k] = v; d.signup.error = ''; });

  function fmtCard(v) { return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); }
  function fmtExp(v) { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; }

  function submit(e) {
    e.preventDefault();
    if (busy.current || f.status === 'processing') return; // duplicate click or refresh guard
    const er = {};
    if (!f.name.trim()) er.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Please enter an email like name@company.com.';
    if (f.password.length < 8) er.password = 'Use at least 8 characters.';
    if (f.card.replace(/\s/g, '').length < 13) er.card = 'Please enter your card number.';
    if (!/^\d\d\/\d\d$/.test(f.exp)) er.exp = 'Use month and year, like 08/28.';
    if (f.cvc.length < 3) er.cvc = '3 or 4 digits.';
    if (f.zip.length < 5) er.zip = 'Enter your ZIP code.';
    if (!f.agree) er.agree = 'Please accept the agreement to continue.';
    setErrs(er);
    if (Object.keys(er).length) {
      setTimeout(() => { const el = document.querySelector('.is-bad, [data-err]'); if (el) el.focus(); }, 30);
      return;
    }
    busy.current = true;
    mut((d) => { d.signup.status = 'processing'; d.signup.error = ''; d.route = { stage: 'signup', view: 'processing' }; });
  }

  return (
    <div className="screen signup">
      <form onSubmit={submit} noValidate className="sform" aria-label="Sign up and pay">
        <Kicker>Step 1 of 4 · Create your account</Kicker>
        <h1 className="h1 sform__h" tabIndex={-1} data-heading>Welcome to<br /><span className="accent">AI&nbsp;MAX.</span></h1>
        <p className="lede">Create your account, then review your new website. Nothing goes live until you approve it.</p>

        {f.error && <Banner tone="bad" icon="alert" title="Your payment didn’t go through.">{f.error} Nothing was charged. Your answers are still here.</Banner>}

        <section className="fsec" aria-labelledby="s1">
          <h2 className="fsec__t" id="s1"><span>1</span>Your account</h2>
          <Input label="Your name" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} error={errs.name} />
          <Input label="Email" type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} error={errs.email} />
          <div className="field">
            <label htmlFor="pw">Create a password</label>
            <div className="pwwrap">
              <input id="pw" className={'input' + (errs.password ? ' is-bad' : '')} type={showPw ? 'text' : 'password'} autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} style={{ paddingRight: 110 }} />
              <button type="button" className="linkbtn" onClick={() => setShowPw(!showPw)}>{showPw ? 'Hide' : 'Show'}</button>
            </div>
            {errs.password ? <div className="err" role="alert"><Icon name="alert" size={18} /> {errs.password}</div> : <div className="hint">At least 8 characters.</div>}
          </div>
        </section>

        <section className="fsec" aria-labelledby="s3">
          <h2 className="fsec__t" id="s3"><span>2</span>Payment</h2>
          <Input label="Card number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" value={f.card} onChange={(e) => set('card', fmtCard(e.target.value))} error={errs.card} />
          <div className="grid3">
            <Input label="Expires" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={f.exp} onChange={(e) => set('exp', fmtExp(e.target.value))} error={errs.exp} />
            <Input label="Security code" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={f.cvc} onChange={(e) => set('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))} error={errs.cvc} />
            <Input label="ZIP code" inputMode="numeric" autoComplete="postal-code" placeholder="75240" value={f.zip} onChange={(e) => set('zip', e.target.value.replace(/\D/g, '').slice(0, 5))} error={errs.zip} />
          </div>
          <div className="secure"><Icon name="lock" size={16} /> Your card details are encrypted.
            {s.demo.proto && <button type="button" className="skip" style={{ marginLeft: 'auto' }} onClick={() => mut((d) => { Object.assign(d.signup, { card: '4242 4242 4242 4242', exp: '08/28', cvc: '123', zip: '75240' }); })}><span className="pill-proto">Prototype</span>Test card</button>}
          </div>
        </section>

        <PlanSummary />

        <div className="field">
          <Check checked={f.agree} onChange={(e) => set('agree', e.target.checked)} data-err={errs.agree ? '' : undefined}>
            I agree to the <button type="button" className="linkbtn" onClick={() => setTerms(true)}>Service Agreement</button>.
          </Check>
          {errs.agree && <div className="err" role="alert"><Icon name="alert" size={18} /> {errs.agree}</div>}
        </div>

        <div className="sform__cta">
          <button className="btn btn--primary btn--block btn--xl" type="submit">Sign Up &amp; Pay <Icon name="arrowRight" size={22} /></button>
          <p className="muted small">Your account is created once your payment goes through.</p>
        </div>

      </form>

      <SignupPreview site={siteFromBiz(s.applied)} />
      {terms && <Terms onClose={() => setTerms(false)} />}
    </div>
  );
}

export function Processing() {
  const { s, mut, go, logEmail } = useApp();
  const [step, setStep] = useState(0);
  const done = useRef(false);
  useHeadingFocus('processing');
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 900);
    const t2 = setTimeout(() => setStep(2), 1900);
    const t3 = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      const declined = s.demo.decline || s.signup.card.replace(/\s/g, '').endsWith('0002');
      if (declined) {
        mut((d) => { d.signup.status = 'idle'; d.signup.error = 'Your bank declined this card.'; d.signup.cvc = ''; d.demo.decline = false; d.route = { stage: 'signup', view: 'form' }; });
        return;
      }
      mut((d) => {
        if (!d.signup.paidAt) { d.signup.paidAt = now(); d.signup.accountId = 'acct_' + rid(); }
        d.signup.status = 'done';
        d.signup.password = '';
        d.signup.card = ''; d.signup.cvc = '';
        d.route = { stage: 'signup', view: 'welcome' };
        d.emails.push({ kind: 'receipt', at: now() });
      });
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []); // eslint-disable-line
  const items = ['Checking your card', 'Taking your payment', 'Creating your AI MAX account'];
  return (
    <div className="screen center">
      <Spinner />
      <h1 className="h1" tabIndex={-1} data-heading style={{ fontSize: 36 }}>One moment.</h1>
      <p className="lede" style={{ marginTop: 0 }}>Please keep this page open.</p>
      <ul className="steps-list" aria-live="polite">
        {items.map((t, i) => <li key={t} className={i < step ? 'is-done' : ''}><Tick state={i < step ? 'done' : 'todo'} /> {t}</li>)}
      </ul>
    </div>
  );
}

export function Welcome() {
  const { s, go, setWelcomeLight } = useApp();
  const [mail, setMail] = useState(false);
  const left = useRef(false);
  useHeadingFocus('welcome');
  useEffect(() => {
    const a = setTimeout(() => setWelcomeLight(true), 1200); // the slow fade into the lighter platform tone
    const b = setTimeout(() => { if (!left.current) next(); }, 6200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []); // eslint-disable-line
  function next() { left.current = true; setWelcomeLight(false); go({ stage: 'details', view: 'form' }); }
  return (
    <div className="screen center">
      <div className="bigcheck"><Icon name="check" size={48} stroke={3} /></div>
      <div className="eyebrow">Payment received</div>
      <h1 className="h1" tabIndex={-1} data-heading>You’re in, {s.signup.name.split(' ')[0]}.</h1>
      <p className="lede" style={{ marginTop: 0, maxWidth: 520 }}>Your AI MAX account is ready. Your receipt and a private link to come back are on their way.</p>
      <div className="card card--tight" style={{ textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center', maxWidth: 520 }}>
        <span className="tick tick--todo" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>2</span>
        <div><b>Next, confirm your business details.</b><div className="muted small">We’ve filled in what we know.</div></div>
      </div>

      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn btn--primary" onClick={next}>Continue <Icon name="arrowRight" size={20} /></button>
        <button className="btn btn--ghost" onClick={() => setMail(true)}><Icon name="mail" size={18} /> See the email</button>
      </div>
      {mail && <EmailPreview kind="receipt" onClose={() => setMail(false)} onOpen={() => { setMail(false); next(); }} />}
    </div>
  );
}
