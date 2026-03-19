import { useEffect, useState } from 'react';
import { Clock, FileText, Download, Trash2, FolderOpen } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function HistoryPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    try {
      const data = await window.api.documents.getAll();
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Supprimer cette entrée de l\'historique ?')) {
      await window.api.documents.delete(id);
      loadHistory();
    }
  }

  async function handleOpen(filePath: string) {
    if (filePath) {
      await window.api.documents.openFile(filePath);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Historique des documents</h1>
        <p className="page-subtitle">{documents.length} document{documents.length !== 1 ? 's' : ''} généré{documents.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" /></div>
      ) : documents.length === 0 ? (
        <EmptyState icon={Clock} title="Aucun historique" description="Les documents que vous générerez apparaîtront ici." />
      ) : (
        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Société</th>
                <th>Modèle</th>
                <th>Date</th>
                <th>Généré par</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-500" />
                      <span className="font-medium">{doc.file_name}</span>
                    </div>
                  </td>
                  <td>{doc.company_name || '—'}</td>
                  <td><span className="badge-primary">{doc.template_name || doc.operation_type}</span></td>
                  <td className="text-sm">{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="text-sm">{doc.generated_by || 'système'}</td>
                  <td>
                    <div className="flex gap-1">
                      {doc.file_path && (
                        <button onClick={() => handleOpen(doc.file_path)} className="btn-ghost p-1.5" title="Ouvrir">
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(doc.id)} className="btn-ghost p-1.5 text-red-500" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
