import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import IncomeManagement from './pages/IncomeManagement';
import BudgetManagement from './pages/BudgetManagement';
import ExpenseTracking from './pages/ExpenseTracking';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifySuccess from './pages/VerifySuccess';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import AIChat from './pages/AIChat';
import Analytics from './pages/Analytics';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'sonner';
import SalaryDateModal from './components/SalaryDateModal';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(13, 19, 36, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '14px 18px',
            boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.6)',
            color: '#F0F4FF',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <SalaryDateModal />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-success" element={<VerifySuccess />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="income" element={<IncomeManagement />} />
          <Route path="budgets" element={<BudgetManagement />} />
          <Route path="expenses" element={<ExpenseTracking />} />
          <Route path="savings" element={<Navigate to="/accounts" replace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="copilot" element={<AIChat />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
