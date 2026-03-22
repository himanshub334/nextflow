// trigger/tasks.ts
import { task } from '@trigger.dev/sdk/v3';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// ─── LLM Task ─────────────────────────────────────────────────────────────────

const LLMTaskPayload = z.object({
  model: z.string(),
  systemPrompt: z.string().optional(),
  userMessage: z.string(),
  imageUrls: z.array(z.string()).optional(),
});

export const runLLMTask = task({
  id: 'run-llm',
  retry: { maxAttempts: 2 },
  run: async (payload: z.infer<typeof LLMTaskPayload>) => {
    const { model, systemPrompt, userMessage, imageUrls = [] } = LLMTaskPayload.parse(payload);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const geminiModel = genAI.getGenerativeModel({ model });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Fetch and encode images
    for (const url of imageUrls) {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      parts.push({ inlineData: { mimeType, data: base64 } });
    }

    parts.push({ text: userMessage });

    const generationConfig = systemPrompt
      ? { systemInstruction: systemPrompt }
      : {};

    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts }],
      ...generationConfig,
    });

    const text = result.response.text();
    return { output: text };
  },
});

// ─── Crop Image Task ──────────────────────────────────────────────────────────

const CropImagePayload = z.object({
  imageUrl: z.string().url(),
  xPercent: z.number().min(0).max(100).default(0),
  yPercent: z.number().min(0).max(100).default(0),
  widthPercent: z.number().min(1).max(100).default(100),
  heightPercent: z.number().min(1).max(100).default(100),
  transloaditKey: z.string(),
  transloaditSecret: z.string(),
});

export const cropImageTask = task({
  id: 'crop-image',
  retry: { maxAttempts: 2 },
  run: async (payload: z.infer<typeof CropImagePayload>) => {
    const { imageUrl, xPercent, yPercent, widthPercent, heightPercent, transloaditKey, transloaditSecret } =
      CropImagePayload.parse(payload);

    // Fetch image to get dimensions first
    const imgResponse = await fetch(imageUrl);
    const imgBuffer = await imgResponse.arrayBuffer();

    // Use Transloadit to crop
    const assembly = await createTransloaditAssembly({
      transloaditKey,
      transloaditSecret,
      steps: {
        imported: {
          robot: '/http/import',
          url: imageUrl,
        },
        cropped: {
          use: 'imported',
          robot: '/image/resize',
          crop_x: `${xPercent}%`,
          crop_y: `${yPercent}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          resize_strategy: 'crop',
          imagemagick_stack: 'v2.0.7',
        },
        exported: {
          use: 'cropped',
          robot: '/s3/store',
          // Alternatively use Transloadit's own storage
          result: true,
        },
      },
    });

    const result = assembly.results?.cropped?.[0];
    if (!result?.url) {
      throw new Error('Crop operation failed — no output URL');
    }

    return { output: result.url };
  },
});

// ─── Extract Frame Task ───────────────────────────────────────────────────────

const ExtractFramePayload = z.object({
  videoUrl: z.string().url(),
  timestamp: z.string().default('0'),
  transloaditKey: z.string(),
  transloaditSecret: z.string(),
});

export const extractFrameTask = task({
  id: 'extract-frame',
  retry: { maxAttempts: 2 },
  run: async (payload: z.infer<typeof ExtractFramePayload>) => {
    const { videoUrl, timestamp, transloaditKey, transloaditSecret } =
      ExtractFramePayload.parse(payload);

    // Parse timestamp — supports "50%" or seconds
    const ffmpegOffset = timestamp.endsWith('%') ? timestamp : `${timestamp}s`;

    const assembly = await createTransloaditAssembly({
      transloaditKey,
      transloaditSecret,
      steps: {
        imported: {
          robot: '/http/import',
          url: videoUrl,
        },
        frame: {
          use: 'imported',
          robot: '/video/thumbs',
          count: 1,
          offsets: [ffmpegOffset],
          format: 'jpg',
          width: 1280,
          height: 720,
          resize_strategy: 'fit',
        },
      },
    });

    const result = assembly.results?.frame?.[0];
    if (!result?.url) {
      throw new Error('Frame extraction failed — no output URL');
    }

    return { output: result.url };
  },
});

// ─── Transloadit Helper ───────────────────────────────────────────────────────

async function createTransloaditAssembly({
  transloaditKey,
  transloaditSecret,
  steps,
}: {
  transloaditKey: string;
  transloaditSecret: string;
  steps: Record<string, unknown>;
}): Promise<{ results?: Record<string, Array<{ url: string }>> }> {
  const params = JSON.stringify({
    auth: { key: transloaditKey },
    steps,
  });

  // Create HMAC signature
  const crypto = await import('crypto');
  const signature = crypto
    .createHmac('sha384', transloaditSecret)
    .update(Buffer.from(params, 'utf-8'))
    .digest('hex');

  const formData = new FormData();
  formData.append('params', params);
  formData.append('signature', `sha384:${signature}`);

  const response = await fetch('https://api2.transloadit.com/assemblies', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transloadit error: ${response.statusText}`);
  }

  const assembly = await response.json();

  // Poll until complete
  let status = assembly;
  while (status.ok === 'ASSEMBLY_EXECUTING' || status.ok === 'REQUEST_ABORTED') {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(`https://api2.transloadit.com/assemblies/${status.assembly_id}`, {
      headers: { Authorization: `Bearer ${transloaditKey}` },
    });
    status = await poll.json();
  }

  if (status.ok !== 'ASSEMBLY_COMPLETED') {
    throw new Error(`Assembly failed: ${status.error || status.message}`);
  }

  return status;
}
