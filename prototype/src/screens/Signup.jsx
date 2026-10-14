import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Input, Check, ActionBar, Banner, Modal, Spinner, Tick, useHeadingFocus } from '../ui/Primitives.jsx';
import { EmailPreview } from '../ui/Emails.jsx';
import ScaledSite from '../site/ScaledSite.jsx';
import { useApp, siteFromBiz, money, now, rid, nextRoute, isPaid } from '../store.jsx';
import { PLAN, CLIENT } from '../data.js';

function Terms({ onClose }) {
  return (
    <Modal onClose={onClose} label="Service agreement">
      <h2 className="h2">Service agreement, in plain words.</h2>
      <ul style={{ paddingLeft: 22, display: 'grid', gap: 10 }}>
        <li>You pay {money(PLAN.price)} per month for {PLAN.term}. Today you pay {money(PLAN.dueToday)}.</li>
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
    <div className="card price">
      <div>
        <div className="muted small" style={{ fontWeight: 600 }}>{PLAN.name}</div>
        <div className="price__big">{money(PLAN.price)} <small>per month</small></div>
      </div>
      <div className="price__rows">
        <div className="price__row"><span>Commitment</span><span>{PLAN.term}</span></div>
        <div className="price__row"><span>Billing</span><span>{PLAN.billing}, on the {PLAN.billDay}</span></div>
        <div className="price__row"><span>Next bill after today</span><span>{PLAN.nextBill}</span></div>
        <div className="price__row price__row--total"><span>Due today</span><span>{money(PLAN.dueToday)}</span></div>
      </div>
    </div>
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
    <div className="screen">
      <Head eyebrow="Step 1 of 4 · Sign up" title="Let’s get your website live." lede="Pay once to start. Then we confirm a few details, you review your website, and it goes live when you say so." />
      <div className="signup">
        <form onSubmit={submit} noValidate className="card" aria-label="Sign up and pay">
          {f.error && <div style={{ marginBottom: 20 }}><Banner tone="bad" icon="alert" title="Your payment didn’t go through.">{f.error} Nothing was charged, and your answers are still here.</Banner></div>}
          <section className="formsec" aria-labelledby="s1">
            <div className="formsec__t" id="s1"><span className="formsec__n">1</span> About you</div>
            <div className="grid2">
              <Input label="Your name" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} error={errs.name} />
              <Input label="Email for your account" type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} error={errs.email} hint="We send your receipt here." />
            </div>
          </section>
          <section className="formsec" aria-labelledby="s2">
            <div className="formsec__t" id="s2"><span className="formsec__n">2</span> Create your password</div>
            <div className="field">
              <label htmlFor="pw">Password</label>
              <div className="pwwrap">
                <input id="pw" className={'input' + (errs.password ? ' is-bad' : '')} type={showPw ? 'text' : 'password'} autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} style={{ paddingRight: 110 }} />
                <button type="button" className="linkbtn" onClick={() => setShowPw(!showPw)}>{showPw ? 'Hide' : 'Show'}</button>
              </div>
              {errs.password ? <div className="err" role="alert"><Icon name="alert" size={18} /> {errs.password}</div> : <div className="hint">At least 8 characters. This is how you sign in to AI MAX later.</div>}
            </div>
          </section>
          <section className="formsec" aria-labelledby="s3">
            <div className="formsec__t" id="s3"><span className="formsec__n">3</span> Payment</div>
            <Input label="Card number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" value={f.card} onChange={(e) => set('card', fmtCard(e.target.value))} error={errs.card} />
            <div className="grid3">
              <Input label="Expires" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={f.exp} onChange={(e) => set('exp', fmtExp(e.target.value))} error={errs.exp} />
              <Input label="Security code" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={f.cvc} onChange={(e) => set('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))} error={errs.cvc} />
              <Input label="Card ZIP code" inputMode="numeric" autoComplete="postal-code" placeholder="75240" value={f.zip} onChange={(e) => set('zip', e.target.value.replace(/\D/g, '').slice(0, 5))} error={errs.zip} />
            </div>
            <div className="secure"><Icon name="lock" size={16} /> Your card is encrypted. We never see the full number.
              {s.demo.proto && <button type="button" className="skip" style={{ marginLeft: 'auto' }} onClick={() => mut((d) => { Object.assign(d.signup, { card: '4242 4242 4242 4242', exp: '08/28', cvc: '123', zip: '75240' }); })}><span className="pill-proto">Prototype</span>Fill test card</button>}
            </div>
          </section>
          <section className="formsec" aria-labelledby="s4">
            <div className="formsec__t" id="s4"><span className="formsec__n">4</span> Agreement</div>
            <Check checked={f.agree} onChange={(e) => set('agree', e.target.checked)} data-err={errs.agree ? '' : undefined}>
              I agree to the <button type="button" className="linkbtn" onClick={() => setTerms(true)}>Service Agreement</button>, and to pay {money(PLAN.price)} per month for {PLAN.term}.
            </Check>
            {errs.agree && <div className="err" role="alert"><Icon name="alert" size={18} /> {errs.agree}</div>}
          </section>
          <div style={{ marginTop: 30 }}>
            <button className="btn btn--primary btn--block" style={{ minHeight: 64, fontSize: 21 }} type="submit">Sign up &amp; pay {money(PLAN.dueToday)} <Icon name="arrowRight" size={22} /></button>
            <p className="muted small" style={{ textAlign: 'center', marginTop: 12 }}>Your account is created after your payment succeeds.</p>
          </div>
        </form>

        <aside className="signup__side" aria-label="Your order">
          <div className="minisite">
            <div className="minisite__bar"><i /><i /><i /><span>{CLIENT.site}</span></div>
            <ScaledSite site={siteFromBiz(s.applied)} height={250} />
          </div>
          <div className="muted small" style={{ textAlign: 'center', marginTop: -8 }}>Your new website, ready for you to review after sign up.</div>
          <PlanSummary />
        </aside>
      </div>
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
      <p className="lede" style={{ marginTop: 0, maxWidth: 520 }}>Your AI MAX account is ready. We emailed your receipt and a private link to come back any time.</p>
      <div className="card card--tight" style={{ textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center', maxWidth: 520 }}>
        <span className="tick tick--todo" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>2</span>
        <div><b>Next: confirm your business details.</b><div className="muted small">It takes about three minutes. We’ve filled in what we know.</div></div>
      </div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn btn--primary" onClick={next}>Continue <Icon name="arrowRight" size={20} /></button>
        <button className="btn btn--ghost" onClick={() => setMail(true)}><Icon name="mail" size={18} /> See the email</button>
      </div>
      {mail && <EmailPreview kind="receipt" onClose={() => setMail(false)} onOpen={() => { setMail(false); next(); }} />}
    </div>
  );
}
