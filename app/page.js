import Link from 'next/link';
import { designSystem } from '../lib/design-system';

export default function Home() {
  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeText}>✨ Modern Restaurant Experience</span>
          </div>
          <h1 style={styles.heroTitle}>
            Order Smarter,<br />
            <span style={styles.heroTitleAccent}>Dine Better</span>
          </h1>
          <p style={styles.heroSubtitle}>
            The future of restaurant dining is here. Order instantly with QR codes, 
            chat with our AI assistant, and enjoy seamless service.
          </p>
          <div style={styles.heroButtons}>
            <Link href="/admin/signup" style={styles.primaryButton}>
              Start Free Trial
              <span style={styles.buttonIcon}>→</span>
            </Link>
            <Link href="/admin/login" style={styles.secondaryButton}>
              Sign In
            </Link>
          </div>
        </div>
        <div style={styles.heroVisual}>
          <div style={styles.heroCard}>
            <div style={styles.heroCardHeader}>
              <div style={styles.heroCardDots}>
                <span style={styles.heroCardDot}></span>
                <span style={styles.heroCardDot}></span>
                <span style={styles.heroCardDot}></span>
              </div>
            </div>
            <div style={styles.heroCardContent}>
              <div style={styles.heroQRCode}>
                <div style={styles.qrGrid}>
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} style={styles.qrCell}></div>
                  ))}
                </div>
              </div>
              <p style={styles.heroCardText}>Scan & Order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={styles.featuresSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Everything You Need</h2>
          <p style={styles.sectionSubtitle}>
            Powerful features designed to enhance your dining experience
          </p>
        </div>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIconWrapper}>
              <div style={styles.featureIcon}>📱</div>
            </div>
            <h3 style={styles.featureTitle}>Instant Ordering</h3>
            <p style={styles.featureDescription}>
              Scan a QR code and instantly access the full menu. No waiting, no hassle.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIconWrapper}>
              <div style={styles.featureIcon}>🤖</div>
            </div>
            <h3 style={styles.featureTitle}>AI-Powered Assistant</h3>
            <p style={styles.featureDescription}>
              Chat naturally with our AI to discover dishes, get recommendations, and place orders.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIconWrapper}>
              <div style={styles.featureIcon}>⚡</div>
            </div>
            <h3 style={styles.featureTitle}>Real-Time Updates</h3>
            <p style={styles.featureDescription}>
              Track your order status in real-time. Know exactly when your food is ready.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIconWrapper}>
              <div style={styles.featureIcon}>📊</div>
            </div>
            <h3 style={styles.featureTitle}>Easy Management</h3>
            <p style={styles.featureDescription}>
              Restaurant owners get powerful tools to manage menus, orders, and tables effortlessly.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIconWrapper}>
              <div style={styles.featureIcon}>🔒</div>
            </div>
            <h3 style={styles.featureTitle}>Secure & Fast</h3>
            <p style={styles.featureDescription}>
              Built with security and performance in mind. Your data is safe and orders are processed instantly.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIconWrapper}>
              <div style={styles.featureIcon}>📱</div>
            </div>
            <h3 style={styles.featureTitle}>Mobile First</h3>
            <p style={styles.featureDescription}>
              Designed for mobile devices. Works seamlessly on any screen size.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Transform Your Restaurant?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of restaurants already using our platform to enhance customer experience.
          </p>
          <Link href="/admin/signup" style={styles.ctaButton}>
            Get Started Free
            <span style={styles.buttonIcon}>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: designSystem.colors.gray[50],
    overflowX: 'hidden',
  },
  
  // Hero Section
  hero: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '3rem',
    alignItems: 'center',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '5rem 1.5rem',
    minHeight: '85vh',
  },
  
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: designSystem.spacing[6],
  },
  
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${designSystem.spacing[2]} ${designSystem.spacing[4]}`,
    backgroundColor: designSystem.colors.primary[50],
    borderRadius: designSystem.borderRadius.full,
    width: 'fit-content',
    '@media (max-width: 968px)': {
      margin: '0 auto',
    },
  },
  
  heroBadgeText: {
    fontSize: designSystem.typography.fontSize.sm,
    fontWeight: designSystem.typography.fontWeight.medium,
    color: designSystem.colors.primary[600],
  },
  
  heroTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: designSystem.typography.fontWeight.bold,
    lineHeight: designSystem.typography.lineHeight.tight,
    color: designSystem.colors.text.primary,
    margin: 0,
  },
  
  heroTitleAccent: {
    background: `linear-gradient(135deg, ${designSystem.colors.primary[600]}, ${designSystem.colors.primary[400]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
    lineHeight: designSystem.typography.lineHeight.relaxed,
    color: designSystem.colors.text.secondary,
    maxWidth: '540px',
    '@media (max-width: 968px)': {
      maxWidth: '100%',
    },
  },
  
  heroButtons: {
    display: 'flex',
    gap: designSystem.spacing[4],
    flexWrap: 'wrap',
    '@media (max-width: 968px)': {
      justifyContent: 'center',
    },
  },
  
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: designSystem.spacing[2],
    padding: `${designSystem.spacing[4]} ${designSystem.spacing[8]}`,
    backgroundColor: designSystem.colors.primary[600],
    color: designSystem.colors.text.inverse,
    textDecoration: 'none',
    borderRadius: designSystem.borderRadius.lg,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    transition: 'all 200ms ease-in-out',
    boxShadow: designSystem.shadows.md,
    border: 'none',
    cursor: 'pointer',
  },
  
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${designSystem.spacing[4]} ${designSystem.spacing[8]}`,
    backgroundColor: 'transparent',
    color: designSystem.colors.text.primary,
    textDecoration: 'none',
    borderRadius: designSystem.borderRadius.lg,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    transition: 'all 200ms ease-in-out',
    border: `2px solid ${designSystem.colors.border}`,
    cursor: 'pointer',
  },
  
  buttonIcon: {
    fontSize: designSystem.typography.fontSize.lg,
    transition: 'transform 200ms ease-in-out',
  },
  
  heroVisual: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  heroCard: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius['2xl'],
    padding: designSystem.spacing[6],
    boxShadow: designSystem.shadows['2xl'],
    maxWidth: '400px',
    width: '100%',
  },
  
  heroCardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: designSystem.spacing[4],
  },
  
  heroCardDots: {
    display: 'flex',
    gap: designSystem.spacing[2],
  },
  
  heroCardDot: {
    width: '12px',
    height: '12px',
    borderRadius: designSystem.borderRadius.full,
    backgroundColor: designSystem.colors.gray[300],
  },
  
  heroCardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: designSystem.spacing[4],
  },
  
  heroQRCode: {
    width: '200px',
    height: '200px',
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing[4],
    border: `2px solid ${designSystem.colors.border}`,
  },
  
  qrGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '2px',
    width: '100%',
    height: '100%',
  },
  
  qrCell: {
    backgroundColor: designSystem.colors.text.primary,
    borderRadius: '2px',
  },
  
  heroCardText: {
    fontSize: designSystem.typography.fontSize.lg,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text.primary,
    margin: 0,
  },
  
  // Features Section
  featuresSection: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: `${designSystem.spacing[20]} ${designSystem.spacing[6]}`,
    backgroundColor: designSystem.colors.surface,
  },
  
  sectionHeader: {
    textAlign: 'center',
    marginBottom: designSystem.spacing[12],
  },
  
  sectionTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing[4],
    marginTop: 0,
  },
  
  sectionSubtitle: {
    fontSize: designSystem.typography.fontSize.xl,
    color: designSystem.colors.text.secondary,
    maxWidth: '600px',
    margin: '0 auto',
  },
  
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: designSystem.spacing[6],
  },
  
  featureCard: {
    backgroundColor: designSystem.colors.gray[50],
    borderRadius: designSystem.borderRadius.xl,
    padding: designSystem.spacing[6],
    transition: 'all 200ms ease-in-out',
    border: `1px solid ${designSystem.colors.border}`,
  },
  
  featureIconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    backgroundColor: designSystem.colors.primary[50],
    borderRadius: designSystem.borderRadius.xl,
    marginBottom: designSystem.spacing[4],
  },
  
  featureIcon: {
    fontSize: '32px',
  },
  
  featureTitle: {
    fontSize: designSystem.typography.fontSize.xl,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing[2],
    marginTop: 0,
  },
  
  featureDescription: {
    fontSize: designSystem.typography.fontSize.base,
    lineHeight: designSystem.typography.lineHeight.relaxed,
    color: designSystem.colors.text.secondary,
    margin: 0,
  },
  
  // CTA Section
  ctaSection: {
    backgroundColor: designSystem.colors.primary[600],
    padding: `${designSystem.spacing[20]} ${designSystem.spacing[6]}`,
    marginTop: designSystem.spacing[12],
  },
  
  ctaContent: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
  },
  
  ctaTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: designSystem.typography.fontWeight.bold,
    color: designSystem.colors.text.inverse,
    marginBottom: designSystem.spacing[4],
    marginTop: 0,
  },
  
  ctaSubtitle: {
    fontSize: designSystem.typography.fontSize.xl,
    color: designSystem.colors.primary[100],
    marginBottom: designSystem.spacing[8],
    lineHeight: designSystem.typography.lineHeight.relaxed,
  },
  
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: designSystem.spacing[2],
    padding: `${designSystem.spacing[4]} ${designSystem.spacing[10]}`,
    backgroundColor: designSystem.colors.text.inverse,
    color: designSystem.colors.primary[600],
    textDecoration: 'none',
    borderRadius: designSystem.borderRadius.lg,
    fontSize: designSystem.typography.fontSize.lg,
    fontWeight: designSystem.typography.fontWeight.semibold,
    transition: 'all 200ms ease-in-out',
    boxShadow: designSystem.shadows.xl,
    border: 'none',
    cursor: 'pointer',
  },
};

// Add hover effects via CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    a[href*="signup"], a[href*="login"] {
      transition: all 200ms ease-in-out;
    }
    a[href*="signup"]:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(14, 165, 233, 0.3);
    }
    a[href*="signup"]:hover span {
      transform: translateX(4px);
    }
    a[href*="login"]:hover {
      background-color: ${designSystem.colors.gray[50]};
      border-color: ${designSystem.colors.gray[300]};
    }
    .featureCard:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    @media (max-width: 968px) {
      .hero {
        grid-template-columns: 1fr !important;
        text-align: center !important;
      }
      .heroButtons {
        justify-content: center !important;
      }
      .heroBadge {
        margin: 0 auto !important;
      }
    }
  `;
  document.head.appendChild(style);
}
