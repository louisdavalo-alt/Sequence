const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Where user documents are auto-saved between sessions (per-OS user data folder,
// e.g. %APPDATA%/Séquence on Windows). This is what makes the app behave like a
// real desktop app: your work is still there when you reopen it, fully offline.
const STORE_PATH = path.join(app.getPath('userData'), 'sequence-data.json');

function readStore() {
  let raw;
  try {
    raw = fs.readFileSync(STORE_PATH, 'utf-8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Impossible de lire le fichier de sauvegarde locale :', err.message);
    }
    return null; // no saved data yet, or unreadable — app falls back to its built-in demo doc
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Le fichier de sauvegarde locale existe mais son contenu est invalide (JSON corrompu) :', err.message);
    return null;
  }
}

function writeStore(data) {
  // Basic shape check before persisting: a compromised or buggy renderer sending
  // garbage here shouldn't be able to corrupt the save file into something that
  // can't be read back at all next launch.
  if (!data || typeof data !== 'object' || !Array.isArray(data.documents)) {
    console.error('Sauvegarde ignorée : format de données inattendu.');
    return false;
  }
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data), 'utf-8');
    return true;
  } catch (err) {
    console.error('Échec de la sauvegarde locale :', err);
    return false;
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#181614',
    title: 'Séquence — Atelier de scénario',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  });

  mainWindow.setMenuBarVisibility(false); // clean, Word-like chrome — no default Electron dev menu

  // DevTools are hidden by default for a clean, Word-like window (no default
  // Electron menu bar either), but F12 / Ctrl+Shift+I still opens them —
  // useful for diagnosing a bug report without a special debug build.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isF12 = input.key === 'F12';
    const isCtrlShiftI = input.control && input.shift && input.key.toLowerCase() === 'i';
    if (isF12 || isCtrlShiftI) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Defense in depth: this window should never navigate to anything other than
  // its own bundled index.html. If a bug (or a future regression) ever let some
  // injected content call location.href = '...', this stops it from turning
  // into a full navigation to an attacker-controlled page.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  // Any attempt to open an external http(s) link opens it in the user's real
  // browser. Internal popups (about:blank / empty URL) used by the app's own
  // "export to PDF" print windows are still allowed to open as normal child
  // windows — the app never needs the network for those.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url && /^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC: local autosave/load, so your documents survive closing the app ---
// Sender check: only the app's own main window may use these channels — a
// belt-and-braces measure recommended for Electron IPC, even though nothing
// else in this app currently has the means to call them.
function isTrustedSender(event) {
  return !!mainWindow && event.sender === mainWindow.webContents;
}
ipcMain.handle('sequence:load', (event) => {
  if (!isTrustedSender(event)) return null;
  return readStore();
});
ipcMain.handle('sequence:save', (event, data) => {
  if (!isTrustedSender(event)) return false;
  return writeStore(data);
});
