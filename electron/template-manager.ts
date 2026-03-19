import fs from 'fs';
import path from 'path';
import { Database } from './database';

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  legal_form: string;
  document_type: string;
  file_name: string;
  file_path: string;
  variables: string[];
  tags: string[];
  version: number;
  is_active: boolean;
}

export class TemplateManager {
  private templatesDir: string;
  private db: Database;

  constructor(templatesDir: string, db: Database) {
    this.templatesDir = templatesDir;
    this.db = db;
  }

  getAllTemplates(): TemplateInfo[] {
    const rows = this.db.getAllTemplatesRaw();
    return rows.map(this.mapTemplate);
  }

  getTemplateById(id: string): TemplateInfo | null {
    const row = this.db.getTemplateByIdRaw(id);
    if (!row) return null;
    return this.mapTemplate(row);
  }

  getTemplatesByCategory(category: string): TemplateInfo[] {
    const rows = this.db.getTemplatesByCategoryRaw(category);
    return rows.map(this.mapTemplate);
  }

  getTemplateVariables(id: string): string[] {
    const template = this.getTemplateById(id);
    if (!template) return [];
    return template.variables;
  }

  getTemplatePath(filePathOrName: string): string {
    if (path.isAbsolute(filePathOrName) && fs.existsSync(filePathOrName)) {
      return filePathOrName;
    }
    return path.join(this.templatesDir, filePathOrName);
  }

  templateExists(filePathOrName: string): boolean {
    return fs.existsSync(this.getTemplatePath(filePathOrName));
  }

  private mapTemplate(row: any): TemplateInfo {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category,
      legal_form: row.legal_form || 'SARL',
      document_type: row.document_type,
      file_name: row.file_path,
      file_path: row.file_path,
      variables: row.variables ? JSON.parse(row.variables) : [],
      tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
      version: row.version || 1,
      is_active: row.is_active === 1,
    };
  }
}
