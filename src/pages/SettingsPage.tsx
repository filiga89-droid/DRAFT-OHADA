import { useEffect, useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const [form, setForm] = useState({
    cabinet_name: '',
    cabinet_address: '',
    cabinet_phone: '',
    cabinet_email: '',
    cabinet_logo_path: '',
    default_jurisdiction: 'OHADA',
    default_currency: 'FCFA',
    footer_text: '',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const data = await window.api.settings.get();
      if (data) setForm({ ...form, ...data });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await window.api.settings.update(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Configuration du cabinet et préférences</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            Informations du cabinet
          </h2>
          <div className="space-y-4">
            <div>
              <label className="input-label">Nom du cabinet</label>
              <input type="text" value={form.cabinet_name} onChange={(e) => setForm({ ...form, cabinet_name: e.target.value })} className="input-field" placeholder="Cabinet d'Avocats XYZ" />
            </div>
            <div>
              <label className="input-label">Adresse</label>
              <input type="text" value={form.cabinet_address} onChange={(e) => setForm({ ...form, cabinet_address: e.target.value })} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Téléphone</label>
                <input type="text" value={form.cabinet_phone} onChange={(e) => setForm({ ...form, cabinet_phone: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input type="email" value={form.cabinet_email} onChange={(e) => setForm({ ...form, cabinet_email: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Préférences par défaut</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Juridiction par défaut</label>
                <select value={form.default_jurisdiction} onChange={(e) => setForm({ ...form, default_jurisdiction: e.target.value })} className="input-field">
                  <option value="OHADA">OHADA</option>
                </select>
              </div>
              <div>
                <label className="input-label">Devise par défaut</label>
                <select value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value })} className="input-field">
                  <option value="FCFA">FCFA</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="input-label">Texte de pied de page (documents)</label>
              <textarea value={form.footer_text} onChange={(e) => setForm({ ...form, footer_text: e.target.value })} className="input-field" rows={3} placeholder="Texte qui apparaîtra en bas des documents générés..." />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">
            {saved ? <><Check className="w-4 h-4" /> Enregistré</> : <><Save className="w-4 h-4" /> Enregistrer les paramètres</>}
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-neutral-100 rounded-lg max-w-2xl">
        <h3 className="text-sm font-semibold text-neutral-700 mb-1">À propos</h3>
        <p className="text-sm text-neutral-500">
          OHADA Draft v1.0.0 — Outil d'assistance à la rédaction de documents juridiques OHADA.<br />
          Ce logiciel ne fournit pas de conseil juridique. Tout document généré doit être validé par un professionnel du droit.
        </p>
      </div>
    </div>
  );
}
