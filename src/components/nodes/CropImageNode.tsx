'use client';
// src/components/nodes/CropImageNode.tsx

import React from 'react';
import { Handle, Position, NodeProps, useEdges } from 'reactflow';
import { Crop, Loader2, AlertCircle } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { CropImageNodeData } from '@/types';

function NumberInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="nf-label">{label} %</div>
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="nf-input"
        disabled={disabled}
      />
    </div>
  );
}

export function CropImageNode({ id, data }: NodeProps<CropImageNodeData>) {
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
        icon={<Crop size={12} />}
        color="#ec4899"
        bgColor="rgba(236,72,153,0.15)"
        isRunning={data.isRunning}
      >
        {/* Image URL */}
        <div>
          <div className="nf-label flex items-center gap-1">
            Image URL
            {connectedHandles.has('image_url') && (
              <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>
                connected
              </span>
            )}
          </div>
          <input
            type="text"
            value={data.imageUrl ?? ''}
            onChange={(e) => updateNodeData(id, { imageUrl: e.target.value })}
            placeholder="Image URL or connect node"
            className="nf-input"
            disabled={connectedHandles.has('image_url')}
          />
        </div>

        {/* Crop params grid */}
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="X"
            value={data.xPercent}
            onChange={(v) => updateNodeData(id, { xPercent: v })}
            disabled={connectedHandles.has('x_percent')}
          />
          <NumberInput
            label="Y"
            value={data.yPercent}
            onChange={(v) => updateNodeData(id, { yPercent: v })}
            disabled={connectedHandles.has('y_percent')}
          />
          <NumberInput
            label="Width"
            value={data.widthPercent}
            onChange={(v) => updateNodeData(id, { widthPercent: v })}
            disabled={connectedHandles.has('width_percent')}
          />
          <NumberInput
            label="Height"
            value={data.heightPercent}
            onChange={(v) => updateNodeData(id, { heightPercent: v })}
            disabled={connectedHandles.has('height_percent')}
          />
        </div>

        {data.isRunning && (
          <div className="flex items-center gap-2 text-xs" style={{ color: '#ec4899' }}>
            <Loader2 size={12} className="animate-spin" />
            Processing via FFmpeg...
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
            <div className="nf-label" style={{ color: 'var(--success)' }}>Output</div>
            <img
              src={data.output}
              alt="cropped"
              className="w-full rounded object-cover"
              style={{ maxHeight: 80 }}
            />
          </div>
        )}
      </NodeWrapper>

      {/* Input handles */}
      <Handle type="target" position={Position.Left} id="image_url" title="image_url" style={{ top: '28%' }} />
      <Handle type="target" position={Position.Left} id="x_percent" title="x_percent" style={{ top: '42%' }} />
      <Handle type="target" position={Position.Left} id="y_percent" title="y_percent" style={{ top: '54%' }} />
      <Handle type="target" position={Position.Left} id="width_percent" title="width_percent" style={{ top: '66%' }} />
      <Handle type="target" position={Position.Left} id="height_percent" title="height_percent" style={{ top: '78%' }} />

      {/* Output */}
      <Handle type="source" position={Position.Right} id="output" title="image output" style={{ top: '50%' }} />
    </div>
  );
}
