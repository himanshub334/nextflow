// src/app/workflow/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { WorkflowEditor } from '@/components/canvas/WorkflowEditor';

export default async function WorkflowPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return <WorkflowEditor />;
}
