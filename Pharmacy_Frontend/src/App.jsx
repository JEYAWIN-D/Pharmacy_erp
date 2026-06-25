import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './frontend/Auth';
import PharmacyERP from './frontend/PharmacyERP';
import { DBProvider } from './frontend/db/DBContext';

function App() {
  return (
    <DBProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/pharmacy" element={<PharmacyERP />} />
          {/* Redirect any unmatched routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </DBProvider>
  );
}

export default App;
