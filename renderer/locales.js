const locales = {
  es: {
    // Sidebar
    "nav.tools": "Herramientas",
    "nav.home": "Inicio",
    "nav.merge": "Unificar PDF",
    "nav.split": "Dividir PDF",
    "nav.convert": "Convertir",
    "nav.compress": "Comprimir PDF",
    "nav.qr": "Generar QR",
    "nav.security": "Seguridad",
    "nav.watermark": "Marca de Agua",
    "nav.more": "Más",
    "nav.history": "Historial",
    "nav.private_title": "100% Privado",
    "nav.private_sub": "Sin internet",

    // Titles
    "title.home": "Bienvenido a PDF Maestro",
    "subtitle.home": "Todas tus herramientas de PDF, sin límites, sin internet, sin publicidad.",
    "title.merge": "Unificar PDF",
    "subtitle.merge": "Selecciona múltiples archivos PDF y únelos en un solo documento.",
    "title.split": "Dividir PDF",
    "subtitle.split": "Extrae páginas o separa un PDF en múltiples archivos.",
    "title.convert": "Convertir PDF",
    "subtitle.convert": "Convierte imágenes a PDF y viceversa de forma sencilla.",
    "title.compress": "Comprimir PDF",
    "subtitle.compress": "Reduce el tamaño de tus archivos PDF sin perder calidad notable.",
    "title.qr": "Generador de QR",
    "subtitle.qr": "Crea códigos QR hermosos, personalizables y de alta resolución al instante.",
    "title.security": "Seguridad PDF",
    "subtitle.security": "Protege tus archivos con contraseña o elimina restricciones.",
    "title.watermark": "Marca de Agua",
    "subtitle.watermark": "Protege tus documentos añadiendo texto superpuesto.",

    // General Buttons & UI
    "btn.add_files": "Agregar Archivos",
    "btn.clear": "Limpiar Todo",
    "btn.process": "Procesar",
    "btn.download": "Descargar",
    "btn.open_folder": "Abrir Carpeta",
    "lbl.dropzone": "Arrastra tus archivos aquí o haz clic para seleccionar",
    
    // Toasts
    "toast.success": "¡Proceso completado con éxito!",
    "toast.error": "Ocurrió un error. Inténtalo de nuevo.",
    "toast.no_files": "Por favor, selecciona archivos primero.",
    "toast.processing": "Procesando archivos...",
    "toast.lang_changed": "Idioma cambiado a Español"
  },
  en: {
    // Sidebar
    "nav.tools": "Tools",
    "nav.home": "Home",
    "nav.merge": "Merge PDF",
    "nav.split": "Split PDF",
    "nav.convert": "Convert",
    "nav.compress": "Compress PDF",
    "nav.qr": "Generate QR",
    "nav.security": "Security",
    "nav.watermark": "Watermark",
    "nav.more": "More",
    "nav.history": "History",
    "nav.private_title": "100% Private",
    "nav.private_sub": "Offline mode",

    // Titles
    "title.home": "Welcome to PDF Maestro",
    "subtitle.home": "All your PDF tools, unlimited, offline, ad-free.",
    "title.merge": "Merge PDF",
    "subtitle.merge": "Select multiple PDF files and combine them into a single document.",
    "title.split": "Split PDF",
    "subtitle.split": "Extract pages or separate a PDF into multiple files.",
    "title.convert": "Convert PDF",
    "subtitle.convert": "Easily convert images to PDF and vice versa.",
    "title.compress": "Compress PDF",
    "subtitle.compress": "Reduce the size of your PDF files without noticeable quality loss.",
    "title.qr": "QR Generator",
    "subtitle.qr": "Create beautiful, customizable, high-resolution QR codes instantly.",
    "title.security": "PDF Security",
    "subtitle.security": "Protect your files with a password or remove restrictions.",
    "title.watermark": "Watermark",
    "subtitle.watermark": "Protect your documents by adding overlaid text.",

    // General Buttons & UI
    "btn.add_files": "Add Files",
    "btn.clear": "Clear All",
    "btn.process": "Process",
    "btn.download": "Download",
    "btn.open_folder": "Open Folder",
    "lbl.dropzone": "Drag your files here or click to select",
    
    // Toasts
    "toast.success": "Process completed successfully!",
    "toast.error": "An error occurred. Please try again.",
    "toast.no_files": "Please select files first.",
    "toast.processing": "Processing files...",
    "toast.lang_changed": "Language changed to English"
  }
};

