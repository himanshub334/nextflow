// src/types/index.ts
import { Node, Edge } from 'reactflow';

// ─── Node Data Types ──────────────────────────────────────────────────────────

export interface TextNodeData {
  type: 'text';
  label: string;
  text: string;
  output?: string;
}

export interface UploadImageNodeData {
  type: 'uploadImage';
  label: string;
  imageUrl?: string;
  fileName?: string;
  output?: string;
}

export interface UploadVideoNodeData {
  type: 'uploadVideo';
  label: string;
  videoUrl?: string;
  fileName?: string;
  output?: string;
}

export interface LLMNodeData {
  type: 'llm';
  label: string;
  model: string;
  systemPrompt?: string;
  userMessage?: string;
  output?: string;
  isRunning?: boolean;
  error?: string;
}

export interface CropImageNodeData {
  type: 'cropImage';
  label: string;
  imageUrl?: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  output?: string;
  isRunning?: boolean;
  error?: string;
}

export interface ExtractFrameNodeData {
  type: 'extractFrame';
  label: string;
  videoUrl?: string;
  timestamp: string;
  output?: string;
  isRunning?: boolean;
  error?: string;
}

export type NodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

export type AppNode = Node<NodeData>;
export type AppEdge = Edge;

// ─── Node Types Enum ──────────────────────────────────────────────────────────

export type NodeType =
  | 'text'
  | 'uploadImage'
  | 'uploadVideo'
  | 'llm'
  | 'cropImage'
  | 'extractFrame';

// ─── Workflow History Types ───────────────────────────────────────────────────

export interface NodeResult {
  nodeId: string;
  nodeType: NodeType;
  nodeLabel: string;
  status: 'success' | 'failed' | 'running' | 'skipped';
  inputs: Record<string, unknown>;
  output?: unknown;
  error?: string;
  executionTimeMs?: number;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  userId: string;
  runType: 'full' | 'single' | 'selected';
  status: 'running' | 'success' | 'failed';
  nodeResults: NodeResult[];
  startedAt: string;
  completedAt?: string;
}

// ─── Execution Types ──────────────────────────────────────────────────────────

export type ExecutionMode = 'full' | 'single' | 'selected';

export interface ExecutionContext {
  nodeOutputs: Record<string, unknown>;
  runId: string;
}

// ─── Handle Types for Type-Safe Connections ───────────────────────────────────

export type HandleDataType = 'text' | 'image' | 'video' | 'any';

export interface HandleMeta {
  id: string;
  dataType: HandleDataType;
  label: string;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface WorkflowSavePayload {
  workflowId?: string;
  name: string;
  nodes: AppNode[];
  edges: AppEdge[];
}

export interface RunWorkflowPayload {
  workflowId: string;
  nodes: AppNode[];
  edges: AppEdge[];
  mode: ExecutionMode;
  selectedNodeIds?: string[];
}

// ─── LLM Models ───────────────────────────────────────────────────────────────

export const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Exp)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number]['value'];
