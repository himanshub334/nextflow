'use client';
// src/components/nodes/TextNode.tsx

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Type } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { TextNodeData } from '@/types';

export function TextNode({ id, data }: NodeProps<TextNodeData>) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <div className="group">
      <NodeWrapper
        id={id}
        label={data.label}
        icon={<Type size={12} />}
        color="#3b82f6"
        bgColor="rgba(59,130,246,0.15)"
      >
        <div>
          <div className="nf-label">Text Content</div>
          <textarea
            value={data.text}
            onChange={(e) => updateNodeData(id, { text: e.target.value })}
            placeholder="Enter text..."
            className="nf-textarea"
            rows={4}
          />
        </div>
      </NodeWrapper>

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
