// src/components/trade/LeveragePanel.jsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function LeveragePanel({ owner, agentName='aeq-agent', coin }) {
  const [mode, setMode] = useState('cross');            // 'cross' | 'isolated'
  const [lev, setLev] = useState('5');                  
  const [isoMarginUSD, setIsoMarginUSD] = useState(''); 
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function apply() {
    try {
      setBusy(true); setMsg(null);
      const payload = {
        owner,
        agent_name: agentName,
        coin,
        is_cross: mode === 'cross',
        leverage: lev ? parseInt(lev, 10) : 1,
        adjust_isolated_margin_usd: mode === 'isolated' && isoMarginUSD ? parseFloat(isoMarginUSD) : undefined,
      };
      const r = await fetch('/api/agents/hl/leverage', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify(payload),
      });
      const txt = await r.text(); let data; try{ data = JSON.parse(txt);} catch{ data = { raw: txt }; }
      if (!r.ok) throw new Error((data && (data.detail || data.message)) || r.statusText || 'Failed');
      setMsg({ ok: true });
    } catch (e) {
      setMsg({ ok: false, err: String(e.message || e) });
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant={mode === 'cross' ? 'default' : 'outline'} onClick={() => setMode('cross')}>Cross</Button>
        <Button type="button" variant={mode === 'isolated' ? 'default' : 'outline'} onClick={() => setMode('isolated')}>Isolated</Button>
      </div>

      <label className="block space-y-1">
        <div className="text-sm font-medium">Leverage (x)</div>
        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
               type="number" min="1" step="1" value={lev} onChange={(e)=>setLev(e.target.value)} />
      </label>

      {mode === 'isolated' ? (
        <label className="block space-y-1">
          <div className="text-sm font-medium">Extra isolated margin (USD)</div>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                 type="number" min="0" step="0.01" value={isoMarginUSD} onChange={(e)=>setIsoMarginUSD(e.target.value)} />
        </label>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={apply} disabled={busy}>{busy ? 'Applying…' : 'Apply leverage'}</Button>
        {msg?.ok ? <span className="text-xs text-green-700">OK</span> : null}
        {msg && !msg.ok ? <span className="text-xs text-red-700">{msg.err}</span> : null}
      </div>
    </div>
  );
}
