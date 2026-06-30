'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const MESSAGES: Record<string, { title: string; desc: string }> = {
  OAuthSignin:        { title: 'Google sign-in failed', desc: 'Could not start the Google sign-in flow. Check that your Google OAuth credentials are set correctly in .env.' },
  OAuthCallback:      { title: 'Google callback error', desc: 'Google returned an error. Make sure your redirect URI is added in Google Console.' },
  OAuthCreateAccount: { title: 'Account creation failed', desc: 'Could not create your account. Please try again.' },
  EmailCreateAccount: { title: 'Email sign-in failed', desc: 'Could not create your account with that email. Please try again.' },
  Callback:           { title: 'Callback error', desc: 'Something went wrong during sign-in. Please try again.' },
  EmailSignin:        { title: 'Email not sent', desc: 'Could not send the magic link. The email provider may not be configured yet.' },
  CredentialsSignin:  { title: 'Invalid credentials', desc: 'The email or password you entered is incorrect.' },
  default:            { title: 'Sign-in error', desc: 'An unexpected error occurred. Please try again.' },
};

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get('error') ?? 'default';
  const msg = MESSAGES[error] ?? MESSAGES.default;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-5">⚠️</div>
        <h1 className="text-2xl font-medium mb-2">{msg.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">{msg.desc}</p>
        <div className="flex flex-col gap-3">
          <Link href="/auth/signin"
            className="bg-brand-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
            Try again
          </Link>
          <Link href="/"
            className="text-sm text-gray-400 hover:text-brand-500 transition-colors">
            ← Back to countdowns
          </Link>
        </div>
        <details className="mt-8 text-left border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <summary className="text-xs text-gray-400 cursor-pointer">Debug info</summary>
          <p className="text-xs text-gray-400 mt-2 font-mono">error code: {error}</p>
        </details>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
