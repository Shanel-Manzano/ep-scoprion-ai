import React, { useEffect, useRef, useState } from 'react';
import RooSite from './RooSite.jsx';

// A non-interactive, scaled-down view of the website (checkout, launch preview).
export default function ScaledSite({ site, height = 250, device = 'desktop' }) {
  const ref = useRef(null);
  const [w, setW] = useState(400);
  const base = device === 'mobile' ? 390 : 1240;
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const k = w / base;
  return (
    <div ref={ref} style={{ height, overflow: 'hidden', position: 'relative', pointerEvents: 'none', background: '#fff' }} aria-hidden="true">
      <div style={{ width: base, transform: 'scale(' + k + ')', transformOrigin: 'top left' }}>
        <RooSite device={device} site={site} />
      </div>
    </div>
  );
}
