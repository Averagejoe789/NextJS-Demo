'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthChange } from '../../lib/auth-utils';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Routes that don't require authentication
  const publicRoutes = ['/admin/login', '/admin/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Handle responsive sidebar state
  useEffect(() => {
    let previousDesktop = false;
    
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      
      // Only update sidebar state if screen size category changed
      // This prevents overriding manual toggles
      if (desktop !== previousDesktop) {
        if (desktop) {
          setSidebarOpen(true);
        } else {
          setSidebarOpen(false);
        }
        previousDesktop = desktop;
      }
    };

    // Set initial state based on screen size
    const initialDesktop = window.innerWidth >= 768;
    setIsDesktop(initialDesktop);
    previousDesktop = initialDesktop;
    if (initialDesktop) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main style={{
        ...styles.main,
        marginLeft: sidebarOpen && isDesktop ? '260px' : '0',
      }}>
        {/* Mobile hamburger button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={styles.mobileMenuButton}
          className="mobile-menu-button"
          aria-label="Toggle menu"
        >
          <span style={styles.hamburgerIcon}>☰</span>
        </button>
        {children}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
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
    flex: 1,
    marginLeft: '0', // Will be adjusted via CSS for desktop
    padding: '20px',
    transition: 'margin-left 300ms ease-in-out',
    width: '100%',
    maxWidth: '100%',
  },
  mobileMenuButton: {
    display: 'block', // Shown on mobile via CSS
    position: 'fixed',
    top: '16px',
    left: '16px',
    zIndex: 997,
    width: '44px',
    height: '44px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 200ms ease-in-out',
  },
  hamburgerIcon: {
    fontSize: '20px',
    color: '#374151',
  },
};

