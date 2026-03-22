// src/app/api/history/[runId]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ runId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { runId } = await context.params;

  const run = await prisma.workflowRun.findFirst({
    where: { id: runId, userId },
  });

  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ run });
}