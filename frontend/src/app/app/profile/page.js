// src/app/app/profile/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount, useChainId, useSignMessage, useSignTypedData } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { DesktopFallback } from '@/components/ui/ComingSoon';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { recoverTypedDataAddress } from 'viem';

/* --------------------------- constants -------------------------------- */
const DEFAULT_AGENT_NAME = 'aeq-agent';
const DEFAULT_TTL_SECONDS = 180 * 24 * 60 * 60; // 180 days
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const EXTENDED_INDEX = 4;                       // required subaccount index
const EXTENDED_NAME  = 'aeq_elioM2.0 trading key';  // required subaccount name/description

/* --------------------------- SIWE helpers ----------------------------- */
function buildSiweMessage({ address, nonce, chainId, domain, uri }) {
  const issuedAt = new Date().toISOString();
  return `${domain} wants you to sign in with your Ethereum account:
${address}

URI: ${uri}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

/* --------------------------- HL helpers ------------------------------- */
function toHexChainId(n) { return '0x' + Number(n).toString(16); }
function splitSigRSV(sigHex) {
  const s = sigHex.slice(2);
  const r = '0x' + s.slice(0, 64);
  const sPart = '0x' + s.slice(64, 128);
  let v = parseInt(s.slice(128, 130), 16);
  if (v < 27) v += 27;
  return { r, s: sPart, v };
}
function buildEip712ForApprove(action, evmChainIdNumber) {
  const domain = {
    name: 'HyperliquidSignTransaction',
    version: '1',
    chainId: evmChainIdNumber,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  };
  const types = {
    'HyperliquidTransaction:ApproveAgent': [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'agentAddress', type: 'address' },
      { name: 'agentName', type: 'string' },
      { name: 'nonce', type: 'uint64' },
    ],
  };
  const primaryType = 'HyperliquidTransaction:ApproveAgent';
  const message = {
    hyperliquidChain: action.hyperliquidChain,
    agentAddress: action.agentAddress.toLowerCase(),
    agentName: action.agentName ?? '',
    nonce: BigInt(action.nonce),
  };
  return { domain, types, primaryType, message };
}
async function getHyperliquidChainFromHealth() {
  try {
    const r = await fetch('/api/health', { cache: 'no-store' });
    const j = await r.json();
    const url = j?.exchange_url || '';
    if (!url) return 'Mainnet';
    return url.includes('test') ? 'Testnet' : 'Mainnet';
  } catch { return 'Mainnet'; }
}

/* --------------------- deterministic date formatting ------------------ */
function stableUTCFromSeconds(tsSec) {
  if (!tsSec) return '—';
  const d = new Date(tsSec * 1000);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

/* =============================== PAGE ================================= */

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const owner = useMemo(() => address?.toLowerCase() ?? null, [address]);

  // session
  const [sessionAddr, setSessionAddr] = useState(null);
  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await res.json();
      setSessionAddr(data?.address || null);
    } catch { setSessionAddr(null); }
  };
  useEffect(() => { if (mounted) refreshSession(); }, [mounted]);

  // HL agent
  const [agent, setAgent] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const refreshAgent = async () => {
    if (!owner) return;
    try {
      setLoadingAgent(true);
      const res = await fetch(`/api/agent/hl/get-agent?owner=${owner}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAgent(data && (data.agent_address || data.agent_name || data.expiry_unix) ? data : null);
      } else if (res.status === 404) {
        setAgent(null);
      } else {
        const resList = await fetch(`/api/agent?owner=${owner}`, { cache: 'no-store' });
        const list = await resList.json().catch(() => []);
        setAgent(Array.isArray(list) && list.length ? list[0] : null);
      }
    } catch { setAgent(null); }
    finally { setLoadingAgent(false); }
  };

  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState(null);

  const connectedAndAuthed =
    mounted && isConnected && sessionAddr && owner &&
    sessionAddr.toLowerCase() === owner.toLowerCase();

  /* --------------------------- Extended (x10) state -------------------- */
  const [extBusy, setExtBusy] = useState(false);
  const [extError, setExtError] = useState(null);
  const [extStatus, setExtStatus] = useState(null);
  const [extResult, setExtResult] = useState(null); // { exists/created, client_id }
  const [extKeyInfo, setExtKeyInfo] = useState(null); // record from /api/extended/agents

  /* ---------------------- Extended helpers ----------------------------- */
  const personalSign = (message) => signMessageAsync({ message });
  const fetchJsonOrThrow = async (res, fallback='Request failed') => {
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.detail || fallback);
    return j;
  };
  const signTypedDataAndVerify = async (typedData, ownerAddr) => {
    const { domain, types, primaryType, message } = typedData || {};
    const sig = await signTypedDataAsync({ domain, types, primaryType, message });
    const recovered = await recoverTypedDataAddress({ domain, types, primaryType, message, signature: sig });
    if (!ownerAddr || recovered.toLowerCase() !== ownerAddr.toLowerCase()) {
      throw new Error(`Typed-data signature recovers to ${recovered}, not your wallet ${ownerAddr}`);
    }
    return sig;
  };

  // Extended: load keystore-backed record (owner only, like HL)
  const refreshExtended = async () => {
    if (!owner) { setExtKeyInfo(null); return null; }
    try {
      const r = await fetch(`/api/agent/extended/get-agent?owner=${owner}`, { cache: 'no-store' });
      if (r.status === 404) { setExtKeyInfo(null); return null; }
      if (!r.ok)        { setExtKeyInfo(null); return null; }
      const j = await r.json();
      setExtKeyInfo(j);
      return j;
    } catch {
      setExtKeyInfo(null);
      return null;
    }
  };

  // Load both HL and Extended as soon as wallet is known
  useEffect(() => {
    if (owner) {
      refreshAgent();
      refreshExtended();
    } else {
      setAgent(null);
      setExtKeyInfo(null);
    }
  }, [owner]);

  /* ----------------- ONE BUTTON: onboard → sub(1) → API(1) ------------- */
  const setupExtendedIndex1 = async () => {
    try {
      setExtBusy(true);
      setExtError(null);
      setExtResult(null);
      setExtStatus('Starting Extended setup…');

      if (!connectedAndAuthed) throw new Error('Please sign in with your wallet first.');

      // If the record already exists, stop early
      const existing = await refreshExtended();
      if (existing && (existing.api_key || existing.has_api_key)) {
        setExtResult({ exists: true, client_id: existing.client_id });
        setExtStatus('Extended key already present.');
        return;
      }

      // 1) Onboard default account (index 0)
      setExtStatus('1/3 Onboarding default account (index 0)…');
      try {
        const tdKD0 = await fetch(
          `/api/agent/extended/typed-data/key-derivation?wallet=${owner}&account_index=0`,
          { cache: 'no-store' }
        ).then(r => fetchJsonOrThrow(r, 'Failed TD: key-derivation (0)'));
        const sigKD0 = await signTypedDataAndVerify(tdKD0, owner);

        const tdREG0 = await fetch(
          `/api/agent/extended/typed-data/registration?wallet=${owner}&account_index=0&action=REGISTER`,
          { cache: 'no-store' }
        ).then(r => fetchJsonOrThrow(r, 'Failed TD: registration (0)'));
        const sigREG0 = await signTypedDataAndVerify(tdREG0, owner);
        const time0 = tdREG0?.message?.time;

        const r0 = await fetch('/api/agent/extended/onboarding', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            wallet: owner,
            account_index: 0,
            key_derivation_signature: sigKD0,
            registration_signature: sigREG0,
            registration_time: time0,
          }),
        });
        if (!r0.ok) {
          const txt = await r0.text();
          if (!/already|exists|onboard/i.test(txt)) throw new Error(txt || 'Onboarding failed');
        }
      } catch (e) {
        if (!String(e?.message || '').match(/already|exists|onboard/i)) throw e;
      }

      // 2) Create subaccount (index 1) named EXTENDED_NAME
      setExtStatus('2/3 Creating subaccount (index 1)…');
      try {
        const tdKD = await fetch(
          `/api/agent/extended/typed-data/key-derivation?wallet=${owner}&account_index=${EXTENDED_INDEX}`,
          { cache: 'no-store' }
        ).then(r => fetchJsonOrThrow(r, 'Failed TD: key-derivation (1)'));
        const sigKD = await signTypedDataAndVerify(tdKD, owner);

        const tdREG = await fetch(
          `/api/agent/extended/typed-data/registration?wallet=${owner}&account_index=${EXTENDED_INDEX}&action=CREATE_SUB_ACCOUNT`,
          { cache: 'no-store' }
        ).then(r => fetchJsonOrThrow(r, 'Failed TD: registration (1)'));
        const sigREG = await signTypedDataAndVerify(tdREG, owner);
        const regTime = tdREG?.message?.time;

        const challenge = await fetch(
          `/api/agent/extended/challenge?path=${encodeURIComponent('/auth/onboard/subaccount')}`,
          { cache: 'no-store' }
        ).then(r => fetchJsonOrThrow(r, 'Failed subaccount auth challenge'));
        const authSig = await personalSign(challenge.message);

        const rSub = await fetch('/api/agent/extended/onboarding/subaccount', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            wallet: owner,
            account_index: EXTENDED_INDEX,
            description: EXTENDED_NAME,
            key_derivation_signature: sigKD,
            registration_signature: sigREG,
            registration_time: regTime,
            auth_time: challenge.time,
            auth_signature: authSig,
          }),
        });
        if (!rSub.ok) {
          const txt = await rSub.text();
          if (!/exists|already|409/i.test(txt)) throw new Error(txt || 'Subaccount creation failed');
        }
      } catch (e) {
        if (!String(e?.message || '').match(/exists|already|409/i)) throw e;
      }

      // 3) Create API key for subaccount 1 (2-step challenge)
      setExtStatus('3/3 Creating API key (index 1)…');
      const path1 = '/api/v1/user/accounts';
      const c1 = await fetch(`/api/agent/extended/challenge?path=${encodeURIComponent(path1)}`, { cache: 'no-store' })
        .then(r => fetchJsonOrThrow(r, 'Invalid challenge for /accounts'));
      const sig1 = await personalSign(c1.message);

      let r = await fetch('/api/agent/extended/check-or-create-api-key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          owner,
          signature: sig1,
          time: c1.time,
          account_index: EXTENDED_INDEX,
          description: EXTENDED_NAME,
        }),
      });

      if (r.status === 200) {
        const j = await r.json();
        setExtResult({ exists: true, client_id: j.account_id ?? j.client_id });
        setExtStatus('API key already existed.');
        await refreshExtended();
        return;
      }
      if (r.status !== 428) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail || 'Extended check failed');
      }

      const j428 = await r.json();
      const challenge2 = j428?.detail?.challenge;
      if (!challenge2) throw new Error('No second challenge provided');
      const sig2 = await personalSign(challenge2);
      const [, t2] = challenge2.split('@');

      const r2 = await fetch('/api/agent/extended/create-api-key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          owner,
          signature: sig1,
          time: c1.time,
          account_index: EXTENDED_INDEX,
          description: EXTENDED_NAME,
          signature2: sig2,
          time2: t2,
        }),
      });
      const j2 = await fetchJsonOrThrow(r2, 'Extended create failed');
      setExtResult({ created: true, client_id: j2.account_id ?? j2.client_id });
      setExtStatus('Extended API key created.');
      await refreshExtended();
    } catch (e) {
      setExtError(e.message || 'Extended setup failed');
      setExtStatus(null);
    } finally {
      setExtBusy(false);
    }
  };

  /* --------------------------- actions -------------------------------- */
  const handleSignIn = async () => {
    try {
      setAuthBusy(true);
      setError(null);
      const n = await fetch('/api/auth/nonce', { cache: 'no-store' }).then(r => r.json());
      if (!n?.nonce || !n?.domain || !n?.uri) throw new Error('Invalid nonce payload');
      const msg = buildSiweMessage({ address: owner, nonce: n.nonce, chainId, domain: n.domain, uri: n.uri });
      const signature = await signMessageAsync({ message: msg });
      const r = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: owner, message: msg, signature }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail || 'Verification failed');
      }
      await refreshSession();
      await refreshAgent();
      await refreshExtended(); // also refresh Extended on sign-in
    } catch (e) {
      setError(e.message || 'Sign-in failed');
    } finally { setAuthBusy(false); }
  };

  // HL: Create + Approve
  const createAndApproveAgent = async () => {
    try {
      setBusy(true); setError(null);
      if (!connectedAndAuthed) throw new Error('Please sign in with your wallet first.');

      const agentPriv = generatePrivateKey();
      const agentAddr = privateKeyToAccount(agentPriv).address.toLowerCase();
      const hyperliquidChain = await getHyperliquidChainFromHealth();
      const nowMs = Date.now();
      const action = {
        type: 'approveAgent',
        hyperliquidChain,
        signatureChainId: toHexChainId(chainId),
        agentAddress: agentAddr,
        agentName: DEFAULT_AGENT_NAME,
        nonce: nowMs,
      };

      const { domain, types, primaryType, message } = buildEip712ForApprove(action, chainId);
      const sigHex = await signTypedDataAsync({ domain, types, primaryType, message });
      const recovered = await recoverTypedDataAddress({ domain, types, primaryType, message, signature: sigHex });
      if (recovered.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(`Signature recovers to ${recovered}, not your wallet ${owner}`);
      }
      const { r, s, v } = splitSigRSV(sigHex);

      const resp = await fetch('/api/agent/hl/approve-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          owner,
          agent_name: DEFAULT_AGENT_NAME,
          agent_privkey_hex: agentPriv,
          agent_address: agentAddr,
          ttl_seconds: DEFAULT_TTL_SECONDS,
          approve_request: { action, nonce: nowMs, signature: { r, s, v } },
        }),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(j?.detail || j?.response || 'Approve failed');
      await refreshAgent();
    } catch (e) { setError(e.message || 'Approve failed'); }
    finally { setBusy(false); }
  };

  const revokeAgent = async () => {
    try {
      setBusy(true); setError(null);
      if (!connectedAndAuthed) throw new Error('Please sign in with your wallet first.');
      if (!agent) throw new Error('No agent to revoke.');

      const name = agent.agent_name ?? DEFAULT_AGENT_NAME;
      const hyperliquidChain = await getHyperliquidChainFromHealth();
      const nowMs = Date.now();
      const action = {
        type: 'approveAgent',
        hyperliquidChain,
        signatureChainId: toHexChainId(chainId),
        agentAddress: ZERO_ADDRESS,
        agentName: name,
        nonce: nowMs,
      };

      const { domain, types, primaryType, message } = buildEip712ForApprove(action, chainId);
      const sigHex = await signTypedDataAsync({ domain, types, primaryType, message });
      const recovered = await recoverTypedDataAddress({ domain, types, primaryType, message, signature: sigHex });
      if (recovered.toLowerCase() !== owner.toLowerCase()) {
        throw new Error(`Signature recovers to ${recovered}, not your wallet ${owner}`);
      }
      const { r, s, v } = splitSigRSV(sigHex);

      const resp = await fetch('/api/agent/hl/revoke-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          owner,
          agent_name: name,
          approve_request: { action, nonce: nowMs, signature: { r, s, v } },
        }),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(j?.detail || j?.response || 'Revoke failed');
      await refreshAgent();
    } catch (e) { setError(e.message || 'Revoke failed'); }
    finally { setBusy(false); }
  };

  /* ----------------------------- render -------------------------------- */
  const apiKeyReady = !!(extKeyInfo?.api_key || extKeyInfo?.has_api_key);

  const profileContent = (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profile</h1>
        {!mounted ? <Button variant="outline" size="lg">Connect Wallet</Button> : <ConnectWallet />}
      </div>

      {!mounted ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !isConnected ? (
        <p className="text-muted-foreground">Connect your wallet to manage your agent.</p>
      ) : !(sessionAddr && sessionAddr.toLowerCase() === (owner ?? '')) ? (
        <Card><CardContent className="p-6 space-y-4">
          <p className="text-muted-foreground">
            You’re connected as <span className="font-mono">{owner}</span>. Please sign in to create a session.
          </p>
          <Button onClick={handleSignIn} disabled={authBusy}>
            {authBusy ? 'Signing…' : 'Sign in with wallet'}
          </Button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent></Card>
      ) : (
        <>
          {/* ========================= HL Agent card ========================= */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Signed in as</div>
                  <div className="font-mono">{owner}</div>
                </div>
                <Image src="/hyprliquid.png" alt="Hyperliquid" width={32} height={32} />
              </div>

              {loadingAgent ? (
                <div className="text-sm text-muted-foreground">Loading agent…</div>
              ) : agent ? (
                <div className="border rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Name</div>
                      <div className="font-mono text-sm">{agent.agent_name ?? DEFAULT_AGENT_NAME}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Address</div>
                      <div className="font-mono text-xs break-all">{agent.agent_address ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Valid until</div>
                      <div className="text-sm">
                        {agent.expiry_unix ? stableUTCFromSeconds(agent.expiry_unix) : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button variant="destructive" onClick={revokeAgent} disabled={busy}>
                      {busy ? 'Working…' : 'Revoke'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-4">
                  <h2 className="font-medium text-lg">Create / Approve Agent</h2>
                  <div className="text-xs text-muted-foreground">
                    Generates a key locally and approves it on Hyperliquid. The key is stored encrypted by the backend.
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={createAndApproveAgent} disabled={busy}>
                      {busy ? 'Working…' : 'Create Agent'}
                    </Button>
                  </div>
                </div>
              )}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </CardContent>
          </Card>

          {/* ======================= Extended (x10) card ===================== */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Extended (x10)</div>
                  <div className="text-xs text-muted-foreground">
                    Onboard (0) → subaccount (1) → API key (1).
                  </div>
                </div>
                <Image src="/extended.png" alt="Extended" width={32} height={32} />
              </div>

              {apiKeyReady ? (
                <div className="border rounded-xl p-4 space-y-3">
                  <div className="text-sm">
                    Status: <span className="text-green-600 font-medium">OK</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    client_id: <span className="font-mono">{extKeyInfo?.client_id ?? '—'}</span>
                    {extKeyInfo?.vault_number != null ? (
                      <> · vault: <span className="font-mono">{extKeyInfo.vault_number}</span></>
                    ) : null}
                    {extKeyInfo?.stark_key_public ? (
                      <> · l2 pub: <span className="font-mono">{String(extKeyInfo.stark_key_public).slice(0, 10)}…</span></>
                    ) : null}
                  </div>
                  <Button asChild>
                    <Link href="/app/markets">Start farming</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={setupExtendedIndex1} disabled={extBusy}>
                      {extBusy ? 'Working…' : 'Setup Extended (index 1)'}
                    </Button>
                  </div>

                  {extStatus ? <div className="text-xs text-muted-foreground">{extStatus}</div> : null}

                  {extResult ? (
                    <div className="mt-2 border rounded-xl p-4">
                      {'exists' in extResult && extResult.exists ? (
                        <div>
                          <div className="text-sm">An API key already exists.</div>
                          <div className="text-xs text-muted-foreground">
                            client_id: <span className="font-mono">{extResult.client_id}</span>
                          </div>
                        </div>
                      ) : 'created' in extResult && extResult.created ? (
                        <div>
                          <div className="text-sm">API key created successfully.</div>
                          <div className="text-xs text-muted-foreground">
                            client_id: <span className="font-mono">{extResult.client_id}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">Done.</div>
                      )}
                    </div>
                  ) : null}

                  {extError ? <p className="text-sm text-red-600">{extError}</p> : null}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <DesktopFallback 
      comingSoonTitle="Profile Coming Soon!"
      comingSoonDescription="We're building a comprehensive profile management system for mobile. Manage your wallet connections, trading keys, and account settings all in one place!"
    >
      {profileContent}
    </DesktopFallback>
  );
}

