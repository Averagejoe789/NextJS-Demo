'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logOut } from '../../lib/auth-utils';

export default function AdminNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/admin/login');
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContent}>
        <Link href="/admin/dashboard" style={styles.logo}>
          🍽️ Restaurant Admin
        </Link>
        <div style={styles.navLinks}>
          <Link href="/admin/dashboard" style={styles.navLink}>
            Dashboard
          </Link>
          <Link href="/admin/restaurant" style={styles.navLink}>
            My Restaurant
          </Link>
          <Link href="/admin/menu" style={styles.navLink}>
            Menu
          </Link>
          <Link href="/admin/tables" style={styles.navLink}>
            Tables
          </Link>
          <Link href="/admin/orders" style={styles.navLink}>
            Orders
          </Link>
          <button 
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '0 20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  navLink: {
    color: '#333',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

