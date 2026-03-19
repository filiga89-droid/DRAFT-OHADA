import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { TemplateManager } from './template-manager';

interface GenerateResult {
  buffer: Buffer;
  fileName: string;
}

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function numberToWordsFr(n: number): string {
  if (n === 0) return 'zéro';
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  function convertHundreds(num: number): string {
    let result = '';
    if (num >= 100) {
      if (Math.floor(num / 100) > 1) result += units[Math.floor(num / 100)] + ' ';
      result += 'cent';
      if (num % 100 === 0 && Math.floor(num / 100) > 1) result += 's';
      if (num % 100 !== 0) result += ' ';
      num %= 100;
    }
    if (num >= 20) {
      const t = Math.floor(num / 10);
      if (t === 7 || t === 9) {
        result += tens[t] + '-';
        num = (t === 7 ? 10 : 10) + (num % 10);
        if (num < 20) { result += units[num]; return result; }
      } else {
        result += tens[t];
        if (num % 10 === 0 && t === 8) result += 's';
        if (num % 10 !== 0) result += '-';
        num %= 10;
      }
    }
    if (num > 0 && num < 20) result += units[num];
    return result;
  }

  if (n < 1000) return convertHundreds(n);

  let result = '';
  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    result += convertHundreds(millions) + ' million';
    if (millions > 1) result += 's';
    n %= 1000000;
    if (n > 0) result += ' ';
  }
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    if (thousands === 1) result += 'mille';
    else result += convertHundreds(thousands) + ' mille';
    n %= 1000;
    if (n > 0) result += ' ';
  }
  if (n > 0) result += convertHundreds(n);
  return result;
}

export class DocumentGenerator {
  private templateManager: TemplateManager;
  private templatesDir: string;

  constructor(templateManager: TemplateManager, templatesDir: string) {
    this.templateManager = templateManager;
    this.templatesDir = templatesDir;
  }

  async generate(templateId: string, data: Record<string, unknown>): Promise<GenerateResult> {
    const template = this.templateManager.getTemplateById(templateId);
    if (!template) throw new Error(`Modèle introuvable: ${templateId}`);

    const templatePath = this.templateManager.getTemplatePath(template.file_path);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Fichier template introuvable: ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });

    const enrichedData = this.enrichData(data);
    doc.render(enrichedData);

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const fileName = `${template.name} - ${(data.company_name as string) || 'document'}.docx`;
    return { buffer, fileName };
  }

  async preview(templateId: string, data: Record<string, unknown>): Promise<string> {
    const template = this.templateManager.getTemplateById(templateId);
    if (!template) throw new Error(`Modèle introuvable: ${templateId}`);

    const enrichedData = this.enrichData(data);

    let previewText = `=== ${template.name} ===\n\n`;
    previewText += `Catégorie: ${template.category}\n`;
    previewText += `Forme juridique: ${template.legal_form}\n\n`;
    previewText += `--- Variables utilisées ---\n`;
    for (const [key, value] of Object.entries(enrichedData)) {
      if (typeof value === 'string' || typeof value === 'number') {
        previewText += `${key}: ${value}\n`;
      } else if (Array.isArray(value)) {
        previewText += `${key}: [${value.length} éléments]\n`;
      }
    }
    return previewText;
  }

  private enrichData(data: Record<string, unknown>): Record<string, unknown> {
    const enriched = { ...data };

    // Format capital amounts
    if (typeof enriched.capital_amount === 'number') {
      enriched.capital_amount_formatted = formatNumber(enriched.capital_amount as number);
      enriched.capital_amount_words = numberToWordsFr(enriched.capital_amount as number);
    }
    if (typeof enriched.share_value === 'number') {
      enriched.share_value_formatted = formatNumber(enriched.share_value as number);
      enriched.share_value_words = numberToWordsFr(enriched.share_value as number);
    }
    if (typeof enriched.total_shares === 'number') {
      enriched.total_shares_formatted = formatNumber(enriched.total_shares as number);
      enriched.total_shares_words = numberToWordsFr(enriched.total_shares as number);
    }

    // Enrich shareholders
    if (Array.isArray(enriched.shareholders)) {
      enriched.shareholders = (enriched.shareholders as any[]).map((s, i) => ({
        ...s,
        index: i + 1,
        shares_amount_formatted: formatNumber(s.shares_amount || 0),
        shares_amount_words: numberToWordsFr(s.shares_amount || 0),
        shares_count_formatted: formatNumber(s.shares_count || 0),
        contribution_amount_formatted: formatNumber(s.contribution_amount || s.shares_amount || 0),
        is_physique: s.type === 'physique',
        is_morale: s.type === 'morale',
        display_name: s.type === 'morale' ? s.company_name || s.full_name : s.full_name,
      }));
      enriched.shareholders_count = (enriched.shareholders as any[]).length;
      enriched.is_single_shareholder = (enriched.shareholders as any[]).length === 1;
      enriched.is_multiple_shareholders = (enriched.shareholders as any[]).length > 1;

      // Capital distribution
      const totalContrib = (enriched.shareholders as any[]).reduce((sum: number, s: any) => sum + (s.shares_amount || 0), 0);
      enriched.total_contributions = totalContrib;
      enriched.total_contributions_formatted = formatNumber(totalContrib);
      enriched.total_contributions_words = numberToWordsFr(totalContrib);

      enriched.has_nature_contributions = (enriched.shareholders as any[]).some((s: any) => s.contribution_type === 'nature');
      enriched.has_only_numeraire = (enriched.shareholders as any[]).every((s: any) => s.contribution_type === 'numeraire');
    }

    // Enrich managers
    if (Array.isArray(enriched.managers)) {
      enriched.managers = (enriched.managers as any[]).map((m, i) => ({
        ...m,
        index: i + 1,
        is_physique: m.type === 'physique',
        is_morale: m.type === 'morale',
        display_name: m.type === 'morale' ? m.company_name || m.full_name : m.full_name,
      }));
      enriched.managers_count = (enriched.managers as any[]).length;
      enriched.first_manager = (enriched.managers as any[])[0] || {};
    }

    // Date helpers
    enriched.current_date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    enriched.current_year = new Date().getFullYear().toString();

    // Legal form helpers
    const lf = (enriched.legal_form as string || '').toUpperCase();
    enriched.is_sarl = lf === 'SARL';
    enriched.is_sa = lf === 'SA';
    enriched.is_sas = lf === 'SAS';
    enriched.is_snc = lf === 'SNC';
    enriched.is_scs = lf === 'SCS';
    enriched.legal_form_full = {
      'SARL': 'Société à Responsabilité Limitée',
      'SA': 'Société Anonyme',
      'SAS': 'Société par Actions Simplifiée',
      'SNC': 'Société en Nom Collectif',
      'SCS': 'Société en Commandite Simple',
    }[lf] || enriched.legal_form;

    return enriched;
  }
}
