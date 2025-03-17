// Script per migliorare la funzionalità del menu mobile
document.addEventListener('DOMContentLoaded', function() {
    // Crea il toggle per il menu mobile se non esiste
    const navbar = document.querySelector('.navbar .container');
    const navLinks = navbar?.querySelector('.nav-links, .nav-buttons');
    
    if (navbar && !document.querySelector('.mobile-menu-toggle')) {
        // Crea il pulsante toggle
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.setAttribute('aria-label', 'Toggle menu');
        
        // Inserisci il pulsante dopo il brand
        const brand = navbar.querySelector('.navbar-brand');
        if (brand) {
            brand.after(mobileToggle);
        } else {
            navbar.prepend(mobileToggle);
        }
        
        // Assicurati che i nav links abbiano la classe corretta
        if (navLinks) {
            navLinks.classList.add('nav-links');
        }
        
        // Event listener per il toggle
        mobileToggle.addEventListener('click', function() {
            console.log('Menu toggle clicked');
            if (navLinks) {
                navLinks.classList.toggle('active');
                
                // Cambia l'icona in base allo stato
                const icon = mobileToggle.querySelector('i');
                if (navLinks.classList.contains('active')) {
                    icon.className = 'fas fa-times';
                } else {
                    icon.className = 'fas fa-bars';
                }
            }
        });
    }
    
    // Correggi anche eventuali problemi con la tabella del riepilogo settimanale
    const summaryTable = document.querySelector('.summary-table');
    if (summaryTable) {
        const cells = summaryTable.querySelectorAll('td');
        cells.forEach(cell => {
            const label = cell.getAttribute('data-label');
            if (!label) {
                const headerIndex = Array.from(cell.parentElement.children).indexOf(cell);
                const headerText = summaryTable.querySelector(`thead th:nth-child(${headerIndex + 1})`)?.textContent || '';
                cell.setAttribute('data-label', headerText);
            }
        });
    }
});
