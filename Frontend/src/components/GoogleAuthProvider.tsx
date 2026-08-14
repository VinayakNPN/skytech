'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

/**
 * Client-side wrapper for Google OAuth provider.
 * Kept in a separate component so layout.tsx can remain a Server Component.
 */
export default function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
