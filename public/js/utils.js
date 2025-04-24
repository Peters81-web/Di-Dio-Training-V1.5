/**
 * DiDio Training App - Utility Functions (Versione migliorata)
 * File ottimizzato e ripulito con miglioramenti di usabilità
 */

// ===== UI FEEDBACK =====

/**
 * Mostra un indicatore di caricamento
 * @returns {HTMLElement} L'elemento DOM del loader
 */
const showLoading = () => {
  // Rimuovi eventuali loader esistenti
  const existingLoaders = document.querySelectorAll('.loading-overlay');
  existingLoaders.forEach(loader => loader.remove());
  
  const loading = document.createElement('div');
  loading.className = 'loading-overlay';
  loading.innerHTML = `
    <div class="loading-spinner"></div>
    <p>Caricamento...</p>
  `;
  document.body.appendChild(loading);
  
  // Impedisci lo scroll durante il caricamento
  document.body.style.overflow = 'hidden';
  
  return loading;
};

/**
 * Nasconde l'indicatore di caricamento
 * @param {HTMLElement} loadingElement - L'elemento loader da rimuovere
 */
const hideLoading = (loadingElement) => {
  if (loadingElement && loadingElement.parentNode) {
    loadingElement.remove();
  }
  // Ripristina lo scroll
  document.body.style.overflow = '';
  
  // Assicuriamoci che tutti i loader siano rimossi
  const remainingLoaders = document.querySelectorAll('.loading-overlay');
  remainingLoaders.forEach(loader => loader.remove());
};

/**
 * Mostra un messaggio toast 
 * @param {string} message - Il messaggio da mostrare
 * @param {string} type - Il tipo di toast (success, error, warning, info)
 * @param {number} duration - Durata in ms (default: 3000ms)
 */
