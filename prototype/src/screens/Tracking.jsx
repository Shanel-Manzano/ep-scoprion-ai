import React, { useRef, useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Badge, Banner, ActionBar, Skip, Tick, Person, useHeadingFocus } from '../ui/Primitives.jsx';
import { EmailPreview } from '../ui/Emails.jsx';
import { EditCard, StatusBadge } from './Review.jsx';
import WebsiteSteps from '../ui/WebsiteSteps.jsx';
import { useApp, launchItems, drafts, sent, unresolvedSent, needsAnswer, teamEvent, now, rid, fmtTime } from '../store.jsx';

// "Check your edits" before anything is sent.
export function SendReview() {
  const { s, mut, go, say } = useApp();
  const ds = drafts(s);
  const sending = useRef(false);
  useHeadingFocus('send');

  function send() {
    if (sending.current || ds.length === 0) return;
    sending.current = true;
    mut((d) => {
      const bid = rid();
      const mine = d.edits.filter((e) => e.status === 'draft');
      mine.forEach((e) => { e.status = 'received'; e.batchId = bid; e.sentAt = now(); });
      d.batches.push({ id: bid, at: now(), count: mine.length, note: d.generalNote.trim(), version: d.siteVersion });
      d.generalNote = '';
      d.flags.justSent = mine.length;
      d.route = { stage: 'website', view: 'tracking' };
    });
    window.scrollTo(0, 0);
  }

  if (ds.length === 0) {
    return (
      <div className="screen main--narrow" style={{ margin: '0 auto' }}>
        <Head eyebrow="Step 3 of 4 · Website" title="No edits to send." lede="You haven’t added any edits yet. Go back to your website to add some, or approve it as it is." />
        <ActionBar size="narrow"><button className="btn btn--primary" onClick={() => go({ stage: 'website', view: 'review' })}>Back to my website</button></ActionBar>
      </div>
    );
  }
  return (
    <div className="screen main--narrow" style={{ margin: '0 auto' }}>
      <Head eyebrow="Step 3 of 4 · Website" title="Check your edits." lede="Look them over, then send them to your team." />
      <WebsiteSteps current={2} text="Check your edits, then send them. Sending doesn’t approve your website." version={s.siteVersion} />
      <div className="stack">
        {ds.map((e) => (
          <EditCard key={e.id} e={e}
            onEdit={() => go({ stage: 'website', view: 'review' })}
            onDelete={() => mut((d) => { d.edits = d.edits.filter((x) => x.id !== e.id); })} />
        ))}
        <button className="btn btn--ghost" style={{ justifySelf: 'start' }} onClick={() => go({ stage: 'website', view: 'review' })}><Icon name="plus" size={18} /> Add or change edits</button>
        <Person line="I’ll read every edit you send." />
        <div className="card card--tight field">
          <label htmlFor="gn">A note for your team <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <textarea id="gn" className="textarea" placeholder="Anything else you’d like us to know? For example, “I’ll send new team photos tomorrow.”" value={s.generalNote} onChange={(e) => mut((d) => { d.generalNote = e.target.value; })} />
        </div>
      </div>
      <ActionBar size="narrow" msg={<><b>{ds.length} edit{ds.length === 1 ? '' : 's'}</b> will be sent together.</>}>
        <button className="btn btn--ghost" onClick={() => go({ stage: 'website', view: 'review' })}><Icon name="arrowLeft" size={18} /> Back</button>
        <button className="btn btn--primary" onClick={send}>Send to my team <Icon name="send" size={20} /></button>
      </ActionBar>
    </div>
  );
}

const STEPS = ['Received', 'In progress', 'Ready for review'];
function Timeline({ status }) {
  const idx = { received: 0, in_progress: 1, needs_answer: 1, ready: 2, done: 2 }[status] ?? 0;
  return (
    <div>
      <div className="timeline" aria-hidden="true">
        {STEPS.map((_, i) => (
          <React.Fragment key={i}>
            <b className={i < idx || (i === idx && status === 'ready') ? 'on' : i === idx ? 'now' : ''} />
            {i < STEPS.length - 1 && <i className={i < idx ? 'on' : ''} />}
          </React.Fragment>
        ))}
      </div>
      <div className="tlabels" aria-hidden="true">{STEPS.map((x) => <span key={x}>{x}</span>)}</div>
    </div>
  );
}

