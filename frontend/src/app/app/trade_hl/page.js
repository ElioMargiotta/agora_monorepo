'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';

import SideTabs from '@/components/trade/SideTabs';
import OrderTypeTabs from '@/components/trade/OrderTypeTabs';
import TifSelect from '@/components/trade/TifSelect';
import SizeInput from '@/components/trade/SizeInput';
import SlippageInput from '@/components/trade/SlippageInput';
import ReduceOnlyToggle from '@/components/trade/ReduceOnlyToggle';
import CloidInput from '@/components/trade/CloidInput';
import LeveragePanel from '@/components/trade/LeveragePanel';

const DEFAULT_AGENT_NAME = 'aeq-agent';

// Centralize API routes used by this page
const API = {
  trade: '/api/trading/hl/orders/open',
  leverage: '/api/trading/hl/leverage',
  activeAssetData: '/api/trading/hl/active-asset-data',
  state: '/api/trading/hl/state',
  marketClose: '/api/trading/hl/orders/market-close',
};

export default function TradePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const owner = useMemo(() => address?.toLowerCase() ?? null, [address]);

  // ---------------- Session ----------------
  const [sessionAddr, setSessionAddr] = useState(null);
  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const r = await fetch('/api/auth/session', { cache: 'no-store' });
        const j = await r.json();
        setSessionAddr(j?.address || null);
      } catch { setSessionAddr(null); }
    })();
  }, [mounted]);

  const connectedAndAuthed = mounted && isConnected && sessionAddr && owner && sessionAddr.toLowerCase() === owner.toLowerCase();

  // ---------------- Agent (for display) ----------------
  const [agent, setAgent] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(false);
  useEffect(() => {
    if (!owner) return setAgent(null);
    (async () => {
      try {
        setLoadingAgent(true);
        const r = await fetch(`/api/hl/agents?owner=${owner}`, { cache: 'no-store' });
        setAgent(r.ok ? await r.json() : null);
      } catch { setAgent(null); }
      finally { setLoadingAgent(false); }
    })();
  }, [owner]);

  // ---------------- Sign-in ----------------
  const [authBusy, setAuthBusy] = useState(false);
  const [authErr, setAuthErr] = useState(null);
  const handleSignIn = async () => {
    try {
      setAuthBusy(true); setAuthErr(null);
      if (!owner) throw new Error('Connect your wallet first.');
      const n = await fetch('/api/auth/nonce', { cache: 'no-store' }).then(r => r.json());
      if (!n?.nonce || !n?.domain || !n?.uri) throw new Error('Invalid nonce payload');
      const issuedAt = new Date().toISOString();
      const msg = `${n.domain} wants you to sign in with your Ethereum account:\n${owner}\n\nURI: ${n.uri}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${n.nonce}\nIssued At: ${issuedAt}`;
      const signature = await signMessageAsync({ message: msg });
      const r = await fetch('/api/auth/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: owner, message: msg, signature }) });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail || 'Verification failed');
      }
      const s = await fetch('/api/auth/session', { cache: 'no-store' }).then(r => r.json());
      setSessionAddr(s?.address || null);
    } catch (e) { setAuthErr(e.message || 'Sign-in failed'); }
    finally { setAuthBusy(false); }
  };

  // ---------------- Order state ----------------
  const [agentName, setAgentName] = useState(DEFAULT_AGENT_NAME);
  useEffect(() => { if (agent?.agent_name) setAgentName(agent.agent_name); }, [agent?.agent_name]);

  const [coin, setCoin] = useState('BTC');
  const [markPx, setMarkPx] = useState('');
  const [isBuy, setIsBuy] = useState(true);
  const [orderType, setOrderType] = useState('market'); // market | limit | twap
  const [size, setSize] = useState('0.01');
  const [limitPx, setLimitPx] = useState('');
  const [tif, setTif] = useState('Gtc');
  const [slippage, setSlippage] = useState('0.05');
  const [reduceOnly, setReduceOnly] = useState(false);
  const [cloid, setCloid] = useState('');

  // ---- Leverage (inline; calls API.leverage) ----
  const [levMode, setLevMode] = useState('cross'); // 'cross' | 'isolated'
  const [levValue, setLevValue] = useState('5');   // integer leverage
  const [levIsoMarginUSD, setLevIsoMarginUSD] = useState(''); // optional when isolated
  const [levBusy, setLevBusy] = useState(false);
  const [levMsg, setLevMsg] = useState(null);

  // ---------------- Positions (current) ----------------
  const [positions, setPositions] = useState([]);
  const [posBusy, setPosBusy] = useState(false);
  const [posErr, setPosErr] = useState(null);

  const refreshPositions = useCallback(async () => {
    if (!connectedAndAuthed || !owner) { setPositions([]); return; }
    try {
      setPosBusy(true); setPosErr(null);
      const r = await fetch(`${API.state}?owner=${owner}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`state ${r.status}`);
      const j = await r.json();
      const arr = Array.isArray(j?.assetPositions) ? j.assetPositions : [];
      const rows = arr.map((x) => {
        const p = x.position || {};
        const szi = parseFloat(p.szi ?? '0');
        const side = szi > 0 ? 'LONG' : szi < 0 ? 'SHORT' : 'FLAT';
        const lev = p.leverage || {};
        return {
          coin: p.coin || x.asset || '—',
          szi,
          side,
          entryPx: p.entryPx != null ? parseFloat(p.entryPx) : null,
          leverageType: lev.type || '—',
          leverageValue: lev.value != null ? parseInt(lev.value, 10) : null,
        };
      }).filter(r => r.szi !== 0);
      setPositions(rows);
    } catch (e) {
      setPosErr(String(e?.message || e)); setPositions([]);
    } finally { setPosBusy(false); }
  }, [connectedAndAuthed, owner]);

  useEffect(() => { refreshPositions(); }, [refreshPositions]);

  // Persistence
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('hlTradeTicket') || 'null');
      if (s) {
        setAgentName(s.agentName ?? DEFAULT_AGENT_NAME);
        setCoin(s.coin ?? 'BTC'); setIsBuy(!!s.isBuy);
        setOrderType(s.orderType ?? 'market'); setSize(String(s.size ?? '0.01'));
        setLimitPx(s.limitPx ?? ''); setTif(s.tif ?? 'Gtc'); setSlippage(s.slippage ?? '0.05');
        setReduceOnly(!!s.reduceOnly); setCloid(s.cloid ?? '');
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('hlTradeTicket', JSON.stringify({ agentName, coin, isBuy, orderType, size, limitPx, tif, slippage, reduceOnly, cloid })); } catch {}
  }, [agentName, coin, isBuy, orderType, size, limitPx, tif, slippage, reduceOnly, cloid]);

  // ---------------- Active asset (HL-style pretrade) ----------------
  const [aad, setAad] = useState(null);            // active asset data
  const [aadBusy, setAadBusy] = useState(false);
  const [aadErr, setAadErr] = useState(null);
  const fetchAadAbort = useRef(null);

  const fetchActiveAssetData = useCallback(async () => {
    if (!connectedAndAuthed || !owner || !coin) { setAad(null); return; }
    try {
      setAadBusy(true); setAadErr(null);
      if (fetchAadAbort.current) fetchAadAbort.current.abort();
      const ctrl = new AbortController(); fetchAadAbort.current = ctrl;
      const r = await fetch(`${API.activeAssetData}?owner=${owner}&coin=${encodeURIComponent(coin)}`, { signal: ctrl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(`active-asset-data ${r.status}`);
      const j = await r.json();
      setAad(j);
      if (j && typeof j.markPx === 'number') setMarkPx(String(j.markPx));
    } catch (e) { if (e?.name !== 'AbortError') { setAadErr(String(e)); setAad(null); } }
    finally { setAadBusy(false); }
  }, [connectedAndAuthed, owner, coin]);

  // Debounce on inputs that matter
  useEffect(() => {
    const t = setTimeout(() => { fetchActiveAssetData(); }, 250);
    return () => clearTimeout(t);
  }, [fetchActiveAssetData]);

  // ---------------- Request builder ----------------
  const payload = useMemo(() => {
    const p = {
      owner: owner ?? '',
      agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME,
      coin: (coin || '').trim(),
      is_buy: Boolean(isBuy),
      order_type: orderType === 'limit' ? 'limit' : 'market',
      size: safeFloat(size),
      reduce_only: Boolean(reduceOnly),
    };
    if (orderType === 'limit') {
      if (limitPx !== '') p.limit_px = safeFloat(limitPx);
      if (tif) p.tif = tif;
    } else if (orderType === 'market') {
      if (slippage !== '') p.slippage = safeFloat(slippage);
    }
    if (cloid.trim()) p.cloid = cloid.trim();
    return p;
  }, [owner, agentName, coin, isBuy, orderType, size, limitPx, tif, slippage, reduceOnly, cloid]);

  // Compute derived UI data
  const notionalUSD = useMemo(() => {
    const s = parseFloat(size); const m = parseFloat(String(markPx));
    if (!Number.isFinite(s) || !Number.isFinite(m)) return null;
    return s * m;
  }, [size, markPx]);

  const aadMaxSize = useMemo(() => {
    if (!aad || !Array.isArray(aad.maxTradeSzs)) return undefined;
    // HL returns [maxBuy, maxSell]
    return isBuy ? parseFloat(aad.maxTradeSzs[0]) : parseFloat(aad.maxTradeSzs[1]);
  }, [aad, isBuy]);

  const sizeTooBig = useMemo(() => {
    const s = parseFloat(size);
    if (!Number.isFinite(s) || !Number.isFinite(aadMaxSize)) return false;
    return s > aadMaxSize;
  }, [size, aadMaxSize]);

  const canSubmit = useMemo(() => {
    if (!connectedAndAuthed) return false;
    if (!payload.owner || !payload.agent_name || !payload.coin) return false;
    if (!(typeof payload.size === 'number') || Number.isNaN(payload.size) || payload.size <= 0) return false;
    if (orderType === 'limit') {
      const ok = typeof payload.limit_px === 'number' && !Number.isNaN(payload.limit_px) && payload.limit_px > 0;
      if (!ok) return false;
    }
    if (sizeTooBig) return false;
    return true;
  }, [connectedAndAuthed, payload, orderType, sizeTooBig]);

  // ---------------- Submit ----------------
  const [submitting, setSubmitting] = useState(false);
  const [resp, setResp] = useState(null);
  const [err, setErr] = useState(null);

  async function placeOrder(e) {
    e.preventDefault();
    setSubmitting(true); setResp(null); setErr(null);
    try {
      const r = await fetch(API.trade, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      const txt = await r.text(); let data; try{ data = JSON.parse(txt);} catch { data = { raw: txt }; }
      if (!r.ok) throw new Error((data && (data.detail || data.message)) || r.statusText || 'Failed');
      setResp({ status: r.status, data });
      await refreshPositions();
      await fetchActiveAssetData();
    } catch (e) { setErr(e.message || 'Order failed'); }
    finally { setSubmitting(false); }
  }

  async function applyLeverage() {
    try {
      setLevBusy(true); setLevMsg(null);
      const payload = {
        owner: owner ?? '',
        agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME,
        coin: (coin || '').trim(),
        is_cross: levMode === 'cross',
        leverage: levValue ? parseInt(levValue, 10) : 1,
        adjust_isolated_margin_usd: levMode === 'isolated' && levIsoMarginUSD ? parseFloat(levIsoMarginUSD) : undefined,
      };
      const r = await fetch(API.leverage, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const txt = await r.text(); let data; try{ data = JSON.parse(txt);} catch{ data = { raw: txt }; }
      if (!r.ok) throw new Error((data && (data.detail || data.message)) || r.statusText || 'Failed');
      setLevMsg({ ok: true });
      await fetchActiveAssetData();
      await refreshPositions();
    } catch (e) { setLevMsg({ ok: false, err: String(e?.message || e) }); }
    finally { setLevBusy(false); }
  }

  // Per-position actions
  async function applyPositionLeverage(targetCoin, mode, value, extraUsd) {
    try {
      const payload = {
        owner: owner ?? '',
        agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME,
        coin: (targetCoin || '').trim(),
        is_cross: mode === 'cross',
        leverage: parseInt(String(value||'1'), 10),
        adjust_isolated_margin_usd: mode === 'isolated' && extraUsd !== undefined && extraUsd !== '' ? parseFloat(String(extraUsd)) : undefined,
      };
      const r = await fetch(API.leverage, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        throw new Error(j?.detail || `leverage ${r.status}`);
      }
      await fetchActiveAssetData();
      await refreshPositions();
      return true;
    } catch (e) {
      console.error('applyPositionLeverage', e);
      return false;
    }
  }

  async function closePosition(targetCoin, partialSz) {
    try {
      const payload = { owner: owner ?? '', agent_name: (agentName || DEFAULT_AGENT_NAME).trim() || DEFAULT_AGENT_NAME, coin: targetCoin, size: partialSz ? parseFloat(String(partialSz)) : undefined };
      const r = await fetch(API.marketClose, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        throw new Error(j?.detail || `marketClose ${r.status}`);
      }
      await fetchActiveAssetData();
      await refreshPositions();
    } catch (e) {
      console.error('closePosition', e);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trade</h1>
        {!mounted ? <Button variant="outline" size="lg">Connect Wallet</Button> : <ConnectWallet />}
      </div>

      {!mounted ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !isConnected ? (
        <p className="text-muted-foreground">Connect your wallet to place trades.</p>
      ) : !(sessionAddr && sessionAddr.toLowerCase() === (owner ?? '')) ? (
        <Card><CardContent className="p-6 space-y-4">
          <p className="text-muted-foreground">You’re connected as <span className="font-mono">{owner}</span>. Please sign in to create a session.</p>
          <Button onClick={handleSignIn} disabled={authBusy}>{authBusy ? 'Signing…' : 'Sign in with wallet'}</Button>
          {authErr ? <p className="text-sm text-red-600">{authErr}</p> : null}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Center column: identity + pretrade strip + leverage */}
          <div className="lg:col-span-2 space-y-4">
            {/* Agent summary */}
            <Card><CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Signed in as</div>
                <div className="font-mono text-sm">{owner}</div>
              </div>
              <Image src="/hyprliquid.png" alt="Hyperliquid" width={28} height={28} />
            </CardContent></Card>

            {/* HL-like pretrade info bar */}
            <Card>
              <CardContent className="p-4 text-xs flex flex-wrap gap-x-6 gap-y-2 items-center">
                <div>Market: <span className="font-medium">{coin}</span></div>
                <div>Leverage: <span className="font-medium">{aad?.leverage?.type ?? '—'} {aad?.leverage?.value ?? '—'}x</span></div>
                <div>Mark: <span className="font-mono">{markPx || '—'}</span></div>
                {Number.isFinite(aadMaxSize) ? (
                  <div>Max size ({isBuy ? 'Buy' : 'Sell'}): <span className="font-mono">{aadMaxSize}</span></div>
                ) : null}
                {aadBusy ? <span className="text-muted-foreground">refreshing…</span> : null}
                {aadErr ? <span className="text-red-600">{aadErr}</span> : null}
              </CardContent>
            </Card>

            {/* Leverage controls (separate card, like HL side rail) */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Leverage (for next orders)</div>
                    {levMsg?.ok ? <span className="text-xs text-green-700">Applied</span> : levMsg && !levMsg.ok ? <span className="text-xs text-red-700">{levMsg.err}</span> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant={levMode==='cross'?'default':'outline'} onClick={()=>setLevMode('cross')}>Cross</Button>
                    <Button type="button" variant={levMode==='isolated'?'default':'outline'} onClick={()=>setLevMode('isolated')}>Isolated</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm">
                      <div className="text-xs text-muted-foreground">Leverage (x)</div>
                      <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" min="1" step="1" value={levValue} onChange={(e)=>setLevValue(e.target.value)} />
                    </label>
                    {levMode==='isolated' ? (
                      <label className="block text-sm">
                        <div className="text-xs text-muted-foreground">Extra isolated margin (USD)</div>
                        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" min="0" step="0.01" value={levIsoMarginUSD} onChange={(e)=>setLevIsoMarginUSD(e.target.value)} />
                      </label>
                    ) : <div />}
                  </div>
                  <Button type="button" size="sm" onClick={applyLeverage} disabled={levBusy || !connectedAndAuthed}>{levBusy ? 'Applying…' : 'Apply'}</Button>
                </div>
              </CardContent>
            </Card>

            {/* Positions (current) */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Positions</div>
                  {posBusy ? <div className="text-xs text-muted-foreground">refreshing…</div> : null}
                </div>
                {posErr ? <div className="text-xs text-red-600">{posErr}</div> : null}
                {positions.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No open positions.</div>
                ) : (
                  <div className="space-y-3">
                    {positions.map((p) => (
                      <div key={p.coin} className="border rounded-md p-3 text-xs grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
                        <div className="space-y-1">
                          <div className="text-[11px] text-muted-foreground">Market</div>
                          <div className="font-medium">{p.coin}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[11px] text-muted-foreground">Side / Size</div>
                          <div className={`font-mono ${p.side==='LONG'?'text-green-700':p.side==='SHORT'?'text-red-700':''}`}>{p.side} · {Math.abs(p.szi)}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[11px] text-muted-foreground">Entry Px</div>
                          <div className="font-mono">{p.entryPx!=null? p.entryPx : '—'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[11px] text-muted-foreground">Mode / Lev</div>
                          <div>{p.leverageType ?? '—'} {p.leverageValue ?? '—'}x</div>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <select className="rounded-md border px-2 py-1" defaultValue={p.leverageType==='isolated'?'isolated':'cross'} id={`mode-${p.coin}`}>
                              <option value="cross">Cross</option>
                              <option value="isolated">Isolated</option>
                            </select>
                            <input className="rounded-md border px-2 py-1" type="number" min="1" step="1" defaultValue={p.leverageValue ?? 5} id={`lev-${p.coin}`} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input className="rounded-md border px-2 py-1" type="number" min="0" step="0.01" placeholder="Extra USD (isolated)" id={`iso-${p.coin}`} />
                            <Button type="button" size="sm" onClick={async ()=>{
                              const m = document.getElementById(`mode-${p.coin}`).value;
                              const v = document.getElementById(`lev-${p.coin}`).value;
                              const extra = document.getElementById(`iso-${p.coin}`).value;
                              const ok = await applyPositionLeverage(p.coin, m, v, extra);
                              if (!ok) alert('Leverage update failed');
                            }}>Set Lev</Button>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={()=>closePosition(p.coin)}>Close</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right rail: HL-like order ticket */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4 space-y-5">
              {/* Header: side */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button type="button" variant={isBuy ? 'default' : 'outline'} onClick={() => setIsBuy(true)} className={isBuy ? 'bg-green-600 hover:bg-green-600 text-white' : ''}>Buy</Button>
                  <Button type="button" variant={!isBuy ? 'destructive' : 'outline'} onClick={() => setIsBuy(false)} className={!isBuy ? 'bg-red-600 hover:bg-red-600 text-white' : ''}>Sell</Button>
                </div>
                <div className="text-xs text-muted-foreground">{coin}</div>
              </div>

              {/* Order type */}
              <OrderTypeTabs value={orderType} onChange={setOrderType} enableTwap={true} />

              {/* Market / Limit specific rows */}
              {orderType === 'limit' ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <div className="text-xs text-muted-foreground">Limit price</div>
                    <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" min="0" step="any" value={limitPx} onChange={(e)=>setLimitPx(e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <div className="text-xs text-muted-foreground">TIF</div>
                    <TifSelect value={tif} onChange={setTif} />
                  </label>
                </div>
              ) : orderType === 'market' ? (
                <div className="flex items-center justify-between text-xs">
                  <div className="text-muted-foreground">Market order</div>
                  <div className="flex items-center gap-2">Slippage <SlippageInput slippage={slippage} setSlippage={setSlippage} /></div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">TWAP params (interval/duration/clip) — backend coming soon.</div>
              )}

              {/* Size row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-muted-foreground">Size ({coin})</div>
                  {Number.isFinite(notionalUSD) ? <div>≈ <span className="font-mono">{notionalUSD.toFixed(2)}</span> USD</div> : null}
                </div>
                <SizeInput size={size} setSize={setSize} markPx={markPx} />
                {sizeTooBig ? <div className="text-[11px] text-red-600">Size exceeds max allowed at current leverage.</div> : null}
              </div>

              {/* Advanced */}
              <div className="space-y-3">
                {orderType==='limit' ? (
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={tif==='Alo'} onChange={(e)=>setTif(e.target.checked?'Alo':'Gtc')} />
                    <span>Post-only (ALO)</span>
                  </label>
                ) : null}

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={reduceOnly} onChange={(e)=>setReduceOnly(e.target.checked)} />
                    <span>Reduce-only</span>
                  </label>
                  {orderType==='limit' ? (
                    <select className="rounded-md border px-2 py-1" value={tif} onChange={(e)=>setTif(e.target.value)}>
                      <option value="Gtc">GTC</option>
                      <option value="Ioc">IOC</option>
                      <option value="Alo">ALO</option>
                    </select>
                  ) : null}
                </div>

                <label className="block text-xs">
                  <div className="text-muted-foreground">CLOID (optional)</div>
                  <CloidInput cloid={cloid} setCloid={setCloid} />
                </label>

                {/* Agent & market inputs inline for quick edits */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="block">
                    <div className="text-muted-foreground">Agent</div>
                    <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={agentName} onChange={(e)=>setAgentName(e.target.value)} />
                  </label>
                  <label className="block">
                    <div className="text-muted-foreground">Market</div>
                    <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={coin} onChange={(e)=>setCoin(e.target.value)} placeholder="BTC" />
                  </label>
                </div>
              </div>

              {/* Submit */}
              <form onSubmit={placeOrder}>
                <Button type="submit" disabled={!canSubmit || submitting} className={`w-full ${isBuy ? 'bg-green-600 hover:bg-green-600' : 'bg-red-600 hover:bg-red-600'} text-white`}>
                  {submitting ? 'Submitting…' : `${isBuy ? 'Buy' : 'Sell'} ${size || ''} ${coin}`}
                </Button>
                <div className="mt-2 text-xs min-h-[1.25rem]">
                  {resp ? <span className="text-green-700">OK ({resp.status})</span> : err ? <span className="text-red-700">{err}</span> : null}
                </div>
              </form>

              {/* Preview (debug) */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Preview payload</summary>
                <pre className="bg-muted rounded-md border p-3 text-[11px] overflow-auto max-h-60">{JSON.stringify(payload, null, 2)}</pre>
              </details>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ---------------- Utils ----------------
function safeFloat(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}
