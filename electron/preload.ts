import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Clients
  clients: {
    getAll: () => ipcRenderer.invoke('db:clients:getAll'),
    getById: (id: string) => ipcRenderer.invoke('db:clients:getById', id),
    create: (data: unknown) => ipcRenderer.invoke('db:clients:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('db:clients:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:clients:delete', id),
    search: (query: string) => ipcRenderer.invoke('db:clients:search', query),
  },
  // Companies
  companies: {
    getAll: () => ipcRenderer.invoke('db:companies:getAll'),
    getById: (id: string) => ipcRenderer.invoke('db:companies:getById', id),
    getByClient: (clientId: string) => ipcRenderer.invoke('db:companies:getByClient', clientId),
    create: (data: unknown) => ipcRenderer.invoke('db:companies:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('db:companies:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:companies:delete', id),
    search: (query: string) => ipcRenderer.invoke('db:companies:search', query),
  },
  // Shareholders
  shareholders: {
    getByCompany: (companyId: string) => ipcRenderer.invoke('db:shareholders:getByCompany', companyId),
    create: (data: unknown) => ipcRenderer.invoke('db:shareholders:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('db:shareholders:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:shareholders:delete', id),
  },
  // Managers
  managers: {
    getByCompany: (companyId: string) => ipcRenderer.invoke('db:managers:getByCompany', companyId),
    create: (data: unknown) => ipcRenderer.invoke('db:managers:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('db:managers:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('db:managers:delete', id),
  },
  // Templates
  templates: {
    getAll: () => ipcRenderer.invoke('templates:getAll'),
    getById: (id: string) => ipcRenderer.invoke('templates:getById', id),
    getByCategory: (category: string) => ipcRenderer.invoke('templates:getByCategory', category),
    getVariables: (id: string) => ipcRenderer.invoke('templates:getVariables', id),
  },
  // Document generation
  documents: {
    generate: (templateId: string, data: Record<string, unknown>) => ipcRenderer.invoke('doc:generate', templateId, data),
    preview: (templateId: string, data: Record<string, unknown>) => ipcRenderer.invoke('doc:preview', templateId, data),
    saveAs: (content: ArrayBuffer, defaultName: string) => ipcRenderer.invoke('doc:saveAs', Buffer.from(content), defaultName),
    openFile: (filePath: string) => ipcRenderer.invoke('doc:openFile', filePath),
    getAll: () => ipcRenderer.invoke('db:documents:getAll'),
    getByCompany: (companyId: string) => ipcRenderer.invoke('db:documents:getByCompany', companyId),
    create: (data: unknown) => ipcRenderer.invoke('db:documents:create', data),
    delete: (id: string) => ipcRenderer.invoke('db:documents:delete', id),
  },
  // Settings
  settings: {
    get: () => ipcRenderer.invoke('db:settings:get'),
    update: (data: unknown) => ipcRenderer.invoke('db:settings:update', data),
  },
  // Dashboard stats
  stats: {
    dashboard: () => ipcRenderer.invoke('db:stats:dashboard'),
  },
};

contextBridge.exposeInMainWorld('api', api);
