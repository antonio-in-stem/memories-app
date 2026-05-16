'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton({ className = 'nav-ghost' }: { className?: string }) {
  return (
    <button className={className} type="button" onClick={() => void signOut({ callbackUrl: '/' })}>
      Sign out
    </button>
  );
}
