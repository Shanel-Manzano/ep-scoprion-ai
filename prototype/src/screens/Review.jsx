import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icons.jsx';
import { Head, Badge, Banner, ActionBar, Modal, useHeadingFocus } from '../ui/Primitives.jsx';
import RooSite from '../site/RooSite.jsx';
import { useApp, siteFromBiz, drafts, sent, pendingUpdate, unresolvedSent, now, rid } from '../store.jsx';
import { REQUEST_TYPES, CLIENT } from '../data.js';

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const typeMeta = (id) => REQUEST_TYPES.find((t) => t.id === id) || REQUEST_TYPES[2];
const STATUS = {
  draft: ['', 'Not sent yet'], received: ['', 'Received'], in_progress: ['', 'In progress'], needs_answer: ['warn', 'Needs your answer'], ready: ['good', 'Ready for review'], done: ['good', 'Done'],
};
export const StatusBadge = ({ status }) => { const [t, l] = STATUS[status] || STATUS.draft; return <Badge tone={t}>{l}</Badge>; };

function findNode(canvas, label) {
  if (!canvas) return null;
  for (const n of canvas.querySelectorAll('[data-el]')) if (n.dataset.el === label) return n;
  return null;
}

// ---------------------------------------------------------------------------
// The scaled, scrollable website with hover highlights and numbered pins.
// ---------------------------------------------------------------------------
function SiteFrame({ device, site, mode, edits, selId, selLabel, onPick, onPin, focusId }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const [avail, setAvail] = useState(1000);
  const [ch, setCh] = useState(3200);
  const [viewH, setViewH] = useState(560);
  const [hover, setHover] = useState(null);
  const [pins, setPins] = useState([]);
  const [selBox, setSelBox] = useState(null);
  const base = device === 'mobile' ? 390 : 1240;
  const scale = Math.min(1, (avail - (device === 'mobile' ? 18 : 0)) / base);
  const isEdit = mode === 'edit';

  useEffect(() => {
    const calc = () => setViewH(Math.max(380, Math.min(window.innerHeight - (window.innerWidth < 760 ? 330 : 310), 820)));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const ro = new ResizeObserver(() => setCh(canvasRef.current ? canvasRef.current.offsetHeight : 3200));
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [device]);

  const visible = edits.filter((e) => e.status !== 'done');
  useLayoutEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const cr = canvas.getBoundingClientRect();
    const seen = {};
    setPins(visible.map((e) => {
      const node = findNode(canvas, e.label); if (!node) return null;
      const r = node.getBoundingClientRect();
      const k = seen[e.label] = (seen[e.label] || 0) + 1;
      return { id: e.id, n: e.n, status: e.status, x: (r.right - cr.left) / scale - 22 - (k - 1) * 30, y: (r.top - cr.top) / scale + 44 };
    }).filter(Boolean));
    const sn = selLabel ? findNode(canvas, selLabel) : null;
    if (sn) { const r = sn.getBoundingClientRect(); setSelBox({ x: (r.left - cr.left) / scale, y: (r.top - cr.top) / scale, w: r.width / scale, h: r.height / scale }); } else setSelBox(null);
  }, [edits, scale, device, ch, site, selLabel]); // eslint-disable-line

  // jump to a pin from the My edits list
  useEffect(() => {
    if (!focusId || !scrollRef.current) return;
    const p = pins.find((x) => x.id === focusId.id);
    if (p) scrollRef.current.scrollTo({ top: Math.max(0, p.y * scale - 120), behavior: 'smooth' });
  }, [focusId]); // eslint-disable-line

  const onMove = (e) => {
    if (!isEdit) return;
    const node = e.target.closest('[data-el]');
    if (!node) { setHover(null); return; }
    const cr = canvasRef.current.getBoundingClientRect(); const r = node.getBoundingClientRect();
    setHover({ x: (r.left - cr.left) / scale, y: (r.top - cr.top) / scale, w: r.width / scale, h: r.height / scale, label: node.dataset.el });
  };
  const onClick = (e) => {
    if (e.target.closest('.pin')) return;
    if (e.target.closest('a, button')) e.preventDefault(); // browsing never leaves the preview
    if (!isEdit) return;
    const node = e.target.closest('[data-el]');
    if (!node) return;
    e.preventDefault();
    const sec = node.closest('[data-section]');
    onPick({
      label: node.dataset.el, section: sec ? sec.dataset.section : 'Page',
      snippet: (node.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90),
      sx: e.clientX, sy: e.clientY,
    });
    setHover(null);
  };

  const phone = device === 'mobile';
  const frameW = phone ? Math.min(base * scale + 18, avail) : avail;
  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <div className={'browser' + (phone ? ' browser--phone' : '')} style={{ width: frameW }}>
        <div className="browser__chrome">
          {!phone && <div className="browser__dots"><i /><i /><i /></div>}
          <div className="browser__url"><Icon name="eye" size={14} /> Preview · <b>{CLIENT.site}</b></div>
        </div>
        <div className="browser__scroll" ref={scrollRef} style={{ height: viewH }}>
          <div className="sizer" style={{ width: base * scale, height: ch * scale }}>
            <div className={'canvas' + (isEdit ? ' is-edit' : '')} ref={canvasRef} style={{ width: base, transform: 'scale(' + scale + ')' }}
              onMouseMove={onMove} onMouseLeave={() => setHover(null)} onClick={onClick}>
              <RooSite device={device} site={site} />
              {selBox && <div className="edit-sel" style={{ left: selBox.x, top: selBox.y, width: selBox.w, height: selBox.h }} />}
              {isEdit && hover && (
                <div className="edit-hover" style={{ left: hover.x, top: hover.y, width: hover.w, height: hover.h }}>
                  <span style={{ transform: 'translateY(-100%) scale(' + 1 / scale + ')', transformOrigin: '0 100%' }}>{hover.label}</span>
                </div>
              )}
              {pins.map((p) => (
                <div key={p.id} className={'pin' + (p.status !== 'draft' ? (p.status === 'ready' ? ' is-ready' : ' is-sent') : '') + (p.id === selId ? ' is-sel' : '')}
                  style={{ left: p.x - 17, top: p.y - 42, transform: 'scale(' + 1 / scale + ')' }} role="button" tabIndex={0} aria-label={'Edit ' + p.n}
                  onClick={(e) => { e.stopPropagation(); onPin(p.id, e); }} onKeyDown={(e) => { if (e.key === 'Enter') onPin(p.id, e); }}>
                  <svg viewBox="0 0 32 40"><path d="M16 0C7.7 0 1 6.7 1 15c0 10.5 15 25 15 25s15-14.5 15-25C31 6.7 24.3 0 16 0z" fill="#5b45f0" stroke="#fff" strokeWidth="2" /></svg>
                  <span>{p.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The small comment composer
// ---------------------------------------------------------------------------
function Composer({ draft, setDraft, onSave, onDelete, onCancel }) {
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const narrow = window.innerWidth < 760;
  const meta = typeMeta(draft.type);
  let style = {};
  if (!narrow) {
    const W = 360, H = 460, m = 12;
    let left = draft.sx + 18, top = draft.sy - 30;
    if (left + W > window.innerWidth - m) left = draft.sx - W - 18;
    if (left < m) left = m;
    if (top + H > window.innerHeight - m) top = window.innerHeight - H - m;
    if (top < m) top = m;
    style = { left, top };
  }
  const save = () => {
    if (!draft.note.trim() && !(draft.files || []).length) { setErr('Tell us what you would like changed.'); return; }
    onSave();
  };
  return (
    <>
      {narrow && <div className="scrim" onClick={onCancel} />}
      <div className={'composer' + (narrow ? ' is-sheet' : '')} style={style} role="dialog" aria-label="Leave an edit">
        <div className="composer__head">
          <div className="composer__what">{draft.id ? 'Your edit' : 'New edit'}</div>
          <h4>{draft.label}</h4>
          <small>{draft.section}</small>
          {draft.snippet && <small style={{ marginTop: 6, fontStyle: 'italic' }}>“{draft.snippet.length > 70 ? draft.snippet.slice(0, 70) + '…' : draft.snippet}”</small>}
        </div>
        <div className="composer__body">
          <div className="lbl" style={{ color: '#14123a' }}>What kind of change?</div>
          <div className="row" style={{ gap: 8 }} role="radiogroup" aria-label="Type of change">
            {REQUEST_TYPES.map((t) => (
              <button key={t.id} role="radio" aria-checked={draft.type === t.id} className={'chip' + (draft.type === t.id ? ' is-on' : '')} onClick={() => { setDraft({ ...draft, type: t.id }); setErr(''); }}>
                <Icon name={t.icon} size={15} /> {t.label}
              </button>
            ))}
          </div>
          <textarea className="textarea" autoFocus placeholder={meta.hint} value={draft.note} aria-label="What should change?"
            onChange={(e) => { setDraft({ ...draft, note: e.target.value }); setErr(''); }} />
          {(draft.files || []).length > 0 && (
            <div className="row" style={{ gap: 8 }}>
              {draft.files.map((f) => <span className="chip" key={f.name} style={{ fontSize: 14 }}><Icon name="paperclip" size={14} />{f.name}<button aria-label={'Remove ' + f.name} onClick={() => setDraft({ ...draft, files: draft.files.filter((x) => x.name !== f.name) })}><Icon name="x" size={14} /></button></span>)}
            </div>
          )}
          <div>
            <input ref={fileRef} type="file" multiple hidden onChange={(e) => { const fs = [...e.target.files].map((f) => ({ name: f.name, size: f.size })); setDraft({ ...draft, files: [...(draft.files || []), ...fs] }); e.target.value = ''; }} />
            <button className="btn btn--ghost btn--xs" onClick={() => fileRef.current.click()}><Icon name="paperclip" size={16} /> {draft.type === 'image' ? 'Add a photo' : 'Add a file'}</button>
          </div>
          {err && <div className="err" role="alert"><Icon name="alert" size={18} /> {err}</div>}
          <div className="hint">This is a request. Your website doesn’t change until your team does the work.</div>
        </div>
        <div className="composer__foot">
          {draft.id && <button className="btn btn--ghost btn--sm" onClick={onDelete}><Icon name="trash" size={16} /> Delete</button>}
          <span className="grow" />
          <button className="btn btn--ghost btn--sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary btn--sm" onClick={save}>{draft.id ? 'Save' : 'Add edit'}</button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// My edits panel
// ---------------------------------------------------------------------------
export function EditCard({ e, sel, onSelect, onEdit, onDelete }) {
  const meta = typeMeta(e.type);
  const editable = e.status === 'draft';
  return (
    <div className={'edit' + (sel ? ' is-sel' : '')} onClick={() => onSelect && onSelect(e.id)}>
      <div className="edit__top">
        <span className={'edit__n' + (e.status === 'ready' ? ' is-ready' : e.status !== 'draft' ? ' is-sent' : '')}>{e.n}</span>
        <div className="grow">
          <div className="row" style={{ gap: 8, marginBottom: 4 }}><Badge icon={meta.icon}>{meta.label}</Badge><StatusBadge status={e.status} /></div>
          <div className="edit__el">{e.label}</div>
          <div className="edit__sec"><Icon name="mapPin" size={13} /> {e.page} · {e.section}</div>
        </div>
      </div>
      {e.snippet && <div className="edit__snip">“{e.snippet.length > 80 ? e.snippet.slice(0, 80) + '…' : e.snippet}”</div>}
      <div className="edit__note">{e.note || <span className="muted">No details added.</span>}</div>
      {(e.files || []).length > 0 && <div className="row" style={{ gap: 8 }}>{e.files.map((f) => <span key={f.name} className="chip" style={{ fontSize: 14 }}><Icon name="paperclip" size={14} />{f.name}</span>)}</div>}
      {editable && (onEdit || onDelete) && (
        <div className="row" style={{ marginTop: 4 }}>
          {onEdit && <button className="btn btn--ghost btn--xs" onClick={(ev) => { ev.stopPropagation(); onEdit(e); }}><Icon name="pencil" size={15} /> Edit</button>}
          {onDelete && <button className="btn btn--ghost btn--xs" onClick={(ev) => { ev.stopPropagation(); onDelete(e); }}><Icon name="trash" size={15} /> Delete</button>}
        </div>
      )}
    </div>
  );
}

function MyEdits({ onClose, onSelect, selId, onEdit, onDelete, onSend }) {
  const { s } = useApp();
  const d = drafts(s), sn = sent(s).filter((e) => e.status !== 'done');
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="My edits">
        <div className="drawer__head">
          <div><h2 className="h2">My edits</h2><div className="muted small">Numbers match the pins on your website.</div></div>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        <div className="drawer__body">
          {d.length === 0 && sn.length === 0 && (
            <div className="center" style={{ minHeight: 240, gap: 10 }}>
              <Icon name="mousePointer" size={48} />
              <b>No edits yet.</b>
              <span className="muted">Choose Leave edits, then click a headline, photo, or button on your website.</span>
            </div>
          )}
          {d.length > 0 && <div className="lbl">Not sent yet · {d.length}</div>}
          {d.map((e) => <EditCard key={e.id} e={e} sel={e.id === selId} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />)}
          {sn.length > 0 && <div className="lbl" style={{ marginTop: 8 }}>Sent to your team · {sn.length}</div>}
          {sn.map((e) => <EditCard key={e.id} e={e} sel={e.id === selId} onSelect={onSelect} />)}
        </div>
        <div className="drawer__foot">
          <div className="muted small">Edits save automatically as you go.</div>
          <button className="btn btn--primary" disabled={d.length === 0} onClick={onSend}>Send to my team <Icon name="arrowRight" size={20} /></button>
        </div>
      </aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Review screen
// ---------------------------------------------------------------------------
export function Review() {
  const { s, mut, go, say } = useApp();
  const [device, setDevice] = useState(window.innerWidth < 760 ? 'mobile' : 'desktop');
  const [mode, setMode] = useState('browse');
  const [draft, setDraft] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [selId, setSelId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [tourOpen, setTourOpen] = useState(window.innerWidth >= 760);
  useHeadingFocus('review');

  const site = siteFromBiz(s.applied);
  const ds = drafts(s);
  const unresolved = unresolvedSent(s);
  const blocked = pendingUpdate(s) || unresolved.length > 0;
  const justRevised = s.edits.some((e) => e.status === 'ready');
  const live = s.edits.filter((e) => e.status !== 'done');

  const pick = (p) => setDraft({ ...p, type: 'text', note: '', files: [] });
  const openPin = useCallback((id, ev) => {
    const e = s.edits.find((x) => x.id === id);
    setSelId(id);
    if (e.status === 'draft') setDraft({ ...e, sx: ev.clientX || window.innerWidth / 2, sy: ev.clientY || 200 });
    else setDrawer(true);
  }, [s.edits]);

  function saveDraft() {
    const d = draft;
    mut((x) => {
      if (d.id) {
        const e = x.edits.find((y) => y.id === d.id);
        Object.assign(e, { type: d.type, note: d.note.trim(), files: d.files || [] });
      } else {
        x.editSeq += 1;
        x.edits.push({
          id: rid(), n: x.editSeq, page: 'Home', section: d.section, label: d.label, ref: slug(d.section) + '.' + slug(d.label),
          selector: '[data-section="' + d.section + '"] [data-el="' + d.label + '"]', type: d.type, note: d.note.trim(), files: d.files || [],
          snippet: d.snippet || '', version: x.siteVersion, status: 'draft', createdAt: now(), batchId: null, thread: [], question: null,
        });
        d.__new = x.editSeq;
      }
    });
    setSelId(null);
    setDraft(null);
    say(draft.id ? 'Edit saved.' : 'Edit added. Look for the numbered pin.');
  }
  const del = (id) => { mut((x) => { x.edits = x.edits.filter((e) => e.id !== id); }); setDraft(null); setSelId(null); };

  function approve() {
    if (blocked) return;
    if (ds.length) { setConfirm(true); return; }
    doApprove();
  }
  function doApprove() {
    mut((d) => {
      d.approval = { version: d.siteVersion, by: d.signup.name, at: now() };
      d.edits.forEach((e) => { if (e.status === 'ready') e.status = 'done'; });
      d.flags.updatedBanner = false; d.flags.revisionReady = false;
      d.route = { stage: 'launch', view: 'details' };
    });
    setConfirm(false);
    say('Approved. Version ' + s.siteVersion + ' is saved. Nothing goes live until you launch.');
    window.scrollTo(0, 0);
  }

  const modeSeg = (
    <div className="seg" role="group" aria-label="What would you like to do?">
      <button className={mode === 'browse' ? 'is-on' : ''} aria-pressed={mode === 'browse'} onClick={() => { setMode('browse'); setDraft(null); }}><Icon name="eye" size={18} /> Browse</button>
      <button className={mode === 'edit' ? 'is-on' : ''} aria-pressed={mode === 'edit'} onClick={() => setMode('edit')}><Icon name="mousePointer" size={18} /> Leave edits</button>
    </div>
  );
  const devSeg = (
    <div className="seg" role="group" aria-label="Preview size">
      <button className={device === 'desktop' ? 'is-on' : ''} aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}><Icon name="monitor" size={18} /> Computer</button>
      <button className={device === 'mobile' ? 'is-on' : ''} aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}><Icon name="smartphone" size={18} /> Phone</button>
    </div>
  );

  return (
    <div className="screen review">
      <div className="review__bar">
        <div className="review__title">
          <div className="eyebrow">Step 3 of 4 · Website</div>
          <h1 className="h1" tabIndex={-1} data-heading>Review your website.</h1>
        </div>
        <div className="row"><Badge icon="layers">Version {s.siteVersion}</Badge></div>
      </div>

      {s.flags.updatedBanner && s.changes.length > 0 && (
        <Banner tone="good" icon="checkCircle" title="Your website now includes your confirmed details.">
          {s.changes.length} update{s.changes.length === 1 ? '' : 's'} applied: {s.changes.slice(0, 3).map((c) => c.label).join(', ')}{s.changes.length > 3 ? ' and more' : ''}.
        </Banner>
      )}
      {justRevised && <Banner tone="good" icon="checkCircle" title="Your team finished your edits.">Take another look. If it looks right, choose Looks good.</Banner>}
      {blocked && <Banner tone="warn" icon="clock" title="Your team is still working.">You can approve once your edits are ready. <button className="linkbtn" onClick={() => go({ stage: 'website', view: unresolved.length ? 'tracking' : 'updating' })}>See progress</button></Banner>}

      {!s.flags.tourDismissed && !tourOpen && <div><button className="linkbtn" onClick={() => setTourOpen(true)}><Icon name="helpCircle" size={16} /> How does this work?</button></div>}
      {!s.flags.tourDismissed && tourOpen && (
        <div className="card card--tight tour" role="region" aria-label="Quick tour">
          <div className="row" style={{ justifyContent: 'space-between' }}><b>How this works <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></b>
            <button className="linkbtn" onClick={() => mut((d) => { d.flags.tourDismissed = true; })}>Got it, hide this</button></div>
          <ol>
            <li><b>1</b><span><b>Look around.</b> Scroll your website just like a visitor would.</span></li>
            <li><b>2</b><span><b>Choose Leave edits</b>, then click what you’d like changed.</span></li>
            <li><b>3</b><span><b>Looks good?</b> Choose Looks good. You can skip edits entirely.</span></li>
          </ol>
        </div>
      )}

      <div className="review__bar">
        {modeSeg}{devSeg}
        <button className="btn btn--soft btn--sm" onClick={() => setDrawer(true)}><Icon name="edit" size={18} /> My edits <span className="badge" style={{ background: 'var(--cta)', color: '#fff' }}>{live.length}</span></button>
      </div>

      <div className={'stagebox' + (mode === 'edit' ? ' is-edit' : '')}>
        <div className="modebanner" aria-live="polite">
          {mode === 'edit' ? <><span className="dot" /> <b>Leave edits is on.</b> Click a headline, photo, or button to tell us what to change.</> : <><Icon name="eye" size={18} /> <b>You’re browsing.</b> Scroll and look around. Nothing you click here changes anything.</>}
        </div>
        <SiteFrame device={device} site={site} mode={mode} edits={s.edits} selId={draft ? draft.id : selId} selLabel={draft ? draft.label : (s.edits.find((e) => e.id === selId) || {}).label} focusId={focusId}
          onPick={pick} onPin={openPin} />
      </div>

      {draft && <Composer draft={draft} setDraft={setDraft} onSave={saveDraft} onCancel={() => { setDraft(null); setSelId(null); }} onDelete={() => del(draft.id)} />}
      {drawer && <MyEdits onClose={() => setDrawer(false)} selId={selId}
        onSelect={(id) => { setSelId(id); setFocusId({ id, t: Date.now() }); }}
        onEdit={(e) => { setDrawer(false); setMode('edit'); setDraft({ ...e, sx: window.innerWidth / 2 - 180, sy: 200 }); }} onDelete={(e) => del(e.id)}
        onSend={() => { setDrawer(false); go({ stage: 'website', view: 'send' }); }} />}

      {confirm && (
        <Modal onClose={() => setConfirm(false)} label="Edits not sent">
          <h2 className="h2">You have {ds.length} edit{ds.length === 1 ? '' : 's'} not sent yet.</h2>
          <p className="muted">Approving now means your team won’t make {ds.length === 1 ? 'that change' : 'those changes'}. {ds.length === 1 ? 'It stays' : 'They stay'} saved as {ds.length === 1 ? 'a draft' : 'drafts'}.</p>
          <div className="row">
            <button className="btn btn--primary" onClick={() => { setConfirm(false); go({ stage: 'website', view: 'send' }); }}>Send my edits first</button>
            <button className="btn btn--ghost" onClick={doApprove}>Approve without them</button>
          </div>
        </Modal>
      )}

      <ActionBar size="wide" msg={ds.length ? <><b>{ds.length} edit{ds.length === 1 ? '' : 's'}</b> ready to send. Sending edits doesn’t approve your website.</> : blocked ? <>Your team is working on your website.</> : <>Happy with it? Choose <b>Looks good</b>. Nothing goes live until you launch.</>}>
        {ds.length > 0 ? (
          <>
            <button className="btn btn--ghost" disabled={blocked} onClick={approve}><Icon name="check" size={20} /> Looks good</button>
            <button className="btn btn--primary" onClick={() => go({ stage: 'website', view: 'send' })}>Send to my team <Icon name="arrowRight" size={20} /></button>
          </>
        ) : (
          <button className="btn btn--primary" disabled={blocked} onClick={approve}><Icon name="check" size={20} /> Looks good</button>
        )}
      </ActionBar>
    </div>
  );
}
