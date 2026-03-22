import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'NextFlow — LLM Workflow Builder',
  description: 'Visual LLM workflow builder powered by Google Gemini',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="bg-[#0a0a0f] text-slate-100 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}