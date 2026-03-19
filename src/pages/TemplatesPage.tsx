import { useEffect, useState } from 'react';
import { FolderOpen, FileText, Search } from 'lucide-react';
import EmptyState from '../components/EmptyState';

const CATEGORIES = [
  { value: '', label: 'Tous' },
  { value: 'constitution', label: 'Constitution' },
  { value: 'modification', label: 'Modification' },
  { value: 'cession', label: 'Cession' },
  { value: 'nomination', label: 'Nomination' },
  { value: 'dissolution', label: 'Dissolution' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    try {
      const data = await window.api.templates.getAll();
      setTemplates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = templates.filter((t) => {
    if (filter && t.category !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bibliothèque de modèles</h1>
        <p className="page-subtitle">{templates.length} modèle{templates.length !== 1 ? 's' : ''} disponible{templates.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder="Rechercher un modèle..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => setFilter(cat.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === cat.value ? 'bg-primary-700 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Aucun modèle trouvé" description="Aucun modèle ne correspond à vos critères de recherche." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <div key={template.id} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">{template.name}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{template.description}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="badge-primary">{template.category}</span>
                <span className="badge-neutral">{template.legal_form}</span>
                <span className="badge-success">v{template.version || 1}</span>
              </div>
              {template.variables && template.variables.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <p className="text-xs text-neutral-400 mb-1">Variables :</p>
                  <div className="flex gap-1 flex-wrap">
                    {template.variables.slice(0, 5).map((v: string) => (
                      <code key={v} className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">{`{{${v}}}`}</code>
                    ))}
                    {template.variables.length > 5 && <span className="text-xs text-neutral-400">+{template.variables.length - 5}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
