'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { AddressResult } from '@/lib/address-results';

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder, country, className }: {
  value: string; onChange: (value: string) => void; onSelect: (place: AddressResult) => void;
  placeholder: string; country?: string; className?: string;
}) {
  const id = useId(); const [open, setOpen] = useState(false); const [items, setItems] = useState<AddressResult[]>([]);
  const [active, setActive] = useState(-1); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const selected = useRef('');
  useEffect(() => {
    const controller = new AbortController();
    setItems([]); setActive(-1); setMessage('');
    if (!open || value.trim().length < 3 || value === selected.current) { setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: value.trim(), ...(country ? { country } : {}) });
        const response = await fetch(`/api/geo?${params}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Address search unavailable.');
        setItems(body.data); setMessage(body.data.length ? '' : 'No matches. Try a street, landmark and city.');
      } catch (error) { if (!controller.signal.aborted) setMessage((error as Error).message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value, country, open, attempt]);
  function choose(place: AddressResult) { selected.current = place.displayName; onChange(place.displayName); onSelect(place); setOpen(false); setItems([]); }
  return <div className="relative"><input role="combobox" aria-label={placeholder} aria-autocomplete="list" aria-controls={id} aria-expanded={open && items.length > 0}
    aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} autoComplete="off" placeholder={placeholder} value={value} className={className}
    onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onChange={event => { onChange(event.target.value); setOpen(true); }}
    onKeyDown={event => {
      if (event.key === 'Escape') { setOpen(false); return; }
      if (event.key === 'ArrowDown' && items.length) { event.preventDefault(); setActive(i => Math.min(i + 1, items.length - 1)); }
      if (event.key === 'ArrowUp' && items.length) { event.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
      if (event.key === 'Enter' && open && active >= 0 && items[active]) { event.preventDefault(); choose(items[active]); }
    }} />
    {open && (items.length > 0 || message || loading) && <div className="absolute z-40 mt-1 w-full rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
      <ul role="listbox" id={id}>{items.map((place, index) => <li role="option" aria-selected={active === index} id={`${id}-${index}`} key={`${place.latitude}:${place.longitude}:${index}`}
        className={`cursor-pointer px-4 py-3 text-sm text-text-primary hover:bg-surface-secondary ${active === index ? 'bg-surface-secondary' : ''}`}
        onMouseDown={event => event.preventDefault()} onClick={() => choose(place)}>{place.displayName}</li>)}</ul>
      <p role="status" className="px-4 py-2 text-xs text-text-secondary">{loading ? 'Finding addresses…' : message || '© OpenStreetMap contributors · Photon'}</p>
      {!!message && !loading && <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => setAttempt(i => i + 1)} className="px-4 pb-3 text-sm text-amber-700">Try again</button>}
    </div>}
  </div>;
}
