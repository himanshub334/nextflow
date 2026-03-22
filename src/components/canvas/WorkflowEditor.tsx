'use client';
// src/components/canvas/WorkflowEditor.tsx

import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '@/lib/store/workflow-store';
import { useTemporalStore } from 'zundo';
import { LeftSidebar } from '@/components/sidebar/LeftSidebar';
import { HistoryPanel } from '@/components/sidebar/HistoryPanel';
import { TopBar } from '@/components/ui/TopBar';
import { TextNode } from '@/components/nodes/TextNode';
import { UploadImageNode } from '@/components/nodes/UploadImageNode';
import { UploadVideoNode } from '@/components/nodes/UploadVideoNode';
import { LLMNode } from '@/components/nodes/LLMNode';
import { CropImageNode } from '@/components/nodes/CropImageNode';
import { ExtractFrameNode } from '@/components/nodes/ExtractFrameNode';

const nodeTypes = {
  text: TextNode,
  uploadImage: UploadImageNode,
  uploadVideo: UploadVideoNode,
  llm: LLMNode,
  cropImage: CropImageNode,
  extractFrame: ExtractFrameNode,
};

function FlowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    sidebarOpen,
    historyPanelOpen,
  } = useWorkflowStore();

  const { fitView } = useReactFlow();

  useEffect(() => {
    setTimeout(() => fitView({ padding: 0.1 }), 100);
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[12, 12]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#a855f7', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
        className="bg-[#0a0a0f]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.07)"
        />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            switch (node.data?.type) {
              case 'text': return '#3b82f6';
              case 'uploadImage': return '#22c55e';
              case 'uploadVideo': return '#f59e0b';
              case 'llm': return '#a855f7';
              case 'cropImage': return '#ec4899';
              case 'extractFrame': return '#06b6d4';
              default: return '#475569';
            }
          }}
          maskColor="rgba(10,10,15,0.7)"
          style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
        />
      </ReactFlow>
    </div>
  );
}

export function WorkflowEditor() {
  const { sidebarOpen, historyPanelOpen } = useWorkflowStore();

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0f]">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <FlowCanvas />
          <HistoryPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
