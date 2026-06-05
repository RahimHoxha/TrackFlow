import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
