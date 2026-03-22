'use client';
// src/components/nodes/LLMNode.tsx

import React from 'react';
import { Handle, Position, NodeProps, useEdges } from 'reactflow';
import { Bot, Loader2, AlertCircle } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { LLMNodeData, GEMINI_MODELS } from '@/types';

function ConnectedBadge() {
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded ml-1"
      style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--accent-purple)' }}
    >
      connected
    </span>
  );
}

export function LLMNode({ id, data }: NodeProps<LLMNodeData>) {
  const { updateNodeData } = useWorkflowStore();
  const edges = useEdges();

  const connectedHandles = new Set(
    edges.filter((e) => e.target === id).map((e) => e.targetHandle)
  );

  const isSystemConnected = connectedHandles.has('system_prompt');
  const isUserConnected = connectedHandles.has('user_message');
  const isImagesConnected = connectedHandles.has('images');

  return (
    <div className="group">
      <NodeWrapper
        id={id}
        label={data.label}
        icon={<Bot size={12} />}
        color="#a855f7"
        bgColor="rgba(168,85,247,0.15)"
        isRunning={data.isRunning}
      >
        {/* Model selector */}
        <div>
          <div className="nf-label">Model</div>
          <select
            value={data.model}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
            className="nf-select"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* System Prompt */}
        <div>
          <div className="nf-label flex items-center">
            System Prompt
            {isSystemConnected && <ConnectedBadge />}
          </div>
          <textarea
            value={data.systemPrompt ?? ''}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
            placeholder="Optional system instructions..."
            className="nf-textarea"
            rows={2}
            disabled={isSystemConnected}
          />
        </div>

        {/* User Message */}
        <div>
          <div className="nf-label flex items-center">
            User Message
            {isUserConnected && <ConnectedBadge />}
          </div>
          <textarea
            value={data.userMessage ?? ''}
            onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
            placeholder="Enter prompt or connect text node..."
            className="nf-textarea"
            rows={3}
            disabled={isUserConnected}
          />
        </div>

        {/* Images note */}
        <div
          className="text-[10px] rounded px-2 py-1.5"
          style={{
            background: isImagesConnected
              ? 'rgba(168,85,247,0.1)'
              : 'var(--bg-elevated)',
            color: isImagesConnected ? 'var(--accent-purple)' : 'var(--text-muted)',
            border: '1px solid',
            borderColor: isImagesConnected
              ? 'rgba(168,85,247,0.3)'
              : 'var(--border-subtle)',
          }}
        >
          {isImagesConnected
            ? '✓ Image(s) connected via handle'
            : 'Connect image nodes to images handle'}
        </div>

        {/* Running state */}
        {data.isRunning && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent-purple)' }}>
            <Loader2 size={12} className="animate-spin" />
            Running via Trigger.dev...
          </div>
        )}

        {/* Error */}
        {data.error && (
          <div
            className="flex items-start gap-1.5 rounded px-2 py-1.5 text-[11px]"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}
          >
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            {data.error}
          </div>
        )}

        {/* Inline output — displayed directly on node */}
        {data.output && !data.isRunning && (
          <div>
            <div className="nf-label" style={{ color: 'var(--success)' }}>Output</div>
            <div
              className="text-[11px] rounded p-2 leading-relaxed"
              style={{
                background: 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: 'var(--text-secondary)',
                maxHeight: 120,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {data.output}
            </div>
          </div>
        )}
      </NodeWrapper>

      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="system_prompt"
        title="system_prompt (text)"
        style={{ top: '30%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="user_message"
        title="user_message (text)"
        style={{ top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="images"
        title="images (image)"
        style={{ top: '70%' }}
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        title="text output"
        style={{ top: '50%' }}
      />
    </div>
  );
}
