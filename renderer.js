const { ipcRenderer } = require('electron')
const db = require('electron').remote.getGlobal('db')

class CitaManager {
    constructor() {
        this.currentClinica = 'clinica1'
        this.initEventListeners()
        this.loadDoctores()
        this.loadCitas()
    }

    initEventListeners() {
        document.getElementById('select-clinica').addEventListener('change', (e) => {
            this.currentClinica = e.target.value
            this.loadCitas()
        })
        
        // Más listeners...
    }

    loadDoctores() {
        db.all("SELECT * FROM doctores WHERE clinica = ?", [this.currentClinica], (err, rows) => {
            if (err) {
                console.error(err)
                return
            }
            this.renderDoctores(rows)
        })
    }

    loadCitas() {
        const sql = `
            SELECT c.*, d.nombre as doctor_nombre 
            FROM citas c
            JOIN doctores d ON c.doctor_id = d.id
            WHERE c.clinica = ?
            ORDER BY c.fecha
        `
        
        db.all(sql, [this.currentClinica], (err, rows) => {
            if (err) {
                console.error(err)
                return
            }
            this.renderCitas(rows)
        })
    }

    agregarCita(citaData) {
        return new Promise((resolve, reject) => {
            // Validar disponibilidad primero
            const checkSql = `
                SELECT COUNT(*) as count 
                FROM citas 
                WHERE clinica = ? AND fecha = ? AND estado != 'cancelada'
            `
            
            db.get(checkSql, [citaData.clinica, citaData.fecha], (err, row) => {
                if (err) return reject(err)
                
                if (row.count > 0) {
                    return reject(new Error('Ya existe una cita programada en esta clínica a la misma hora'))
                }
                
                // Verificar que el doctor no tenga otra cita a la misma hora
                db.get(
                    "SELECT COUNT(*) as count FROM citas WHERE doctor_id = ? AND fecha = ?",
                    [citaData.doctor_id, citaData.fecha],
                    (err, row) => {
                        if (err) return reject(err)
                        if (row.count > 0) {
                            return reject(new Error('El doctor ya tiene una cita a esta hora'))
                        }
                        
                        // Insertar la nueva cita
                        const sql = `
                            INSERT INTO citas 
                            (paciente, doctor_id, clinica, fecha, motivo, estado)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `
                        
                        db.run(sql, [
                            citaData.paciente,
                            citaData.doctor_id,
                            citaData.clinica,
                            citaData.fecha,
                            citaData.motivo,
                            citaData.estado || 'pendiente'
                        ], function(err) {
                            if (err) return reject(err)
                            resolve(this.lastID)
                        })
                    }
                )
            })
        })
    }

    // Más métodos...
}

document.addEventListener('DOMContentLoaded', () => {
    window.citaManager = new CitaManager()
})