import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import CompanyPage from './pages/CompanyPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import TemplatesPage from './pages/TemplatesPage';
import GenerateDocumentPage from './pages/GenerateDocumentPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/companies" element={<CompanyPage />} />
        <Route path="/companies/:id" element={<CompanyDetailPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/generate" element={<GenerateDocumentPage />} />
        <Route path="/generate/:companyId" element={<GenerateDocumentPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
