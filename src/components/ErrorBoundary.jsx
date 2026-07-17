import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#fff', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            Terjadi kesalahan
          </div>
          <div style={{
            fontSize: '12px', color: '#ef4444', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: '8px',
            padding: '12px 16px', maxWidth: '360px', wordBreak: 'break-all',
            textAlign: 'left', marginBottom: '20px',
          }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#002D72', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 24px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer',
            }}
          >
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
