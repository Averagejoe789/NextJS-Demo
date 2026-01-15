'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logOut } from '../../lib/auth-utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState({
    restaurant: true, // Restaurant is expanded by default
    manage: false,
  });

  const handleLogout = async () => {
    await logOut();
    router.push('/admin/login');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isRestaurantActive = pathname.startsWith('/admin/manage') || 
                            pathname.startsWith('/admin/menu') || 
                            pathname.startsWith('/admin/tables');
  
  const isManageActive = pathname.startsWith('/admin/manage') || 
                        pathname.startsWith('/admin/design') || 
                        pathname.startsWith('/admin/marketing');

  const restaurantSubItems = [
    { href: '/admin/menu', label: 'Menu Items' },
    { href: '/admin/mealtimes', label: 'Mealtimes' },
    { href: '/admin/inventory', label: 'Inventory' },
    { href: '/admin/tables', label: 'Dining Areas' },
  ];

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '⏱' }, // Speedometer/dashboard icon
    { href: '/admin/orders', label: 'Orders', icon: '🧾' }, // Receipt icon
    { href: '/admin/reservations', label: 'Reservations', icon: '📅' }, // Calendar icon
    { href: '/admin/customers', label: 'Customers', icon: '👤' }, // Person icon
  ];

  const manageSubItems = [
    { href: '/admin/manage', label: 'Restaurant Settings' },
    { href: '/admin/design', label: 'Design' },
    { href: '/admin/marketing', label: 'Marketing' },
  ];

  const expandableItems = [
    { 
      key: 'restaurant', 
      label: 'Restaurant', 
      icon: '🍴', // Fork and knife
      subItems: restaurantSubItems 
    },
    { 
      key: 'manage', 
      label: 'Manage', 
      icon: '⚙️', // Gear
      subItems: manageSubItems 
    },
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
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>
            <div style={styles.logoFlame}>🔥</div>
            <div style={styles.logoFork}>🍴</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {/* Primary Menu Items */}
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

          {/* Expandable Restaurant Section */}
          <div style={styles.expandableSection}>
            <button
              onClick={() => toggleSection('restaurant')}
              style={{
                ...styles.expandableItem,
                ...(isRestaurantActive ? styles.expandableItemActive : {})
              }}
            >
              <span style={styles.navIcon}>🍴</span>
              <span style={styles.navLabel}>Restaurant</span>
              <span style={styles.chevron}>
                {expandedSections.restaurant ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.restaurant && (
              <div style={styles.subMenu}>
                {restaurantSubItems.map((subItem) => {
                  const isSubActive = pathname === subItem.href || 
                                     (subItem.href === '/admin/tables' && pathname.startsWith('/admin/tables'));
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      style={{
                        ...styles.subMenuItem,
                        ...(isSubActive ? styles.subMenuItemActive : {})
                      }}
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      {subItem.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Other Expandable Items */}
          {expandableItems.filter(item => item.key !== 'restaurant').map((item) => {
            // If item has href, render as a link instead of expandable
            if (item.href) {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  style={{
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {})
                  }}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  <span style={styles.navLabel}>{item.label}</span>
                </Link>
              );
            }
            
            // Otherwise render as expandable
            const isActive = item.key === 'manage' ? isManageActive : false;
            return (
              <div key={item.key} style={styles.expandableSection}>
                <button
                  onClick={() => toggleSection(item.key)}
                  style={{
                    ...styles.expandableItem,
                    ...(isActive ? styles.expandableItemActive : {})
                  }}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  <span style={styles.navLabel}>{item.label}</span>
                  <span style={styles.chevron}>
                    {expandedSections[item.key] ? '▼' : '▶'}
                  </span>
                </button>
                {expandedSections[item.key] && item.subItems && item.subItems.length > 0 && (
                  <div style={styles.subMenu}>
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href || 
                                        (subItem.href === '/admin/manage' && pathname.startsWith('/admin/manage')) ||
                                        (subItem.href === '/admin/design' && pathname.startsWith('/admin/design')) ||
                                        (subItem.href === '/admin/marketing' && pathname.startsWith('/admin/marketing'));
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          style={{
                            ...styles.subMenuItem,
                            ...(isSubActive ? styles.subMenuItemActive : {})
                          }}
                          onClick={() => {
                            if (window.innerWidth < 768) {
                              setSidebarOpen(false);
                            }
                          }}
                        >
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

const styles = {
  overlay: {
    display: 'none',
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
  logoContainer: {
    padding: '1.5rem 1rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    minHeight: '80px',
  },
  logo: {
    position: 'relative',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFlame: {
    fontSize: '2.5rem',
    position: 'absolute',
    filter: 'hue-rotate(0deg) saturate(1.5)',
  },
  logoFork: {
    fontSize: '1.25rem',
    position: 'absolute',
    zIndex: 1,
    filter: 'brightness(0) invert(1) drop-shadow(0 0 1px rgba(0,0,0,0.3))',
    transform: 'translateY(-2px)',
  },
  nav: {
    flex: 1,
    padding: '0.75rem 0.5rem',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    marginBottom: '0.25rem',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    color: '#374151',
    fontSize: '0.9375rem',
    fontWeight: 500,
    transition: 'all 200ms ease-in-out',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  },
  navItemActive: {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    fontWeight: 600,
  },
  navIcon: {
    fontSize: '1.125rem',
    width: '20px',
    textAlign: 'center',
    flexShrink: 0,
  },
  navLabel: {
    flex: 1,
  },
  expandableSection: {
    marginBottom: '0.25rem',
  },
  expandableItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    color: '#374151',
    fontSize: '0.9375rem',
    fontWeight: 500,
    transition: 'all 200ms ease-in-out',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  },
  expandableItemActive: {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    fontWeight: 600,
  },
  chevron: {
    fontSize: '0.75rem',
    color: '#6b7280',
    flexShrink: 0,
    width: '16px',
    textAlign: 'center',
  },
  subMenu: {
    paddingLeft: '2.5rem',
    paddingTop: '0.25rem',
    paddingBottom: '0.25rem',
  },
  subMenuItem: {
    display: 'block',
    padding: '0.625rem 1rem',
    marginBottom: '0.125rem',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: 400,
    transition: 'all 200ms ease-in-out',
  },
  subMenuItemActive: {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    fontWeight: 500,
  },
};
