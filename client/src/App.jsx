import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'error' }));
  }, []);

  return (
    <div className="app">
      <h1>PearlMarket</h1>
      <p>Welcome to PearlMarket</p>
      {health && (
        <p className="status">
          API Status: <span>{health.status}</span>
        </p>
      )}
    </div>
  );
}

export default App;
