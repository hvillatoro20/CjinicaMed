// main.js (Proceso principal)
const { app, BrowserWindow } = require('electron')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

let db = new sqlite3.Database('./database.sqlite')

// Crear tablas si no existen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS doctores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    especialidad TEXT NOT NULL,
    clinica TEXT NOT NULL
  )`)
  
  db.run(`CREATE TABLE IF NOT EXISTS citas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente TEXT NOT NULL,
    doctor_id INTEGER NOT NULL,
    clinica TEXT NOT NULL,
    fecha TEXT NOT NULL,
    motivo TEXT NOT NULL,
    estado TEXT NOT NULL,
    FOREIGN KEY(doctor_id) REFERENCES doctores(id)
  )`)
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(createWindow)