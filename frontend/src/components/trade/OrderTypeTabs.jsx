// src/components/trade/OrderTypeTabs.jsx
'use client';

export default function OrderTypeTabs({ value, onChange, enableTwap=true }) {
  return (
    <div className="flex gap-4 items-center h-10">
      {['market','limit', ...(enableTwap ? ['twap'] : [])].map(k => (
        <label key={k} className="inline-flex items-center gap-2 text-sm capitalize">
          <input type="radio" name="ordertype" checked={value === k} onChange={() => onChange(k)} />
          <span>{k}</span>
        </label>
      ))}
    </div>
  );
}
