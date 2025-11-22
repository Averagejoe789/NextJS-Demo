import Link from 'next/link';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>🍽️ Restaurant QR Ordering System</h1>
        <p style={styles.subtitle}>
          Contactless ordering through QR codes with AI-powered assistance
        </p>

        <div style={styles.cards}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>For Restaurant Owners</h2>
            <p style={styles.cardDescription}>
              Manage your restaurant, upload menus, create tables, and generate QR codes for customers.
            </p>
            <Link href="/admin/signup" style={styles.button}>
              Get Started →
            </Link>
            <p style={styles.cardLink}>
              Already have an account? <Link href="/admin/login" style={styles.link}>Login</Link>
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>For Customers</h2>
            <p style={styles.cardDescription}>
              Scan the QR code at your table to browse the menu, chat with our AI assistant, and place orders.
            </p>
            <p style={styles.cardNote}>
              💡 Ask your server for the QR code at your table
            </p>
          </div>
        </div>

        <div style={styles.features}>
          <h2 style={styles.featuresTitle}>Features</h2>
          <div style={styles.featuresGrid}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>📱</div>
              <h3 style={styles.featureTitle}>QR Code Ordering</h3>
              <p style={styles.featureDescription}>Scan a QR code to instantly access the menu and order</p>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>🤖</div>
              <h3 style={styles.featureTitle}>AI Assistant</h3>
              <p style={styles.featureDescription}>Chat with our AI to discover dishes and place orders naturally</p>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>⚡</div>
              <h3 style={styles.featureTitle}>Real-time Updates</h3>
              <p style={styles.featureDescription}>Track your order status in real-time</p>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>🎯</div>
              <h3 style={styles.featureTitle}>Easy Management</h3>
              <p style={styles.featureDescription}>Restaurant owners can easily manage menus and orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '40px 20px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: '16px',
  },
  subtitle: {
    fontSize: '20px',
    textAlign: 'center',
    color: '#666',
    marginBottom: '60px',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px',
    marginBottom: '60px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333',
  },
  cardDescription: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  cardNote: {
    fontSize: '14px',
    color: '#999',
    marginTop: '16px',
    fontStyle: 'italic',
  },
  cardLink: {
    fontSize: '14px',
    color: '#666',
    marginTop: '16px',
  },
  button: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '500',
  },
  features: {
    marginTop: '60px',
  },
  featuresTitle: {
    fontSize: '32px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '40px',
    color: '#333',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
  },
  feature: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
  },
  featureDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
  },
};
