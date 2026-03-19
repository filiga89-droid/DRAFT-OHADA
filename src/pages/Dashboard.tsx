import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, FileText, FolderOpen, Plus, ArrowRight, Clock } from 'lucide-react';
import StatCard from '../components/StatCard';

interface DashboardStats {
  totalClients: number;
  totalCompanies: number;
  totalDocuments: number;
  recentDocuments: any[];
  recentCompanies: any[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await window.api.stats.dashboard();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/clients')} className="btn-secondary">
            <Plus className="w-4 h-4" />
            Nouveau client
          </button>
          <button onClick={() => navigate('/generate')} className="btn-primary">
            <FileText className="w-4 h-4" />
            Générer un document
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clients" value={stats?.totalClients || 0} icon={Users} color="primary" />
        <StatCard label="Sociétés" value={stats?.totalCompanies || 0} icon={Building2} color="emerald" />
        <StatCard label="Documents générés" value={stats?.totalDocuments || 0} icon={FileText} color="amber" />
        <StatCard label="Modèles actifs" value={6} icon={FolderOpen} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent companies */}
        <div className="card">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Sociétés récentes</h2>
            <button onClick={() => navigate('/companies')} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-neutral-100">
            {stats?.recentCompanies && stats.recentCompanies.length > 0 ? (
              stats.recentCompanies.map((company: any) => (
                <div
                  key={company.id}
                  onClick={() => navigate(`/companies/${company.id}`)}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{company.name}</p>
                      <p className="text-xs text-neutral-500">{company.legal_form}</p>
                    </div>
                  </div>
                  <span className="badge-success">{company.legal_form}</span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-neutral-500">Aucune société enregistrée</p>
                <button onClick={() => navigate('/companies')} className="mt-2 text-sm text-primary-600 hover:underline">
                  Créer une société
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent documents */}
        <div className="card">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Documents récents</h2>
            <button onClick={() => navigate('/history')} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-neutral-100">
            {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
              stats.recentDocuments.map((doc: any) => (
                <div key={doc.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{doc.template_name || doc.file_name}</p>
                      <p className="text-xs text-neutral-500">{doc.company_name} · {new Date(doc.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-neutral-400" />
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-neutral-500">Aucun document généré</p>
                <button onClick={() => navigate('/generate')} className="mt-2 text-sm text-primary-600 hover:underline">
                  Générer votre premier document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="font-semibold text-neutral-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Constitution de société', desc: 'Générer le pack complet de constitution (statuts, PV, déclaration...)', href: '/generate', color: 'primary' },
            { title: 'Modification statutaire', desc: 'PV d\'AGE, résolutions, mise à jour des statuts', href: '/generate', color: 'emerald' },
            { title: 'Cession de parts', desc: 'Acte de cession, mise à jour du registre des associés', href: '/generate', color: 'amber' },
          ].map((action) => (
            <div
              key={action.title}
              onClick={() => navigate(action.href)}
              className="card-hover p-5"
            >
              <h3 className="font-semibold text-neutral-900 mb-1">{action.title}</h3>
              <p className="text-sm text-neutral-500">{action.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