function QuestionCard({ e }) {
  const { mut, say } = useApp();
  const [text, setText] = useState('');
  function reply(t) {
    const v = (t || text).trim(); if (!v) return;
    mut((d) => {
      const x = d.edits.find((y) => y.id === e.id);
      x.thread.push({ from: 'me', text: v, at: now() });
      x.status = 'in_progress'; x.question = null;
    });
    say('Sent. Your team will pick it up from here.');
  }
  return (
    <div className="card card--accent" id={'q-' + e.id} role="group" aria-label={'Question about edit ' + e.n}>
      <div className="row" style={{ marginBottom: 6 }}><Badge tone="warn" icon="message">Needs your answer</Badge><span className="muted small">Edit {e.n} · {e.label}</span></div>
      <div className="thread">
        {e.thread.map((m, i) => <div key={i} className={'msg msg--' + (m.from === 'me' ? 'me' : 'team')}>{m.text}</div>)}
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        {(e.question?.options || []).map((o) => <button key={o} className="chip" onClick={() => reply(o)}>{o}</button>)}
      </div>
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor={'r-' + e.id}>Or write your own answer</label>
        <textarea id={'r-' + e.id} className="textarea" value={text} onChange={(ev) => setText(ev.target.value)} placeholder="Type your answer here." />
      </div>
      <button className="btn btn--primary" style={{ marginTop: 12 }} disabled={!text.trim()} onClick={() => reply()}>Send my answer</button>
    </div>
  );
}

