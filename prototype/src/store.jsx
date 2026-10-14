import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { DRAFT_BIZ, CLIENT } from './data.js';

// One customer record. Pre-platform setup and AI MAX onboarding both read and
// write this same object, so nothing is ever asked twice.

const KEY = 'aimax-prototype-v1';
const clone = (x) => JSON.parse(JSON.stringify(x));
const rid = () => Math.random().toString(36).slice(2, 10);
export const now = () => Date.now();

export function initialState() {
  return {
    v: 1,
    route: { stage: 'signup', view: 'form' },
    signup: {
      name: 'Michael Duran', email: 'michael@duranfirm.com', password: '', card: '', exp: '', cvc: '', zip: '',
      agree: false, status: 'idle', error: '', idem: rid(), accountId: null, paidAt: null,
    },
    biz: clone(DRAFT_BIZ),
    applied: clone(DRAFT_BIZ), // what the current website draft was built from
    confirmedAt: null,
    changes: [],
    update: { state: 'none', startedAt: null }, // none | applying | team | question | ready
    siteVersion: 1,
    draftedAt: null,
    edits: [],
    editSeq: 0,
    generalNote: '',
    batches: [],
    approval: null, // { version, by, at }
    launch: {
      calls: { tracking: '(214) 555-0198', receiving: '(214) 555-0142', tested: false, error: '' },
      forms: { dest: 'intake@duranfirm.com', tested: false, error: '' },
      followup: { mode: 'request', confirmed: false, calendar: 'none' },
      domain: { name: CLIENT.site, choice: null, other: '', provider: '', status: 'none', checks: 0, helpRequested: false },
    },
    pub: { state: 'idle', step: 0 }, // idle | publishing | waiting | action | live
    liveAt: null,
    platform: {
      google: { status: 'idle', account: null },
      facebook: { status: 'idle', account: null },
      instagram: { status: 'idle', account: null },
      crm: { state: 'none', choice: null, other: '' },
      revenue: { amount: '', period: 'month', saved: false },
      doneAt: null,
    },
    demo: { decline: false, scenario: 'auto', proto: true, pubOutcome: 'live' },
    emails: [],
    flags: { tourDismissed: false, helpedSeen: false },
    savedAt: now(),
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const s = { ...initialState(), ...JSON.parse(raw) };
    // Anything that was mid-flight when the page closed goes back to a safe state.
    if (s.signup.status === 'processing') s.signup.status = 'idle';
    if (s.update.state === 'applying') s.update.state = 'applying';
    if (s.pub.state === 'publishing') s.pub = { state: 'idle', step: 0 };
    return s;
  } catch (e) {
    return initialState();
  }
}

function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* noop */ }
}
export function wipe() {
  try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
}

// ---------------------------------------------------------------------------
// Derived facts
// ---------------------------------------------------------------------------
export const isPaid = (s) => !!s.signup.paidAt;
export const approvalCurrent = (s) => !!s.approval && s.approval.version === s.siteVersion;
export const pendingUpdate = (s) => ['applying', 'team', 'question'].includes(s.update.state);
export const drafts = (s) => s.edits.filter((e) => e.status === 'draft');
export const sent = (s) => s.edits.filter((e) => e.status !== 'draft');
export const unresolvedSent = (s) => s.edits.filter((e) => ['received', 'in_progress', 'needs_answer'].includes(e.status));
export const needsAnswer = (s) => s.edits.filter((e) => e.status === 'needs_answer');

export function launchItems(s) {
  const l = s.launch;
  const domainDone = l.domain.status === 'connected';
  const followDone = l.followup.confirmed && (l.followup.mode !== 'booking' || l.followup.calendar === 'tested');
  return {
    calls: l.calls.tested,
    forms: l.forms.tested,
    followup: followDone,
    domain: domainDone,
    approval: approvalCurrent(s),
  };
}
export const launchDetailsDone = (s) => {
  const i = launchItems(s);
  return i.calls && i.forms && i.followup && i.domain;
};