window.t = function(key) {
  const lang = localStorage.getItem('app_lang') || 'es';
  const dict = locales[lang] || locales['es'];
  return dict[key] || key;
};

window.setLang = function(lang) {
  localStorage.setItem('app_lang', lang);
  location.reload();
};

window.setTheme = function(theme) {
  localStorage.setItem('app_theme', theme);
  applyTheme(theme);
  updateThemeIcon();
};

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function updateThemeIcon() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const lightIcon = document.querySelector('.theme-icon-light');
  const darkIcon = document.querySelector('.theme-icon-dark');
  if (lightIcon && darkIcon) {
    lightIcon.style.display = isLight ? 'inline' : 'none';
    darkIcon.style.display = isLight ? 'none' : 'inline';
  }
}

// Ensure theme is applied immediately before DOM is fully loaded if possible
let initialTheme = localStorage.getItem('app_theme');
if (!initialTheme) {
  initialTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
applyTheme(initialTheme);

document.addEventListener('DOMContentLoaded', () => {
  // Inject Theme Toggle Button
  const sidebarBottom = document.querySelector('.sidebar-bottom');
  if (sidebarBottom) {
    const themeBtnHtml = `
      <div style="display: flex; justify-content: center; margin-bottom: 10px;">
        <button onclick="setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light')" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 14px; border-radius: 20px; width: 45px; height: 30px; display: flex; align-items: center; justify-content: center;" title="Cambiar Tema">
          <span class="theme-icon-light" style="display: none;">🌙</span>
          <span class="theme-icon-dark">☀️</span>
        </button>
      </div>
    `;
    sidebarBottom.insertAdjacentHTML('afterbegin', themeBtnHtml);
    updateThemeIcon();
  }

  const lang = localStorage.getItem('app_lang') || 'es';
  if (lang === 'es') return; // Default HTML is in Spanish

  const dict = locales[lang];
  if (!dict) return;

  // We map the exact text we want to translate.
  // Note: For sidebars, there are leading spaces because of the icons.
  const translations = {
    "Herramientas": dict["nav.tools"],
    " Inicio": " " + dict["nav.home"],
    " Unificar PDF": " " + dict["nav.merge"],
    " Dividir PDF": " " + dict["nav.split"],
    " Convertir": " " + dict["nav.convert"],
    " Comprimir PDF": " " + dict["nav.compress"],
    " Generar QR": " " + dict["nav.qr"],
    " Seguridad": " " + dict["nav.security"],
    " Marca de Agua": " " + dict["nav.watermark"],
    "Más": dict["nav.more"],
    " Historial": " " + dict["nav.history"],
    "100% Privado": dict["nav.private_title"],
    "Sin internet": dict["nav.private_sub"],
    
    // index.html
    "Bienvenido a PDF Maestro": dict["title.home"],
    "Todas tus herramientas de PDF, sin límites, sin internet, sin publicidad.": dict["subtitle.home"],
    // merge.html
    "Unificar PDF": dict["title.merge"],
    "Selecciona múltiples archivos PDF y únelos en un solo documento.": dict["subtitle.merge"],
    "Agregar Archivos": dict["btn.add_files"],
    "Limpiar Todo": dict["btn.clear"],
    "Unificar Archivos": dict["btn.process"],
    "Arrastra tus archivos PDF aquí o haz clic para seleccionar": dict["lbl.dropzone"],
    // qr.html
    "Generador de QR": dict["title.qr"],
    "Crea códigos QR hermosos, personalizables y de alta resolución al instante.": dict["subtitle.qr"],
    // etc... Add more exact strings as needed
  };

  // Replace text in the DOM
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let n;
  while(n = walk.nextNode()) {
    let txt = n.nodeValue;
    // Exact match including spaces
    if (translations[txt]) {
      n.nodeValue = translations[txt];
    } else {
      // Trimmed match
      let tTrim = txt.trim();
      if (tTrim && translations[tTrim]) {
        n.nodeValue = txt.replace(tTrim, translations[tTrim]);
      }
    }
  }

  // Also replace standard inputs placeholders if any
  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
    let p = el.getAttribute('placeholder');
    if (translations[p]) {
      el.setAttribute('placeholder', translations[p]);
    }
  });
});

