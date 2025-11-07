// src/components/trade/CloidInput.jsx
'use client';

export default function CloidInput({ cloid, setCloid }) {
  return (
    <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
           placeholder="0x… (32 hex)" value={cloid} onChange={(e)=>setCloid(e.target.value)} />
  );
}