export function publishChecks(s) {
  const i = launchItems(s);
  return [
    { key: 'confirmed', label: 'Business details confirmed', ok: !!s.confirmedAt, fix: { stage: 'details', view: 'form' }, fixLabel: 'Confirm details' },
    { key: 'updates', label: 'Website updates applied', ok: !pendingUpdate(s), fix: { stage: 'website', view: 'updating' }, fixLabel: 'See updates' },
    { key: 'approved', label: 'Current website version approved', ok: i.approval && unresolvedSent(s).length === 0, fix: { stage: 'website', view: 'review' }, fixLabel: 'Review website' },
    { key: 'domain', label: 'Domain connected', ok: i.domain, fix: { stage: 'launch', view: 'details', open: 'domain' }, fixLabel: 'Connect domain' },
    { key: 'calls', label: 'Call routing tested', ok: i.calls, fix: { stage: 'launch', view: 'details', open: 'calls' }, fixLabel: 'Test calls' },
    { key: 'forms', label: 'Form delivery tested', ok: i.forms, fix: { stage: 'launch', view: 'details', open: 'forms' }, fixLabel: 'Test form' },
    { key: 'followup', label: 'Consultation follow-up set', ok: i.followup, fix: { stage: 'launch', view: 'details', open: 'followup' }, fixLabel: 'Choose follow-up' },
  ];
}

export function platformItems(s) {
  const p = s.platform;
  const social = (k) => ['connected', 'none'].includes(p[k].status);
  return {
    details: true, hours: true, services: true,
    social: social('google') && social('facebook') && social('instagram'),
    crm: ['connected', 'no_software', 'other'].includes(p.crm.state),
    revenue: p.revenue.saved,
  };
}

export function milestones(s) {
  return {
    paid: s.signup.paidAt,
    confirmed: s.confirmedAt,
    drafted: s.draftedAt,
    approved: approvalCurrent(s) ? s.approval.at : null,
    live: s.liveAt,
    platform: s.platform.doneAt,
  };
}

// Where should someone land if they come back later (or open an email link)?
export function nextRoute(s) {
  if (!isPaid(s)) return { stage: 'signup', view: 'form' };
  if (s.liveAt) return { stage: 'platform', view: 'setup' };
  if (!s.confirmedAt) return { stage: 'details', view: 'form' };
  if (s.update.state === 'applying') return { stage: 'website', view: 'applying' };
  if (pendingUpdate(s)) return { stage: 'website', view: 'updating' };
  if (needsAnswer(s).length) return { stage: 'website', view: 'tracking' };
  if (unresolvedSent(s).length) return { stage: 'website', view: 'tracking' };
  if (!approvalCurrent(s)) return { stage: 'website', view: 'review' };
  if (!launchDetailsDone(s)) return { stage: 'launch', view: 'details' };
  return { stage: 'launch', view: 'publish' };
}

export function describeRoute(r) {
  const m = {
    'signup/form': 'Sign up', 'details/form': 'Confirm your business details', 'website/review': 'Review your website',
    'website/updating': 'Your website update', 'website/applying': 'Your website update', 'website/tracking': 'Your edits',
    'website/send': 'Send your edits', 'launch/details': 'Get ready to launch', 'launch/publish': 'Approve & launch',
    'launch/live': 'Your live website', 'platform/setup': 'Finish setting up AI MAX',
  };
  return m[r.stage + '/' + r.view] || 'Your setup';
}

// ---------------------------------------------------------------------------
// Business confirmation -> website changes
// ---------------------------------------------------------------------------
const addr = (l) => [l.street, l.suite, l.city + ', ' + l.state + ' ' + l.zip].filter(Boolean).join(', ');
export const fmtHours = (h) => (h.closed ? 'Closed' : h.open + ' to ' + h.close);

