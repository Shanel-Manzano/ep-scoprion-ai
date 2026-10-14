// RooSite.jsx — The Duran Law Firm homepage (the "after"). Estate & probate.
// Class names kept (roo-*) so the shared CSS applies; content + data-el labels are legal.
import React from 'react';
import { Icon, Stars } from '../ui/Icons.jsx';

  const SERVICES = [
    { ico: 'shieldCheck', accent: true, t: 'Probate', d: 'Uncontested estates handled start to finish, with or without a will, for one clear, flat fee.' },
    { ico: 'users', t: 'Guardianship', d: 'Compassionate guardianships for seniors, adults with special needs, and minor children.' },
    { ico: 'fileText', t: 'Estate Planning', d: 'Goal-driven wills and plans that protect your family and keep them out of court.' },
    { ico: 'bookOpen', t: 'Wills & Trusts', d: 'Clear, properly executed documents, drafted to hold up and easy to understand.' },
    { ico: 'feather', t: 'Powers of Attorney', d: 'Medical and financial directives so the right person can act when it matters.' },
    { ico: 'landmark', t: 'Probate Litigation', d: 'When an estate is contested, steady representation that protects your interests.' },
  ];
  const WHY = [
    { ico: 'scale', t: 'Former probate court clerk', d: 'Michael clerked under a Dallas County Probate Judge, so he knows the court from the inside.' },
    { ico: 'dollar', t: 'Fixed, flat fees', d: 'Most matters are quoted as one flat fee up front. No surprise hourly bills.' },
    { ico: 'award', t: '20+ years, 2,000+ estates', d: 'Two decades focused on probate, guardianship, and estate planning across North Texas.' },
    { ico: 'heart', t: 'Guidance, not jargon', d: 'Plain-English advice and a real person on the other end of the phone.' },
  ];
  const PROCESS = [
    { t: 'Free Consultation', d: 'We listen first, answer your questions, and tell you honestly where you stand.' },
    { t: 'Flat-Fee Quote', d: 'One clear price for your matter — explained line by line before you commit.' },
    { t: 'We Handle the Court', d: 'Filings, hearings, and deadlines. We manage the process so you don’t have to.' },
    { t: 'Closing & Peace of Mind', d: 'The estate is settled, the family is protected, and the matter is behind you.' },
  ];
  const REVIEWS = [
    { n: 'Patricia M.', city: 'Plano, TX', t: 'Michael probated my late husband’s estate quickly and for a flat fee. He made an overwhelming time so much easier.' },
    { n: 'The Alvarez Family', city: 'Dallas, TX', t: 'We needed guardianship for my mother. They guided us with patience and real compassion every step of the way.' },
    { n: 'Robert & Diane S.', city: 'McKinney, TX', t: 'Finally an estate plan we actually understand. Clear pricing, no jargon, and our family is protected.' },
  ];
  const AREAS = ['Dallas', 'Plano', 'Frisco', 'McKinney', 'Allen', 'Richardson', 'Garland', 'Collin County', 'North Texas'];

  const DEFAULT_SITE = {
    name: 'The Duran Law Firm',
    phone: '(214) 225-4150',
    email: 'intake@duranfirm.com',
    address: '13355 Noel Rd, Ste 1100, Dallas TX',
    services: ['Probate', 'Guardianship', 'Estate Planning', 'Wills & Trusts', 'Powers of Attorney', 'Probate Litigation'],
  };
  function buildServices(names) {
    return (names || []).slice(0, 9).map((n, i) => {
      const base = SERVICES.find((x) => x.t === n);
      return base ? { ...base, accent: i === 0 } : { ico: 'fileText', accent: i === 0, t: n, d: 'Clear guidance on ' + n.toLowerCase() + ', from a team that explains every step in plain English.' };
    });
  }
  function el(label) { return { 'data-el': label }; }

  function RooSite({ device, site }) {
    const S = { ...DEFAULT_SITE, ...(site || {}) };
    const svcList = buildServices(S.services);
    return (
      <div className={'roo' + (device === 'mobile' ? ' roo--mobile' : '')}>
        {/* NAV */}
        <nav className="roo-nav" id="roo-nav" data-section="Header & navigation">
          <a className="roo-logo" {...el('Logo & firm name')}>
            <span className="roo-logo__mark"><Icon name="scale" size={24} stroke={2} /></span>
            <span className="roo-logo__txt"><b>{S.name}</b><span>Estate &amp; Probate</span></span>
          </a>
          <div className="roo-nav__links" {...el('Main menu links')}>
            <a href="#roo-services">Practice Areas</a>
            <a href="#roo-why">About</a>
            <a href="#roo-process">How It Works</a>
            <a href="#roo-reviews">Results</a>
            <a href="#roo-area">Service Area</a>
          </div>
          <div className="roo-nav__right">
            <div className="roo-phone" id="roo-phone" {...el('Call tracking phone number')}>
              <span className="roo-phone__ico"><Icon name="phone" size={18} /></span>
              <span className="roo-phone__txt"><span>Free consultation</span><b>{S.phone}</b></span>
            </div>
            <button className="roo-btn roo-btn--primary" {...el('‘Free Consultation’ button')}>Free Consultation</button>
            <button className="roo-burger" aria-label="Menu"><Icon name="menu" size={20} /></button>
          </div>
        </nav>

        {/* HERO */}
        <header className="roo-hero" id="roo-hero" data-section="Hero">
          <div className="roo-hero__grid">
            <div className="roo-hero__copy">
              <span className="roo-hero__eyebrow" {...el('Hero eyebrow tag')}><Icon name="mapPin" size={15} /> Serving Dallas &amp; Collin County</span>
              <h1 {...el('Hero headline')}>Probate, handled<br /><span className="u">with care.</span></h1>
              <p className="roo-hero__lede" {...el('Hero subheadline')}>
                Fixed-fee probate, guardianship, and estate planning from an attorney who has
                spent 20+ years guiding North Texas families, without the hourly surprises.
              </p>
              <div className="roo-hero__cta" {...el('Hero call-to-action buttons')}>
                <button className="roo-btn roo-btn--primary roo-btn--lg">Schedule a free consultation <Icon name="arrowRight" size={18} /></button>
                <button className="roo-btn roo-btn--ghost roo-btn--lg"><Icon name="phone" size={18} /> {S.phone}</button>
              </div>
              <div className="roo-hero__trust" {...el('Hero trust badges & rating')}>
                <div className="roo-hero__rating">
                  <span className="roo-hero__stars"><Stars n={5} size={17} /></span>
                  <span><b>4.9/5</b> from 200+ families</span>
                </div>
                <div className="roo-hero__badges">
                  <span className="roo-hero__badge"><Icon name="shieldCheck" size={17} /> Licensed in Texas</span>
                </div>
              </div>
            </div>
            <div className="roo-hero__art">
              <div className="roo-hero__photo photo" {...el('Hero photo')}>
                <span className="photo__tag"><Icon name="image" size={15} /> Photo: Michael Duran, Attorney</span>
              </div>
              <div className="roo-hero__float roo-hero__float--a" {...el('Hero stat badge — estates probated')}>
                <span className="ico"><Icon name="landmark" size={22} /></span>
                <div><b>2,000+</b><span>estates probated</span></div>
              </div>
              <div className="roo-hero__float roo-hero__float--b" {...el('Hero floating review card')}>
                <span className="stars"><Stars n={5} size={14} /></span>
                <q>He made a hard time so much easier for our family.</q>
                <cite>Patricia M., Plano</cite>
              </div>
            </div>
          </div>
        </header>

        {/* STATS / TRUST BAR */}
        <section className="roo-stats" id="roo-stats" data-section="Trust stats bar" {...el('Trust stats bar')}>
          <div className="roo-stats__inner">
            <div className="roo-stat"><b>20<em>+yr</em></b><span>focused on probate law</span></div>
            <div className="roo-stat"><b>2,000<em>+</em></b><span>estates &amp; wills probated</span></div>
            <div className="roo-stat"><b>Flat<em>fee</em></b><span>quoted up front</span></div>
            <div className="roo-stat"><b>A<em>+</em></b><span>BBB-accredited firm</span></div>
          </div>
        </section>

        {/* PRACTICE AREAS */}
        <section className="roo-sec" id="roo-services" data-section="Practice areas">
          <div className="roo-sec__head">
            <span className="roo-eyebrow" {...el('Practice-areas eyebrow')}>What we do</span>
            <h2 {...el('Practice-areas heading')}>Estate &amp; probate, start to finish.</h2>
            <p {...el('Practice-areas subtext')}>One firm for the moments that matter most, from settling an estate to protecting a loved one.</p>
          </div>
          <div className="roo-services__grid">
            {svcList.map((s) => (
              <div className="svc" key={s.t} {...el('Practice area: ' + s.t)}>
                <div className={'svc__ico' + (s.accent ? ' svc__ico--accent' : '')}><Icon name={s.ico} size={26} /></div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <a href="#">Learn more <Icon name="arrowRight" size={15} /></a>
              </div>
            ))}
          </div>
        </section>

        {/* WHY */}
        <section className="roo-why" id="roo-why" data-section="Why choose us">
          <div className="roo-why__wrap">
            <div className="roo-why__photo photo" {...el('‘About’ photo')}>
              <span className="photo__tag"><Icon name="image" size={15} /> Photo: Michael with a client family</span>
            </div>
            <div className="roo-why__copy">
              <span className="roo-eyebrow" {...el('About eyebrow')}>Why families choose Duran</span>
              <h2 {...el('About heading')}>An attorney who treats your family like his own.</h2>
              <div className="roo-why__list">
                {WHY.map((w) => (
                  <div className="roo-why__item" key={w.t} {...el('About point: ' + w.t)}>
                    <span className="ico"><Icon name={w.ico} size={23} /></span>
                    <div><h4>{w.t}</h4><p>{w.d}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="roo-sec" id="roo-process" data-section="How it works">
          <div className="roo-sec__head">
            <span className="roo-eyebrow" {...el('Process eyebrow')}>How it works</span>
            <h2 {...el('Process heading')}>Four steps. No legal maze.</h2>
          </div>
          <div className="roo-process__grid">
            {PROCESS.map((p, i) => (
              <div className="pstep" key={p.t} {...el('Process step ' + (i + 1) + ': ' + p.t)}>
                <div className="pstep__n">{i + 1}</div>
                <h4>{p.t}</h4><p>{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICE AREA */}
        <section className="roo-area" id="roo-area" data-section="Service area">
          <div className="roo-area__wrap">
            <div className="roo-area__copy">
              <span className="roo-eyebrow roo-area__eyebrow" {...el('Service-area eyebrow')}>Where we practice</span>
              <h2 {...el('Service-area heading')}>Proudly local to North Texas.</h2>
              <p {...el('Service-area description')}>Based in Dallas and serving the surrounding counties. You’ll work directly with our team, never a national call center.</p>
              <div className="roo-area__chips" {...el('Service-area city list')}>
                {AREAS.map((a) => <span key={a}>{a}</span>)}
              </div>
            </div>
            <div className="roo-map" {...el('Service area map')}>
              <div className="roo-map__grid"></div>
              <span className="roo-map__pin" style={{ left: '24%', top: '30%' }}></span>
              <span className="roo-map__pin" style={{ left: '70%', top: '26%' }}></span>
              <span className="roo-map__pin" style={{ left: '32%', top: '68%' }}></span>
              <span className="roo-map__pin" style={{ left: '76%', top: '64%' }}></span>
              <div className="roo-map__hq"><span className="dot"></span><span>Dallas Office</span></div>
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="roo-sec" id="roo-reviews" data-section="Results & reviews">
          <div className="roo-sec__head">
            <span className="roo-eyebrow" {...el('Reviews eyebrow')}>In their words</span>
            <h2 {...el('Reviews heading')}>Families who got their lives back.</h2>
          </div>
          <div className="roo-reviews__grid">
            {REVIEWS.map((r) => (
              <div className="rev" key={r.n} {...el('Review from ' + r.n)}>
                <span className="rev__stars"><Stars n={5} size={16} /></span>
                <p className="rev__text">“{r.t}”</p>
                <div className="rev__who">
                  <span className="rev__av">{r.n.charAt(0)}</span>
                  <div><b>{r.n}</b><span>{r.city}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="roo-cta" id="roo-cta" data-section="Consultation call-to-action">
          <div className="roo-cta__inner">
            <div className="roo-cta__copy">
              <span className="roo-eyebrow" {...el('CTA eyebrow')}>Free, no-pressure consultation</span>
              <h2 {...el('CTA heading')}>Talk to an attorney, not a call center.</h2>
              <p {...el('CTA subtext')}>Tell us what you’re facing. We’ll explain your options in plain English, usually the same day.</p>
            </div>
            <form className="roo-cta__box" {...el('Consultation request form')} onSubmit={(e) => e.preventDefault()}>
              <h4>Request your free consultation</h4>
              <div className="roo-field"><label>Full name</label><input placeholder="Jane Doe" /></div>
              <div className="roo-field"><label>Phone</label><input placeholder="(555) 555-0123" /></div>
              <div className="roo-field"><label>How can we help?</label>
                <select defaultValue=""><option value="" disabled>Choose one…</option><option>Probate (with or without a will)</option><option>Guardianship</option><option>Estate planning</option><option>Wills &amp; trusts</option><option>Something else</option></select>
              </div>
              <button className="roo-btn roo-btn--primary">Request my consultation <Icon name="arrowRight" size={18} /></button>
              <small>Confidential. No obligation. A real attorney reviews every request.</small>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="roo-footer" id="roo-footer" data-section="Footer">
          <div className="roo-footer__top">
            <div className="roo-footer__brand" {...el('Footer firm info')}>
              <div className="roo-logo">
                <span className="roo-logo__mark"><Icon name="scale" size={24} stroke={2} /></span>
                <span className="roo-logo__txt"><b>{S.name}</b><span>Estate &amp; Probate</span></span>
              </div>
              <p>Dallas-based and family-focused. Fixed-fee probate, guardianship, and estate planning across North Texas.</p>
            </div>
            <div className="roo-footer__col" {...el('Footer: Practice links')}><h5>Practice Areas</h5><ul>{svcList.slice(0, 4).map((x) => <li key={x.t}><a href="#">{x.t}</a></li>)}</ul></div>
            <div className="roo-footer__col" {...el('Footer: Firm links')}><h5>Firm</h5><ul><li><a href="#">About Michael</a></li><li><a href="#">Results</a></li><li><a href="#">Service Area</a></li><li><a href="#">Contact</a></li></ul></div>
            <div className="roo-footer__col" {...el('Footer: Contact info')}><h5>Get in touch</h5><ul><li><a href="#">{S.phone}</a></li><li><a href="#">{S.email}</a></li><li><a href="#">{S.address}</a></li></ul></div>
          </div>
          <div className="roo-footer__bottom" {...el('Footer legal bar')}>
            <span>© 2026 The Duran Law Firm, PLLC · Michael A. Duran, Attorney · Licensed in Texas</span>
            <span>Privacy · Terms · Disclaimer</span>
          </div>
        </footer>

        {/* MOBILE sticky call bar */}
        <div className="roo-callbar" {...el('Mobile sticky call bar')}>
          <button className="roo-btn roo-btn--navy"><Icon name="phone" size={18} /> Call</button>
          <button className="roo-btn roo-btn--primary">Free Consultation</button>
        </div>

        {/* SCORPION CONNECT — always-on chat / text widget */}
        <div className="roo-connect-dock">
          <div className="roo-connect" id="roo-connect" {...el('Scorpion Connect chat widget')}>
            <span className="roo-connect__ico"><Icon name="message" size={20} /></span>
            <div className="roo-connect__txt">
              <b>Text us a question<span className="roo-connect__live"><i></i> Online now</span></b>
              <span>Real person · typically replies in 2 min</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
export default RooSite;
