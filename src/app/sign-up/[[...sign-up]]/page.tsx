// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            NextFlow
          </h1>
          <p className="text-slate-400 text-sm mt-1">LLM Workflow Builder</p>
        </div>
        <SignUp afterSignUpUrl="/workflow" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
