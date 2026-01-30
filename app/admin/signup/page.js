'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signInWithGoogle, onAuthChange } from '../../../lib/auth-utils';
import SignupForm from '../../../components/admin/SignupForm';
import AuthContainer from '../../../components/admin/AuthContainer';

export default function AdminSignup() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        router.push('/admin/setup');
      }
    });
    return () => unsubscribe?.();
  }, [router]);

  const handleSignup = async (email, password) => {
    const result = await signUp(email, password);

    if (result.success) {
      router.push('/admin/setup');
    } else {
      throw new Error(result.error || 'Failed to create account');
    }
  };

  const handleGoogleSignUp = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      router.push('/admin/setup');
    } else {
      throw new Error(result.error || 'Google sign-up failed');
    }
  };

  return (
    <AuthContainer>
      <SignupForm onSignup={handleSignup} onGoogleSignUp={handleGoogleSignUp} />
    </AuthContainer>
  );
}

