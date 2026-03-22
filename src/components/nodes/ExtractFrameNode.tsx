'use client';
// src/components/nodes/ExtractFrameNode.tsx

import React from 'react';
import { Handle, Position, NodeProps, useEdges } from 'reactflow';
import { Film, Loader2, AlertCircle } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { ExtractFrameNodeData } from '@/types';

export function ExtractFrameNode({ id, data }: NodeProps<ExtractFrameNodeData>) {
  const { updateNodeData } = useWorkflowStore();
  const edges = useEdges();

  const connectedHandles = new Set(
    edges.filter((e) => e.target === id).map((e) => e.targetHandle)
  );

  return (
    <div className="group">
      <NodeWrapper
        id={id}
        label={data.label}
        icon={<Film size={12} />}
        color="#06b6d4"
        bgColor="rgba(6,182,212,0.15)"
        isRunning={data.isRunning}
      >
        {/* Video URL */}
        <div>
          <div className="nf-label flex items-center gap-1">
            Video URL
            {connectedHandles.has('video_url') && (
              <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                connected
              </span>
            )}
          </div>
          <input
            type="text"
            value={data.videoUrl ?? ''}
            onChange={(e) => updateNodeData(id, { videoUrl: e.target.value })}
            placeholder="Video URL or connect node"
            className="nf-input"
            disabled={connectedHandles.has('video_url')}
          />
        </div>

        {/* Timestamp */}
        <div>
          <div className="nf-label flex items-center gap-1">
            Timestamp
            {connectedHandles.has('timestamp') && (
              <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                connected
              </span>
            )}
          </div>
          <input
            type="text"
            value={data.timestamp}
            onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
            placeholder="e.g. 5 (seconds) or 50%"
            className="nf-input"
            disabled={connectedHandles.has('timestamp')}
          />
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Seconds (e.g. 5) or percentage (e.g. 50%)
          </div>
        </div>

        {data.isRunning && (
          <div className="flex items-center gap-2 text-xs" style={{ color: '#06b6d4' }}>
            <Loader2 size={12} className="animate-spin" />
            Extracting frame via FFmpeg...
          </div>
        )}

        {data.error && (
          <div className="flex items-start gap-1.5 rounded px-2 py-1.5 text-[11px]"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}>
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            {data.error}
          </div>
        )}

        {data.output && !data.isRunning && (
          <div>
            <div className="nf-label" style={{ color: 'var(--success)' }}>Extracted Frame</div>
            <img
              src={data.output}
              alt="extracted frame"
              className="w-full rounded object-cover"
              style={{ maxHeight: 80 }}
            />
          </div>
        )}
      </NodeWrapper>

      {/* Input handles */}
      <Handle type="target" position={Position.Left} id="video_url" title="video_url" style={{ top: '35%' }} />
      <Handle type="target" position={Position.Left} id="timestamp" title="timestamp" style={{ top: '60%' }} />

      {/* Output */}
      <Handle type="source" position={Position.Right} id="output" title="image output" style={{ top: '50%' }} />
    </div>
  );
}
