// dashboard-fix.js - Miglioramenti per la dashboard dell'app
document.addEventListener('DOMContentLoaded', async function() {
    // Verifica che siamo nella pagina dashboard
    if (!document.getElementById('workoutsList')) {
        return;
    }
    
    console.log('Dashboard Fix - Inizializzando miglioramenti...');
    
    // Riferimento al client Supabase (usa quello già creato)
    let supabaseClient = null;
    try {
        supabaseClient = window.createSupabaseClient();
    } catch (error) {
        console.error('Errore nell\'inizializzazione di Supabase:', error);
        return;
    }
    
    // Mapping migliorato delle icone per le attività
    const ACTIVITY_ICONS = {
        'corsa': '🏃‍♂️',
        'running': '🏃‍♂️',
        'jogging': '🏃‍♂️',
        'camminata': '🚶‍♂️',
        'walking': '🚶‍♂️',
        'nuoto': '🏊‍♂️',
        'swimming': '🏊‍♂️',
        'spin bike': '🚴‍♂️',
        'cycling': '🚴‍♂️',
        'yoga': '🧘‍♂️',
        'pilates': '🧘‍♀️',
        'forza': '💪',
        'strength': '💪',
        'pesi': '🏋️‍♂️',
        'weights': '🏋️‍♂️',
        'funzionale': '⚡',
        'functional': '⚡',
        'hiit': '⚡',
        'interval': '⚡',
        'callistenia': '🤸‍♂️',
        'calisthenics': '🤸‍♂️',
        'stretching': '🤸‍♀️',
        'flessibilità': '🤸‍♀️',
        'cardio': '❤️',
        'basketball': '🏀',
        'pallacanestro': '🏀',
        'calcio': '⚽',
        'football': '⚽',
        'soccer': '⚽',
        'tennis': '🎾',
        'pallavolo': '🏐',
        'volleyball': '🏐',
        'danza': '💃',
        'dance': '💃',
        'boxing': '🥊',
        'boxe': '🥊',
        'kickboxing': '🥋',
        'martial arts': '🥋',
        'arti marziali': '🥋',
        'rowing': '🚣‍♂️',
        'canottaggio': '🚣‍♂️',
        'esqui': '⛷️',
        'sci': '⛷️',
        'skiing': '⛷️',
        'snowboard': '🏂',
        'climbing': '🧗‍♂️',
        'arrampicata': '🧗‍♂️',
        'surfing': '🏄‍♂️',
        'surf': '🏄‍♂️',
        'recupero': '🔄',
        'recovery': '🔄',
        'default': '🏋️‍♂️'
    };
    
    // Funzione per ottenere l'icona in base al nome dell'attività
    function getActivityIcon(activityName) {
        if (!activityName) return ACTIVITY_ICONS.default;
        
        // Converte in minuscolo per il confronto
        const name = activityName.toLowerCase();
        
        // Cerca una corrispondenza nel mapping
        for (const [key, icon] of Object.entries(ACTIVITY_ICONS)) {
            if (name.includes(key)) {
                return icon;
            }
        }
        
        return ACTIVITY_ICONS.default;
    }
    
    // Funzione per aggiungere il pulsante di modifica nelle card degli allenamenti
    function enhanceWorkoutCards() {
        const workoutCards = document.querySelectorAll('.workout-card');
        
        workoutCards.forEach(card => {
            // Verifica se il pulsante di modifica è già presente
            if (card.querySelector('.workout-edit-btn')) {
                return;
            }
            
            const actionsDiv = card.querySelector('.workout-card > div:last-child');
            if (!actionsDiv) return;
            
            // Ottieni l'ID dell'allenamento
            const workoutId = card.getAttribute('data-workout-id');
            if (!workoutId) return;
            
            // Crea il pulsante di modifica
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-outline btn-sm workout-edit-btn';
            editButton.setAttribute('data-id', workoutId);
            editButton.innerHTML = '<i class="fas fa-edit"></i> Modifica';
            
            // Inserisci il bottone tra "Dettagli" e i pulsanti a destra
            const detailsBtn = actionsDiv.querySelector('.workout-details-btn');
            if (detailsBtn) {
                detailsBtn.after(editButton);
            } else {
                actionsDiv.prepend(editButton);
            }
            
            // Aggiungi l'event listener per l'edit
            editButton.addEventListener('click', () => {
                editWorkout(workoutId);
            });
        });
        
        // Sostituisci le icone generiche con quelle appropriate
        updateActivityIcons();
    }
    
    // Funzione per aggiornare le icone delle attività
    function updateActivityIcons() {
        // Cerca tutte le card con un'icona attività
        document.querySelectorAll('.workout-card .d-flex.align-center.gap-2 .fs-xxl').forEach(iconElement => {
            const card = iconElement.closest('.workout-card');
            if (!card) return;
            
            // Cerca il nome dell'attività nel badge
            const badgeElement = card.querySelector('.badge-primary');
            if (!badgeElement) return;
            
            const activityName = badgeElement.textContent.trim();
            const betterIcon = getActivityIcon(activityName);
            
            // Aggiorna l'icona solo se è diversa
            if (iconElement.textContent !== betterIcon) {
                iconElement.textContent = betterIcon;
            }
        });
    }
    
    // Funzione per modificare un allenamento
    async function editWorkout(workoutId) {
        try {
            // Recupera i dati dell'allenamento
            const { data: workout, error } = await supabaseClient
                .from('workout_plans')
                .select('*')
                .eq('id', workoutId)
                .single();
                
            if (error) throw error;
            if (!workout) throw new Error('Allenamento non trovato');
            
            // Mostra il modal di modifica
            showEditModal(workout);
        } catch (error) {
            console.error('Errore nel recupero dei dati dell\'allenamento:', error);
            if (window.showToast) {
                window.showToast('Errore nel recupero dei dati dell\'allenamento', 'error');
            } else {
                alert('Errore nel recupero dei dati dell\'allenamento: ' + error.message);
            }
        }
    }
    
    // Funzione per mostrare il modal di modifica
    function showEditModal(workout) {
        // Rimuovi eventuali modal esistenti
        const existingModal = document.getElementById('editWorkoutModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Crea il modal di modifica
        const modalHtml = `
            <div id="editWorkoutModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Modifica Allenamento</h2>
                        <button type="button" class="modal-close" onclick="closeEditModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="editWorkoutForm">
                        <input type="hidden" id="edit-workout-id" value="${workout.id}">
                        
                        <div class="form-group">
                            <label for="edit-name">Nome Allenamento</label>
                            <input
                                type="text"
                                id="edit-name"
                                class="form-control"
                                value="${escapeHtml(workout.name)}"
                                required
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-objective">Obiettivo</label>
                            <input
                                type="text"
                                id="edit-objective"
                                class="form-control"
                                value="${escapeHtml(workout.objective || '')}"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-duration">Durata (minuti)</label>
                            <input
                                type="number"
                                id="edit-duration"
                                class="form-control"
                                value="${workout.total_duration || ''}"
                                required
                                min="1"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-warmup">Riscaldamento</label>
                            <div id="edit-warmup-toolbar" class="rich-text-toolbar">
                                <button type="button" data-command="bold"><i class="fas fa-bold"></i></button>
                                <button type="button" data-command="italic"><i class="fas fa-italic"></i></button>
                                <button type="button" data-command="underline"><i class="fas fa-underline"></i></button>
                                <button type="button" data-command="insertUnorderedList"><i class="fas fa-list-ul"></i></button>
                                <button type="button" data-command="insertOrderedList"><i class="fas fa-list-ol"></i></button>
                            </div>
                            <div id="edit-warmup" class="rich-text-editor" contenteditable="true">${workout.warmup || ''}</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-main-phase">Fase Principale</label>
                            <div id="edit-main-phase-toolbar" class="rich-text-toolbar">
                                <button type="button" data-command="bold"><i class="fas fa-bold"></i></button>
                                <button type="button" data-command="italic"><i class="fas fa-italic"></i></button>
                                <button type="button" data-command="underline"><i class="fas fa-underline"></i></button>
                                <button type="button" data-command="insertUnorderedList"><i class="fas fa-list-ul"></i></button>
                                <button type="button" data-command="insertOrderedList"><i class="fas fa-list-ol"></i></button>
                            </div>
                            <div id="edit-main-phase" class="rich-text-editor" contenteditable="true">${workout.main_phase || ''}</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-cooldown">Defaticamento</label>
                            <div id="edit-cooldown-toolbar" class="rich-text-toolbar">
                                <button type="button" data-command="bold"><i class="fas fa-bold"></i></button>
                                <button type="button" data-command="italic"><i class="fas fa-italic"></i></button>
                                <button type="button" data-command="underline"><i class="fas fa-underline"></i></button>
                                <button type="button" data-command="insertUnorderedList"><i class="fas fa-list-ul"></i></button>
                                <button type="button" data-command="insertOrderedList"><i class="fas fa-list-ol"></i></button>
                            </div>
                            <div id="edit-cooldown" class="rich-text-editor" contenteditable="true">${workout.cooldown || ''}</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-notes">Note</label>
                            <div id="edit-notes-toolbar" class="rich-text-toolbar">
                                <button type="button" data-command="bold"><i class="fas fa-bold"></i></button>
                                <button type="button" data-command="italic"><i class="fas fa-italic"></i></button>
                                <button type="button" data-command="underline"><i class="fas fa-underline"></i></button>
                                <button type="button" data-command="insertUnorderedList"><i class="fas fa-list-ul"></i></button>
                                <button type="button" data-command="insertOrderedList"><i class="fas fa-list-ol"></i></button>
                            </div>
                            <div id="edit-notes" class="rich-text-editor" contenteditable="true">${workout.notes || ''}</div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeEditModal()">
                                <i class="fas fa-times"></i> Annulla
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Salva Modifiche
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Aggiungi il modal al body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Aggiungi stili per gli editor di testo formattato
        addRichTextStyles();
        
        // Mostra il modal
        const modal = document.getElementById('editWorkoutModal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Inizializza gli editor di testo formattato
        initRichTextEditors();
        
        // Gestisci la sottomissione del form
        const form = document.getElementById('editWorkoutForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Raccoglie i dati dal form
                const workoutId = document.getElementById('edit-workout-id').value;
                const name = document.getElementById('edit-name').value;
                const objective = document.getElementById('edit-objective').value;
                const duration = parseInt(document.getElementById('edit-duration').value);
                const warmup = document.getElementById('edit-warmup').innerHTML;
                const mainPhase = document.getElementById('edit-main-phase').innerHTML;
                const cooldown = document.getElementById('edit-cooldown').innerHTML;
                const notes = document.getElementById('edit-notes').innerHTML;
                
                // Validazione
                if (!name.trim()) {
                    throw new Error('Il nome dell\'allenamento è obbligatorio');
                }
                
                if (isNaN(duration) || duration <= 0) {
                    throw new Error('La durata deve essere un numero positivo');
                }
                
                // Invia l'aggiornamento
                await updateWorkout(workoutId, {
                    name,
                    objective,
                    total_duration: duration,
                    warmup,
                    main_phase: mainPhase,
                    cooldown,
                    notes
                });
            } catch (error) {
                console.error('Errore nell\'aggiornamento dell\'allenamento:', error);
                
                if (window.showToast) {
                    window.showToast(error.message, 'error');
                } else {
                    alert('Errore: ' + error.message);
                }
            }
        });
    }
    
    // Funzione per aggiornare un allenamento
    async function updateWorkout(workoutId, data) {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = '<div class="loading-spinner"></div><p>Salvataggio in corso...</p>';
        document.body.appendChild(loadingEl);
        
        try {
            const { error } = await supabaseClient
                .from('workout_plans')
                .update(data)
                .eq('id', workoutId);
                
            if (error) throw error;
            
            // Mostra un messaggio di successo
            if (window.showToast) {
                window.showToast('Allenamento aggiornato con successo', 'success');
            } else {
                alert('Allenamento aggiornato con successo');
            }
            
            // Chiudi il modal
            closeEditModal();
            
            // Aggiorna la lista degli allenamenti
            if (window.loadWorkouts) {
                await window.loadWorkouts();
            } else {
                // Se la funzione loadWorkouts non è disponibile, ricarica la pagina
                window.location.reload();
            }
        } catch (error) {
            console.error('Errore nell\'aggiornamento dell\'allenamento:', error);
            
            if (window.showToast) {
                window.showToast('Errore nell\'aggiornamento dell\'allenamento: ' + error.message, 'error');
            } else {
                alert('Errore: ' + error.message);
            }
        } finally {
            document.body.removeChild(loadingEl);
        }
    }
    
    // Funzione per chiudere il modal di modifica
    function closeEditModal() {
        const modal = document.getElementById('editWorkoutModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
    
    // Funzione per inizializzare gli editor di testo formattato
    function initRichTextEditors() {
        // Per ogni toolbar, aggiungi gli event listener ai pulsanti
        document.querySelectorAll('.rich-text-toolbar button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const command = button.getAttribute('data-command');
                
                // Trova l'editor collegato a questa toolbar
                const toolbar = button.closest('.rich-text-toolbar');
                const editorId = toolbar.id.replace('-toolbar', '');
                const editor = document.getElementById(editorId);
                
                // Esegui il comando
                document.execCommand(command, false, null);
                
                // Assicurati che l'editor mantenga il focus
                editor.focus();
            });
        });
    }
    
    // Funzione per aggiungere stili CSS per gli editor di testo formattato
    function addRichTextStyles() {
        // Verifica se gli stili sono già stati aggiunti
        if (document.getElementById('rich-text-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'rich-text-styles';
        style.textContent = `
            .rich-text-toolbar {
                display: flex;
                gap: 5px;
                background-color: #f8f9fa;
                border: 1px solid #e0e0e0;
                border-bottom: none;
                border-radius: 4px 4px 0 0;
                padding: 5px;
                margin-bottom: 0;
            }
            
            .rich-text-toolbar button {
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .rich-text-toolbar button:hover {
                background-color: #f1f3f5;
            }
            
            .rich-text-toolbar button:active {
                background-color: #e9ecef;
            }
            
            .rich-text-editor {
                min-height: 100px;
                border: 1px solid #e0e0e0;
                border-radius: 0 0 4px 4px;
                padding: 10px;
                overflow-y: auto;
                background-color: white;
            }
            
            .rich-text-editor:focus {
                outline: none;
                border-color: #4361ee;
                box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.25);
            }
            
            .rich-text-editor ul, 
            .rich-text-editor ol {
                margin-left: 20px;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Funzione per aggiungere gli editor di testo formattato al modal di creazione allenamento
    function enhanceWorkoutModal() {
        // Controlla se il modal di creazione è presente
        const modal = document.getElementById('workoutModal');
        if (!modal) return;
        
        // Verifica se l'enhancement è già stato fatto
        if (modal.querySelector('.rich-text-toolbar')) return;
        
        // Aggiungi stili per gli editor di testo formattato
        addRichTextStyles();
        
        // Trova i campi testarea da migliorare
        const textareas = ['warmup', 'mainPhase', 'cooldown', 'notes'];
        
        textareas.forEach(fieldId => {
            const textarea = document.getElementById(fieldId);
            if (!textarea) return;
            
            // Memorizza il testo corrente e rimuovi il textarea
            const textContent = textarea.value || '';
            const placeholder = textarea.getAttribute('placeholder') || '';
            const parent = textarea.parentNode;
            
            // Crea la toolbar e l'editor
            const toolbarHtml = `
                <div id="${fieldId}-toolbar" class="rich-text-toolbar">
                    <button type="button" data-command="bold"><i class="fas fa-bold"></i></button>
                    <button type="button" data-command="italic"><i class="fas fa-italic"></i></button>
                    <button type="button" data-command="underline"><i class="fas fa-underline"></i></button>
                    <button type="button" data-command="insertUnorderedList"><i class="fas fa-list-ul"></i></button>
                    <button type="button" data-command="insertOrderedList"><i class="fas fa-list-ol"></i></button>
                </div>
                <div id="${fieldId}-editor" class="rich-text-editor" contenteditable="true" data-target="${fieldId}">${textContent}</div>
                <input type="hidden" id="${fieldId}" name="${fieldId}" value="${escapeHtml(textContent)}">
            `;
            
            // Rimuovi il textarea e aggiungi la toolbar e l'editor
            textarea.remove();
            parent.insertAdjacentHTML('beforeend', toolbarHtml);
            
            // Aggiungi il placeholder come attributo data-placeholder
            const editor = document.getElementById(`${fieldId}-editor`);
            editor.setAttribute('data-placeholder', placeholder);
            
            // Aggiungi event listener per sincronizzare il contenuto con l'input nascosto
            editor.addEventListener('input', function() {
                const hiddenInput = document.getElementById(fieldId);
                hiddenInput.value = this.innerHTML;
            });
        });
        
        // Inizializza gli editor di testo formattato
        initRichTextEditors();
        
        // Sovrascrivi la gestione del submit del form
        const form = document.getElementById('workoutForm');
        if (form) {
            // Rimuovi eventuali listener esistenti (non è possibile farlo direttamente)
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Aggiungi il nuovo listener
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    // Raccoglie i valori dagli editor di testo formattato
                    document.querySelectorAll('.rich-text-editor[data-target]').forEach(editor => {
                        const targetId = editor.getAttribute('data-target');
                        const targetInput = document.getElementById(targetId);
                        if (targetInput) {
                            targetInput.value = editor.innerHTML;
                        }
                    });
                    
                    // Utilizza la funzione originale se disponibile
                    if (window.handleSubmit) {
                        await window.handleSubmit(e);
                    } else if (window.createWorkout) {
                        // Raccogli i dati
                        const formData = {
                            name: document.getElementById('workoutname').value,
                            activity_id: document.getElementById('activityType').value,
                            objective: document.getElementById('objective').value,
                            total_duration: parseInt(document.getElementById('duration').value),
                            warmup: document.getElementById('warmup').value,
                            main_phase: document.getElementById('mainPhase').value,
                            cooldown: document.getElementById('cooldown').value,
                            notes: document.getElementById('notes').value
                        };
                        
                        await window.createWorkout(formData);
                    } else {
                        // Se non ci sono funzioni disponibili, invia il form normalmente
                        newForm.submit();
                    }
                } catch (error) {
                    console.error('Error in form submission:', error);
                    if (window.showToast) {
                        window.showToast(error.message, 'error');
                    } else {
                        alert('Errore: ' + error.message);
                    }
                }
            });
        }
    }
    
    // Utility per l'escaping HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Osservatore per la lista dei workout
    function setupWorkoutListObserver() {
        // Crea un MutationObserver per osservare cambiamenti nella lista di workout
        const observer = new MutationObserver((mutations) => {
            // Se ci sono cambiamenti nella lista, aggiorna le card
            enhanceWorkoutCards();
        });
        
        // Elemento da osservare
        const workoutsList = document.getElementById('workoutsList');
        if (workoutsList) {
            // Configura l'observer per guardare cambiamenti nei figli e nel contenuto
            observer.observe(workoutsList, {
                childList: true,
                subtree: true
            });
        }
    }
    
    // Esponi funzioni a livello globale
    window.closeEditModal = closeEditModal;
    window.getActivityIcon = getActivityIcon;
    window.editWorkout = editWorkout;
    
    // Inizializza le funzionalità
    enhanceWorkoutCards();
    enhanceWorkoutModal();
    setupWorkoutListObserver();
});
