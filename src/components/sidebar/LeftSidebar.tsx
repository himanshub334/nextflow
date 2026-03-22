'use client';
// src/components/sidebar/LeftSidebar.tsx

import React, { useState } from 'react';
import {
  Type,
  Image,
  Video,
  Bot,
  Crop,
  Film,
  Search,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { NodeType } from '@/types';

interface NodeButton {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const NODE_BUTTONS: NodeButton[] = [
  {
    type: 'text',
    label: 'Text',
    description: 'Text input node',
    icon: <Type size={16} />,
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.12)',
  },
  {
    type: 'uploadImage',
    label: 'Upload Image',
    description: 'Upload image via Transloadit',
    icon: <Image size={16} />,
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.12)',
  },
  {
    type: 'uploadVideo',
    label: 'Upload Video',
    description: 'Upload video via Transloadit',
    icon: <Video size={16} />,
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.12)',
  },
  {
    type: 'llm',
    label: 'Run LLM',
    description: 'Google Gemini via Trigger.dev',
    icon: <Bot size={16} />,
    color: '#a855f7',
    bgColor: 'rgba(168,85,247,0.12)',
  },
  {
    type: 'cropImage',
    label: 'Crop Image',
    description: 'FFmpeg crop via Trigger.dev',
    icon: <Crop size={16} />,
    color: '#ec4899',
    bgColor: 'rgba(236,72,153,0.12)',
  },
  {
    type: 'extractFrame',
    label: 'Extract Frame',
    description: 'Video frame via Trigger.dev',
    icon: <Film size={16} />,
    color: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.12)',
  },
];

export function LeftSidebar() {
  const { addNode, sidebarOpen, setSidebarOpen } = useWorkflowStore();
  const [search, setSearch] = useState('');

  const filtered = NODE_BUTTONS.filter(
    (n) =>
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!sidebarOpen) {
    return (
      <div
        className="flex flex-col items-center py-3 gap-2"
        style={{
          width: 48,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Expand sidebar"
        >
          <Zap size={16} style={{ color: 'var(--accent-purple)' }} />
        </button>
        <div className="w-full h-px my-1" style={{ background: 'var(--border-subtle)' }} />
        {NODE_BUTTONS.map((btn) => (
          <button
            key={btn.type}
            onClick={() => addNode(btn.type)}
            className="p-1.5 rounded-md transition-all"
            style={{ color: btn.color, background: btn.bgColor }}
            title={btn.label}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="nf-sidebar flex-shrink-0"
      style={{ width: 220 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: 'var(--accent-purple)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            NODES
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="nf-input pl-7"
            style={{ fontSize: 11, padding: '5px 8px 5px 26px' }}
          />
        </div>
      </div>

      {/* Quick Access label */}
      <div className="px-3 pt-3 pb-1">
        <span className="nf-label">Quick Access</span>
      </div>

      {/* Node buttons */}
      <div className="flex flex-col gap-1 px-2 pb-3 overflow-y-auto flex-1">
        {filtered.map((btn) => (
          <button
            key={btn.type}
            onClick={() => addNode(btn.type)}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-left transition-all group"
            style={{
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = btn.bgColor;
              e.currentTarget.style.borderColor = `${btn.color}33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow', btn.type);
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: btn.bgColor, color: btn.color }}
            >
              {btn.icon}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                {btn.label}
              </div>
              <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                {btn.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
