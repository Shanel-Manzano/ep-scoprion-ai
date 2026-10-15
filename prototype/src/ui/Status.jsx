import React from 'react';
import { Icon } from './Icons.jsx';
import { useApp, launchItems } from '../store.jsx';

// One status vocabulary everywhere: orange in queue, blue in progress, red needs you, green complete.
export const STATUS_META = {
  queue: { label: 'In queue', icon: 'clock' },
  progress: { label: 'In progress', icon: 'refresh' },
  question: { label: 'Needs your answer', icon: 'message' },
  done: { label: 'Complete', icon: 'check' },
};
export function StatusPill({ kind }) {
  const m = STATUS_META[kind] || STATUS_META.queue;
  return <span className={'spill spill--' + kind}><Icon name={m.icon} size={13} stroke={2.6} />{m.label}</span>;
}

// edit status -> shared kind
export const editKind = (st) => ({ received: 'queue', in_progress: 'progress', needs_answer: 'question', ready: 'done', done: 'done' }[st] || 'queue');

// A pizza tracker: where this thing is right now. current = index of the active step; alert turns it red.
export function Tracker({ steps, current, alert, allDone, queue }) {
  return (
    <ol className="ptrack" aria-label="Progress">
      {steps.map((label, i) => {
        const st = allDone || i < current ? 'done' : i === current ? (alert ? 'alert' : queue ? 'queue' : 'now') : 'todo';
        return (
          <li key={label} className={'ptrack__s is-' + st} aria-current={['now', 'alert', 'queue'].includes(st) ? 'step' : undefined}>
            <span className="ptrack__dot">{st === 'done' ? <Icon name="check" size={13} stroke={3.4} /> : st === 'alert' ? <Icon name="message" size={12} stroke={2.6} /> : null}</span>
            <span className="ptrack__l">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function LaunchCard() {
  const { s, go } = useApp();
  const it = launchItems(s);
  const n = [it.calls, it.forms, it.followup, it.domain].filter(Boolean).length;
  return (
    <section className="launchcard">
      <div className="launchcard__ico"><Icon name="rocket" size={26} /></div>
      <div className="grow">
        <h2 className="h2">While you wait, get ready to launch.</h2>
        <p className="muted">{n} of 4 launch details done. Your website goes live as soon as you approve it.</p>
        <div className="prog" style={{ marginTop: 10 }}><i style={{ width: (n / 4) * 100 + '%' }} /></div>
      </div>
      <button className="btn btn--primary" onClick={() => go({ stage: 'launch', view: 'details' })}>{n === 4 ? 'Review Launch Details' : 'Complete Launch Details'} <Icon name="arrowRight" size={18} /></button>
    </section>
  );
}
