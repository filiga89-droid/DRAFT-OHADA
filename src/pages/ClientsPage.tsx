import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Edit2, Trash2, Building2, Phone, Mail } from 'lucide-react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

interface Client {
  id: string;
  reference: string;
  type: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  created_at: string;
}

const emptyClient = {
  type: 'physique' as const,
  first_name: '',
  last_name: '',
  company_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: 'Cameroun',
  notes: '',
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const data = await window.api.clients.getAll();
      setClients(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(query: string) {
    setSearch(query);
    if (query.trim()) {
      const results = await window.api.clients.search(query);
      setClients(results || []);
    } else {
      loadClients();
    }
  }

  function openCreateModal() {
    setEditingClient(null);
    setForm(emptyClient);
    setShowModal(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setForm({
      type: client.type as 'physique' | 'morale',
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      company_name: client.company_name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      country: client.country || 'Cameroun',
      notes: client.notes || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingClient) {
        await window.api.clients.update(editingClient.id, form);
      } else {
        await window.api.clients.create(form);
      }
      setShowModal(false);
      loadClients();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Êtes-vous sûr de vouloir archiver ce client ?')) {
      await window.api.clients.delete(id);
      loadClients();
    }
  }

  function getClientName(client: Client) {
    if (client.type === 'morale') return client.company_name || '—';
    return `${client.last_name || ''} ${client.first_name || ''}`.trim() || '—';
  }

  const filteredClients = clients;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouveau client
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client"
          description="Commencez par créer votre premier client pour gérer ses dossiers de sociétés."
          action={{ label: 'Créer un client', onClick: openCreateModal }}
        />
      ) : (
        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Nom / Raison sociale</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Ville</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="cursor-pointer" onClick={() => navigate(`/companies?client=${client.id}`)}>
                  <td>
                    <span className="text-xs font-mono text-neutral-500">{client.reference}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${client.type === 'morale' ? 'bg-violet-50' : 'bg-primary-50'}`}>
                        {client.type === 'morale'
                          ? <Building2 className="w-4 h-4 text-violet-600" />
                          : <Users className="w-4 h-4 text-primary-600" />}
                      </div>
                      <span className="font-medium">{getClientName(client)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={client.type === 'morale' ? 'badge-warning' : 'badge-primary'}>
                      {client.type === 'morale' ? 'Personne morale' : 'Personne physique'}
                    </span>
                  </td>
                  <td>
                    <div className="space-y-0.5">
                      {client.email && (
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Mail className="w-3 h-3" /> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-sm">{client.city || '—'}</td>
                  <td>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEditModal(client)} className="btn-ghost p-1.5">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingClient ? 'Modifier le client' : 'Nouveau client'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Type de client</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'physique' | 'morale' })}
              className="input-field"
            >
              <option value="physique">Personne physique</option>
              <option value="morale">Personne morale</option>
            </select>
          </div>

          {form.type === 'physique' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Nom</label>
                <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Prénom</label>
                <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input-field" required />
              </div>
            </div>
          ) : (
            <div>
              <label className="input-label">Raison sociale</label>
              <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="input-field" required />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">Téléphone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="input-label">Adresse</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Ville</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">Pays</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="input-label">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">
              {editingClient ? 'Enregistrer' : 'Créer le client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
