/**
 * DiDio Training App - Utility Functions
 * File ottimizzato che sostituisce tutti gli script di utilità precedenti
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
    }
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
  
  // ===== FORM SUBMISSION =====
  
  /**
   * Gestisce la sottomissione di un form con validazione
   * @param {string} formId - L'ID del form
   * @param {Function} onSubmit - Callback per la sottomissione
   */
  const setupFormSubmission = (formId, onSubmit) => {
    const form = document.getElementById(formId);
    if (!form || typeof onSubmit !== 'function') return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Verifica campi obbligatori
      const requiredInputs = form.querySelectorAll('[required]');
      let isValid = true;
      
      requiredInputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.classList.add('is-invalid');
          
          // Aggiungi messaggio di errore se non esiste
          const errorMsg = input.parentNode.querySelector('.form-error');
          if (!errorMsg) {
            const error = document.createElement('div');
            error.className = 'form-error';
            error.textContent = 'Questo campo è obbligatorio';
            input.parentNode.appendChild(error);
          }
        } else {
          input.classList.remove('is-invalid');
          const errorMsg = input.parentNode.querySelector('.form-error');
          if (errorMsg) errorMsg.remove();
        }
      });
      
      if (isValid) {
        try {
          const formData = new FormData(form);
          const data = {};
          
          // Converti FormData in un oggetto
          for (const [key, value] of formData.entries()) {
            data[key] = value;
          }
          
          await onSubmit(data);
        } catch (error) {
          console.error('Form submission error:', error);
          showToast(error.message || 'Si è verificato un errore', 'error');
        }
      }
    });
    
    // Rimuovi messaggio di errore quando si modifica un input
    form.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        const errorMsg = input.parentNode.querySelector('.form-error');
        if (errorMsg) errorMsg.remove();
      });
    });
  };
  
  // ===== DATE & TIME UTILITIES =====
  
  /**
   * Formatta una data
   * @param {string|Date} dateStr - Data da formattare
   * @param {Object} options - Opzioni di formattazione
   * @returns {string} Data formattata
   */
  const formatDate = (dateStr, options = {}) => {
    const date = new Date(dateStr);
    const defaultOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    
    return date.toLocaleDateString('it-IT', { ...defaultOptions, ...options });
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
    
    console.log('App initialized successfully');
  };
  
  // Esporta funzioni nel global scope
  window.showLoading = showLoading;
  window.hideLoading = hideLoading;
  window.showToast = showToast;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.formatDate = formatDate;
  window.getUrlParams = getUrlParams;
  window.setupFormSubmission = setupFormSubmission;
  window.initApp = initApp;
  
  // Inizializza l'app quando il DOM è pronto
  document.addEventListener('DOMContentLoaded', initApp);