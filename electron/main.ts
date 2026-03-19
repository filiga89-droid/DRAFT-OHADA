import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { Database } from './database';
import { DocumentGenerator } from './document-generator';
import { TemplateManager } from './template-manager';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let db: Database;
let docGenerator: DocumentGenerator;
let templateManager: TemplateManager;

function getTemplatesPath(): string {
  if (isDev) {
    return path.join(__dirname, '..', 'templates');
  }
  return path.join(process.resourcesPath, 'templates');
}

function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'ohada-draft.db');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'OHADA Draft',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function setupIpcHandlers() {
  // ===== CLIENT HANDLERS =====
  ipcMain.handle('db:clients:getAll', () => db.getAllClients());
  ipcMain.handle('db:clients:getById', (_, id: string) => db.getClientById(id));
  ipcMain.handle('db:clients:create', (_, data) => db.createClient(data));
  ipcMain.handle('db:clients:update', (_, id: string, data) => db.updateClient(id, data));
  ipcMain.handle('db:clients:delete', (_, id: string) => db.deleteClient(id));
  ipcMain.handle('db:clients:search', (_, query: string) => db.searchClients(query));

  // ===== COMPANY HANDLERS =====
  ipcMain.handle('db:companies:getAll', () => db.getAllCompanies());
  ipcMain.handle('db:companies:getById', (_, id: string) => db.getCompanyById(id));
  ipcMain.handle('db:companies:getByClient', (_, clientId: string) => db.getCompaniesByClient(clientId));
  ipcMain.handle('db:companies:create', (_, data) => db.createCompany(data));
  ipcMain.handle('db:companies:update', (_, id: string, data) => db.updateCompany(id, data));
  ipcMain.handle('db:companies:delete', (_, id: string) => db.deleteCompany(id));
  ipcMain.handle('db:companies:search', (_, query: string) => db.searchCompanies(query));

  // ===== SHAREHOLDER HANDLERS =====
  ipcMain.handle('db:shareholders:getByCompany', (_, companyId: string) => db.getShareholdersByCompany(companyId));
  ipcMain.handle('db:shareholders:create', (_, data) => db.createShareholder(data));
  ipcMain.handle('db:shareholders:update', (_, id: string, data) => db.updateShareholder(id, data));
  ipcMain.handle('db:shareholders:delete', (_, id: string) => db.deleteShareholder(id));

  // ===== MANAGER/DIRECTOR HANDLERS =====
  ipcMain.handle('db:managers:getByCompany', (_, companyId: string) => db.getManagersByCompany(companyId));
  ipcMain.handle('db:managers:create', (_, data) => db.createManager(data));
  ipcMain.handle('db:managers:update', (_, id: string, data) => db.updateManager(id, data));
  ipcMain.handle('db:managers:delete', (_, id: string) => db.deleteManager(id));

  // ===== TEMPLATE HANDLERS =====
  ipcMain.handle('templates:getAll', () => templateManager.getAllTemplates());
  ipcMain.handle('templates:getById', (_, id: string) => templateManager.getTemplateById(id));
  ipcMain.handle('templates:getByCategory', (_, category: string) => templateManager.getTemplatesByCategory(category));
  ipcMain.handle('templates:getVariables', (_, id: string) => templateManager.getTemplateVariables(id));

  // ===== DOCUMENT GENERATION =====
  ipcMain.handle('doc:generate', async (_, templateId: string, data: Record<string, unknown>) => {
    try {
      const result = await docGenerator.generate(templateId, data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('doc:preview', async (_, templateId: string, data: Record<string, unknown>) => {
    try {
      const result = await docGenerator.preview(templateId, data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('doc:saveAs', async (_, content: Buffer, defaultName: string) => {
    if (!mainWindow) return { success: false, error: 'No window' };
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'Document Word', extensions: ['docx'] }],
    });
    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Annulé' };
    }
    const fs = await import('fs');
    fs.writeFileSync(result.filePath, Buffer.from(content));
    return { success: true, filePath: result.filePath };
  });

  ipcMain.handle('doc:openFile', async (_, filePath: string) => {
    shell.openPath(filePath);
  });

  // ===== DOCUMENT HISTORY =====
  ipcMain.handle('db:documents:getAll', () => db.getAllDocuments());
  ipcMain.handle('db:documents:getByCompany', (_, companyId: string) => db.getDocumentsByCompany(companyId));
  ipcMain.handle('db:documents:create', (_, data) => db.createDocument(data));
  ipcMain.handle('db:documents:delete', (_, id: string) => db.deleteDocument(id));

  // ===== SETTINGS =====
  ipcMain.handle('db:settings:get', () => db.getSettings());
  ipcMain.handle('db:settings:update', (_, data) => db.updateSettings(data));

  // ===== STATS =====
  ipcMain.handle('db:stats:dashboard', () => db.getDashboardStats());
}

app.whenReady().then(() => {
  db = new Database(getDbPath());
  templateManager = new TemplateManager(getTemplatesPath(), db);
  docGenerator = new DocumentGenerator(templateManager, getTemplatesPath());

  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  db?.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
