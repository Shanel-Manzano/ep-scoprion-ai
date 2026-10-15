import React, { useEffect, useId, useRef } from 'react';
import { Icon } from './Icons.jsx';
import { useApp } from '../store.jsx';
import { PM, HELP } from '../data.js';

export function Head({ eyebrow, title, lede, children }) {
  return (
    <div className="head">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 className="h1" tabIndex={-1} data-heading>{title}</h1>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <div className="hint">{hint}</div>}
      {error && <div className="err" role="alert"><Icon name="alert" size={18} /> {error}</div>}
    </div>
  );
}

export function Input({ label, hint, error, className = '', ...rest }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <input id={id} className={'input' + (error ? ' is-bad' : '') + ' ' + className} {...rest} />
    </Field>
  );
}

export function Select({ label, hint, children, ...rest }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select id={id} className="select" {...rest}>{children}</select>
    </Field>
  );
}

export function Check({ children, ...rest }) {
  return <label className="check"><input type="checkbox" {...rest} /><span>{children}</span></label>;
}

export function Toggle({ children, ...rest }) {
  return <label className="toggle"><input type="checkbox" role="switch" {...rest} /><span>{children}</span></label>;
}

export function Badge({ tone, icon, children }) {
  return <span className={'badge' + (tone ? ' badge--' + tone : '')}>{icon && <Icon name={icon} size={14} stroke={2.4} />}{children}</span>;
}

export function Banner({ tone, icon = 'info', title, children }) {
  return (
    <div className={'banner' + (tone ? ' banner--' + tone : '')} role={tone === 'bad' ? 'alert' : undefined}>
      <Icon name={icon} size={22} />
      <div>{title && <b>{title}</b>}{children}</div>
    </div>
  );
}

export function Tick({ state }) {
  if (state === 'done') return <span className="tick" aria-label="Done"><Icon name="check" size={17} stroke={3} /></span>;
  if (state === 'warn') return <span className="tick tick--warn" aria-label="Needs attention"><Icon name="alert" size={16} stroke={2.4} /></span>;
  return <span className="tick tick--todo" aria-label="To do" />;
}

export function ActionBar({ children, msg, size }) {
  return (
    <div className={'actionbar' + (size ? ' actionbar--' + size : '')}>
      <div className="actionbar__in">
        {msg && <div className="actionbar__msg">{msg}</div>}
        {!msg && <div className="grow" />}
        {children}
      </div>
    </div>
  );
}

export function Modal({ onClose, children, wide, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => { const f = ref.current && ref.current.querySelector('[autofocus], input, textarea, select, button.btn, button'); if (f) f.focus(); }, 30);
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(t); if (prev && prev.focus) prev.focus(); };
  }, [onClose]);
  return (
    <div className="modal">
      <div className="scrim" onClick={onClose} />
      <div className={'modal__box' + (wide ? ' modal__box--wide' : '')} role="dialog" aria-modal="true" aria-label={label} ref={ref}>
        {onClose && <button className="iconbtn modal__x" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>}
        {children}
      </div>
    </div>
  );
}

// Prototype-only shortcut so reviewers are never stuck waiting on a real team.
export function Skip({ onClick, children }) {
  const { s } = useApp();
  if (!s.demo.proto) return null;
  return <button className="skip" onClick={onClick}><span className="pill-proto">Prototype</span>{children}</button>;
}

export function Spinner() { return <div className="spinner" role="status" aria-label="Working" />; }

export function useHeadingFocus(dep) {
  useEffect(() => {
    const h = document.querySelector('[data-heading]');
    if (h) h.focus({ preventScroll: true });
  }, [dep]);
}

// The real person behind the product, so nobody feels they are talking to a form.
export function Person({ line, compact }) {
  return (
    <div className={'person' + (compact ? ' person--compact' : '')}>
      <span className="person__av"><img src={PM.photo} alt="" width="56" height="56" /><i aria-label="Online" /></span>
      <div className="person__txt">
        <b>{PM.name}</b>
        <span>{line || PM.role}</span>
        <span className="person__ph"><Icon name="phone" size={14} /> {HELP.phone}</span>
      </div>
    </div>
  );
}

export function Kicker({ children }) {
  return <div className="kicker"><span className="kicker__mark" aria-hidden="true" />{children}</div>;
}
