// src/app/api/workflows/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

const SaveWorkflowSchema = z.object({
  workflowId: z.string().optional(),
  name: z.string().min(1).max(100),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

// GET /api/workflows — list user's workflows
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ workflows });
}

// POST /api/workflows — save workflow
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const result = SaveWorkflowSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { workflowId, name, nodes, edges } = result.data;

  const workflow = workflowId
    ? await prisma.workflow.update({
        where: { id: workflowId, userId },
        data: { name, nodes, edges },
      })
    : await prisma.workflow.create({
        data: { userId, name, nodes, edges },
      });

  return NextResponse.json({ workflow });
}
