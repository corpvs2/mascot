const electron = require('electron');
const {app, BrowserWindow, Menu, Tray, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');

const configPath = path.join(app.getPath("userData"), "image-list.json");

let mainWindow;
let tray;

function createWindow () {
  tray = new Tray("./icon.png");
  const contextMenu = Menu.buildFromTemplate([
    {label: "─固定 (保存)", type: "radio", click: function () {
      mainWindow.webContents.send('async-request', ["listFromDOM",""]);
      mainWindow.webContents.send('async-request', ["transparent", true]);
      mainWindow.setIgnoreMouseEvents(true);
      mainWindow.setAlwaysOnTop(true);
    }},
    {label: "─編集", type: "radio", click: function () {
      mainWindow.webContents.send('async-request', ["transparent", false]);
      mainWindow.setIgnoreMouseEvents(false);
      mainWindow.setAlwaysOnTop(false);
    }},
    {label: "終了", click: function () {

      mainWindow.close();
    }},
  ]);
  tray.setToolTip("Mascot");
  tray.setContextMenu(contextMenu);

  mainWindow = new BrowserWindow(
    {
      "alwaysOnTop": true,
      "transparent": true,
      "skipTaskbar": true,
      "frame": false,
      "resizable": false,
      "show": false,
    }
  )

  mainWindow.setIgnoreMouseEvents(true);
  mainWindow.maximize();
  mainWindow.loadFile('index.html');
  mainWindow.show();

  mainWindow.on('closed', function () {
    mainWindow = null;
  })
}

app.on('ready', createWindow);

// レンダラプロセスから投げられたリクエストがここに来る
ipcMain.on('async-request', function(event, arg) {
  if (arg.length != 2){
    console.warn("Invalid format message.");
    return;
  }
  var index = arg[0];
  var argument = arg[1];
  console.log("[IPC-REQUEST] index:", index, ", argument:", argument);

  switch (index) {
  case "listFromFile":
    //event.sender.send('async-reply', [index, [{"path": "C:\\Users\\pioka\\Pictures\\j_m_TG-005_Grimoire-of-Darkness.png","top": 200,"left": 200,"width": 200,"height": 200}]]);
    var list = [];
    try { list = JSON.parse(fs.readFileSync(configPath, 'utf8')); }
    catch(e) { list = []; }
    event.sender.send("async-reply", [index, list]);
    break;
  default:
    break;
  }
});

// 投げたリクエストに対するレンダラプロセスからの応答がここに来る
ipcMain.on('async-reply', function(event, arg) {
  if (arg.length != 2){
    console.warn("Invalid format message.");
    return;
  }
  var index = arg[0];
  var responce = arg[1];
  console.log("[IPC-REPLY] index:", index, ", responce:", responce);

  switch (index) {
  case "listFromDOM":
    fs.writeFileSync(configPath, JSON.stringify(responce));
    break;
  default:
    break;
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
})
