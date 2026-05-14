import React, { Component, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import Topbar from './layout/Topbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Suppliers from './pages/Suppliers';
import Accounts from './pages/Accounts';
import ChartOfAccounts from './pages/ChartOfAccounts';
import Payroll from './pages/Payroll';
import PurchaseInvoices from './pages/PurchaseInvoices';
import Checks from './pages/Checks';
import JournalEntries from './pages/JournalEntries';
import FixedAssets from './pages/FixedAssets';
import Reports from './pages/Reports';
import SqlEngine from './pages/SqlEngine';
import AiAssistant from './pages/AiAssistant';
import DependencyAnalyzer from './pages/DependencyAnalyzer';
import ERDiagram from './pages/ERDiagram';
import ComprehensiveReport from './pages/ComprehensiveReport';
import AcademicReport from './pages/AcademicReport';
import DatabaseSchema from './components/DatabaseSchema';
import CurrencyWidget from './components/CurrencyWidget';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';

// Error Boundary Wrapper
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', direction: 'rtl' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>حدث خطأ في النظام</h1>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Layout wrapper for authenticated pages
function AppLayout() {
  return (
    <div
      dir="rtl"
      style={{
        display: 'grid',
        gridTemplateColumns: '256px 1fr',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
      }}
    >
      {/* Floating currency widget — rendered at root level so it overlays all pages */}
      <CurrencyWidget />

      {/* COLUMN 1 (RIGHT): SIDEBAR */}
      <aside
        style={{
          gridColumn: '1',
          height: '100%',
          overflowY: 'auto',
          backgroundColor: '#020617',
          borderLeft: '1px solid #1e293b',
          zIndex: 20,
        }}
      >
        <Sidebar />
      </aside>

      {/* COLUMN 2 (LEFT): MAIN CONTENT AREA */}
      <main
        style={{
          gridColumn: '2',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* TOPBAR (Fixed height) */}
        <header
          style={{
            height: '64px',
            flexShrink: 0,
            backgroundColor: '#0f172a',
            borderBottom: '1px solid #1e293b',
            zIndex: 100,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <Topbar />
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <section
          className="page-fade-in"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            backgroundColor: '#0f172a',
          }}
        >
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Aggressively kill offline databases but PRESERVE Supabase auth tokens
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Standalone login — no sidebar/topbar */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Dashboard Layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/purchases" element={<PurchaseInvoices />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/journal" element={<JournalEntries />} />
              <Route path="/checks" element={<Checks />} />
              <Route path="/assets" element={<FixedAssets />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/sql" element={<SqlEngine />} />
              <Route path="/ai" element={<AiAssistant />} />
              <Route path="/analyzer" element={<DependencyAnalyzer />} />
              <Route path="/erd" element={<ERDiagram />} />
              <Route path="/report" element={<ComprehensiveReport />} />
              <Route path="/academic-report" element={<AcademicReport />} />
              <Route path="/db-schema" element={<DatabaseSchema />} />
            </Route>

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
