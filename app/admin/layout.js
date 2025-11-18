'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthChange } from '../../lib/auth-utils';
import AdminNavbar from '../../components/admin/AdminNavbar';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Routes that don't require authentication
  const publicRoutes = ['/admin/login', '/admin/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // TEMPORARY: Bypass authentication check
    // For public routes, don't wait for auth - render immediately
    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    // TEMPORARY: Skip auth check, just set user to a mock object
    setUser({ uid: 'temp-user', email: 'test@example.com' });
    setLoading(false);

    // Original auth check (commented out for now)
    // const unsubscribe = onAuthChange((currentUser) => {
    //   setUser(currentUser);
    //   setLoading(false);
    //   
    //   // Redirect to login if not authenticated
    //   if (!currentUser) {
    //     router.push('/admin/login');
    //   }
    // });

    // return () => unsubscribe();
  }, [router, isPublicRoute]);

  // Allow public routes (login/signup) to render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading for protected routes
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  // Protected routes require authentication
  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div style={styles.container}>
      <AdminNavbar />
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
  loadingText: {
    fontSize: '18px',
    color: '#666',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
};

