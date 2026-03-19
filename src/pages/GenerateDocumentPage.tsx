import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, ChevronLeft, Building2, Download, Eye, FolderOpen, Check, AlertCircle } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  legal_form: string;
  document_type: string;
}

type Step = 'company' | 'template' | 'options' | 'preview' | 'done';

const CATEGORIES = [
  { value: 'constitution', label: 'Constitution' },
  { value: 'modification', label: 'Modification statutaire' },
  { value: 'cession', label: 'Cession de parts' },
  { value: 'nomination', label: 'Nomination / Révocation' },
  { value: 'dissolution', label: 'Dissolution / Liquidation' },
];

export default function GenerateDocumentPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(companyId ? 'template' : 'company');
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [shareholders, setShareholders] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Extra options
  const [options, setOptions] = useState({
    operation_city: '',
    operation_date: new Date().toISOString().slice(0, 10),
    notary_name: '',
    deposit_bank: '',
    deposit_date: '',
    custom_resolutions: '',
  });

  useEffect(() => {
    loadCompanies();
    loadTemplates();
    if (companyId) loadCompanyData(companyId);
  }, [companyId]);

  async function loadCompanies() {
    const data = await window.api.companies.getAll();
    setCompanies(data || []);
  }

  async function loadTemplates() {
    const data = await window.api.templates.getAll();
    setTemplates(data || []);
  }

  async function loadCompanyData(id: string) {
    const [comp, sh, mg] = await Promise.all([
      window.api.companies.getById(id),
      window.api.shareholders.getByCompany(id),
      window.api.managers.getByCompany(id),
    ]);
    setSelectedCompany(comp);
    setShareholders(sh || []);
    setManagers(mg || []);
  }

  async function selectCompany(company: any) {
    setSelectedCompany(company);
    await loadCompanyData(company.id);
    setStep('template');
  }

  function selectTemplate(template: Template) {
    setSelectedTemplate(template);
    setStep('options');
  }

  async function handlePreview() {
    if (!selectedTemplate || !selectedCompany) return;
    setLoading(true);
    setError('');
    try {
      const data = buildTemplateData();
      const result = await window.api.documents.preview(selectedTemplate.id, data);
      if (result.success) {
        setPreviewText(result.data || '');
        setStep('preview');
      } else {
        setError(result.error || 'Erreur de prévisualisation');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedTemplate || !selectedCompany) return;
    setGenerating(true);
    setError('');
    try {
      const data = buildTemplateData();
      const result = await window.api.documents.generate(selectedTemplate.id, data);
      if (result.success) {
        setGeneratedResult(result.data);
        setStep('done');
        // Record in history
        await window.api.documents.create({
          company_id: selectedCompany.id,
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.name,
          operation_type: selectedTemplate.category,
          file_name: `${selectedTemplate.name} - ${selectedCompany.name}.docx`,
          generated_by: 'utilisateur',
        });
      } else {
        setError(result.error || 'Erreur de génération');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveAs() {
    if (!generatedResult) return;
    const defaultName = `${selectedTemplate?.name} - ${selectedCompany?.name}.docx`;
    await window.api.documents.saveAs(generatedResult.buffer, defaultName);
  }

  function buildTemplateData(): Record<string, unknown> {
    return {
      // Company data
      company_name: selectedCompany.name,
      legal_form: selectedCompany.legal_form,
      legal_form_full: getLegalFormFull(selectedCompany.legal_form),
      capital_amount: selectedCompany.capital_amount,
      capital_currency: selectedCompany.capital_currency || 'FCFA',
      share_value: selectedCompany.share_value,
      total_shares: selectedCompany.total_shares,
      headquarters_address: selectedCompany.headquarters_address,
      headquarters_city: selectedCompany.headquarters_city,
      headquarters_country: selectedCompany.headquarters_country || 'Cameroun',
      business_object: selectedCompany.business_object,
      duration: selectedCompany.duration,
      rccm: selectedCompany.rccm,
      ifu: selectedCompany.ifu,
      fiscal_year_start: selectedCompany.fiscal_year_start,
      fiscal_year_end: selectedCompany.fiscal_year_end,
      jurisdiction: selectedCompany.jurisdiction || 'OHADA',
      // Shareholders
      shareholders: shareholders.map((s, i) => ({
        ...s,
        index: i + 1,
        display_name: s.type === 'morale' ? s.company_name || s.full_name : s.full_name,
      })),
      // Managers
      managers: managers.map((m, i) => ({
        ...m,
        index: i + 1,
        display_name: m.type === 'morale' ? m.company_name || m.full_name : m.full_name,
      })),
      // Options
      ...options,
      // Computed
      is_single_shareholder: shareholders.length === 1,
      is_multiple_shareholders: shareholders.length > 1,
      shareholders_count: shareholders.length,
      managers_count: managers.length,
      first_manager: managers[0] || {},
    };
  }

  function getLegalFormFull(lf: string) {
    const map: Record<string, string> = {
      SARL: 'Société à Responsabilité Limitée', SA: 'Société Anonyme',
      SAS: 'Société par Actions Simplifiée', SNC: 'Société en Nom Collectif',
      SCS: 'Société en Commandite Simple', SUARL: 'Société Unipersonnelle à Responsabilité Limitée',
    };
    return map[lf] || lf;
  }

  const filteredTemplates = categoryFilter
    ? templates.filter((t) => t.category === categoryFilter)
    : templates;

  const steps: { key: Step; label: string; num: number }[] = [
    { key: 'company', num: 1, label: 'Société' },
    { key: 'template', num: 2, label: 'Modèle' },
    { key: 'options', num: 3, label: 'Options' },
    { key: 'preview', num: 4, label: 'Aperçu' },
    { key: 'done', num: 5, label: 'Terminé' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  // Validation
  const warnings: string[] = [];
  if (selectedCompany) {
    if (shareholders.length === 0) warnings.push('Aucun associé enregistré pour cette société');
    if (managers.length === 0) warnings.push('Aucun dirigeant enregistré pour cette société');
    if (!selectedCompany.business_object) warnings.push('L\'objet social n\'est pas renseigné');
    if (!selectedCompany.headquarters_city) warnings.push('La ville du siège social n\'est pas renseignée');
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Générer un document</h1>
        <p className="page-subtitle">Assistant de génération de documents juridiques</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              i < currentStepIndex ? 'bg-primary-700 text-white' :
              i === currentStepIndex ? 'bg-primary-700 text-white ring-4 ring-primary-100' :
              'bg-neutral-200 text-neutral-500'
            }`}>
              {i < currentStepIndex ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-sm font-medium ${i <= currentStepIndex ? 'text-neutral-900' : 'text-neutral-400'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-neutral-300 mx-1" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step: Company */}
      {step === 'company' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Sélectionnez une société</h2>
          {companies.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-neutral-500 mb-4">Aucune société disponible</p>
              <button onClick={() => navigate('/companies')} className="btn-primary">Créer une société</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => selectCompany(company)}
                  className="card-hover p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{company.name}</h3>
                    <p className="text-xs text-neutral-500">{company.legal_form} · {company.headquarters_city || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Template */}
      {step === 'template' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Choisissez un modèle
              {selectedCompany && <span className="text-sm font-normal text-neutral-500 ml-2">pour {selectedCompany.name}</span>}
            </h2>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => setCategoryFilter('')} className={`px-3 py-1.5 rounded-full text-sm font-medium ${!categoryFilter ? 'bg-primary-700 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
              Tous
            </button>
            {CATEGORIES.map((cat) => (
              <button key={cat.value} onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${categoryFilter === cat.value ? 'bg-primary-700 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div key={template.id} onClick={() => selectTemplate(template)} className="card-hover p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{template.name}</h3>
                    <p className="text-sm text-neutral-500 mt-1">{template.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="badge-primary">{template.category}</span>
                      <span className="badge-neutral">{template.legal_form}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep('company')} className="btn-secondary"><ChevronLeft className="w-4 h-4" /> Retour</button>
          </div>
        </div>
      )}

      {/* Step: Options */}
      {step === 'options' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Options du document</h2>

          {warnings.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Points d'attention</h3>
              <ul className="space-y-1">
                {warnings.map((w, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-6 mb-4">
            <h3 className="font-semibold mb-4">Récapitulatif</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-neutral-500">Société :</span> <strong>{selectedCompany?.name}</strong></div>
              <div><span className="text-neutral-500">Forme :</span> <strong>{selectedCompany?.legal_form}</strong></div>
              <div><span className="text-neutral-500">Modèle :</span> <strong>{selectedTemplate?.name}</strong></div>
              <div><span className="text-neutral-500">Capital :</span> <strong>{selectedCompany?.capital_amount?.toLocaleString('fr-FR')} FCFA</strong></div>
              <div><span className="text-neutral-500">Associés :</span> <strong>{shareholders.length}</strong></div>
              <div><span className="text-neutral-500">Dirigeants :</span> <strong>{managers.length}</strong></div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Paramètres complémentaires</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Lieu de l'acte</label>
                <input type="text" value={options.operation_city} onChange={(e) => setOptions({ ...options, operation_city: e.target.value })}
                  placeholder={selectedCompany?.headquarters_city || 'Ex: Douala'} className="input-field" />
              </div>
              <div>
                <label className="input-label">Date de l'acte</label>
                <input type="date" value={options.operation_date} onChange={(e) => setOptions({ ...options, operation_date: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label">Notaire (si applicable)</label>
                <input type="text" value={options.notary_name} onChange={(e) => setOptions({ ...options, notary_name: e.target.value })}
                  placeholder="Maître..." className="input-field" />
              </div>
              <div>
                <label className="input-label">Banque de dépôt (constitution)</label>
                <input type="text" value={options.deposit_bank} onChange={(e) => setOptions({ ...options, deposit_bank: e.target.value })}
                  placeholder="Nom de la banque" className="input-field" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep('template')} className="btn-secondary"><ChevronLeft className="w-4 h-4" /> Retour</button>
            <button onClick={handlePreview} disabled={loading} className="btn-secondary">
              <Eye className="w-4 h-4" /> {loading ? 'Chargement...' : 'Aperçu'}
            </button>
            <button onClick={handleGenerate} disabled={generating} className="btn-primary">
              <Download className="w-4 h-4" /> {generating ? 'Génération...' : 'Générer le document'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Aperçu du document</h2>
          <div className="card p-6 mb-4">
            <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-mono">{previewText}</pre>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('options')} className="btn-secondary"><ChevronLeft className="w-4 h-4" /> Retour</button>
            <button onClick={handleGenerate} disabled={generating} className="btn-primary">
              <Download className="w-4 h-4" /> {generating ? 'Génération...' : 'Générer le document'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Document généré avec succès !</h2>
          <p className="text-neutral-500 mb-8">{selectedTemplate?.name} — {selectedCompany?.name}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleSaveAs} className="btn-primary">
              <Download className="w-4 h-4" /> Enregistrer sous...
            </button>
            <button onClick={() => { setStep(companyId ? 'template' : 'company'); setSelectedTemplate(null); setGeneratedResult(null); }} className="btn-secondary">
              <FileText className="w-4 h-4" /> Nouveau document
            </button>
            <button onClick={() => navigate('/history')} className="btn-ghost">
              Voir l'historique
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
