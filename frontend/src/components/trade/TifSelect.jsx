// src/components/trade/TifSelect.jsx
'use client';

export default function TifSelect({ value, onChange }) {
  return (
    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="Gtc">GTC</option>
      <option value="Ioc">IOC</option>
      <option value="Alo">ALO (post-only)</option>
    </select>
  );
}
