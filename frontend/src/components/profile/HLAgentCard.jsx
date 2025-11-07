'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HLAgentCard({
  owner,
  agent,
  loading,
  busy,
  error,
  onCreate,
  onRevoke,
  defaultAgentName,
  formatTs,
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Signed in as</div>
            <div className="font-mono">{owner}</div>
          </div>
          <Image src="/hyprliquid.png" alt="Hyperliquid" width={32} height={32} />
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading agent…</div>
        ) : agent ? (
          <div className="border rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="font-mono text-sm">{agent.agent_name ?? defaultAgentName}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Address</div>
                <div className="font-mono text-xs break-all">{agent.agent_address ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Valid until</div>
                <div className="text-sm">
                  {agent.expiry_unix ? formatTs(agent.expiry_unix) : '—'}
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <Button variant="destructive" onClick={onRevoke} disabled={busy}>
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
              <Button type="button" onClick={onCreate} disabled={busy}>
                {busy ? 'Working…' : 'Create Agent'}
              </Button>
            </div>
          </div>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
