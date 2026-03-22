'use client';
// src/components/nodes/NodeWrapper.tsx

import React from 'react';
import { Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';

interface NodeWrapperProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  isRunning?: boolean;
  children: React.ReactNode;
}

export function NodeWrapper({
  id,
  label,
  icon,
  color,
  bgColor,
  isRunning,
  children,
}: NodeWrapperProps) {
  const { deleteNode } = useWorkflowStore();

  return (
    <div className={`nf-node${isRunning ? ' node-running' : ''}`}>
      {/* Header */}
      <div className="nf-node-header">
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: bgColor, color }}
        >
          {icon}
        </div>
        <span className="text-xs font-semibold flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        <button
          onClick={() => deleteNode(id)}
          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          title="Delete node"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Body */}
      <div className="nf-node-body">{children}</div>
    </div>
  );
}
