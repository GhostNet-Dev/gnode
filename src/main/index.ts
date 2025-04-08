import BootFactory from '@Commons/bootfactory';
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { RouteType } from 'src/types/routetypes';

let mainWindow: BrowserWindow | null = null;
const factory = new BootFactory()

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    ipcMain.on(RouteType.LoadKeysReq, async (evt, id: string, pass: string) => {
        const ret = await factory.route.LoadKeys(id, pass)
        evt.reply(RouteType.LoadKeysRes, ret)
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

