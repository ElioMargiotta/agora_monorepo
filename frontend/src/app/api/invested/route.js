import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// const prisma = new PrismaClient();

const postSchema = z.object({
  asset: z.string().min(1),
  invested_money: z.string().regex(/^\d+(\.\d+)?$/),
});

export async function GET() {
  // Prisma database temporarily disabled for deployment
  return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  
  try {
    const userId = 1; // Stub
    const data = await prisma.investedData.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        asset: true,
        invested_money: true,
        created_at: true,
      },
    });
    const response = data.map(item => ({
      id: item.id,
      asset: item.asset,
      invested_money: item.invested_money.toString(),
      created_at: item.created_at.toISOString(),
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

    const item = await prisma.investedData.create({
      data: {
        user_id: userId,
        asset: validated.asset,
        invested_money: parseFloat(validated.invested_money),
      },
    });

    return NextResponse.json({
      id: item.id,
      asset: item.asset,
      invested_money: item.invested_money.toString(),
      created_at: item.created_at.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
