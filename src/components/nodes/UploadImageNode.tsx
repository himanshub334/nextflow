'use client';
// src/components/nodes/UploadImageNode.tsx

import React, { useRef, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image, Upload, Loader2 } from 'lucide-react';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { UploadImageNodeData } from '@/types';

export function UploadImageNode({ id, data }: NodeProps<UploadImageNodeData>) {
  const { updateNodeData } = useWorkflowStore();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const paramsObj = {
        auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY },
        steps: {
          store: {
            use: ':original',
            robot: '/file/compress',
            result: true,
          },
        },
      };
      const params = JSON.stringify(paramsObj);
      formData.append('params', params);

      const res = await fetch('https://api2.transloadit.com/assemblies', {
        method: 'POST',
        body: formData,
      });

      const assembly = await res.json();

      // Poll for completion
      let status = assembly;
      while (status.ok === 'ASSEMBLY_EXECUTING') {
        await new Promise((r) => setTimeout(r, 1000));
        const poll = await fetch(
          `https://api2.transloadit.com/assemblies/${status.assembly_id}`
        );
        status = await poll.json();
      }

      const uploadedFile = status.uploads?.[0];
      if (uploadedFile?.url) {
        updateNodeData(id, {
          imageUrl: uploadedFile.url,
          fileName: file.name,
          output: uploadedFile.url,
        });
      }
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="group">
      <NodeWrapper
        id={id}
        label={data.label}
        icon={<Image size={12} />}
        color="#22c55e"
        bgColor="rgba(34,197,94,0.15)"
      >
        {/* Upload area */}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
          style={{
            border: '1px dashed var(--border-default)',
            padding: '14px 8px',
            minHeight: 72,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = 'var(--border-default)')
          }
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" style={{ color: '#22c55e' }} />
          ) : data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt="preview"
              className="w-full rounded object-cover"
              style={{ maxHeight: 100 }}
            />
          ) : (
            <>
              <Upload size={16} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Click to upload image
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                jpg, jpeg, png, webp, gif
              </span>
            </>
          )}
        </div>

        {data.fileName && (
          <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
            {data.fileName}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </NodeWrapper>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        title="image url output"
        style={{ top: '50%' }}
      />
    </div>
  );
}
