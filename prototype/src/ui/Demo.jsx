import React, { useState } from 'react';
import { Icon } from './Icons.jsx';
import { useApp, initialState, planUpdate, diffBiz, milestones, finishUpdate, teamEvent, SAMPLE_EDITS, now, wipe, fmtTime, rid, clone } from '../store.jsx';
import { MILESTONES } from '../data.js';

// Prototype controls: jump anywhere, simulate the team side, preview emails.
// Presets always build a consistent customer record so no screen is reached half-done.
function build(d, name) {
  const paid = () => { if (!d.signup.paidAt) { d.signup.paidAt = now(); d.signup.accountId = 'acct_demo'; } d.signup.password = ''; };
  const confirmed = () => { paid(); d.confirmedAt = d.confirmedAt || now(); d.update = { state: 'none', startedAt: now() }; d.changes = []; d.draftedAt = d.draftedAt || now(); };
  const launchDone = () => {
    const l = d.launch;
    l.calls.tested = true; l.forms.tested = true; l.followup.confirmed = true; l.followup.mode = 'request';
    Object.assign(l.domain, { choice: 'confirmed', provider: 'GoDaddy', status: 'connected', checks: 2 });
  };
  const approve = () => { d.approval = { version: d.siteVersion, by: d.signup.name, at: now() }; };
  d.flags.justSent = 0;
  const pend = (scenario, mutate) => {
    paid(); d.confirmedAt = now(); d.draftedAt = null;
    mutate(d.biz);
    const plan = planUpdate(diffBiz(d.applied, d.biz), scenario);
    d.changes = plan.list; d.update = { state: plan.state, startedAt: now() };
  };
  switch (name) {
    case 'welcome': paid(); d.route = { stage: 'signup', view: 'welcome' }; break;
    case 'details': paid(); d.route = { stage: 'details', view: 'form' }; break;
    case 'applying': pend('auto', (b) => { b.locations[0].hours.weekdays.open = '8:30 AM'; }); d.route = { stage: 'website', view: 'applying' }; break;
    case 'updating': pend('team', (b) => { b.team.push({ id: 't3', name: 'Marcus Lee', cred: 'Associate Attorney' }); }); d.route = { stage: 'website', view: 'updating' }; break;
    case 'question': pend('auto', (b) => { b.services.push({ name: 'Elder Law', priority: false }); }); d.route = { stage: 'website', view: 'updating' }; break;
    case 'review': confirmed(); d.route = { stage: 'website', view: 'review' }; break;
    case 'tracking': {
      confirmed();
      const es = SAMPLE_EDITS(d.siteVersion); const bid = rid();
      es.forEach((e, i) => { e.status = ['received', 'in_progress', 'in_progress'][i]; e.batchId = bid; e.sentAt = now(); });
      d.edits = es; d.editSeq = es.length; d.batches = [{ id: bid, at: now(), count: es.length, note: '', version: d.siteVersion }];
      d.flags.justSent = es.length; d.route = { stage: 'website', view: 'tracking' }; break;
    }
    case 'launch': confirmed(); approve(); d.route = { stage: 'launch', view: 'details' }; break;
    case 'publish': confirmed(); approve(); launchDone(); d.route = { stage: 'launch', view: 'publish' }; break;
    case 'live': confirmed(); approve(); launchDone(); d.liveAt = now(); d.pub = { state: 'live', step: 3 }; d.route = { stage: 'launch', view: 'live' }; break;
    case 'platform': confirmed(); approve(); launchDone(); d.liveAt = d.liveAt || now(); d.pub = { state: 'live', step: 3 }; d.route = { stage: 'platform', view: 'setup' }; break;
    default: break;
  }
}

const JUMPS = [['welcome', 'Welcome'], ['details', 'Details'], ['applying', 'Auto-applying'], ['updating', 'Team updating'], ['question', 'Team question'], ['review', 'Review'], ['tracking', 'Tracking'], ['launch', 'Launch details'], ['publish', 'Publish'], ['live', 'Live'], ['platform', 'AI MAX setup']];

