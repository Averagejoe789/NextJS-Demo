'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logOut } from '../../lib/auth-utils';
import { useRouter } from 'next/navigation';

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/restaurant', label: 'My Restaurant', icon: '🏢' },
    { href: '/admin/menu', label: 'Menu', icon: '📋' },
    { href: '/admin/tables', label: 'Tables', icon: '🪑' },
    { href: '/admin/orders', label: 'Orders', icon: '📦' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          style={styles.overlay}
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        style={{
          ...styles.sidebar,
          ...(sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed)
        }}
        className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
      >
        {/* Sidebar Header */}
        <div style={styles.sidebarHeader}>
          <Link href="/admin/dashboard" style={styles.logo}>
            <span style={styles.logoIcon}>🍽️</span>
            <span style={styles.logoText}>Restaurant Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.toggleButton}
            className="sidebar-toggle-button"
            aria-label="Toggle sidebar"
          >
            <span style={styles.toggleIcon}>{sidebarOpen ? '←' : '☰'}</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            style={styles.closeButton}
            className="sidebar-close-button"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {})
                }}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span style={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div style={styles.sidebarFooter}>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            className="logout-button"
          >
            <span style={styles.logoutIcon}>🚪</span>
            <span style={styles.logoutText}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

const styles = {
  overlay: {
    display: 'none', // Shown on mobile via CSS
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  sidebar: {
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 300ms ease-in-out',
    zIndex: 999,
    boxShadow: '1px 0 3px rgba(0, 0, 0, 0.05)',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  sidebarOpen: {
    width: '260px',
    transform: 'translateX(0)',
  },
  sidebarClosed: {
    width: '260px',
    transform: 'translateX(-100%)',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 1.25rem',
    borderBottom: '1px solid #e5e7eb',
    minHeight: '64px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    textDecoration: 'none',
    color: '#111827',
  },
  logoIcon: {
    fontSize: '1.5rem',
  },
  logoText: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#111827',
  },
  toggleButton: {
    display: 'flex', // Show on desktop
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '0.5rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '1.125rem',
    transition: 'all 150ms ease-in-out',
    flexShrink: 0,
  },
  toggleIcon: {
    lineHeight: 1,
  },
  closeButton: {
    display: 'none', // Hidden on desktop, shown on mobile via CSS
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '0.5rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '1.125rem',
    transition: 'all 150ms ease-in-out',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nav: {
    flex: 1,
    padding: '1rem 0.75rem',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    marginBottom: '0.5rem',
    borderRadius: '0.75rem',
    textDecoration: 'none',
    color: '#374151',
    fontSize: '0.9375rem',
    fontWeight: 500,
    transition: 'all 200ms ease-in-out',
    cursor: 'pointer',
  },
  navItemActive: {
    backgroundColor: '#e0f2fe',
    color: '#0284c7',
    fontWeight: 600,
  },
  navIcon: {
    fontSize: '1.25rem',
    width: '24px',
    textAlign: 'center',
  },
  navLabel: {
    flex: 1,
  },
  sidebarFooter: {
    padding: '1rem 0.75rem',
    borderTop: '1px solid #e5e7eb',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '0.9375rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 200ms ease-in-out',
  },
  logoutIcon: {
    fontSize: '1.25rem',
  },
  logoutText: {
    flex: 1,
    textAlign: 'left',
  },
};

