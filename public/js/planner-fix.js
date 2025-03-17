// Aggiungi questa funzione al file public/js/planner.js
// oppure crea un nuovo file public/js/planner-fix.js

document.addEventListener('DOMContentLoaded', function() {
    // Seleziona il pulsante e il modal
    const newProgramBtn = document.getElementById('newProgramBtn');
    const programModal = document.getElementById('programModal');
    
    if (newProgramBtn && programModal) {
        // Aggiungi evento click al pulsante direttamente
        newProgramBtn.addEventListener('click', function() {
            console.log('Nuovo programma button clicked'); // Per debug
            programModal.style.display = 'block';
        });
        
        // Gestisci la chiusura del modal
        const closeButtons = programModal.querySelectorAll('.modal-close, .btn-secondary');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                programModal.style.display = 'none';
            });
        });
        
        // Chiudi il modal cliccando fuori da esso
        window.addEventListener('click', function(event) {
            if (event.target === programModal) {
                programModal.style.display = 'none';
            }
        });
    } else {
        console.error('Elementi del modal non trovati:', {
            button: newProgramBtn ? 'trovato' : 'non trovato',
            modal: programModal ? 'trovato' : 'non trovato'
        });
    }
    
    // Assicuriamoci che il modal abbia lo stile corretto
    if (programModal) {
        // Applica stili corretti al modal
        Object.assign(programModal.style, {
            position: 'fixed',
            zIndex: '1000',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            overflow: 'auto',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'none'
        });
    }
});

// Funzione di utilità per chiudere i modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}
