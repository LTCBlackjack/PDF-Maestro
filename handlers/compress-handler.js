const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

function findGhostscript() {
  // Check standard installation paths for Windows
  const gsRoot = 'C:\\Program Files\\gs';
  if (fs.existsSync(gsRoot)) {
    const versions = fs.readdirSync(gsRoot);
    if (versions.length > 0) {
      // Get the latest version folder
      versions.sort().reverse();
      const exePath = path.join(gsRoot, versions[0], 'bin', 'gswin64c.exe');
      if (fs.existsSync(exePath)) {
        return exePath;
      }
    }
  }
  // Fallback to system PATH
  return 'gswin64c.exe';
}

function compressPDF(inputPath, outputPath, quality) {
  return new Promise((resolve, reject) => {
    // quality should be 'screen', 'ebook', 'printer', or 'prepress'
    const gsPath = findGhostscript();
    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.5',
      `-dPDFSETTINGS=/${quality}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath
    ];

    execFile(gsPath, args, (error, stdout, stderr) => {
      if (error) {
        console.error('Ghostscript Error:', stderr);
        reject(new Error('Falló la compresión con Ghostscript. Asegúrate de tener Ghostscript instalado.'));
      } else {
        resolve(outputPath);
      }
    });
  });
}

module.exports = { compressPDF };
