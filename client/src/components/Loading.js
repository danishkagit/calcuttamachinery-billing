import React from 'react';

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-muted">Loading...</p>
    </div>
  );
};

export default Loading;
