'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function LinkedInLoginButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      className="linkedin-login-button"
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn('linkedin', { callbackUrl: '/' }).catch(() => setPending(false));
      }}
    >
      {pending ? 'Connecting...' : 'Continue with LinkedIn'}
    </button>
  );
}
