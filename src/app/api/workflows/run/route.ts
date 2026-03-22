// src/app/api/workflows/run/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { buildDAG, getExecutionOrder, getNodeInputsFromEdges } from '@/lib/utils/dag-executor';
import { tasks } from '@trigger.dev/sdk/v3';
import { AppNode, AppEdge, NodeResult, ExecutionMode } from '@/types';

const RunWorkflowSchema = z.object({
  workflowId: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  mode: z.enum(['full', 'single', 'selected']),
  selectedNodeIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const result = RunWorkflowSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten() }, { status: 400 });
  }

  const { workflowId, nodes, edges, mode, selectedNodeIds } = result.data;

  const run = await prisma.workflowRun.create({
    data: { workflowId, userId, runType: mode, status: 'running', nodeResults: [] },
  });

  executeWorkflow({
    runId: run.id, nodes: nodes as AppNode[], edges: edges as AppEdge[],
    mode: mode as ExecutionMode, selectedNodeIds,
  }).catch(console.error);

  return NextResponse.json({ runId: run.id });
}

async function executeWorkflow({ runId, nodes, edges, mode, selectedNodeIds }: {
  runId: string; nodes: AppNode[]; edges: AppEdge[]; mode: ExecutionMode; selectedNodeIds?: string[];
}) {
  const dagMap = buildDAG(nodes, edges);
  const targetIds = mode === 'single' && selectedNodeIds?.length === 1 ? selectedNodeIds
    : mode === 'selected' && selectedNodeIds?.length ? selectedNodeIds : undefined;

  const levels = getExecutionOrder(dagMap, targetIds);
  const nodeOutputs: Record<string, unknown> = {};
  const nodeResults: NodeResult[] = [];

  for (const node of nodes) {
    if (node.data.type === 'text') nodeOutputs[node.id] = node.data.text;
    else if (node.data.type === 'uploadImage') nodeOutputs[node.id] = node.data.imageUrl;
    else if (node.data.type === 'uploadVideo') nodeOutputs[node.id] = node.data.videoUrl;
  }

  let overallStatus: 'success' | 'failed' = 'success';

  for (const level of levels) {
    await Promise.all(level.map(async (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const startTime = Date.now();
      const edgeInputs = getNodeInputsFromEdges(nodeId, edges, nodeOutputs);

      if (['text', 'uploadImage', 'uploadVideo'].includes(node.data.type)) {
        nodeResults.push({ nodeId, nodeType: node.data.type, nodeLabel: node.data.label,
          status: 'success', inputs: {}, output: nodeOutputs[nodeId], executionTimeMs: 0 });
        return;
      }

      try {
        let output: unknown;

        if (node.data.type === 'llm') {
          const imageUrls = Array.isArray(edgeInputs['images'])
            ? edgeInputs['images'] : edgeInputs['images'] ? [edgeInputs['images']] : [];
          const handle = await tasks.trigger('run-llm', {
            model: node.data.model,
            systemPrompt: (edgeInputs['system_prompt'] as string) || node.data.systemPrompt,
            userMessage: (edgeInputs['user_message'] as string) || node.data.userMessage || '',
            imageUrls: imageUrls.length ? imageUrls : undefined,
          });
          const taskResult = await handle.wait();
          output = (taskResult.output as { output: string }).output;

        } else if (node.data.type === 'cropImage') {
          const handle = await tasks.trigger('crop-image', {
            imageUrl: (edgeInputs['image_url'] as string) || node.data.imageUrl || '',
            xPercent: Number(edgeInputs['x_percent'] ?? node.data.xPercent ?? 0),
            yPercent: Number(edgeInputs['y_percent'] ?? node.data.yPercent ?? 0),
            widthPercent: Number(edgeInputs['width_percent'] ?? node.data.widthPercent ?? 100),
            heightPercent: Number(edgeInputs['height_percent'] ?? node.data.heightPercent ?? 100),
            transloaditKey: process.env.TRANSLOADIT_KEY!,
            transloaditSecret: process.env.TRANSLOADIT_SECRET!,
          });
          const taskResult = await handle.wait();
          output = (taskResult.output as { output: string }).output;

        } else if (node.data.type === 'extractFrame') {
          const handle = await tasks.trigger('extract-frame', {
            videoUrl: (edgeInputs['video_url'] as string) || node.data.videoUrl || '',
            timestamp: (edgeInputs['timestamp'] as string) || node.data.timestamp || '0',
            transloaditKey: process.env.TRANSLOADIT_KEY!,
            transloaditSecret: process.env.TRANSLOADIT_SECRET!,
          });
          const taskResult = await handle.wait();
          output = (taskResult.output as { output: string }).output;
        }

        nodeOutputs[nodeId] = output;
        nodeResults.push({ nodeId, nodeType: node.data.type, nodeLabel: node.data.label,
          status: 'success', inputs: edgeInputs, output, executionTimeMs: Date.now() - startTime });

      } catch (error) {
        overallStatus = 'failed';
        nodeResults.push({ nodeId, nodeType: node.data.type, nodeLabel: node.data.label,
          status: 'failed', inputs: edgeInputs,
          error: error instanceof Error ? error.message : String(error),
          executionTimeMs: Date.now() - startTime });
      }
    }));
  }

  await prisma.workflowRun.update({
    where: { id: runId },
    data: { status: overallStatus, nodeResults: nodeResults as any, completedAt: new Date() },
  });
}