export function diffBiz(base, cur) {
  const ch = [];
  const add = (id, label, from, to, kind, extra) => ch.push({ id, label, from, to, kind, status: 'pending', ...(extra || {}) });
  if (base.name !== cur.name) add('name', 'Business name', base.name, cur.name, 'auto');
  if (base.phone !== cur.phone) add('phone', 'Public phone', base.phone, cur.phone, 'auto');
  if (base.email !== cur.email) add('email', 'Public email', base.email, cur.email, 'auto');
  if (base.showPhone !== cur.showPhone) add('showPhone', 'Phone on website', base.showPhone ? 'Shown' : 'Hidden', cur.showPhone ? 'Shown' : 'Hidden', 'auto');
  if (base.showEmail !== cur.showEmail) add('showEmail', 'Email on website', base.showEmail ? 'Shown' : 'Hidden', cur.showEmail ? 'Shown' : 'Hidden', 'auto');
  cur.locations.forEach((l) => {
    const b = base.locations.find((x) => x.id === l.id);
    if (!b) { add('new-' + l.id, 'New location: ' + l.label, '', addr(l), 'team'); return; }
    if (addr(b) !== addr(l)) add('addr-' + l.id, l.label + ' address', addr(b), addr(l), 'auto');
    if (b.showAddress !== l.showAddress) add('vis-' + l.id, l.label + ' address on website', b.showAddress ? 'Shown' : 'Hidden', l.showAddress ? 'Shown' : 'Hidden', 'auto');
    ['weekdays', 'sat', 'sun'].forEach((d) => {
      if (JSON.stringify(b.hours[d]) !== JSON.stringify(l.hours[d])) {
        const nm = { weekdays: 'Weekday hours', sat: 'Saturday hours', sun: 'Sunday hours' }[d];
        add('hrs-' + l.id + d, nm + (cur.locations.length > 1 ? ' · ' + l.label : ''), fmtHours(b.hours[d]), fmtHours(l.hours[d]), 'auto');
      }
    });
    if (b.tz !== l.tz) add('tz-' + l.id, 'Time zone', b.tz, l.tz, 'auto');
  });
  base.locations.forEach((b) => { if (!cur.locations.find((x) => x.id === b.id)) add('rm-' + b.id, 'Remove location: ' + b.label, addr(b), '', 'team'); });
  const bn = base.services.map((x) => x.name), cn = cur.services.map((x) => x.name);
  cur.services.forEach((x) => {
    if (!bn.includes(x.name)) add('svc+' + x.name, 'New service: ' + x.name, '', x.name, 'question', {
      question: {
        text: 'Where should ' + x.name + ' appear on your website?',
        options: ['Give it its own page', 'Add it to Estate Planning', 'Mention it on the home page only'],
      },
    });
    else if (base.services.find((y) => y.name === x.name).priority !== x.priority) add('pri-' + x.name, 'Emphasis: ' + x.name, base.services.find((y) => y.name === x.name).priority ? 'Featured' : 'Standard', x.priority ? 'Featured' : 'Standard', 'auto');
  });
  base.services.forEach((x) => { if (!cn.includes(x.name)) add('svc-' + x.name, 'Remove service: ' + x.name, x.name, '', 'auto'); });
  if (JSON.stringify(base.serviceAreas) !== JSON.stringify(cur.serviceAreas)) add('areas', 'Service areas', base.serviceAreas.join(', '), cur.serviceAreas.join(', '), 'auto');
  cur.team.forEach((t) => {
    const b = base.team.find((x) => x.id === t.id);
    if (!b) add('tm+' + t.id, 'Add team member: ' + t.name, '', t.cred, 'team');
    else if (b.name !== t.name || b.cred !== t.cred) add('tm~' + t.id, 'Team: ' + t.name, b.name + ' · ' + b.cred, t.name + ' · ' + t.cred, 'team');
  });
  base.team.forEach((b) => { if (!cur.team.find((x) => x.id === b.id)) add('tm-' + b.id, 'Remove team member: ' + b.name, b.name, '', 'team'); });
  return ch;
}

// Pick the update path from the changes, honouring the prototype scenario switch.
export function planUpdate(changes, scenario) {
  let list = changes.map((c) => ({ ...c }));
  if (scenario === 'none') return { list: [], state: 'none' };
  if (scenario !== 'auto') {
    if (scenario === 'apply') list = list.map((c) => ({ ...c, kind: 'auto' }));
    if (!list.length) list = [{ id: 'sample', label: 'Weekday hours', from: '8:00 AM to 5:00 PM', to: '8:30 AM to 5:30 PM', kind: 'auto', status: 'pending' }];
    if (scenario === 'team') list = list.map((c, i) => (i === 0 ? { ...c, kind: 'team', label: c.label } : c));
    if (scenario === 'question') list[0] = { ...list[0], kind: 'question', question: { text: 'Should "' + list[0].label + '" also change on your mobile call bar?', options: ['Yes, everywhere', 'Only on the main page'] } };
  }
  if (!list.length) return { list, state: 'none' };
  if (list.some((c) => c.kind === 'question')) return { list, state: 'question' };
  if (list.some((c) => c.kind === 'team') || scenario === 'team') return { list, state: 'team' };
  return { list, state: 'applying' };
}

export function siteFromBiz(b) {
  const pub = b.locations.find((l) => l.showAddress) || null;
  const ordered = [...b.services].sort((x, y) => (y.priority ? 1 : 0) - (x.priority ? 1 : 0));
  return {
    name: b.name,
    phone: b.showPhone ? b.phone : 'Call us',
    email: b.showEmail ? b.email : 'Use the form',
    address: pub ? addr(pub) : 'By appointment',
    services: ordered.map((x) => x.name),
  };
}

