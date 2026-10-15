import React from 'react';
import { Icon } from './Icons.jsx';

// One plain-language "you are here" for the whole Website step.
const STEPS = ['Look it over', 'Send your edits', 'Your team makes them', 'Approve'];

export default function WebsiteSteps({ current, text, version }) {
  return (
    <section className="wsteps" aria-label="Where you are in the website step">
      <ol className="wsteps__list">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < current ? 'done' : n === current ? 'now' : 'todo';
          return (
            <li key={label} className={'wstep is-' + state} aria-current={state === 'now' ? 'step' : undefined}>
              <span className="wstep__dot">{state === 'done' ? <Icon name="check" size={16} stroke={3.2} /> : n}</span>
              <span className="wstep__label">{label}</span>
              {state === 'now' && <span className="wstep__here">You are here</span>}
            </li>
          );
        })}
      </ol>
      <p className="wsteps__text"><b>Right now:</b> {text}{version ? <span className="wsteps__ver"> · Version {version}</span> : null}</p>
    </section>
  );
}
