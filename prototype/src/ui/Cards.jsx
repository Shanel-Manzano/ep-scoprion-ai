import React, { useEffect } from 'react';
import { Icon } from './Icons.jsx';

// Task card: icon, title, one status badge, a short summary, one clear button.
export function TaskCard({ icon, title, status = 'todo', badge, meta, children, actions }) {
  const label = badge || { done: 'Complete', todo: 'To do', warn: 'Action needed' }[status];
  return (
    <section className={'tcard is-' + status}>
      <header className="tcard__head">
        <span className="tcard__ico"><Icon name={icon} size={26} /></span>
        <h2 className="tcard__t">{title}</h2>
        <span className={'tcard__pill tcard__pill--' + status}>{label}</span>
      </header>
      <div className="tcard__body">{children}</div>
      <div className="tcard__foot">
        {meta ? <span className="tcard__meta"><Icon name="clock" size={15} /> {meta}</span> : <span />}
        {actions && <div className="tcard__act">{actions}</div>}
      </div>
    </section>
  );
}

export function Progress({ done, total, label }) {
  return (
    <div className="progress">
      <div className="progress__row"><b>{label || done + ' of ' + total + ' done'}</b></div>
      <div className="prog" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label={label}><i style={{ width: (done / total) * 100 + '%' }} /></div>
    </div>
  );
}

// Centered dialog in the platform's onboarding style: gradient bar, icon circle, step label, gradient title.
export function Sheet({ title, icon, label, onClose, doneLabel = 'Done', onDone, cancel, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="pm">
      <div className="scrim" onClick={onClose} />
      <section className="pm__box" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pm__bar" aria-hidden="true" />
        <div className="pm__head">
          {icon && <span className="pm__ico"><Icon name={icon} size={22} /></span>}
          <span className="pm__label">{label || 'Update'}</span>
          <button className="pm__x" onClick={onClose} aria-label="Close"><Icon name="x" size={20} /></button>
        </div>
        <h2 className="pm__title">{title}</h2>
        <div className="pm__body">{children}</div>
        <div className="pm__foot">
          {cancel && <button className="btn btn--ghost" onClick={onClose}>Cancel</button>}
          <button className="btn btn--primary" onClick={onDone || onClose}>{doneLabel}</button>
        </div>
      </section>
    </div>
  );
}

// Compact confirm tile: what we know, then one yes or a change.
export function DetailTile({ icon, title, checked, children, onYes, onChange }) {
  return (
    <section className={'dtile' + (checked ? ' is-checked' : '')}>
      <header className="dtile__head">
        <span className="dtile__ico"><Icon name={icon} size={24} /></span>
        <h2 className="dtile__t">{title}</h2>
      </header>
      <div className="dtile__body">{children}</div>
      <footer className="dtile__act">
        {checked
          ? <span className="dtile__ok"><Icon name="check" size={16} stroke={3} /> Looks right</span>
          : <button className="dtile__yes" onClick={onYes}><span className="dtile__circle" /> Looks right</button>}
        <button className="linkbtn" onClick={onChange}>Change</button>
      </footer>
    </section>
  );
}
