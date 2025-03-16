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

// Aggiungi gli stili necessari
const addUtilStyles = () => {
    if (document.getElementById('utilStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'utilStyles';
    style.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            animation: slideUp 0.3s ease-out;
        }
        
        .toast.info {
            background-color: #3498db;
        }
        
        .toast.error {
            background-color: #e74c3c;
        }
        
        .toast.success {
            background-color: #2ecc71;
        }
        
        .toast.warning {
            background-color: #f39c12;
        }
        
        .toast-fade-out {
            opacity: 0;
            transition: opacity 0.3s ease-out;
        }
        
        @keyframes slideUp {
            from { transform: translate(-50%, 100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
};

// Esegui al caricamento
document.addEventListener('DOMContentLoaded', addUtilStyles);

// Esporta funzioni
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.closeModal = closeModal;
window.getUrlParams = getUrlParams;
window.formatDate = formatDate;