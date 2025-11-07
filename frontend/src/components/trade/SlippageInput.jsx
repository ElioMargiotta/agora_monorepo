// src/components/trade/SlippageInput.jsx
'use client';

export default function SlippageInput({ slippage, setSlippage }) {
  return (
    <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
           type="number" min="0" step="0.01" value={slippage} onChange={(e)=>setSlippage(e.target.value)} />
  );
}
