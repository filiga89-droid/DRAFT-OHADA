export interface ClientData {
  name: string;
  type: 'physique' | 'morale';
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface CompanyData {
  client_id: string;
  name: string;
  legal_form: string;
  rccm?: string;
  ifu?: string;
  capital_amount: number;
  capital_currency: string;
  share_value: number;
  total_shares: number;
  headquarters_address: string;
  headquarters_city: string;
  headquarters_country: string;
  business_object: string;
  duration: number;
  fiscal_year_start: string;
  fiscal_year_end: string;
  creation_date?: string;
  status: string;
  jurisdiction: string;
  notes?: string;
}

export interface ShareholderData {
  company_id: string;
  type: 'physique' | 'morale';
  full_name: string;
  nationality?: string;
  address?: string;
  id_number?: string;
  id_type?: string;
  birth_date?: string;
  birth_place?: string;
  shares_count: number;
  shares_amount: number;
  contribution_type: 'numeraire' | 'nature' | 'industrie';
  contribution_description?: string;
  is_founding: boolean;
  representative_name?: string;
  representative_title?: string;
  legal_form?: string;
  rccm?: string;
}

export interface ManagerData {
  company_id: string;
  type: 'physique' | 'morale';
  full_name: string;
  title: string;
  nationality?: string;
  address?: string;
  id_number?: string;
  birth_date?: string;
  birth_place?: string;
  appointment_date?: string;
  duration?: string;
  powers?: string;
  is_statutory: boolean;
  representative_name?: string;
  representative_title?: string;
}

export interface DocumentRecord {
  id: string;
  company_id: string;
  template_id: string;
  template_name: string;
  operation_type: string;
  file_name: string;
  file_path?: string;
  generated_by: string;
  created_at: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  legal_form: string;
  operation_type: string;
  file_name: string;
  version: string;
  is_active: boolean;
  variables: string[];
}

export interface DashboardStats {
  totalClients: number;
  totalCompanies: number;
  totalDocuments: number;
  recentDocuments: DocumentRecord[];
  recentCompanies: Array<{ id: string; name: string; legal_form: string; created_at: string }>;
}

export interface CabinetSettings {
  cabinet_name: string;
  cabinet_address: string;
  cabinet_phone: string;
  cabinet_email: string;
  cabinet_logo_path: string;
  default_jurisdiction: string;
  default_currency: string;
  footer_text: string;
}

interface ElectronAPI {
  clients: {
    getAll: () => Promise<any[]>;
    getById: (id: string) => Promise<any>;
    create: (data: ClientData) => Promise<any>;
    update: (id: string, data: Partial<ClientData>) => Promise<any>;
    delete: (id: string) => Promise<void>;
    search: (query: string) => Promise<any[]>;
  };
  companies: {
    getAll: () => Promise<any[]>;
    getById: (id: string) => Promise<any>;
    getByClient: (clientId: string) => Promise<any[]>;
    create: (data: CompanyData) => Promise<any>;
    update: (id: string, data: Partial<CompanyData>) => Promise<any>;
    delete: (id: string) => Promise<void>;
    search: (query: string) => Promise<any[]>;
  };
  shareholders: {
    getByCompany: (companyId: string) => Promise<any[]>;
    create: (data: ShareholderData) => Promise<any>;
    update: (id: string, data: Partial<ShareholderData>) => Promise<any>;
    delete: (id: string) => Promise<void>;
  };
  managers: {
    getByCompany: (companyId: string) => Promise<any[]>;
    create: (data: ManagerData) => Promise<any>;
    update: (id: string, data: Partial<ManagerData>) => Promise<any>;
    delete: (id: string) => Promise<void>;
  };
  templates: {
    getAll: () => Promise<TemplateInfo[]>;
    getById: (id: string) => Promise<TemplateInfo>;
    getByCategory: (category: string) => Promise<TemplateInfo[]>;
    getVariables: (id: string) => Promise<string[]>;
  };
  documents: {
    generate: (templateId: string, data: Record<string, unknown>) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>;
    preview: (templateId: string, data: Record<string, unknown>) => Promise<{ success: boolean; data?: string; error?: string }>;
    saveAs: (content: ArrayBuffer, defaultName: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    openFile: (filePath: string) => Promise<void>;
    getAll: () => Promise<DocumentRecord[]>;
    getByCompany: (companyId: string) => Promise<DocumentRecord[]>;
    create: (data: any) => Promise<DocumentRecord>;
    delete: (id: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<CabinetSettings>;
    update: (data: Partial<CabinetSettings>) => Promise<CabinetSettings>;
  };
  stats: {
    dashboard: () => Promise<DashboardStats>;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
