'use client';
// src/components/ui/TopBar.tsx

import React, { useState, useCallback } from 'react';
import {
  Play, Save, Undo2, Redo2, Download, Upload,
  ChevronDown, Loader2, CheckCircle, PanelLeft, PanelRight,
} from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { UserButton } from '@clerk/nextjs';

export function TopBar() {
  const {
    workflowId, workflowName, nodes, edges, isRunning, selectedNodes,
    setWorkflowId, setWorkflowName, setIsRunning, setActiveRunId,
    addRunToHistory, sidebarOpen, historyPanelOpen,
    setSidebarOpen, setHistoryPanelOpen,
  } = useWorkflowStore();

  // ── Undo/Redo via zundo temporal store ──
  const temporal = useWorkflowStore.temporal;
  const canUndo = temporal.getState().pastStates.length > 0;
  const canRedo = temporal.getState().futureStates.length > 0;
  const handleUndo = () => temporal.getState().undo();
  const handleRedo = () => temporal.getState().redo();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflowId || undefined,
          name: workflowName, nodes, edges,
        }),
      });
      const data = await res.json();
      if (data.workflow?.id) {
        setWorkflowId(data.workflow.id);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }, [workflowId, workflowName, nodes, edges, setWorkflowId]);

  const handleRun = useCallback(async (mode: 'full' | 'single' | 'selected') => {
    if (!workflowId) { alert('Save workflow first before running'); return; }
    setRunMenuOpen(false);
    setIsRunning(true);
    try {
      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, nodes, edges, mode, selectedNodeIds: selectedNodes }),
      });
      const data = await res.json();
      if (data.runId) { setActiveRunId(data.runId); pollRun(data.runId); }
    } catch { setIsRunning(false); }
  }, [workflowId, nodes, edges, selectedNodes, setIsRunning, setActiveRunId]);

  const pollRun = useCallback(async (runId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/history/${runId}`);
      const data = await res.json();
      if (data.run?.status !== 'running') {
        clearInterval(interval);
        setIsRunning(false);
        addRunToHistory(data.run);
      }
    }, 1500);
  }, [setIsRunning, addRunToHistory]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ name: workflowName, nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${workflowName.replace(/\s+/g, '_')}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const data = JSON.parse(await file.text());
      if (data.nodes && data.edges) {
        useWorkflowStore.getState().loadWorkflow(data.nodes, data.edges);
        if (data.name) setWorkflowName(data.name);
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', height: 48, minHeight: 48 }}>

      {/* Left */}
      <div className="flex items-center gap-2">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="nf-btn nf-btn-ghost p-1.5" title="Toggle sidebar">
          <PanelLeft size={16} />
        </button>
        <div className="flex items-center gap-2 px-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--accent-purple)' }}>N</div>
          {editingName ? (
            <input autoFocus value={workflowName} onChange={(e) => setWorkflowName(e.target.value)}
              onBlur={() => setEditingName(false)} onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              className="nf-input text-sm py-0.5 px-1 w-40 h-6" />
          ) : (
            <span className="text-sm font-medium cursor-pointer hover:text-white transition-colors"
              style={{ color: 'var(--text-secondary)' }} onClick={() => setEditingName(true)}>
              {workflowName}
            </span>
          )}
        </div>
      </div>

      {/* Center — undo/redo */}
      <div className="flex items-center gap-1">
        <button onClick={handleUndo} disabled={!canUndo} className="nf-btn nf-btn-ghost p-1.5" title="Undo">
          <Undo2 size={15} />
        </button>
        <button onClick={handleRedo} disabled={!canRedo} className="nf-btn nf-btn-ghost p-1.5" title="Redo">
          <Redo2 size={15} />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button onClick={handleImport} className="nf-btn nf-btn-ghost p-1.5" title="Import JSON"><Upload size={15} /></button>
        <button onClick={handleExport} className="nf-btn nf-btn-ghost p-1.5" title="Export JSON"><Download size={15} /></button>

        <button onClick={handleSave} disabled={saving} className="nf-btn nf-btn-ghost" style={{ fontSize: 12 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved
            ? <CheckCircle size={14} style={{ color: 'var(--success)' }} /> : <Save size={14} />}
          {saved ? 'Saved' : 'Save'}
        </button>

        <div className="relative flex">
          <button onClick={() => handleRun('full')} disabled={isRunning} className="nf-btn nf-btn-primary"
            style={{ fontSize: 12, borderRadius: '7px 0 0 7px', borderRight: 'none', paddingRight: 10 }}>
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Run
          </button>
          <button onClick={() => setRunMenuOpen((o) => !o)} disabled={isRunning} className="nf-btn nf-btn-primary px-2"
            style={{ fontSize: 12, borderRadius: '0 7px 7px 0', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
            <ChevronDown size={13} />
          </button>
          {runMenuOpen && (
            <div className="absolute top-full right-0 mt-1 rounded-lg overflow-hidden shadow-xl z-50 min-w-[180px]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              {[
                { label: 'Run Full Workflow', mode: 'full' as const },
                { label: 'Run Selected Nodes', mode: 'selected' as const },
                { label: 'Run Single Node', mode: 'single' as const },
              ].map(({ label, mode }) => (
                <button key={mode} onClick={() => handleRun(mode)}
                  className="w-full text-left px-4 py-2.5 text-xs transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setHistoryPanelOpen(!historyPanelOpen)} className="nf-btn nf-btn-ghost p-1.5" title="Toggle history">
          <PanelRight size={16} />
        </button>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </div>
  );
}