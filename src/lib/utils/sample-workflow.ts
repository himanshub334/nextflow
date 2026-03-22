// src/lib/utils/sample-workflow.ts
// Pre-built "Product Marketing Kit Generator" sample workflow
// Demonstrates all 6 node types + parallel execution + convergence

import { AppNode, AppEdge } from '@/types';

export const SAMPLE_WORKFLOW_NODES: AppNode[] = [
  // ── Branch A: Image Processing ──────────────────────────────────────────────
  {
    id: 'upload-image-1',
    type: 'uploadImage',
    position: { x: 80, y: 80 },
    data: { type: 'uploadImage', label: 'Product Photo' },
  },
  {
    id: 'crop-image-1',
    type: 'cropImage',
    position: { x: 420, y: 80 },
    data: {
      type: 'cropImage',
      label: 'Crop Product',
      xPercent: 10,
      yPercent: 10,
      widthPercent: 80,
      heightPercent: 80,
    },
  },
  {
    id: 'text-system-1',
    type: 'text',
    position: { x: 80, y: 320 },
    data: {
      type: 'text',
      label: 'System Prompt',
      text: 'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.',
    },
  },
  {
    id: 'text-details-1',
    type: 'text',
    position: { x: 80, y: 500 },
    data: {
      type: 'text',
      label: 'Product Details',
      text: 'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.',
    },
  },
  {
    id: 'llm-1',
    type: 'llm',
    position: { x: 760, y: 200 },
    data: {
      type: 'llm',
      label: 'Product Description LLM',
      model: 'gemini-1.5-flash',
    },
  },

  // ── Branch B: Video Frame Extraction ────────────────────────────────────────
  {
    id: 'upload-video-1',
    type: 'uploadVideo',
    position: { x: 80, y: 700 },
    data: { type: 'uploadVideo', label: 'Product Demo Video' },
  },
  {
    id: 'extract-frame-1',
    type: 'extractFrame',
    position: { x: 420, y: 700 },
    data: {
      type: 'extractFrame',
      label: 'Extract Mid Frame',
      timestamp: '50%',
    },
  },

  // ── Convergence: Final Marketing Summary ─────────────────────────────────────
  {
    id: 'text-system-2',
    type: 'text',
    position: { x: 760, y: 600 },
    data: {
      type: 'text',
      label: 'Social Media Prompt',
      text: 'You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.',
    },
  },
  {
    id: 'llm-2',
    type: 'llm',
    position: { x: 1100, y: 480 },
    data: {
      type: 'llm',
      label: 'Marketing Summary LLM',
      model: 'gemini-1.5-pro',
    },
  },
];

export const SAMPLE_WORKFLOW_EDGES: AppEdge[] = [
  // Branch A connections
  {
    id: 'e1',
    source: 'upload-image-1',
    sourceHandle: 'output',
    target: 'crop-image-1',
    targetHandle: 'image_url',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
  {
    id: 'e2',
    source: 'crop-image-1',
    sourceHandle: 'output',
    target: 'llm-1',
    targetHandle: 'images',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
  {
    id: 'e3',
    source: 'text-system-1',
    sourceHandle: 'output',
    target: 'llm-1',
    targetHandle: 'system_prompt',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
  {
    id: 'e4',
    source: 'text-details-1',
    sourceHandle: 'output',
    target: 'llm-1',
    targetHandle: 'user_message',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },

  // Branch B connections
  {
    id: 'e5',
    source: 'upload-video-1',
    sourceHandle: 'output',
    target: 'extract-frame-1',
    targetHandle: 'video_url',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },

  // Convergence connections
  {
    id: 'e6',
    source: 'llm-1',
    sourceHandle: 'output',
    target: 'llm-2',
    targetHandle: 'user_message',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
  {
    id: 'e7',
    source: 'crop-image-1',
    sourceHandle: 'output',
    target: 'llm-2',
    targetHandle: 'images',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
  {
    id: 'e8',
    source: 'extract-frame-1',
    sourceHandle: 'output',
    target: 'llm-2',
    targetHandle: 'images',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
  {
    id: 'e9',
    source: 'text-system-2',
    sourceHandle: 'output',
    target: 'llm-2',
    targetHandle: 'system_prompt',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
  },
];
