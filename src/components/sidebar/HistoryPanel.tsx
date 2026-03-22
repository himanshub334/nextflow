'use client';
// src/components/sidebar/HistoryPanel.tsx

import React, { useEffect, useState } from 'react';
import {
  History,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  X,
} from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { WorkflowRun, NodeResult } from '@/types';

function formatDuration(start: string, end?: string) {
  if (!end) return '...';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />;
  if (status === 'failed') return <XCircle size={13} style={{ color: 'var(--error)' }} />;
  if (status === 'running') return <Loader2 size={13} className="animate-spin" style={{ color: 'var(--running)' }} />;
  return <Clock size={13} style={{ color: 'var(--text-muted)' }} />;
}

function NodeResultRow({ result }: { result: NodeResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="ml-3 border-l pl-3" style={{ borderColor: 'var(--border-subtle)' }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1.5 w-full py-1 text-left"
      >
        {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <StatusIcon status={result.status} />
        <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
          {result.nodeLabel}
        </span>
        {result.executionTimeMs !== undefined && (
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {result.executionTimeMs < 1000
              ? `${result.executionTimeMs}ms`
              : `${(result.executionTimeMs / 1000).toFixed(1)}s`}
          </span>
        )}
      </button>

      {expanded && (
        <div className="pb-2 pl-4 flex flex-col gap-1">
          {result.output !== undefined && (
            <div>
              <div className="nf-label mb-0.5">Output</div>
              <div
                className="text-[11px] rounded p-1.5 break-all"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  maxHeight: 80,
                  overflow: 'auto',
                }}
              >
                {typeof result.output === 'string'
                  ? result.output.slice(0, 300) + (result.output.length > 300 ? '...' : '')
                  : JSON.stringify(result.output)}
              </div>
            </div>
          )}
          {result.error && (
            <div>
              <div className="nf-label mb-0.5" style={{ color: 'var(--error)' }}>Error</div>
              <div
                className="text-[11px] rounded p-1.5"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}
              >
                {result.error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunEntry({ run, index }: { run: WorkflowRun; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left"
      >
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <StatusIcon status={run.status} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            Run #{index + 1}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {formatTime(run.startedAt)} · {run.runType} ·{' '}
            {formatDuration(run.startedAt, run.completedAt)}
          </div>
        </div>
        <span
          className="nf-badge text-[9px]"
          style={{
            background:
              run.status === 'success'
                ? 'rgba(34,197,94,0.15)'
                : run.status === 'failed'
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(168,85,247,0.15)',
            color:
              run.status === 'success'
                ? 'var(--success)'
                : run.status === 'failed'
                ? 'var(--error)'
                : 'var(--running)',
          }}
        >
          {run.status}
        </span>
      </button>

      {expanded && run.nodeResults?.length > 0 && (
        <div
          className="px-2 pb-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="pt-2 flex flex-col gap-0.5">
            {(run.nodeResults as NodeResult[]).map((result) => (
              <NodeResultRow key={result.nodeId} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryPanel() {
  const { workflowId, runHistory, setRunHistory, historyPanelOpen, setHistoryPanelOpen, activeRunId } =
    useWorkflowStore();

  useEffect(() => {
    if (!workflowId) return;
    fetch(`/api/history?workflowId=${workflowId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.runs) setRunHistory(d.runs);
      });
  }, [workflowId, setRunHistory]);

  if (!historyPanelOpen) return null;

  return (
    <div className="nf-history-panel flex-shrink-0" style={{ width: 280 }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <History size={14} style={{ color: 'var(--accent-purple)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            RUN HISTORY
          </span>
        </div>
        <button
          onClick={() => setHistoryPanelOpen(false)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Runs list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {runHistory.length === 0 ? (
          <div className="text-center py-10">
            <History size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No runs yet. Hit Run to start.
            </p>
          </div>
        ) : (
          runHistory.map((run, i) => (
            <RunEntry key={run.id} run={run} index={runHistory.length - 1 - i} />
          ))
        )}
      </div>
    </div>
  );
}