const showToast = (message, type = 'info', duration = 3000) => {
  // Rimuovi toast esistenti
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  // Crea il toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Crea l'icona appropriata in base al tipo
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    case 'info':
    default:
      icon = '<i class="fas fa-info-circle"></i>';
      break;
  }
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" aria-label="Chiudi">&times;</button>
  `;
  
  // Aggiungi stili
  toast.style.animation = 'toastSlideIn 0.3s ease-out forwards';
  document.body.appendChild(toast);
  
  // Chiusura toast al click
  const closeButton = toast.querySelector('.toast-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    });
  }
  
  // Auto-chiusura dopo il timeout
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
  
  return toast;
};

// ===== MODALS =====

/**
 * Apre un modal
 * @param {string} modalId - L'ID del modal da aprire
 */
const openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  // Mostra il modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Focus sul primo input (accessibilità)
  setTimeout(() => {
    const firstInput = modal.querySelector('input, textarea, select, button:not(.modal-close)');
    if (firstInput) {
      firstInput.focus();
    }
  }, 100);
  
  // Aggiungiamo escape key listener
  document.addEventListener('keydown', function escapeListener(e) {
    if (e.key === 'Escape') {
      closeModal(modalId);
      document.removeEventListener('keydown', escapeListener);
    }
  });
  
  // Click fuori per chiudere
  modal.addEventListener('click', function outsideClickListener(e) {
    if (e.target === modal) {
      closeModal(modalId);
      modal.removeEventListener('click', outsideClickListener);
    }
  });
};

/**
 * Chiude un modal
 * @param {string} modalId - L'ID del modal da chiudere
 */
const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = 'none';
  document.body.style.overflow = '';
  
  // Reset del form se presente
  const form = modal.querySelector('form');
  if (form) {
    form.reset();
    
    // Rimuovi eventuali messaggi di errore
    const errorMessages = form.querySelectorAll('.form-error');
    errorMessages.forEach(el => el.remove());
    
    // Rimuovi classi di campo invalido
    const invalidFields = form.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => field.classList.remove('is-invalid'));
  }
};

// ===== FORM VALIDATION =====

/**
 * Funzione per validare i campi di un form
 * @param {HTMLFormElement} form - Il form da validare
 * @returns {boolean} True se il form è valido, false altrimenti
 */
const validateForm = (form) => {
  let isValid = true;
  
  // Rimuovi tutti i messaggi di errore esistenti
  const existingErrors = form.querySelectorAll('.form-error');
  existingErrors.forEach(el => el.remove());
  
  // Rimuovi le classi di invalidità precedenti
  const invalidFields = form.querySelectorAll('.is-invalid');
  invalidFields.forEach(field => field.classList.remove('is-invalid'));
  
  // Verifica ogni campo required
  const requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    let fieldValue = field.value.trim();
    let isFieldValid = true;
    let errorMessage = '';
    
    // Controllo base: campo vuoto
    if (!fieldValue) {
      isFieldValid = false;
      errorMessage = 'Questo campo è obbligatorio';
    } 
    // Controllo aggiuntivo per input email
    else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
      isFieldValid = false;
      errorMessage = 'Inserisci un indirizzo email valido';
    }
    // Controllo per input number
    else if (field.type === 'number') {
      const numValue = Number(fieldValue);
      const min = field.hasAttribute('min') ? Number(field.getAttribute('min')) : null;
      const max = field.hasAttribute('max') ? Number(field.getAttribute('max')) : null;
      
      if (isNaN(numValue)) {
        isFieldValid = false;
        errorMessage = 'Inserisci un numero valido';
      } else if (min !== null && numValue < min) {
        isFieldValid = false;
        errorMessage = `Il valore minimo è ${min}`;
      } else if (max !== null && numValue > max) {
        isFieldValid = false;
        errorMessage = `Il valore massimo è ${max}`;
      }
    }
    // Controllo lunghezza minima per i textarea
    else if (field.tagName === 'TEXTAREA' && fieldValue.length < 10) {
      isFieldValid = false;
      errorMessage = 'Questo campo deve contenere almeno 10 caratteri';
    }
    
    // Se il campo non è valido
    if (!isFieldValid) {
      isValid = false;
      field.classList.add('is-invalid');
      
      // Crea e aggiungi il messaggio di errore
      const errorDiv = document.createElement('div');
      errorDiv.className = 'form-error';
      errorDiv.textContent = errorMessage;
      
      // Inserisci dopo il campo
      field.parentNode.insertBefore(errorDiv, field.nextSibling);
      
      // Evento per rimuovere l'errore quando l'utente modifica il campo
      field.addEventListener('input', function removeErrorOnInput() {
        field.classList.remove('is-invalid');
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
        field.removeEventListener('input', removeErrorOnInput);
      }, { once: true });
    }
  });
  
  return isValid;
};

/**
 * Raccoglie i dati da un form
 * @param {HTMLFormElement} form - Il form da cui raccogliere i dati
 * @returns {Object} I dati del form come oggetto key-value
 */
const getFormData = (form) => {
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return data;
};

// ===== MOBILE MENU =====

/**
 * Inizializza il menu mobile
 */
const initMobileMenu = () => {
  // Trova o crea il toggle button
  const navbar = document.querySelector('.navbar .container');
  if (!navbar) return;
  
  let mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = navbar.querySelector('.nav-links');
  
  // Se non abbiamo un container di link, non c'è nulla da fare
  if (!navLinks) return;
  
  // Se non esiste il toggle, crealo
  if (!mobileToggle) {
    mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.setAttribute('aria-label', 'Menu');
    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Aggiungi dopo il brand
    const brand = navbar.querySelector('.navbar-brand');
    if (brand) {
      // Inserisci dopo il brand
      if (brand.nextSibling) {
        navbar.insertBefore(mobileToggle, brand.nextSibling);
      } else {
        navbar.appendChild(mobileToggle);
      }
    } else {
      // Se non c'è un brand, inserisci all'inizio
      navbar.insertBefore(mobileToggle, navbar.firstChild);
    }
  }
  
  // Aggiungi event listener
  mobileToggle.addEventListener('click', function() {
    navLinks.classList.toggle('active');
    
    // Cambia l'icona in base allo stato
    const icon = mobileToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
      icon.className = 'fas fa-times';
    } else {
      icon.className = 'fas fa-bars';
    }
  });
  
  // Chiudi il menu quando si clicca su un link
  navLinks.querySelectorAll('a, button').forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 992) {
        navLinks.classList.remove('active');
        mobileToggle.querySelector('i').className = 'fas fa-bars';
      }
    });
  });
};

// ===== DATE & TIME UTILITIES =====

/**
 * Formatta una data nel formato italiano
 * @param {Date|string} date - La data da formattare
 * @param {Object} options - Opzioni di formattazione
 * @returns {string} Data formattata
 */
const formatDate = (date, options = {}) => {
  // Se è una stringa, la convertiamo in Date
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Opzioni predefinite per il formato italiano
  const defaultOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric'
  };
  
  // Unisci le opzioni predefinite con quelle fornite
  const formatOptions = { ...defaultOptions, ...options };
  
  return dateObj.toLocaleDateString('it-IT', formatOptions);
};

/**
 * Ottiene la settimana corrente dell'anno
 * @param {Date} date - Data opzionale, default: oggi
 * @returns {number} Numero della settimana (1-53)
 */
const getWeekNumber = (date = new Date()) => {
  // Crea una nuova data basata su quella fornita
  const target = new Date(date.valueOf());
  
  // ISO week date weeks start on Monday, so correct the day number
  const dayNum = (date.getDay() + 6) % 7;
  
  // ISO 8601 states that week 1 is the week with the first Thursday of that year
  // Set the target date to the Thursday in the target week
  target.setDate(target.getDate() - dayNum + 3);
  
  // Store the millisecond value of the target date
  const firstThursday = target.valueOf();
  
  // Set the target to the first Thursday of the year
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  
  // Return the week number
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

/**
 * Ottiene la data di inizio della settimana corrente (lunedì)
 * @returns {Date}
 */
const getStartOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(date.setDate(diff));
};

/**
 * Ottiene i parametri dall'URL
 * @returns {Object} Parametri URL
 */
const getUrlParams = () => {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split('&');
  
  for (let i = 0; i < pairs.length; i++) {
    if (!pairs[i]) continue;
    
    const pair = pairs[i].split('=');
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  
  return params;
};

// ===== RESPONSIVE TABLES =====

/**
 * Rende le tabelle responsive
 */
const makeTablesResponsive = () => {
  const tables = document.querySelectorAll('table:not(.responsive-ready)');
  
  tables.forEach(table => {
    // Ottieni i testi delle intestazioni
    const headers = table.querySelectorAll('thead th');
    const headerTexts = Array.from(headers).map(header => header.textContent.trim());
    
    // Aggiungi attributi data-label alle celle
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (index < headerTexts.length && !cell.hasAttribute('data-label')) {
          cell.setAttribute('data-label', headerTexts[index]);
        }
      });
    });
    
    // Segna come pronta
    table.classList.add('responsive-ready');
  });
};

// ===== WEEKLY SUMMARY =====

/**
 * Fix specifico per il riepilogo settimanale
 */
const initWeeklySummary = () => {
  // Listener per le select delle attività
  document.querySelectorAll('.workout-type-select').forEach(select => {
    // Imposta stato iniziale
    const row = select.closest('tr');
    if (row && select.value && select.value !== "") {
      row.classList.add('day-with-workout');
    }
    
    // Aggiungi listener per i cambiamenti
    select.addEventListener('change', function() {
      const row = this.closest('tr');
      if (row) {
        if (this.value && this.value !== "") {
          row.classList.add('day-with-workout');
        } else {
          row.classList.remove('day-with-workout');
        }
      }
    });
  });
};

// ===== INITIALIZATION =====

/**
 * Inizializza tutte le funzionalità UI
 */
const initApp = () => {
  // Inizializza menu mobile
  initMobileMenu();
  
  // Rendi responsive le tabelle
  makeTablesResponsive();
  
  // Inizializza riepilogo settimanale se presente
  if (document.querySelector('.workout-type-select')) {
    initWeeklySummary();
  }
  
  // Gestione modal
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = trigger.getAttribute('data-modal');
      openModal(modalId);
    });
  });
  
  // Chiusura modal
  document.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
  
  // Click fuori dal modal
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
  
  // Fix per auth page overflow
  const authPage = document.querySelector('.auth-page');
  if (authPage) {
    authPage.style.overflowY = 'auto';
    authPage.style.minHeight = '100vh';
  }
  
  // Validazione personalizzata per i form
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      if (!validateForm(form)) {
        e.preventDefault();
        // Focus sul primo campo con errore
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) {
          firstInvalid.focus();
        }
      }
    });
  });
  
  console.log('App initialized successfully');
};

// Esponi funzioni nel global scope
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.formatDate = formatDate;
window.getFormData = getFormData;
window.validateForm = validateForm;
window.getWeekNumber = getWeekNumber;
window.getStartOfWeek = getStartOfWeek;
window.getUrlParams = getUrlParams;
window.setupFormSubmission = function(formId, onSubmit) {
  const form = document.getElementById(formId);
  if (!form || typeof onSubmit !== 'function') return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    
    try {
      await onSubmit(getFormData(form));
    } catch (error) {
      console.error('Form submission error:', error);
      showToast(error.message || 'Si è verificato un errore', 'error');
    }
  });
};
window.initApp = initApp;

// Inizializza l'app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initApp);