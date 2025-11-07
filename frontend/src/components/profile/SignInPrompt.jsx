'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SignInPrompt({ owner, onSignIn, authBusy, error }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <p className="text-muted-foreground">
          You’re connected as <span className="font-mono">{owner}</span>. Please sign in to create a session.
        </p>
        <Button onClick={onSignIn} disabled={authBusy}>
          {authBusy ? 'Signing…' : 'Sign in with wallet'}
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
