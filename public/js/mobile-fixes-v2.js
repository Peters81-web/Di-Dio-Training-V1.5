// Script per migliorare la visualizzazione mobile dei giorni della settimana
document.addEventListener('DOMContentLoaded', function() {
  // Funzione per aggiungere gli attributi data-label corretti alle celle
  function fixTableLabels() {
    const tableRows = document.querySelectorAll('#summary-table-body tr');
    
    tableRows.forEach(row => {
      // Prima cella (Giorno)
      const dayCell = row.querySelector('td:first-child');
      if (dayCell) {
        dayCell.setAttribute('data-label', 'Giorno');
        
        // Estrai e formatta meglio il contenuto del giorno
        const content = dayCell.innerHTML;
        const dayMatch = content.match(/([A-Za-zì]+)<span class="day-date">([^<]+)<\/span>/);
        
        if (dayMatch) {
          const dayName = dayMatch[1].trim();
          const dayDate = dayMatch[2].trim();
          
          // Riorganizza il contenuto per una migliore visualizzazione
          dayCell.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-date">${dayDate}</span>
          `;
        }
      }
      
      // Seconda cella (Attività)
      const activityCell = row.querySelector('td:nth-child(2)');
      if (activityCell) {
        activityCell.setAttribute('data-label', 'Attività');
        activityCell.classList.add('workout-cell');
      }
      
      // Terza cella (Descrizione)
      const descriptionCell = row.querySelector('td:nth-child(3)');
      if (descriptionCell) {
        descriptionCell.setAttribute('data-label', 'Descrizione');
        descriptionCell.classList.add('workout-description');
      }
    });
  }
  
  // Funzione per aggiornare gli stili quando si seleziona un'attività
  function setupActivitySelectionEffect() {
    const selects = document.querySelectorAll('.workout-type-select');
    
    selects.forEach(select => {
      // Imposta lo stato iniziale
      updateRowStyle(select);
      
      // Aggiungi listener per i cambiamenti
      select.addEventListener('change', function() {
        updateRowStyle(this);
      });
    });
  }
  
  // Funzione per aggiornare lo stile della riga in base alla selezione
  function updateRowStyle(select) {
    const row = select.closest('tr');
    if (select.value && select.value !== "") {
      row.classList.add('day-with-workout');
    } else {
      row.classList.remove('day-with-workout');
    }
  }
  
  // Esegui le funzioni
  fixTableLabels();
  setupActivitySelectionEffect();
  
  // Esegui nuovamente quando il contenuto della tabella cambia
  // (utile se la tabella viene aggiornata dinamicamente)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.target.id === 'summary-table-body') {
        fixTableLabels();
        setupActivitySelectionEffect();
      }
    });
  });
  
  const tableBody = document.getElementById('summary-table-body');
  if (tableBody) {
    observer.observe(tableBody, { childList: true });
  }
});