export function Tracking() {
  const { s, mut, go, say } = useApp();
  const [mail, setMail] = useState(null);
  useHeadingFocus('tracking');
  const all = sent(s).filter((e) => e.status !== 'done');
  const qs = needsAnswer(s);
  const open = unresolvedSent(s);
  const allReady = all.length > 0 && open.length === 0;
  const corrections = s.changes.filter((c) => c.status === 'done' || true);

  const jumpQ = () => { const el = document.getElementById('q-' + qs[0].id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const ev = (k) => { mut((d) => { teamEvent(d, k); }); };

  return (
    <div className="screen main--narrow" style={{ margin: '0 auto' }}>
      <Head eyebrow="Step 3 of 4 · Website" title={allReady ? 'Your updated website is ready.' : 'Your team is working on your edits.'}
        lede={allReady ? 'Take another look. You can approve this version or ask for more changes.' : 'Each edit shows where it stands. If your team has a question, answer it right here.'} />
      <WebsiteSteps current={allReady ? 4 : 3} version={s.siteVersion}
        text={qs.length ? 'Your team needs an answer from you before they can continue.' : allReady ? 'Your edits are done. Look them over, then approve.' : 'Your team is making your edits. We’ll email you when they’re ready.'} />

      {s.flags.justSent && !allReady && (
        <div style={{ marginBottom: 18 }}><Banner tone="good" icon="checkCircle" title={'Received. ' + s.flags.justSent + ' edit' + (s.flags.justSent === 1 ? '' : 's') + ' sent to your team.'}>Sending edits doesn’t approve your website. You’ll approve it after you see the changes.</Banner></div>
      )}
      {qs.length > 0 && <div style={{ marginBottom: 18 }}><Banner tone="warn" icon="message" title={qs.length === 1 ? 'Your team has a question.' : 'Your team has ' + qs.length + ' questions.'}>They’ll continue as soon as you answer. <button className="linkbtn" onClick={jumpQ}>Answer now</button></Banner></div>}

      <div className="stack">
        {!allReady && qs.length === 0 && (() => {
          const it = launchItems(s); const n = [it.calls, it.forms, it.followup, it.domain].filter(Boolean).length;
          return (
            <section className="launchcard">
              <div className="launchcard__ico"><Icon name="rocket" size={26} /></div>
              <div className="grow">
                <h2 className="h2">While you wait, get ready to launch.</h2>
                <p className="muted">{n} of 4 launch details done. Your website goes live as soon as you approve it.</p>
                <div className="prog" style={{ marginTop: 10 }}><i style={{ width: (n / 4) * 100 + '%' }} /></div>
              </div>
              <button className="btn btn--primary" onClick={() => go({ stage: 'launch', view: 'details' })}>{n === 4 ? 'Review launch details' : 'Complete Launch Details'} <Icon name="arrowRight" size={18} /></button>
            </section>
          );
        })()}
        <Person line="I’m here if you have a question." />
        {qs.map((e) => <QuestionCard key={e.id} e={e} />)}

        <h2 className="h2" style={{ marginTop: 8 }}>Your edits</h2>
        {all.map((e) => (
          <div className="card card--tight" key={e.id}>
            <EditCard e={e} />
            <div style={{ marginTop: 14 }}><Timeline status={e.status} /></div>
            {e.thread.length > 0 && e.status !== 'needs_answer' && <div className="thread">{e.thread.map((m, i) => <div key={i} className={'msg msg--' + (m.from === 'me' ? 'me' : 'team')}>{m.text}</div>)}</div>}
          </div>
        ))}
        {s.batches.length > 0 && s.batches[s.batches.length - 1].note && (
          <div className="card card--tight"><div className="lbl">Your note to the team</div><div className="muted">{s.batches[s.batches.length - 1].note}</div></div>
        )}

        {s.changes.length > 0 && (
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 className="h2">Updates from your confirmed details</h2><Badge tone="good" icon="check">Applied</Badge>
            </div>
            <p className="muted small" style={{ margin: '4px 0 0' }}>These came from the details you confirmed, so they aren’t counted as edit requests.</p>
            <ul className="checklist">{s.changes.map((c) => <li key={c.id}><Tick state={c.status === 'done' ? 'done' : 'todo'} /><div className="grow"><div className="checklist__t">{c.label}</div><div className="checklist__d">{c.to || 'Removed'}</div></div></li>)}</ul>
          </div>
        )}
      </div>

      <div className="row" style={{ marginTop: 22 }}>
        {!allReady && <><Skip onClick={() => ev('start')}>Team starts work</Skip><Skip onClick={() => ev('ask')}>Team asks a question</Skip><Skip onClick={() => ev('ready')}>Revisions are ready</Skip><Skip onClick={() => setMail('question')}>See the email</Skip></>}
      </div>

      <ActionBar size="narrow" msg={qs.length ? <><b>Waiting on you.</b> Answer the question above.</> : allReady ? <>Your updated website is <b>ready for review</b>.</> : <>Step 3 of 4 · <b>Website</b>. We’ll email you when it’s ready.</>}>
        {qs.length > 0 ? (
          <button className="btn btn--primary" onClick={jumpQ}>Answer the question <Icon name="arrowRight" size={20} /></button>
        ) : allReady ? (
          <button className="btn btn--primary" onClick={() => go({ stage: 'website', view: 'review' })}>Review updated website <Icon name="arrowRight" size={20} /></button>
        ) : (
          <>
            <button className="btn btn--ghost" onClick={() => go({ stage: 'website', view: 'review' })}>Look at my website</button>
            {!s.launch.calls.tested || !s.launch.forms.tested || s.launch.domain.status !== 'connected' || !s.launch.followup.confirmed
              ? <button className="btn btn--primary" onClick={() => go({ stage: 'launch', view: 'details' })}>Complete launch details <Icon name="arrowRight" size={20} /></button>
              : <span className="badge badge--good"><Icon name="check" size={14} /> Launch details done</span>}
          </>
        )}
      </ActionBar>
      {mail && <EmailPreview kind={mail} onClose={() => setMail(null)} onOpen={() => { setMail(null); if (qs[0]) jumpQ(); }} />}
    </div>
  );
}
