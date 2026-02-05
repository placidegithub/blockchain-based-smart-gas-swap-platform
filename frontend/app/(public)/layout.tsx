import { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
