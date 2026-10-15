import React, { useEffect } from 'react';
import { Icon } from './Icons.jsx';

// Task card: icon, title, one status badge, a short summary, one clear button.
export function TaskCard({ title, status = 'todo', badge, children, actions }) {
  const label = badge || { done: 'Complete', todo: 'To do', warn: 'Needs you' }[status];
  return (
    <section className={'tcard is-' + status}>
      <div className={'tcard__status tcard__status--' + status}>{status === 'done' && <Icon name="check" size={14} stroke={3} />}{label}</div>
      <h2 className="tcard__t">{title}</h2>
      <div className="tcard__body">{children}</div>
      {actions && <div className="tcard__act">{actions}</div>}
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

// Side panel for editing one card, so the grid behind it stays calm.
export function Sheet({ title, icon, onClose, doneLabel = 'Done', onDone, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer__head">
          <div className="row" style={{ gap: 14, flexWrap: 'nowrap' }}>
            {icon && <span className="tcard__ico"><Icon name={icon} size={24} /></span>}
            <h2 className="h2">{title}</h2>
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        <div className="drawer__body sheet__body">{children}</div>
        <div className="drawer__foot">
          <button className="btn btn--primary btn--block" onClick={onDone || onClose}>{doneLabel}</button>
        </div>
      </aside>
    </>
  );
}

// Compact confirm tile: what we know, then one yes or a change.
export function DetailTile({ icon, title, checked, children, onYes, onChange }) {
  return (
    <section className={'dtile' + (checked ? ' is-checked' : '')}>
      <header className="dtile__head">
        <span className="dtile__ico"><Icon name={icon} size={20} /></span>
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
