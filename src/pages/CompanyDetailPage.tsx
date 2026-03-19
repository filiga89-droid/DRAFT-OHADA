import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, UserCheck, Plus, Edit2, Trash2, FileText, ArrowLeft, Save } from 'lucide-react';
import Modal from '../components/Modal';

interface Shareholder {
  id: string;
  type: string;
  full_name: string;
  company_name?: string;
  nationality: string;
  address: string;
  shares_count: number;
  shares_amount: number;
  contribution_type: string;
  contribution_description?: string;
  birth_date?: string;
  birth_place?: string;
  id_number?: string;
  id_type?: string;
  representative_name?: string;
  representative_title?: string;
  rccm?: string;
  legal_form?: string;
}

interface Manager {
  id: string;
  type: string;
  full_name: string;
  title: string;
  nationality: string;
  address: string;
  birth_date?: string;
  birth_place?: string;
  appointment_date?: string;
  duration?: string;
  powers?: string;
  is_statutory: boolean;
  representative_name?: string;
  representative_title?: string;
}

type TabKey = 'info' | 'shareholders' | 'managers';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  // Shareholder modal
  const [showShareholderModal, setShowShareholderModal] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);
  const [shForm, setShForm] = useState({
    type: 'physique', full_name: '', company_name: '', nationality: 'Camerounaise', address: '', city: '', country: 'Cameroun',
    shares_count: 0, shares_amount: 0, contribution_type: 'numeraire', contribution_description: '',
    birth_date: '', birth_place: '', id_type: 'CNI', id_number: '', is_founding: true,
    representative_name: '', representative_title: '', legal_form: '', rccm: '',
  });

  // Manager modal
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [mgForm, setMgForm] = useState({
    type: 'physique', full_name: '', company_name: '', title: 'Gérant', nationality: 'Camerounaise', address: '',
    birth_date: '', birth_place: '', appointment_date: '', duration: 'Durée de la société', powers: 'Les plus étendus',
    is_statutory: true, representative_name: '', representative_title: '', id_number: '',
  });

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    try {
      const [comp, sh, mg] = await Promise.all([
        window.api.companies.getById(id!),
        window.api.shareholders.getByCompany(id!),
        window.api.managers.getByCompany(id!),
      ]);
      setCompany(comp);
      setForm(comp || {});
      setShareholders(sh || []);
      setManagers(mg || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveCompany() {
    try {
      await window.api.companies.update(id!, form);
      setEditing(false);
      loadData();
    } catch (err) {
      console.error('Erreur:', err);
    }
  }

  // Shareholders CRUD
  function openShareholderCreate() {
    setEditingShareholder(null);
    const shareValue = company?.share_value || 10000;
    setShForm({
      type: 'physique', full_name: '', company_name: '', nationality: 'Camerounaise', address: '', city: '', country: 'Cameroun',
      shares_count: 0, shares_amount: 0, contribution_type: 'numeraire', contribution_description: '',
      birth_date: '', birth_place: '', id_type: 'CNI', id_number: '', is_founding: true,
      representative_name: '', representative_title: '', legal_form: '', rccm: '',
    });
    setShowShareholderModal(true);
  }

  function openShareholderEdit(sh: Shareholder) {
    setEditingShareholder(sh);
    setShForm({ ...sh, city: '', country: 'Cameroun', id_type: sh.id_type || 'CNI', is_founding: true, legal_form: sh.legal_form || '' } as any);
    setShowShareholderModal(true);
  }

  async function saveShareholder(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...shForm, company_id: id };
    if (editingShareholder) {
      await window.api.shareholders.update(editingShareholder.id, data);
    } else {
      await window.api.shareholders.create(data);
    }
    setShowShareholderModal(false);
    loadData();
  }

  async function deleteShareholder(shId: string) {
    if (confirm('Supprimer cet associé ?')) {
      await window.api.shareholders.delete(shId);
      loadData();
    }
  }

  // Managers CRUD
  function openManagerCreate() {
    setEditingManager(null);
    setMgForm({
      type: 'physique', full_name: '', company_name: '', title: 'Gérant', nationality: 'Camerounaise', address: '',
      birth_date: '', birth_place: '', appointment_date: '', duration: 'Durée de la société', powers: 'Les plus étendus',
      is_statutory: true, representative_name: '', representative_title: '', id_number: '',
    });
    setShowManagerModal(true);
  }

  function openManagerEdit(mg: Manager) {
    setEditingManager(mg);
    setMgForm({ ...mg, company_name: '', id_number: '' } as any);
    setShowManagerModal(true);
  }

  async function saveManager(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...mgForm, company_id: id };
    if (editingManager) {
      await window.api.managers.update(editingManager.id, data);
    } else {
      await window.api.managers.create(data);
    }
    setShowManagerModal(false);
    loadData();
  }

  async function deleteManager(mgId: string) {
    if (confirm('Supprimer ce dirigeant ?')) {
      await window.api.managers.delete(mgId);
      loadData();
    }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" /></div>;
  if (!company) return <div className="text-center py-16 text-neutral-500">Société introuvable</div>;

  const totalSharesAllocated = shareholders.reduce((s, sh) => s + (sh.shares_count || 0), 0);
  const totalCapitalAllocated = shareholders.reduce((s, sh) => s + (sh.shares_amount || 0), 0);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'info', label: 'Informations', icon: Building2 },
    { key: 'shareholders', label: `Associés (${shareholders.length})`, icon: Users },
    { key: 'managers', label: `Dirigeants (${managers.length})`, icon: UserCheck },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/companies')} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{company.name}</h1>
          <p className="page-subtitle">{company.legal_form} · {company.headquarters_city || 'Ville non définie'}</p>
        </div>
        <button onClick={() => navigate(`/generate/${id}`)} className="btn-primary">
          <FileText className="w-4 h-4" /> Générer un document
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-neutral-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {activeTab === 'info' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Informations de la société</h2>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setForm(company); }} className="btn-secondary text-sm">Annuler</button>
                <button onClick={saveCompany} className="btn-primary text-sm"><Save className="w-4 h-4" /> Enregistrer</button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm"><Edit2 className="w-4 h-4" /> Modifier</button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: 'Dénomination sociale', key: 'name' },
              { label: 'Forme juridique', key: 'legal_form' },
              { label: 'Capital social', key: 'capital_amount', type: 'number', suffix: ` ${form.capital_currency || 'FCFA'}` },
              { label: 'Valeur nominale', key: 'share_value', type: 'number', suffix: ' FCFA' },
              { label: 'Nombre de parts', key: 'total_shares', type: 'number' },
              { label: 'Siège social', key: 'headquarters_address' },
              { label: 'Ville', key: 'headquarters_city' },
              { label: 'Pays', key: 'headquarters_country' },
              { label: 'RCCM', key: 'rccm' },
              { label: 'IFU / NIF', key: 'ifu' },
              { label: 'Durée (années)', key: 'duration', type: 'number' },
              { label: 'Juridiction', key: 'jurisdiction' },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{field.label}</label>
                {editing ? (
                  <input
                    type={field.type || 'text'}
                    value={form[field.key] || ''}
                    onChange={(e) => setForm({ ...form, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
                    className="input-field mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-neutral-900 mt-1">
                    {form[field.key] ? `${form[field.key]}${field.suffix || ''}` : '—'}
                  </p>
                )}
              </div>
            ))}
          </div>
          {!editing && (
            <>
              <div className="mt-6 pt-4 border-t border-neutral-200">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Objet social</label>
                <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{company.business_object || '—'}</p>
              </div>
            </>
          )}
          {editing && (
            <div className="mt-4">
              <label className="input-label">Objet social</label>
              <textarea value={form.business_object || ''} onChange={(e) => setForm({ ...form, business_object: e.target.value })} className="input-field" rows={4} />
            </div>
          )}
        </div>
      )}

      {/* Shareholders tab */}
      {activeTab === 'shareholders' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-neutral-500">
                Capital réparti : <strong>{totalCapitalAllocated.toLocaleString('fr-FR')} FCFA</strong> sur {(company.capital_amount || 0).toLocaleString('fr-FR')} FCFA
                ({totalSharesAllocated} / {company.total_shares || 0} parts)
              </p>
            </div>
            <button onClick={openShareholderCreate} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Ajouter un associé</button>
          </div>

          {shareholders.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-neutral-500">Aucun associé enregistré</p>
            </div>
          ) : (
            <div className="card table-container">
              <table>
                <thead>
                  <tr>
                    <th>Associé</th>
                    <th>Type</th>
                    <th>Nationalité</th>
                    <th>Parts</th>
                    <th>Montant</th>
                    <th>Apport</th>
                    <th className="w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shareholders.map((sh) => (
                    <tr key={sh.id}>
                      <td className="font-medium">{sh.type === 'morale' ? sh.company_name || sh.full_name : sh.full_name}</td>
                      <td><span className={sh.type === 'morale' ? 'badge-warning' : 'badge-primary'}>{sh.type === 'morale' ? 'PM' : 'PP'}</span></td>
                      <td className="text-sm">{sh.nationality || '—'}</td>
                      <td className="font-medium">{sh.shares_count}</td>
                      <td>{(sh.shares_amount || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td><span className="badge-neutral">{sh.contribution_type}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openShareholderEdit(sh)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteShareholder(sh.id)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Managers tab */}
      {activeTab === 'managers' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-500">{managers.length} dirigeant{managers.length !== 1 ? 's' : ''}</p>
            <button onClick={openManagerCreate} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Ajouter un dirigeant</button>
          </div>

          {managers.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-neutral-500">Aucun dirigeant enregistré</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {managers.map((mg) => (
                <div key={mg.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{mg.full_name}</h3>
                      <span className="badge-primary mt-1">{mg.title}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openManagerEdit(mg)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteManager(mg.id)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-neutral-600">
                    {mg.nationality && <p>Nationalité : {mg.nationality}</p>}
                    {mg.address && <p>Adresse : {mg.address}</p>}
                    {mg.appointment_date && <p>Nomination : {mg.appointment_date}</p>}
                    {mg.duration && <p>Durée : {mg.duration}</p>}
                    {mg.powers && <p>Pouvoirs : {mg.powers}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shareholder Modal */}
      <Modal isOpen={showShareholderModal} onClose={() => setShowShareholderModal(false)} title={editingShareholder ? 'Modifier l\'associé' : 'Nouvel associé'} size="xl">
        <form onSubmit={saveShareholder} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Type</label>
              <select value={shForm.type} onChange={(e) => setShForm({ ...shForm, type: e.target.value })} className="input-field">
                <option value="physique">Personne physique</option>
                <option value="morale">Personne morale</option>
              </select>
            </div>
            <div>
              <label className="input-label">{shForm.type === 'morale' ? 'Raison sociale' : 'Nom complet'} *</label>
              <input type="text" value={shForm.full_name} onChange={(e) => setShForm({ ...shForm, full_name: e.target.value })} className="input-field" required />
            </div>
          </div>
          {shForm.type === 'morale' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="input-label">Forme juridique</label>
                <input type="text" value={shForm.legal_form} onChange={(e) => setShForm({ ...shForm, legal_form: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">RCCM</label>
                <input type="text" value={shForm.rccm} onChange={(e) => setShForm({ ...shForm, rccm: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Représentant légal</label>
                <input type="text" value={shForm.representative_name} onChange={(e) => setShForm({ ...shForm, representative_name: e.target.value })} className="input-field" />
              </div>
            </div>
          )}
          {shForm.type === 'physique' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="input-label">Nationalité</label>
                <input type="text" value={shForm.nationality} onChange={(e) => setShForm({ ...shForm, nationality: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Date de naissance</label>
                <input type="date" value={shForm.birth_date} onChange={(e) => setShForm({ ...shForm, birth_date: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Lieu de naissance</label>
                <input type="text" value={shForm.birth_place} onChange={(e) => setShForm({ ...shForm, birth_place: e.target.value })} className="input-field" />
              </div>
            </div>
          )}
          {shForm.type === 'physique' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Type de pièce d'identité</label>
                <select value={shForm.id_type} onChange={(e) => setShForm({ ...shForm, id_type: e.target.value })} className="input-field">
                  <option value="CNI">CNI</option>
                  <option value="Passeport">Passeport</option>
                  <option value="Carte de séjour">Carte de séjour</option>
                </select>
              </div>
              <div>
                <label className="input-label">Numéro</label>
                <input type="text" value={shForm.id_number} onChange={(e) => setShForm({ ...shForm, id_number: e.target.value })} className="input-field" />
              </div>
            </div>
          )}
          <div>
            <label className="input-label">Adresse</label>
            <input type="text" value={shForm.address} onChange={(e) => setShForm({ ...shForm, address: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Nombre de parts *</label>
              <input type="number" value={shForm.shares_count} onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                const amount = count * (company?.share_value || 10000);
                setShForm({ ...shForm, shares_count: count, shares_amount: amount });
              }} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Montant (FCFA)</label>
              <input type="number" value={shForm.shares_amount} readOnly className="input-field bg-neutral-50" />
            </div>
            <div>
              <label className="input-label">Type d'apport</label>
              <select value={shForm.contribution_type} onChange={(e) => setShForm({ ...shForm, contribution_type: e.target.value })} className="input-field">
                <option value="numeraire">Numéraire</option>
                <option value="nature">Nature</option>
                <option value="industrie">Industrie</option>
              </select>
            </div>
          </div>
          {shForm.contribution_type === 'nature' && (
            <div>
              <label className="input-label">Description de l'apport en nature</label>
              <textarea value={shForm.contribution_description} onChange={(e) => setShForm({ ...shForm, contribution_description: e.target.value })} className="input-field" rows={2} />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={() => setShowShareholderModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">{editingShareholder ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </form>
      </Modal>

      {/* Manager Modal */}
      <Modal isOpen={showManagerModal} onClose={() => setShowManagerModal(false)} title={editingManager ? 'Modifier le dirigeant' : 'Nouveau dirigeant'} size="lg">
        <form onSubmit={saveManager} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Type</label>
              <select value={mgForm.type} onChange={(e) => setMgForm({ ...mgForm, type: e.target.value })} className="input-field">
                <option value="physique">Personne physique</option>
                <option value="morale">Personne morale</option>
              </select>
            </div>
            <div>
              <label className="input-label">Fonction *</label>
              <select value={mgForm.title} onChange={(e) => setMgForm({ ...mgForm, title: e.target.value })} className="input-field">
                <option value="Gérant">Gérant</option>
                <option value="Directeur Général">Directeur Général</option>
                <option value="Président du Conseil d'Administration">PCA</option>
                <option value="Administrateur">Administrateur</option>
                <option value="Président">Président</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Nom complet *</label>
            <input type="text" value={mgForm.full_name} onChange={(e) => setMgForm({ ...mgForm, full_name: e.target.value })} className="input-field" required />
          </div>
          {mgForm.type === 'physique' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="input-label">Nationalité</label>
                <input type="text" value={mgForm.nationality} onChange={(e) => setMgForm({ ...mgForm, nationality: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Date de naissance</label>
                <input type="date" value={mgForm.birth_date} onChange={(e) => setMgForm({ ...mgForm, birth_date: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Lieu de naissance</label>
                <input type="text" value={mgForm.birth_place} onChange={(e) => setMgForm({ ...mgForm, birth_place: e.target.value })} className="input-field" />
              </div>
            </div>
          )}
          {mgForm.type === 'morale' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Représentant légal</label>
                <input type="text" value={mgForm.representative_name} onChange={(e) => setMgForm({ ...mgForm, representative_name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Qualité du représentant</label>
                <input type="text" value={mgForm.representative_title} onChange={(e) => setMgForm({ ...mgForm, representative_title: e.target.value })} className="input-field" />
              </div>
            </div>
          )}
          <div>
            <label className="input-label">Adresse</label>
            <input type="text" value={mgForm.address} onChange={(e) => setMgForm({ ...mgForm, address: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Date de nomination</label>
              <input type="date" value={mgForm.appointment_date} onChange={(e) => setMgForm({ ...mgForm, appointment_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">Durée du mandat</label>
              <input type="text" value={mgForm.duration} onChange={(e) => setMgForm({ ...mgForm, duration: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="input-label">Pouvoirs</label>
            <textarea value={mgForm.powers} onChange={(e) => setMgForm({ ...mgForm, powers: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={() => setShowManagerModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">{editingManager ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
