const fs = require('fs');
const files = ['index.html', 'merge.html', 'split.html', 'convert.html', 'history.html', 'compress.html', 'qr.html'];

const securityLink = `
        <a href="security.html" class="nav-item">
      <div class="nav-icon"><svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div> Seguridad
    </a>
    <a href="watermark.html" class="nav-item">
      <div class="nav-icon">💧</div> Marca de Agua
    </a>
    <div class="sidebar-section-label">`;

files.forEach(f => {
  try {
    let content = fs.readFileSync('renderer/' + f, 'utf8');
    if (!content.includes('href="security.html"')) {
      content = content.replace('<div class="sidebar-section-label">Más</div>', securityLink + 'Más</div>');
      fs.writeFileSync('renderer/' + f, content);
      console.log('Updated ' + f);
    }
  } catch(e) {
    console.log('Skipping ' + f);
  }
});
