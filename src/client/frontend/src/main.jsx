import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Remove StrictMode for now to prevent double mount/cleanup cycles
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
