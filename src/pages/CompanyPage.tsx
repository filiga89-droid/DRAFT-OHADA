import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Plus, Search, Edit2, Trash2, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

interface Company {
  id: string;
  client_id: string;
  name: string;
  legal_form: string;
  rccm: string;
  headquarters_address: string;
  headquarters_city: string;
  capital_amount: number;
  capital_currency: string;
  status: string;
  created_at: string;
  client_first_name?: string;
  client_last_name?: string;
  client_company_name?: string;
}

const legalForms = ['SARL', 'SA', 'SAS', 'SNC', 'SCS', 'SUARL', 'GIE'];

export default function CompanyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get('client');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    client_id: clientIdFilter || '',
    name: '',
    legal_form: 'SARL',
    rccm: '',
    ifu: '',
    capital_amount: 1000000,
    capital_currency: 'FCFA',
    share_value: 10000,
    total_shares: 100,
    headquarters_address: '',
    headquarters_city: '',
    headquarters_country: 'Cameroun',
    business_object: '',
    duration: 99,
    fiscal_year_start: '01/01',
    fiscal_year_end: '31/12',
    jurisdiction: 'OHADA',
  });

  useEffect(() => {
    loadData();
  }, [clientIdFilter]);

  async function loadData() {
    try {
      const [companiesData, clientsData] = await Promise.all([
        clientIdFilter ? window.api.companies.getByClient(clientIdFilter) : window.api.companies.getAll(),
        window.api.clients.getAll(),
      ]);
      setCompanies(companiesData || []);
      setClients(clientsData || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(query: string) {
    setSearch(query);
    if (query.trim()) {
      const results = await window.api.companies.search(query);
      setCompanies(results || []);
    } else {
      loadData();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await window.api.companies.create(form);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur:', err);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Êtes-vous sûr de vouloir archiver cette société ?')) {
      await window.api.companies.delete(id);
      loadData();
    }
  }

  function formatCapital(amount: number, currency: string) {
    return `${amount.toLocaleString('fr-FR')} ${currency}`;
  }

  function getClientName(company: Company) {
    if (company.client_company_name) return company.client_company_name;
    return `${company.client_last_name || ''} ${company.client_first_name || ''}`.trim() || '—';
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Sociétés</h1>
          <p className="page-subtitle">{companies.length} société{companies.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouvelle société
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher une société..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucune société"
          description="Créez votre première société pour commencer à générer des documents."
          action={{ label: 'Créer une société', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="card-hover p-5"
              onClick={() => navigate(`/companies/${company.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{company.name}</h3>
                    <p className="text-xs text-neutral-500">{getClientName(company)}</p>
                  </div>
                </div>
                <span className="badge-success">{company.legal_form}</span>
              </div>

              <div className="space-y-1.5 text-sm text-neutral-600">
                {company.capital_amount && (
                  <p>Capital : {formatCapital(company.capital_amount, company.capital_currency || 'FCFA')}</p>
                )}
                {company.headquarters_city && (
                  <p>Siège : {company.headquarters_city}</p>
                )}
                {company.rccm && (
                  <p className="text-xs text-neutral-400">RCCM : {company.rccm}</p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => navigate(`/generate/${company.id}`)} className="btn-ghost text-xs flex-1 justify-center">
                  <FileText className="w-3.5 h-3.5" /> Générer
                </button>
                <button onClick={() => navigate(`/companies/${company.id}`)} className="btn-ghost text-xs flex-1 justify-center">
                  <Edit2 className="w-3.5 h-3.5" /> Détails
                </button>
                <button onClick={() => handleDelete(company.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50 p-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouvelle société"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Client *</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="input-field" required>
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.type === 'morale' ? c.company_name : `${c.last_name} ${c.first_name}`} ({c.reference})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Dénomination sociale *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Forme juridique *</label>
              <select value={form.legal_form} onChange={(e) => setForm({ ...form, legal_form: e.target.value })} className="input-field">
                {legalForms.map((lf) => <option key={lf} value={lf}>{lf}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Capital social (FCFA) *</label>
              <input type="number" value={form.capital_amount} onChange={(e) => {
                const capital = parseInt(e.target.value) || 0;
                const shares = form.share_value > 0 ? Math.floor(capital / form.share_value) : 0;
                setForm({ ...form, capital_amount: capital, total_shares: shares });
              }} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Valeur nominale (FCFA)</label>
              <input type="number" value={form.share_value} onChange={(e) => {
                const sv = parseInt(e.target.value) || 0;
                const shares = sv > 0 ? Math.floor(form.capital_amount / sv) : 0;
                setForm({ ...form, share_value: sv, total_shares: shares });
              }} className="input-field" />
            </div>
            <div>
              <label className="input-label">Nombre de parts</label>
              <input type="number" value={form.total_shares} readOnly className="input-field bg-neutral-50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Siège social (adresse)</label>
              <input type="text" value={form.headquarters_address} onChange={(e) => setForm({ ...form, headquarters_address: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">Ville</label>
              <input type="text" value={form.headquarters_city} onChange={(e) => setForm({ ...form, headquarters_city: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="input-label">Objet social</label>
            <textarea value={form.business_object} onChange={(e) => setForm({ ...form, business_object: e.target.value })} className="input-field" rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Durée (années)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 99 })} className="input-field" />
            </div>
            <div>
              <label className="input-label">RCCM</label>
              <input type="text" value={form.rccm} onChange={(e) => setForm({ ...form, rccm: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">IFU / NIF</label>
              <input type="text" value={form.ifu} onChange={(e) => setForm({ ...form, ifu: e.target.value })} className="input-field" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Créer la société</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