// ---------------------------------------------------------------------------
// React store
// ---------------------------------------------------------------------------
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [s, setS] = useState(load);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [welcomeLight, setWelcomeLight] = useState(false);
  const first = useRef(true);
  const timer = useRef(null);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { save(s); setSaving(false); }, 450);
  }, [s]);

  const mut = useCallback((fn) => {
    setS((prev) => {
      const d = clone(prev);
      const r = fn(d);
      const out = r || d;
      out.savedAt = now();
      return out;
    });
  }, []);

  const go = useCallback((route) => {
    mut((d) => { d.route = { stage: route.stage, view: route.view || defaultView(route.stage) }; if (route.open) d.flags.open = route.open; else delete d.flags.open; });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [mut]);

  const say = useCallback((msg, tone) => {
    setToast({ msg, tone: tone || 'info', id: rid() });
  }, []);

  const logEmail = useCallback((kind) => {
    mut((d) => { d.emails.push({ kind, at: now() }); });
  }, [mut]);

  return <Ctx.Provider value={{ s, mut, go, toast, setToast, say, saving, logEmail, welcomeLight, setWelcomeLight }}>{children}</Ctx.Provider>;
}

export function defaultView(stage) {
  return { signup: 'form', details: 'form', website: 'review', launch: 'details', platform: 'setup' }[stage] || 'form';
}

export const fmtTime = (t) => new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const money = (n) => '$' + n.toLocaleString('en-US');
export { clone, rid };

export function stageRoute(s, stage) {
  if (stage === 'signup') return { stage, view: 'form' };
  if (stage === 'details') return { stage, view: 'form' };
  if (stage === 'website') {
    if (s.update.state === 'applying') return { stage, view: 'applying' };
    if (pendingUpdate(s)) return { stage, view: 'updating' };
    if (unresolvedSent(s).length) return { stage, view: 'tracking' };
    return { stage, view: 'review' };
  }
  if (stage === 'launch') return { stage, view: s.liveAt ? 'live' : 'details' };
  return { stage, view: 'setup' };
}

export function canGoStage(s, stage) {
  if (s.route.stage === 'platform') return false;
  if (stage === 'signup') return false;
  if (stage === 'details') return isPaid(s);
  return isPaid(s) && !!s.confirmedAt;
}

export function stageDone(s, stage) {
  if (stage === 'signup') return isPaid(s);
  if (stage === 'details') return !!s.confirmedAt;
  if (stage === 'website') return approvalCurrent(s) && !pendingUpdate(s) && unresolvedSent(s).length === 0;
  if (stage === 'launch') return !!s.liveAt;
  return false;
}

// ---------------------------------------------------------------------------
// Team-side events (the real system would raise these; the prototype fakes them)
// ---------------------------------------------------------------------------
export function finishUpdate(d) {
  d.changes.forEach((c) => { c.status = 'done'; });
  d.update = { state: 'ready', startedAt: d.update.startedAt };
  d.applied = clone(d.biz);
  d.siteVersion += 1;
  d.draftedAt = now();
  d.flags.updatedBanner = true;
}

export function teamEvent(d, kind) {
  if (kind === 'start') {
    d.edits.forEach((e) => { if (e.status === 'received') e.status = 'in_progress'; });
  }
  if (kind === 'ask') {
    const e = d.edits.find((x) => x.status === 'in_progress') || d.edits.find((x) => x.status === 'received');
    if (e) {
      e.status = 'needs_answer';
      e.question = { text: 'Quick question about edit ' + e.n + ': should this change everywhere "' + e.label + '" appears, or only on the home page?', options: ['Everywhere it appears', 'Only on the home page'] };
      e.thread.push({ from: 'team', text: e.question.text, at: now() });
    }
  }
  if (kind === 'ready') {
    const open = d.edits.filter((x) => ['received', 'in_progress', 'needs_answer'].includes(x.status));
    if (open.length) {
      open.forEach((e) => { e.status = 'ready'; e.question = null; });
      d.siteVersion += 1;
      d.flags.revisionReady = true;
    }
  }
}

export const SAMPLE_EDITS = (version) => [
  { label: 'Hero headline', section: 'Hero', type: 'text', note: 'Can we try “Compassionate probate, done right” here?', snippet: 'Probate, handled with care.' },
  { label: 'Practice area: Estate Planning', section: 'Practice areas', type: 'text', note: 'Mention that we offer flat-fee wills packages.', snippet: 'Estate Planning' },
  { label: '‘About’ photo', section: 'Why choose us', type: 'image', note: 'Use the new headshot of Michael in the office. I’ll upload it.', snippet: '' },
].map((e, i) => ({ id: rid(), n: i + 1, page: 'Home', ref: 'sample-' + i, selector: '', files: [], version, status: 'draft', createdAt: now(), batchId: null, thread: [], question: null, ...e }));
