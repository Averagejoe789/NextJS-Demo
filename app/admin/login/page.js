'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signInWithGoogle, onAuthChange } from '../../../lib/auth-utils';
import LoginForm from '../../../components/admin/LoginForm';
import AuthContainer from '../../../components/admin/AuthContainer';

export default function AdminLogin() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        router.push('/admin/setup');
      }
    });
    return () => unsubscribe?.();
  }, [router]);

  const handleLogin = async (email, password) => {
    const result = await signIn(email, password);
    if (result.success) {
      router.push('/admin/setup');
    } else {
      throw new Error(result.error || 'Failed to sign in');
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      router.push('/admin/setup');
    } else {
      throw new Error(result.error || 'Google sign-in failed');
    }
  };

  return (
    <AuthContainer>
      <LoginForm onLogin={handleLogin} onGoogleSignIn={handleGoogleSignIn} />
    </AuthContainer>
  );
}

