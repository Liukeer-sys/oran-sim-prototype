import React, { useEffect, useRef } from 'react';

const paths = {
  target: 'M20 10a8 8 0 1 1-6-6 M16 12a4 4 0 1 1-4-4 M12 12l8-8 M17 2v5h5',
  clipboard: 'M9 4H5v17h14V4h-4 M9 2h6v4H9z M8 11h8 M8 16h8',
  sliders: 'M3 6h3 m4 0h11 M3 18h11 m4 0h3 M6 3h4v6H6z M14 15h4v6h-4z',
  info: 'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0 M12 11v6 M12 7h.01',
  music: 'M14 3v12a4 4 0 1 1-4-4 M14 3c0 5 4 6 7 6V5c-4 0-5-2-7-2',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  comment: 'M21 11a9 8 0 0 1-9 8H7l-5 3 2-6a8 8 0 0 1-1-5 9 8 0 0 1 18 0z',
  play: 'm8 5 11 7-11 7z',
  grid: 'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h6v6h-6z',
  hub: 'm3 17 6-6 4 4 8-10 M15 5h6v6',
  spark: 'm12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3 M20 2v4 M18 4h4',
  med: 'M5 3H3v6a5 5 0 0 0 10 0V3h-2 M8 14v3a4 4 0 0 0 8 0v-4 M16 9a2 2 0 1 0 0 .1',
  sim: 'M5 18V9 M12 18V4 M19 18v-6 M3 21h18 M3 5l3-2 3 2',
  image: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1 M3 17l6-6 4 4 4-5 4 5 M8 7h.01',
  video: 'M3 5h12v14H3z M15 10l6-4v12l-6-4',
  copy: 'M8 8h13v13H8z M16 3H3v13',
  film: 'M4 3h16v18H4z M8 3v18 M16 3v18 M4 8h4 M4 16h4 M16 8h4 M16 16h4',
  collapse: 'M3 3h18v18H3z M8 3v18 m8-14-4 5 4 5',
  gift: 'M3 8h18v4H3z M5 12v9h14v-9 M12 8v13 M12 8C2 8 5 0 9 3l3 5c10 0 7-8 3-5z',
  database: 'M4 6c0-5 16-5 16 0s-16 5-16 0 M4 6v12c0 5 16 5 16 0V6 M4 12c0 5 16 5 16 0',
  globe: 'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0 M3 12h18 M12 3c-5 4-5 14 0 18 5-4 5-14 0-18',
  arrow: 'M5 12h14 m-6-6 6 6-6 6',
  upload: 'M12 16V3 m-5 5 5-5 5 5 M4 14v6h16v-6',
  plus: 'M12 5v14 M5 12h14',
  close: 'm6 6 12 12 M6 18 18 6',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  check: 'm5 12 4 4L19 6',
  file: 'M14 2H5v20h14V7z M14 2v6h5 M8 13h8 M8 17h6',
  chevron: 'm7 10 5 5 5-5',
  search: 'M16 16l5 5 M18 10a8 8 0 1 0-16 0 8 8 0 0 0 16 0',
  back: 'M19 12H5 m6-6-6 6 6 6',
};
export function Icon({ name, size = 20, ...props }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.spark}/></svg>; }
export function Button({ children, variant = '', className = '', ...props }) { return <button className={`button ${variant} ${className}`} {...props}>{children}</button>; }
export function Field({ label, children, className = '' }) { return <label className={`field ${className}`}><span className="field-label">{label}</span>{children}</label>; }
export function Select({ children, ...props }) { return <span className="select-wrap"><select {...props}>{children}</select><Icon name="chevron" size={15}/></span>; }
export function Modal({ title, subtitle, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current.focus();
    function keys(e) {
      if(e.key === 'Escape') onClose();
      if(e.key === 'Tab') {
        const items = [...ref.current.querySelectorAll('button, input, select, textarea, [tabindex="0"]')].filter(el => !el.disabled);
        const first = items[0], last = items.at(-1);
        if(e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus(); }
        else if(!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', keys);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', keys); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) onClose(); }}><section ref={ref} tabIndex={-1} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><Button variant="icon-button" aria-label="关闭弹窗" onClick={onClose}><Icon name="close"/></Button></div>{children}</section></div>;
}
