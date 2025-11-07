'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ExtendedSetupCard({
  apiKeyReady,
  extKeyInfo,
  extBusy,
  extError,
  extStatus,
  extResult,
  onSetup,
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Extended (x10)</div>
            <div className="text-xs text-muted-foreground">
              Onboard (0) → subaccount (9) → API key (9).
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
              <Button type="button" onClick={onSetup} disabled={extBusy}>
                {extBusy ? 'Working…' : 'Setup Extended (index 9)'}
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
  );
}
