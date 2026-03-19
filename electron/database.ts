import BetterSqlite3 from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';

export class Database {
  private db: BetterSqlite3.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.db = new BetterSqlite3(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
    this.seedDefaults();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        reference TEXT UNIQUE,
        type TEXT NOT NULL DEFAULT 'physique' CHECK(type IN ('physique','morale')),
        first_name TEXT,
        last_name TEXT,
        company_name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        country TEXT DEFAULT 'Cameroun',
        notes TEXT,
        is_archived INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        legal_form TEXT NOT NULL DEFAULT 'SARL',
        rccm TEXT,
        tax_id TEXT,
        trade_register TEXT,
        headquarters TEXT,
        city TEXT,
        country TEXT DEFAULT 'Cameroun',
        postal_address TEXT,
        corporate_purpose TEXT,
        duration INTEGER DEFAULT 99,
        share_capital INTEGER DEFAULT 1000000,
        par_value INTEGER DEFAULT 10000,
        total_shares INTEGER DEFAULT 100,
        currency TEXT DEFAULT 'FCFA',
        fiscal_year_start TEXT DEFAULT '01/01',
        fiscal_year_end TEXT DEFAULT '31/12',
        formation_date TEXT,
        is_single_shareholder INTEGER DEFAULT 0,
        jurisdiction TEXT DEFAULT 'OHADA',
        status TEXT DEFAULT 'active' CHECK(status IN ('active','archived','dissolved')),
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS shareholders (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'physique' CHECK(type IN ('physique','morale')),
        first_name TEXT,
        last_name TEXT,
        company_name TEXT,
        nationality TEXT DEFAULT 'Camerounaise',
        date_of_birth TEXT,
        place_of_birth TEXT,
        id_type TEXT,
        id_number TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        phone TEXT,
        email TEXT,
        num_shares INTEGER NOT NULL DEFAULT 0,
        contribution_type TEXT DEFAULT 'numeraire' CHECK(contribution_type IN ('numeraire','nature','industrie')),
        contribution_amount INTEGER DEFAULT 0,
        contribution_description TEXT,
        is_manager INTEGER DEFAULT 0,
        representative_name TEXT,
        representative_title TEXT,
        rccm TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS directors (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'physique' CHECK(type IN ('physique','morale')),
        first_name TEXT,
        last_name TEXT,
        company_name TEXT,
        title TEXT NOT NULL DEFAULT 'Gérant',
        nationality TEXT DEFAULT 'Camerounaise',
        date_of_birth TEXT,
        place_of_birth TEXT,
        id_type TEXT,
        id_number TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        phone TEXT,
        email TEXT,
        appointment_date TEXT,
        duration TEXT,
        powers TEXT,
        is_shareholder INTEGER DEFAULT 0,
        shareholder_id TEXT REFERENCES shareholders(id),
        representative_name TEXT,
        representative_title TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'constitution',
        document_type TEXT NOT NULL,
        legal_form TEXT DEFAULT 'SARL',
        file_path TEXT NOT NULL,
        variables TEXT,
        is_active INTEGER DEFAULT 1,
        version INTEGER DEFAULT 1,
        tags TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS generated_documents (
        id TEXT PRIMARY KEY,
        template_id TEXT REFERENCES templates(id),
        company_id TEXT REFERENCES companies(id),
        file_name TEXT NOT NULL,
        file_path TEXT,
        data_snapshot TEXT,
        generated_by TEXT DEFAULT 'system',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY DEFAULT 'main',
        firm_name TEXT DEFAULT '',
        firm_address TEXT DEFAULT '',
        firm_city TEXT DEFAULT '',
        firm_country TEXT DEFAULT 'Cameroun',
        firm_phone TEXT DEFAULT '',
        firm_email TEXT DEFAULT '',
        firm_logo_path TEXT DEFAULT '',
        firm_rccm TEXT DEFAULT '',
        default_currency TEXT DEFAULT 'FCFA',
        default_jurisdiction TEXT DEFAULT 'OHADA',
        default_country TEXT DEFAULT 'Cameroun',
        footer_text TEXT DEFAULT '',
        disclaimer TEXT DEFAULT 'Ce logiciel est un outil d''assistance à la rédaction. Tout document généré doit être relu et validé par un professionnel du droit avant utilisation.',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  private seedDefaults() {
    const settingsRow = this.db.prepare('SELECT id FROM settings WHERE id = ?').get('main');
    if (!settingsRow) {
      this.db.prepare('INSERT INTO settings (id) VALUES (?)').run('main');
    }

    const templateCount = this.db.prepare('SELECT COUNT(*) as cnt FROM templates').get() as any;
    if (templateCount.cnt === 0) {
      this.seedTemplates();
    }
  }

  private seedTemplates() {
    const templates = [
      {
        id: uuid(),
        name: 'Statuts SARL',
        description: 'Modèle de statuts pour une Société à Responsabilité Limitée de droit OHADA',
        category: 'constitution',
        document_type: 'statuts',
        legal_form: 'SARL',
        file_path: 'statuts-sarl.docx',
        variables: JSON.stringify(['company.name', 'company.headquarters', 'company.corporate_purpose', 'company.share_capital', 'company.duration', 'shareholders', 'directors']),
        tags: 'constitution,sarl,statuts',
      },
      {
        id: uuid(),
        name: 'PV de Constitution SARL',
        description: 'Procès-verbal de l\'assemblée générale constitutive d\'une SARL',
        category: 'constitution',
        document_type: 'pv_constitution',
        legal_form: 'SARL',
        file_path: 'pv-constitution-sarl.docx',
        variables: JSON.stringify(['company.name', 'company.headquarters', 'company.share_capital', 'shareholders', 'directors']),
        tags: 'constitution,sarl,pv',
      },
      {
        id: uuid(),
        name: 'Déclaration de Souscription et de Versement',
        description: 'Déclaration de souscription et de versement du capital social',
        category: 'constitution',
        document_type: 'declaration_souscription',
        legal_form: 'SARL',
        file_path: 'declaration-souscription.docx',
        variables: JSON.stringify(['company.name', 'company.share_capital', 'shareholders']),
        tags: 'constitution,sarl,souscription',
      },
      {
        id: uuid(),
        name: 'Acte de Nomination du Gérant',
        description: 'Acte portant nomination du gérant de la SARL',
        category: 'constitution',
        document_type: 'nomination_gerant',
        legal_form: 'SARL',
        file_path: 'nomination-gerant.docx',
        variables: JSON.stringify(['company.name', 'directors']),
        tags: 'constitution,sarl,nomination,gérant',
      },
      {
        id: uuid(),
        name: 'PV d\'AGE - Modification Statutaire',
        description: 'Procès-verbal d\'assemblée générale extraordinaire pour modification des statuts',
        category: 'modification',
        document_type: 'pv_age',
        legal_form: 'SARL',
        file_path: 'pv-age-modification.docx',
        variables: JSON.stringify(['company.name', 'shareholders', 'resolutions']),
        tags: 'modification,sarl,age,pv',
      },
      {
        id: uuid(),
        name: 'Acte de Cession de Parts Sociales',
        description: 'Acte de cession de parts sociales entre associes ou a un tiers',
        category: 'cession',
        document_type: 'cession_parts',
        legal_form: 'SARL',
        file_path: 'cession-parts.docx',
        variables: JSON.stringify(['company.name', 'company.share_capital', 'cedant', 'cessionnaire', 'cession']),
        tags: 'cession,sarl,parts',
      },
    ];

    const stmt = this.db.prepare(`
      INSERT INTO templates (id, name, description, category, document_type, legal_form, file_path, variables, tags)
      VALUES (@id, @name, @description, @category, @document_type, @legal_form, @file_path, @variables, @tags)
    `);

    for (const t of templates) {
      stmt.run(t);
    }
  }

  // === CLIENTS ===
  getAllClients(): any[] {
    return this.db.prepare('SELECT * FROM clients WHERE is_archived = 0 ORDER BY updated_at DESC').all();
  }

  searchClients(query: string): any[] {
    return this.db.prepare(`
      SELECT * FROM clients WHERE is_archived = 0
      AND (first_name LIKE ? OR last_name LIKE ? OR company_name LIKE ? OR reference LIKE ?)
      ORDER BY updated_at DESC
    `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  getClientById(id: string): any {
    return this.db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  }

  createClient(data: any): any {
    const id = uuid();
    const ref = `CLI-${Date.now().toString(36).toUpperCase()}`;
    this.db.prepare(`
      INSERT INTO clients (id, reference, type, first_name, last_name, company_name, email, phone, address, city, country, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, ref, data.type || 'physique', data.first_name, data.last_name, data.company_name, data.email, data.phone, data.address, data.city, data.country || 'Cameroun', data.notes);
    return this.getClientById(id);
  }

  updateClient(id: string, data: any): any {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE clients SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
    return this.getClientById(id);
  }

  deleteClient(id: string): void {
    this.db.prepare('UPDATE clients SET is_archived = 1, updated_at = datetime(\'now\') WHERE id = ?').run(id);
  }

  // === COMPANIES ===
  getAllCompanies(): any[] {
    return this.db.prepare(`
      SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name, cl.company_name as client_company_name
      FROM companies c LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.status != 'archived' ORDER BY c.updated_at DESC
    `).all();
  }

  getCompanyById(id: string): any {
    return this.db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
  }

  getCompaniesByClient(clientId: string): any[] {
    return this.db.prepare('SELECT * FROM companies WHERE client_id = ? AND status != \'archived\' ORDER BY updated_at DESC').all(clientId);
  }

  searchCompanies(query: string): any[] {
    return this.db.prepare(`
      SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name, cl.company_name as client_company_name
      FROM companies c LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.status != 'archived' AND (c.name LIKE ? OR c.rccm LIKE ? OR c.city LIKE ?)
      ORDER BY c.updated_at DESC
    `).all(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  createCompany(data: any): any {
    const id = uuid();
    const totalShares = data.share_capital && data.par_value ? Math.floor(data.share_capital / data.par_value) : data.total_shares || 100;
    this.db.prepare(`
      INSERT INTO companies (id, client_id, name, legal_form, rccm, tax_id, headquarters, city, country, postal_address,
        corporate_purpose, duration, share_capital, par_value, total_shares, currency, fiscal_year_start, fiscal_year_end,
        formation_date, is_single_shareholder, jurisdiction, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.client_id, data.name, data.legal_form || 'SARL', data.rccm, data.tax_id,
      data.headquarters, data.city, data.country || 'Cameroun', data.postal_address,
      data.corporate_purpose, data.duration || 99, data.share_capital || 1000000,
      data.par_value || 10000, totalShares, data.currency || 'FCFA',
      data.fiscal_year_start || '01/01', data.fiscal_year_end || '31/12',
      data.formation_date, data.is_single_shareholder ? 1 : 0, data.jurisdiction || 'OHADA', data.notes);
    return this.getCompanyById(id);
  }

  updateCompany(id: string, data: any): any {
    if (data.share_capital && data.par_value) {
      data.total_shares = Math.floor(data.share_capital / data.par_value);
    }
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE companies SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
    return this.getCompanyById(id);
  }

  deleteCompany(id: string): void {
    this.db.prepare('UPDATE companies SET status = \'archived\', updated_at = datetime(\'now\') WHERE id = ?').run(id);
  }

  // === SHAREHOLDERS ===
  getShareholdersByCompany(companyId: string): any[] {
    return this.db.prepare('SELECT * FROM shareholders WHERE company_id = ? ORDER BY num_shares DESC').all(companyId);
  }

  getShareholder(id: string): any {
    return this.db.prepare('SELECT * FROM shareholders WHERE id = ?').get(id);
  }

  createShareholder(data: any): any {
    const id = uuid();
    this.db.prepare(`
      INSERT INTO shareholders (id, company_id, type, first_name, last_name, company_name, nationality, date_of_birth,
        place_of_birth, id_type, id_number, address, city, country, phone, email, num_shares,
        contribution_type, contribution_amount, contribution_description, is_manager, representative_name, representative_title, rccm)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.company_id, data.type || 'physique', data.first_name, data.last_name, data.company_name,
      data.nationality || 'Camerounaise', data.date_of_birth, data.place_of_birth, data.id_type, data.id_number,
      data.address, data.city, data.country, data.phone, data.email, data.num_shares || 0,
      data.contribution_type || 'numeraire', data.contribution_amount || 0, data.contribution_description,
      data.is_manager ? 1 : 0, data.representative_name, data.representative_title, data.rccm);
    return this.getShareholder(id);
  }

  updateShareholder(id: string, data: any): any {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE shareholders SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
    return this.getShareholder(id);
  }

  deleteShareholder(id: string): void {
    this.db.prepare('DELETE FROM shareholders WHERE id = ?').run(id);
  }

  // === MANAGERS (DIRECTORS) ===
  getManagersByCompany(companyId: string): any[] {
    return this.db.prepare('SELECT * FROM directors WHERE company_id = ? ORDER BY created_at ASC').all(companyId);
  }

  getManager(id: string): any {
    return this.db.prepare('SELECT * FROM directors WHERE id = ?').get(id);
  }

  createManager(data: any): any {
    const id = uuid();
    this.db.prepare(`
      INSERT INTO directors (id, company_id, type, first_name, last_name, company_name, title, nationality,
        date_of_birth, place_of_birth, id_type, id_number, address, city, country, phone, email,
        appointment_date, duration, powers, is_shareholder, shareholder_id, representative_name, representative_title)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.company_id, data.type || 'physique', data.first_name, data.last_name, data.company_name,
      data.title || 'Gerant', data.nationality || 'Camerounaise', data.date_of_birth, data.place_of_birth,
      data.id_type, data.id_number, data.address, data.city, data.country, data.phone, data.email,
      data.appointment_date, data.duration, data.powers, data.is_shareholder ? 1 : 0, data.shareholder_id,
      data.representative_name, data.representative_title);
    return this.getManager(id);
  }

  updateManager(id: string, data: any): any {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE directors SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
    return this.getManager(id);
  }

  deleteManager(id: string): void {
    this.db.prepare('DELETE FROM directors WHERE id = ?').run(id);
  }

  // === TEMPLATES ===
  getAllTemplates(): any[] {
    return this.db.prepare('SELECT * FROM templates WHERE is_active = 1 ORDER BY category, name').all();
  }

  getTemplateById(id: string): any {
    return this.db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
  }

  getTemplatesByCategory(category: string): any[] {
    return this.db.prepare('SELECT * FROM templates WHERE is_active = 1 AND category = ? ORDER BY category, name').all(category);
  }

  // Raw methods used by TemplateManager
  getAllTemplatesRaw(): any[] {
    return this.getAllTemplates();
  }

  getTemplateByIdRaw(id: string): any {
    return this.getTemplateById(id);
  }

  getTemplatesByCategoryRaw(category: string): any[] {
    return this.getTemplatesByCategory(category);
  }

  createTemplate(data: any): any {
    const id = uuid();
    this.db.prepare(`
      INSERT INTO templates (id, name, description, category, document_type, legal_form, file_path, variables, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.description, data.category, data.document_type, data.legal_form, data.file_path, data.variables, data.tags);
    return this.getTemplateById(id);
  }

  updateTemplate(id: string, data: any): any {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE templates SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
    return this.getTemplateById(id);
  }

  // === GENERATED DOCUMENTS ===
  getAllDocuments(): any[] {
    return this.db.prepare(`
      SELECT gd.*, t.name as template_name, c.name as company_name
      FROM generated_documents gd
      LEFT JOIN templates t ON gd.template_id = t.id
      LEFT JOIN companies c ON gd.company_id = c.id
      ORDER BY gd.created_at DESC LIMIT 100
    `).all();
  }

  getDocumentsByCompany(companyId: string): any[] {
    return this.db.prepare(`
      SELECT gd.*, t.name as template_name, c.name as company_name
      FROM generated_documents gd
      LEFT JOIN templates t ON gd.template_id = t.id
      LEFT JOIN companies c ON gd.company_id = c.id
      WHERE gd.company_id = ? ORDER BY gd.created_at DESC
    `).all(companyId);
  }

  createDocument(data: any): any {
    const id = uuid();
    this.db.prepare(`
      INSERT INTO generated_documents (id, template_id, company_id, file_name, file_path, data_snapshot, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.template_id, data.company_id, data.file_name, data.file_path, data.data_snapshot, data.generated_by || 'system');
    return this.db.prepare('SELECT * FROM generated_documents WHERE id = ?').get(id);
  }

  deleteDocument(id: string): void {
    this.db.prepare('DELETE FROM generated_documents WHERE id = ?').run(id);
  }

  // === SETTINGS ===
  getSettings(): any {
    return this.db.prepare('SELECT * FROM settings WHERE id = ?').get('main');
  }

  updateSettings(data: any): any {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    this.db.prepare(`UPDATE settings SET ${fields}, updated_at = datetime('now') WHERE id = 'main'`).run(...values);
    return this.getSettings();
  }

  // === DASHBOARD ===
  getDashboardStats(): any {
    const clients = (this.db.prepare('SELECT COUNT(*) as count FROM clients WHERE is_archived = 0').get() as any).count;
    const companies = (this.db.prepare('SELECT COUNT(*) as count FROM companies WHERE status != \'archived\'').get() as any).count;
    const documents = (this.db.prepare('SELECT COUNT(*) as count FROM generated_documents').get() as any).count;
    const templates = (this.db.prepare('SELECT COUNT(*) as count FROM templates WHERE is_active = 1').get() as any).count;
    const recentDocuments = this.db.prepare(`
      SELECT gd.*, t.name as template_name, c.name as company_name
      FROM generated_documents gd
      LEFT JOIN templates t ON gd.template_id = t.id
      LEFT JOIN companies c ON gd.company_id = c.id
      ORDER BY gd.created_at DESC LIMIT 5
    `).all();
    const recentCompanies = this.db.prepare(`
      SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name
      FROM companies c LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.status != 'archived' ORDER BY c.updated_at DESC LIMIT 5
    `).all();

    return { clients, companies, documents, templates, recentDocuments, recentCompanies };
  }

  // === CLOSE ===
  close(): void {
    this.db.close();
  }
}
