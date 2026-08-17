import { useState, useEffect } from 'react';
import api from './services/api';
import './App.css';

function App() {
  const [healthStatus, setHealthStatus] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    api
      .get('/api/health')
      .then((res) => setHealthStatus({ loading: false, data: res.data, error: null }))
      .catch((err) =>
        setHealthStatus({ loading: false, data: null, error: err.message })
      );
  }, []);

  return (
    <div className="foundation-container">
      <div className="foundation-card">
        <h1 className="foundation-title">Work Wagon</h1>
        <p className="foundation-subtitle">MERN Application</p>
        <p className="foundation-status">Frontend is running ✅</p>

        <div className="api-status">
          <h2>Backend Health Check</h2>
          {healthStatus.loading && <p className="api-loading">Connecting to backend…</p>}
          {healthStatus.error && (
            <p className="api-error">❌ Backend unreachable — {healthStatus.error}</p>
          )}
          {healthStatus.data && (
            <div className="api-response">
              <p>✅ Backend connected</p>
              <pre>{JSON.stringify(healthStatus.data, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
