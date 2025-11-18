'use client';

export default function AuthContainer({ children }) {
  return (
    <div style={styles.container}>
      {children}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
};

