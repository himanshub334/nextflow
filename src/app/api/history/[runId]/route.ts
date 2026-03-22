// src/app/api/history/[runId]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { runId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const run = await prisma.workflowRun.findFirst({
    where: { id: params.runId, userId },
  });

  if (!run) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ run });
}
