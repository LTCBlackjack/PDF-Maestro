const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Encontrar Ghostscript
function getGhostscriptPath() {
    const isWin = process.platform === "win32";
    if (isWin) {
        const paths = [
            'C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe',
            'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
            'C:\\Program Files\\gs\\gs10.02.0\\bin\\gswin64c.exe',
            'C:\\Program Files (x86)\\gs\\gs10.02.1\\bin\\gswin32c.exe'
        ];
        // En un entorno de producción, instalaríamos Ghostscript localmente en la app
        // o usaríamos un paquete portable.
        for (let p of paths) {
            if (fs.existsSync(p)) return `"${p}"`;
        }
        return 'gswin64c'; // fallback to PATH
    }
    return 'gs';
}

async function protectPDF(inputPath, password, options) {
    return new Promise((resolve, reject) => {
        const gsPath = getGhostscriptPath();
        const dir = path.dirname(inputPath);
        const ext = path.extname(inputPath);
        const base = path.basename(inputPath, ext);
        const outputPath = path.join(dir, `${base}_protegido${ext}`);

        // Opciones de impresion/copia (Ghostscript maneja los permisos mediante OwnerPassword)
        // Por simplicidad en MVP, solo bloqueamos la lectura con UserPassword
        // Implementación avanzada requeriría calcular valores bitmask de PDF, 
        // pero GS requiere especificar -sOwnerPassword y -dPermissions.
        // Asumiendo un Permission general de lectura.
        
        let permissions = -4; // basic permissions
        if (!options.print) permissions &= ~2052; // bit 3 (4) y 12 (2048)
        if (!options.copy) permissions &= ~16; // bit 5 (16)
        
        const ownerPassword = "admin_" + Math.random().toString(36).substr(2, 5); // random owner pwd

        const args = [
            gsPath,
            '-q',
            '-dNOPAUSE',
            '-dBATCH',
            '-sDEVICE=pdfwrite',
            `-sOutputFile="${outputPath}"`,
            `-sOwnerPassword="${ownerPassword}"`,
            `-sUserPassword="${password}"`, // Esto cifra la apertura
            `-dPermissions=${permissions}`,
            `"${inputPath}"`
        ];

        const process = exec(args.join(' '), (error, stdout, stderr) => {
            if (error) {
                console.error(`Error de Ghostscript [Protect]: ${stderr}`);
                return reject(error);
            }
            if (!fs.existsSync(outputPath)) {
                return reject(new Error("El archivo de salida no fue generado."));
            }
            resolve(outputPath);
        });
    });
}

async function unprotectPDF(inputPath, currentPassword) {
    return new Promise((resolve, reject) => {
        const gsPath = getGhostscriptPath();
        const dir = path.dirname(inputPath);
        const ext = path.extname(inputPath);
        const base = path.basename(inputPath, ext);
        const outputPath = path.join(dir, `${base}_desbloqueado${ext}`);

        // Para abrir el PDF, enviamos la contraseña actual a Ghostscript mediante -sPDFPassword
        const args = [
            gsPath,
            '-q',
            '-dNOPAUSE',
            '-dBATCH',
            '-sDEVICE=pdfwrite',
            `-sPDFPassword="${currentPassword}"`, // Pass original password
            `-sOutputFile="${outputPath}"`,
            `"${inputPath}"`
        ];

        const process = exec(args.join(' '), (error, stdout, stderr) => {
            if (error) {
                if(stderr.includes('password')) {
                    return reject(new Error('Contraseña incorrecta.'));
                }
                console.error(`Error de Ghostscript [Unprotect]: ${stderr}`);
                return reject(error);
            }
            if (!fs.existsSync(outputPath)) {
                return reject(new Error("El archivo de salida no fue generado."));
            }
            resolve(outputPath);
        });
    });
}

module.exports = {
    protectPDF,
    unprotectPDF
};
