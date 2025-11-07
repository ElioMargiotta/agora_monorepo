// src/components/trade/ReduceOnlyToggle.jsx
'use client';

export default function ReduceOnlyToggle({ reduceOnly, setReduceOnly }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" checked={reduceOnly} onChange={(e) => setReduceOnly(e.target.checked)} />
      <span>Reduce-only</span>
    </label>
  );
}
