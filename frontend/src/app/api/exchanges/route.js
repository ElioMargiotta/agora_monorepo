import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { encryptSecretsForAccount } from '../../../lib/crypto.js';

// const prisma = new PrismaClient();

const exchangeEnum = z.enum(['extended', 'hyperliquid', 'aster', 'lighter', 'paradex']).transform(val => val.toUpperCase());

const postSchema = z.object({
  exchange: exchangeEnum,
  agentKey: z.string().min(1),
  apiKeyPublic: z.string().optional(),
  apiKeyPrivate: z.string().optional(),
  apiSecret: z.string().optional(),
  apiPassphrase: z.string().optional(),
});

export async function GET() {
  // Prisma database temporarily disabled for deployment
  return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  
  try {
    const userId = 1; // Stub
    const accounts = await prisma.exchangeAccount.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        exchange: true,
        agent_key: true,
        api_key_public: true,
        created_at: true,
      },
    });
    const response = accounts.map(acc => ({
      id: acc.id,
      exchange: acc.exchange.toLowerCase(),
      agentKey: acc.agent_key,
      apiKeyPublic: acc.api_key_public,
      created_at: acc.created_at.toISOString(),
    }));
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  // Prisma database temporarily disabled for deployment
  return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  
  try {
    const userId = 1; // Stub
    const body = await request.json();
    const validated = postSchema.parse(body);

    // Check if agentKey is unique
    const existing = await prisma.exchangeAccount.findUnique({
      where: { agent_key: validated.agentKey },
    });
    if (existing) {
      return NextResponse.json({ error: 'agentKey must be unique' }, { status: 400 });
    }

    const secrets = {
      apiKeyPrivate: validated.apiKeyPrivate,
      apiSecret: validated.apiSecret,
      apiPassphrase: validated.apiPassphrase,
    };
    const encrypted = encryptSecretsForAccount(secrets);

    const account = await prisma.exchangeAccount.create({
      data: {
        user_id: userId,
        exchange: validated.exchange,
        agent_key: validated.agentKey,
        api_key_public: validated.apiKeyPublic,
        ...encrypted,
      },
    });

    return NextResponse.json({
      id: account.id,
      exchange: account.exchange.toLowerCase(),
      agentKey: account.agent_key,
      created_at: account.created_at.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
