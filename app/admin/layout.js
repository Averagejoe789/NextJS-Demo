'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthChange } from '../../lib/auth-utils';
import { db } from '../../lib/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurantStatus, setRestaurantStatus] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Routes that don't require auth layout or approved status (login, signup, setup, pending, rejected)
  const publicRoutes = ['/admin/login', '/admin/signup', '/admin/setup', '/admin/pending', '/admin/rejected'];
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
    // Public routes (login, signup, setup) render without waiting for auth
    if (isPublicRoute) {
      setLoading(false);
      setUser(null);
      return;
    }

    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        router.push('/admin/login');
        return;
      }
      if (!isPublicRoute) {
        try {
          const restaurantRef = doc(db, 'restaurants', currentUser.uid);
          const snap = await getDoc(restaurantRef);
          const status = snap.exists() ? (snap.data().status || 'approved') : 'approved';
          setRestaurantStatus(status);
          const isApprovalsPage = pathname === '/admin/approvals';
          if (status === 'pending' && !isApprovalsPage) router.replace('/admin/pending');
          else if (status === 'rejected' && !isApprovalsPage) router.replace('/admin/rejected');
        } catch (err) {
          console.error('Error checking restaurant status:', err);
          setRestaurantStatus('approved');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe?.();
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
    <div style={styles.container} className={!sidebarOpen && isDesktop ? 'sidebar-closed' : ''}>
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main style={{
        ...styles.main,
        marginLeft: sidebarOpen && isDesktop ? '260px' : '0',
      }}>
        {/* Mobile header with hamburger button */}
        <header 
          style={{
            ...styles.mobileHeader,
            left: sidebarOpen && isDesktop ? '260px' : '0',
          }} 
          className="mobile-header"
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.mobileMenuButton}
            className="mobile-menu-button"
            aria-label="Toggle menu"
          >
            <span style={styles.hamburgerIcon}>☰</span>
          </button>
        </header>
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
  mobileHeader: {
    display: 'block',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  mobileMenuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 200ms ease-in-out',
  },
  hamburgerIcon: {
    fontSize: '20px',
    color: '#374151',
  },
};

