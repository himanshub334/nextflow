// src/app/api/workflows/[id]/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workflow = await prisma.workflow.findFirst({
    where: { id: params.id, userId },
  });

  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ workflow });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.workflow.deleteMany({
    where: { id: params.id, userId },
  });

  return NextResponse.json({ success: true });
}
