'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, getCurrentUser } from '../../../lib/auth-utils';
import SignupForm from '../../../components/admin/SignupForm';
import AuthContainer from '../../../components/admin/AuthContainer';

export default function AdminSignup() {
  const router = useRouter();

  useEffect(() => {
    // Redirect if already logged in
    const user = getCurrentUser();
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const handleSignup = async (email, password) => {
    const result = await signUp(email, password);
    
    if (result.success) {
      router.push('/admin/dashboard');
    } else {
      throw new Error(result.error || 'Failed to create account');
    }
  };

  return (
    <AuthContainer>
      <SignupForm onSignup={handleSignup} />
    </AuthContainer>
  );
}

