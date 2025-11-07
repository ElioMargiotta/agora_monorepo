import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { encryptSecretsForAccount, decryptSecretsForAccount } from '../../../../lib/crypto.js';

// const prisma = new PrismaClient();

const putSchema = z.object({
  agentKey: z.string().min(1).optional(),
  apiKeyPublic: z.string().optional(),
  apiKeyPrivate: z.string().optional(),
  apiSecret: z.string().optional(),
  apiPassphrase: z.string().optional(),
});

export async function PUT(request, { params }) {
  // Prisma database temporarily disabled for deployment
  return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  
  try {
    const userId = 1; // Stub
    const { id } = params;
    const accountId = parseInt(id);
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const validated = putSchema.parse(body);

    // Check if account exists and belongs to user
    const existing = await prisma.exchangeAccount.findFirst({
      where: { id: accountId, user_id: userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check agentKey uniqueness if provided
    if (validated.agentKey && validated.agentKey !== existing.agent_key) {
      const conflict = await prisma.exchangeAccount.findUnique({
        where: { agent_key: validated.agentKey },
      });
      if (conflict) {
        return NextResponse.json({ error: 'agentKey must be unique' }, { status: 400 });
      }
    }

    let updateData = {};
    if (validated.agentKey !== undefined) updateData.agent_key = validated.agentKey;
    if (validated.apiKeyPublic !== undefined) updateData.api_key_public = validated.apiKeyPublic;

    // If any secret is provided, rotate DEK and re-encrypt all secrets
    const hasSecret = validated.apiKeyPrivate !== undefined || validated.apiSecret !== undefined || validated.apiPassphrase !== undefined;
    if (hasSecret) {
      // Decrypt existing secrets
      const existingSecrets = decryptSecretsForAccount(existing);
      // Merge with new ones
      const newSecrets = {
        apiKeyPrivate: validated.apiKeyPrivate !== undefined ? validated.apiKeyPrivate : existingSecrets.apiKeyPrivate,
        apiSecret: validated.apiSecret !== undefined ? validated.apiSecret : existingSecrets.apiSecret,
        apiPassphrase: validated.apiPassphrase !== undefined ? validated.apiPassphrase : existingSecrets.apiPassphrase,
      };
      const encrypted = encryptSecretsForAccount(newSecrets);
      updateData = { ...updateData, ...encrypted };
    }

    const updated = await prisma.exchangeAccount.update({
      where: { id: accountId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      exchange: updated.exchange.toLowerCase(),
      agentKey: updated.agent_key,
      updated: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  // Prisma database temporarily disabled for deployment
  return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  
  try {
    const userId = 1; // Stub
    const { id } = params;
    const accountId = parseInt(id);
    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const existing = await prisma.exchangeAccount.findFirst({
      where: { id: accountId, user_id: userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    await prisma.exchangeAccount.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
