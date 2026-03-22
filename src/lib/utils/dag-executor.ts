// src/lib/utils/dag-executor.ts
import { AppNode, AppEdge, NodeData } from '@/types';

export interface DAGNode {
  id: string;
  data: NodeData;
  dependencies: string[];
  dependents: string[];
}

export function buildDAG(nodes: AppNode[], edges: AppEdge[]): Map<string, DAGNode> {
  const dagMap = new Map<string, DAGNode>();

  for (const node of nodes) {
    dagMap.set(node.id, {
      id: node.id,
      data: node.data,
      dependencies: [],
      dependents: [],
    });
  }

  for (const edge of edges) {
    const sourceNode = dagMap.get(edge.source);
    const targetNode = dagMap.get(edge.target);
    if (sourceNode && targetNode) {
      targetNode.dependencies.push(edge.source);
      sourceNode.dependents.push(edge.target);
    }
  }

  return dagMap;
}

export function getExecutionOrder(
  dagMap: Map<string, DAGNode>,
  targetNodeIds?: string[]
): string[][] {
  // Determine which nodes to include
  const relevantNodes = targetNodeIds
    ? getAncestors(dagMap, targetNodeIds)
    : new Set(dagMap.keys());

  // Kahn's algorithm for topological sort in levels (parallel batches)
  const inDegree = new Map<string, number>();
  for (const [id] of dagMap) {
    if (!relevantNodes.has(id)) continue;
    const node = dagMap.get(id)!;
    const relevantDeps = node.dependencies.filter((d) => relevantNodes.has(d));
    inDegree.set(id, relevantDeps.length);
  }

  const levels: string[][] = [];
  let currentLevel = [...inDegree.entries()]
    .filter(([, deg]) => deg === 0)
    .map(([id]) => id);

  const processed = new Set<string>();

  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    const nextLevel: string[] = [];

    for (const nodeId of currentLevel) {
      processed.add(nodeId);
      const node = dagMap.get(nodeId)!;
      for (const dependent of node.dependents) {
        if (!relevantNodes.has(dependent)) continue;
        const newDegree = (inDegree.get(dependent) ?? 0) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          nextLevel.push(dependent);
        }
      }
    }

    currentLevel = nextLevel;
  }

  return levels;
}

function getAncestors(
  dagMap: Map<string, DAGNode>,
  targetIds: string[]
): Set<string> {
  const ancestors = new Set<string>(targetIds);
  const queue = [...targetIds];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = dagMap.get(id);
    if (!node) continue;
    for (const dep of node.dependencies) {
      if (!ancestors.has(dep)) {
        ancestors.add(dep);
        queue.push(dep);
      }
    }
  }

  return ancestors;
}

export function getNodeInputsFromEdges(
  nodeId: string,
  edges: AppEdge[],
  nodeOutputs: Record<string, unknown>
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  for (const edge of edges) {
    if (edge.target === nodeId && edge.targetHandle) {
      const sourceOutput = nodeOutputs[edge.source];
      if (sourceOutput !== undefined) {
        inputs[edge.targetHandle] = sourceOutput;
      }
    }
  }

  return inputs;
}
