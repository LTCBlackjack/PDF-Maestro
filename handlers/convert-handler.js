const { exec } = require('child_process');
const path = require('path');

function pdfToWord(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Apunta al script de python en la misma carpeta que este handler
    const pyScript = path.join(__dirname, 'pdf2word.py');
    
    // Ejecuta python pasando las rutas absolutas entre comillas
    const command = `python "${pyScript}" "${inputPath}" "${outputPath}"`;
    
    exec(command, { encoding: 'utf-8', windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        console.error("Error executing Python script:", stderr || error.message);
        return reject(new Error("Falló la conversión (Asegúrate de tener Python instalado en tu sistema). Detalle: " + (stderr || error.message)));
      }
      resolve({ success: true, path: outputPath });
    });
  });
}

module.exports = { pdfToWord };
