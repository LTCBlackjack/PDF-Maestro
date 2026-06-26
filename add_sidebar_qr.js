const fs = require('fs');
const files = ['index.html', 'merge.html', 'split.html', 'convert.html', 'compress.html', 'history.html'];

const navLink = `
    <a href="qr.html" class="nav-item">
      <div class="nav-icon"><svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></div> Generar QR
    </a>
    <div class="sidebar-section-label">`;

files.forEach(f => {
  let content = fs.readFileSync('renderer/' + f, 'utf8');
  if (content.includes('Generar QR')) return;
  content = content.replace('<div class="sidebar-section-label">Más</div>', navLink + 'Más</div>');
  fs.writeFileSync('renderer/' + f, content);
});