export function Demo({ onEmail }) {
  const { s, mut, go, say } = useApp();
  const [open, setOpen] = useState(false);
  const m = milestones(s);

  const jump = (name) => { mut((d) => { build(d, name); }); setOpen(false); window.scrollTo(0, 0); };
  const reset = () => { wipe(); mut(() => ({ ...initialState(), demo: { ...s.demo, decline: false, scenario: 'auto', pubOutcome: 'live' } })); setOpen(false); say('Prototype reset.'); };
  const set = (k, v) => mut((d) => { d.demo[k] = v; });

  return (
    <div className={'demo' + (s.route.stage === 'signup' ? ' demo--low' : '')}>
      {open && (
        <div className="demo__panel" role="dialog" aria-label="Prototype controls">
          <div>
            <h5>Customer record</h5>
            <ol>{MILESTONES.map((x) => <li key={x.key} className={m[x.key] ? 'on' : ''}><i /> {x.label}{m[x.key] && <time>{fmtTime(m[x.key])}</time>}</li>)}</ol>
          </div>
          <div>
            <h5>Jump to a screen</h5>
            <div className="demo__btns"><button onClick={reset}>Start over</button>{JUMPS.map(([k, l]) => <button key={k} onClick={() => jump(k)}>{l}</button>)}</div>
          </div>
          <div>
            <h5>Next “Confirm & Continue” will</h5>
            <div style={{ fontSize: 12.5, color: '#9b95c9', margin: '-2px 0 8px' }}>Pick one, then go to Details and confirm. Nothing changes until you do.</div>
            <div className="demo__btns">{[['auto', 'From my edits'], ['none', 'No changes'], ['apply', 'Auto-apply'], ['team', 'Team work'], ['question', 'Question']].map(([k, l]) => <button key={k} className={s.demo.scenario === k ? 'is-on' : ''} onClick={() => { set('scenario', k); say('Set. The next time you press Confirm & Continue, this is what happens.'); }}>{l}</button>)}</div>
          </div>
          <div>
            <h5>Payment</h5>
            <div className="demo__btns"><button className={s.demo.decline ? 'is-on' : ''} onClick={() => set('decline', !s.demo.decline)}>Decline the next card</button><button onClick={() => { mut((d) => { d.route = { stage: 'signup', view: 'form' }; }); setOpen(false); }}>Open checkout again</button></div>
          </div>
          <div>
            <h5>Team events</h5>
            <div className="demo__btns">
              <button onClick={() => { mut((d) => { if (['team', 'question'].includes(d.update.state)) { finishUpdate(d); } }); say('Updated preview is ready.'); }}>Updated draft ready</button>
              <button onClick={() => mut((d) => teamEvent(d, 'start'))}>Start work</button>
              <button onClick={() => mut((d) => teamEvent(d, 'ask'))}>Ask question</button>
              <button onClick={() => mut((d) => teamEvent(d, 'ready'))}>Revisions ready</button>
            </div>
          </div>
          <div>
            <h5>Publish outcome</h5>
            <div className="demo__btns">{[['live', 'Goes live'], ['waiting', 'Waiting on dependency'], ['action', 'Action needed']].map(([k, l]) => <button key={k} className={(s.demo.pubOutcome || 'live') === k ? 'is-on' : ''} onClick={() => set('pubOutcome', k)}>{l}</button>)}</div>
          </div>
          <div>
            <h5>Emails and links</h5>
            <div className="demo__btns">
              {[['receipt', 'Receipt'], ['resume', 'Saved progress'], ['ready', 'Draft ready'], ['question', 'Question'], ['launch', 'Launch']].map(([k, l]) => <button key={k} onClick={() => { setOpen(false); onEmail(k); }}>{l}</button>)}
              <button onClick={() => { mut((d) => { d.route = { stage: 'link', view: 'expired' }; }); setOpen(false); }}>Expired link</button>
              <button onClick={() => { mut((d) => { if (!d.liveAt) build(d, 'live'); d.route = { stage: 'website', view: 'review' }; }); setOpen(false); }}>Old link after launch</button>
            </div>
          </div>
          <div>
            <h5>Display</h5>
            <div className="demo__btns"><button className={s.demo.proto ? 'is-on' : ''} onClick={() => set('proto', !s.demo.proto)}>Show “skip ahead” shortcuts</button></div>
          </div>
        </div>
      )}
      <button className="demo__tab" onClick={() => setOpen(!open)} aria-expanded={open}><Icon name="sliders" size={18} /><span>Prototype controls</span></button>
    </div>
  );
}
