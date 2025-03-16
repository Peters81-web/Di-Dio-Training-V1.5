// public/js/utils.js

// Funzione per mostrare il loading spinner
const showLoading = () => {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Caricamento...</p>
    `;
    document.body.appendChild(loading);
    return loading;
};

const hideLoading = (loadingElement) => {
    if (loadingElement && loadingElement.parentNode) {
        loadingElement.remove();
    }
};

const showToast = (message, type = 'info') => {
    // Rimuovi toast esistenti
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Funzione per chiudere i modal
const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

// Funzione per ottenere parametri URL
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

// Funzione per formattare date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Funzione per toggle menu mobile
const toggleMobileMenu = () => {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
};

// Aggiungi gli stili necessari e setup mobile menu
const initResponsiveUI = () => {
    // Verifica se esiste già il toggle menu mobile
    if (!document.querySelector('.mobile-menu-toggle')) {
        const navbar = document.querySelector('.navbar .container');
        if (navbar) {
            const mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-menu-toggle';
            mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            mobileToggle.addEventListener('click', toggleMobileMenu);
            
            // Inserisci dopo il brand
            const brand = navbar.querySelector('.navbar-brand') || navbar.querySelector('h1');
            if (brand && brand.nextSibling) {
                navbar.insertBefore(mobileToggle, brand.nextSibling);
            } else {
                navbar.appendChild(mobileToggle);
            }
            
            // Assicurati che i nav-links abbiano la classe corretta
            const navLinks = navbar.querySelector('.nav-buttons, .nav-links');
            if (navLinks) {
                navLinks.classList.add('nav-links');
                if (navLinks.classList.contains('nav-buttons')) {
                    navLinks.classList.remove('nav-buttons');
                }
            }
        }
    }
    
    // Adatta tabelle per mobile
    const tables = document.querySelectorAll('table:not(.responsive-ready)');
    tables.forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        table.classList.add('responsive-ready');
    });
};

// Esegui al caricamento
document.addEventListener('DOMContentLoaded', () => {
    initResponsiveUI();
    
    // Rileva cambiamenti nel DOM per adattare dinamicamente
    const observer = new MutationObserver(() => {
        initResponsiveUI();
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
});

// Esporta funzioni
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.closeModal = closeModal;
window.getUrlParams = getUrlParams;
window.formatDate = formatDate;
window.toggleMobileMenu = toggleMobileMenu;
