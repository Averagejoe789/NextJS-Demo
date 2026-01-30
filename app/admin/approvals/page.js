'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../../../lib/auth-utils';

export default function AdminApprovals() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isApprover, setIsApprover] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/admin/login');
      return;
    }
    user.getIdToken().then((token) => {
      fetch('/api/admin/am-i-approver', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setIsApprover(data.approver === true);
          if (!data.approver) {
            setLoading(false);
            return;
          }
          return fetch('/api/admin/pending-restaurants', {
            headers: { Authorization: `Bearer ${token}` },
          });
        })
        .then((r) => (r && r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.restaurants) setRestaurants(data.restaurants);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load');
        })
        .finally(() => setLoading(false));
    });
  }, [router]);

  const handleAction = async (restaurantId, action) => {
    const user = getCurrentUser();
    if (!user) return;
    if (action === 'reject' && !rejectReason[restaurantId]?.trim()) {
      setError('Please enter a reason for rejection');
      return;
    }
    setActionLoading(restaurantId);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/approve-restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId,
          action,
          rejectionReason: action === 'reject' ? rejectReason[restaurantId] : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Action failed');
        return;
      }
      setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
      setRejectReason((prev) => ({ ...prev, [restaurantId]: '' }));
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (!isApprover) {
    return (
      <div style={styles.box}>
        <h1 style={styles.title}>Approvals</h1>
        <p style={styles.denied}>You don’t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div style={styles.box}>
      <h1 style={styles.title}>Pending restaurant approvals</h1>
      <p style={styles.subtitle}>
        Review and approve or reject new restaurant applications.
      </p>

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {restaurants.length === 0 ? (
        <p style={styles.empty}>No pending restaurants.</p>
      ) : (
        <div style={styles.list}>
          {restaurants.map((r) => (
            <div key={r.id} style={styles.card}>
              <div style={styles.cardBody}>
                <div style={styles.cardRow}>
                  <strong>{r.name || 'Unnamed'}</strong>
                  <span style={styles.meta}>{r.cuisine || '—'}</span>
                </div>
                <div style={styles.cardRow}>
                  <span style={styles.label}>Email:</span> {r.email || '—'}
                </div>
                <div style={styles.cardRow}>
                  <span style={styles.label}>Address:</span> {r.address || '—'}
                </div>
                <div style={styles.cardRow}>
                  <span style={styles.label}>Phone:</span> {r.phone || '—'}
                </div>
                {r.description && (
                  <div style={styles.desc}>{r.description}</div>
                )}
                <div style={styles.actions}>
                  <input
                    type="text"
                    placeholder="Rejection reason (required to reject)"
                    value={rejectReason[r.id] || ''}
                    onChange={(e) =>
                      setRejectReason((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    style={styles.rejectInput}
                  />
                  <div style={styles.buttons}>
                    <button
                      type="button"
                      onClick={() => handleAction(r.id, 'approve')}
                      disabled={actionLoading !== null}
                      style={{ ...styles.button, ...styles.approveButton }}
                    >
                      {actionLoading === r.id ? '...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(r.id, 'reject')}
                      disabled={actionLoading !== null || !rejectReason[r.id]?.trim()}
                      style={{ ...styles.button, ...styles.rejectButton }}
                    >
                      {actionLoading === r.id ? '...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  loading: {
    padding: '40px',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
  box: {
    maxWidth: '800px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
  },
  denied: {
    color: '#c33',
    fontSize: '16px',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '6px',
    color: '#c33',
    marginBottom: '16px',
  },
  empty: {
    color: '#666',
    fontSize: '16px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  cardBody: {
    padding: '20px',
  },
  cardRow: {
    marginBottom: '8px',
    fontSize: '14px',
  },
  meta: {
    marginLeft: '8px',
    color: '#6b7280',
    fontWeight: 'normal',
  },
  label: {
    color: '#6b7280',
    marginRight: '6px',
  },
  desc: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '8px',
    marginBottom: '12px',
    lineHeight: 1.4,
  },
  actions: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  rejectInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '12px',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
  },
  approveButton: {
    backgroundColor: '#16a34a',
    color: 'white',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
    color: 'white',
  },
};
