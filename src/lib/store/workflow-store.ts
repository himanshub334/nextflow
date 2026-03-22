// src/lib/store/workflow-store.ts
import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow';
import {
  AppNode,
  AppEdge,
  NodeData,
  NodeType,
  ExecutionMode,
  WorkflowRun,
  HandleDataType,
} from '@/types';

// Handle type compatibility map
const HANDLE_COMPATIBILITY: Record<HandleDataType, HandleDataType[]> = {
  text: ['text', 'any'],
  image: ['image', 'any'],
  video: ['video', 'any'],
  any: ['text', 'image', 'video', 'any'],
};

// Source handle data types by node type and handle id
const SOURCE_HANDLE_TYPES: Record<string, HandleDataType> = {
  'text-output': 'text',
  'uploadImage-output': 'image',
  'uploadVideo-output': 'video',
  'llm-output': 'text',
  'cropImage-output': 'image',
  'extractFrame-output': 'image',
};

// Target handle data types
const TARGET_HANDLE_TYPES: Record<string, HandleDataType> = {
  'llm-system_prompt': 'text',
  'llm-user_message': 'text',
  'llm-images': 'image',
  'cropImage-image_url': 'image',
  'cropImage-x_percent': 'text',
  'cropImage-y_percent': 'text',
  'cropImage-width_percent': 'text',
  'cropImage-height_percent': 'text',
  'extractFrame-video_url': 'video',
  'extractFrame-timestamp': 'text',
};

interface WorkflowStore {
  // State
  workflowId: string | null;
  workflowName: string;
  nodes: AppNode[];
  edges: AppEdge[];
  selectedNodes: string[];
  isRunning: boolean;
  runHistory: WorkflowRun[];
  sidebarOpen: boolean;
  historyPanelOpen: boolean;
  activeRunId: string | null;

  // Node actions
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;

  // Workflow actions
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  loadWorkflow: (nodes: AppNode[], edges: AppEdge[]) => void;

  // Execution
  setNodeRunning: (nodeId: string, running: boolean) => void;
  setNodeOutput: (nodeId: string, output: unknown) => void;
  setNodeError: (nodeId: string, error: string) => void;
  setIsRunning: (running: boolean) => void;
  setActiveRunId: (id: string | null) => void;

  // Selection
  setSelectedNodes: (ids: string[]) => void;

  // History
  addRunToHistory: (run: WorkflowRun) => void;
  setRunHistory: (runs: WorkflowRun[]) => void;

  // UI
  setSidebarOpen: (open: boolean) => void;
  setHistoryPanelOpen: (open: boolean) => void;
}

let nodeCounter = 0;

function createNodeId(type: NodeType): string {
  return `${type}-${Date.now()}-${++nodeCounter}`;
}

function getDefaultNodeData(type: NodeType): NodeData {
  switch (type) {
    case 'text':
      return { type: 'text', label: 'Text Node', text: '' };
    case 'uploadImage':
      return { type: 'uploadImage', label: 'Upload Image' };
    case 'uploadVideo':
      return { type: 'uploadVideo', label: 'Upload Video' };
    case 'llm':
      return {
        type: 'llm',
        label: 'LLM Node',
        model: 'gemini-1.5-flash',
        systemPrompt: '',
        userMessage: '',
      };
    case 'cropImage':
      return {
        type: 'cropImage',
        label: 'Crop Image',
        xPercent: 0,
        yPercent: 0,
        widthPercent: 100,
        heightPercent: 100,
      };
    case 'extractFrame':
      return { type: 'extractFrame', label: 'Extract Frame', timestamp: '0' };
  }
}

function isValidConnection(
  connection: Connection,
  nodes: AppNode[],
  edges: AppEdge[]
): boolean {
  const { source, sourceHandle, target, targetHandle } = connection;
  if (!source || !sourceHandle || !target || !targetHandle) return false;

  // No self-connections
  if (source === target) return false;

  // Get source node type
  const sourceNode = nodes.find((n) => n.id === source);
  if (!sourceNode) return false;

  // Build source handle key
  const sourceKey = `${sourceNode.data.type}-${sourceHandle}`;
  const targetKey = `${(nodes.find((n) => n.id === target)?.data.type)}-${targetHandle}`;

  const sourceType = SOURCE_HANDLE_TYPES[sourceKey];
  const targetType = TARGET_HANDLE_TYPES[targetKey];

  if (!sourceType || !targetType) return false;

  // Check compatibility
  const compatibleTargets = HANDLE_COMPATIBILITY[sourceType] || [];
  if (!compatibleTargets.includes(targetType)) return false;

  // DAG: Check for cycles
  // Simple cycle detection: target should not be an ancestor of source
  const ancestors = new Set<string>();
  const queue = [source];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (ancestors.has(current)) continue;
    ancestors.add(current);
    edges
      .filter((e) => e.target === current)
      .forEach((e) => queue.push(e.source));
  }
  if (ancestors.has(target)) return false;

  return true;
}

export const useWorkflowStore = create<WorkflowStore>()(
  temporal(
    (set, get) => ({
      workflowId: null,
      workflowName: 'Untitled Workflow',
      nodes: [],
      edges: [],
      selectedNodes: [],
      isRunning: false,
      runHistory: [],
      sidebarOpen: true,
      historyPanelOpen: true,
      activeRunId: null,

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes) as AppNode[],
        })),

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        })),

      onConnect: (connection) => {
        const { nodes, edges } = get();
        if (!isValidConnection(connection, nodes, edges)) return;
        set((state) => ({
          edges: addEdge(
            {
              ...connection,
              animated: true,
              style: { stroke: '#a855f7', strokeWidth: 2 },
            },
            state.edges
          ),
        }));
      },

      addNode: (type) => {
        const id = createNodeId(type);
        const newNode: AppNode = {
          id,
          type,
          position: {
            x: 100 + Math.random() * 300,
            y: 100 + Math.random() * 200,
          },
          data: getDefaultNodeData(type),
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
      },

      updateNodeData: (nodeId, data) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
          ),
        })),

      deleteNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
        })),

      setWorkflowId: (id) => set({ workflowId: id }),
      setWorkflowName: (name) => set({ workflowName: name }),
      loadWorkflow: (nodes, edges) => set({ nodes, edges }),

      setNodeRunning: (nodeId, running) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, isRunning: running } }
              : n
          ),
        })),

      setNodeOutput: (nodeId, output) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, output, isRunning: false, error: undefined } }
              : n
          ),
        })),

      setNodeError: (nodeId, error) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, error, isRunning: false } }
              : n
          ),
        })),

      setIsRunning: (running) => set({ isRunning: running }),
      setActiveRunId: (id) => set({ activeRunId: id }),

      setSelectedNodes: (ids) => set({ selectedNodes: ids }),

      addRunToHistory: (run) =>
        set((state) => ({ runHistory: [run, ...state.runHistory] })),

      setRunHistory: (runs) => set({ runHistory: runs }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setHistoryPanelOpen: (open) => set({ historyPanelOpen: open }),
    }),
    {
      limit: 50,
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);
