// src/app/api/history/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const workflowId = url.searchParams.get('workflowId');

  const runs = await prisma.workflowRun.findMany({
    where: {
      userId,
      ...(workflowId ? { workflowId } : {}),
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ runs });
}
