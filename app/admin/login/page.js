'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// TEMPORARY: Auth imports commented out
// import { signIn, getCurrentUser } from '../../../lib/auth-utils';
import LoginForm from '../../../components/admin/LoginForm';
import AuthContainer from '../../../components/admin/AuthContainer';

export default function AdminLogin() {
  const router = useRouter();

  useEffect(() => {
    // TEMPORARY: Skip redirect check since auth is bypassed
    // Original code (commented out for now):
    // const user = getCurrentUser();
    // if (user) {
    //   router.push('/admin/dashboard');
    // }
  }, [router]);

  const handleLogin = async (email, password) => {
    // TEMPORARY: Bypass authentication - just redirect to dashboard
    console.log('Bypassing auth, redirecting to dashboard...');
    window.location.href = '/admin/dashboard';
  };

  return (
    <AuthContainer>
      <LoginForm onLogin={handleLogin} />
    </AuthContainer>
  );
}

