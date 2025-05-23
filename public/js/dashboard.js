// Dashboard management - File completamente rivisto
document.addEventListener('DOMContentLoaded', async function() {
    // Inizializzazione Supabase
    const supabaseClient = window.supabaseClient || createSupabaseClient();
    
    // Variabili globali
    let currentUser = null;
    let workouts = [];
    let activities = [];
    let isEditMode = false;
    let currentWorkoutId = null;

     // Icone per i tipi di attività
     const activityIcons = {
        'corsa': '🏃‍♂️',
        'ciclismo': '🚴‍♂️',
        'nuoto': '🏊‍♂️',
        'forza': '💪',
        'pesi': '🏋️‍♂️',
        'yoga': '🧘‍♂️',
        'pilates': '🤸‍♀️',
        'spinning': '🚲',
        'camminata': '🚶‍♂️',
        'hiit': '⚡',
        'stretching': '🤾‍♂️',
        'crossfit': '🏆',
        'calcio': '⚽',
        'basket': '🏀',
        'tennis': '🎾',
        'default': '🏋️‍♂️'
    }
    
    // Funzione per formattare correttamente la durata
    function formatDuration(duration) {
      // Gestisci caso undefined o null
      if (duration === undefined || duration === null) {
        return "0 minuti";
      }
      
      // Se è già un numero, lo usiamo direttamente
      if (typeof duration === 'number') {
        return `${duration} minuti`;
      }
      
      // Se è una stringa che potrebbe essere in formato HH:MM:SS
      if (typeof duration === 'string') {
        // Verifica se è nel formato HH:MM:SS
        if (duration.includes(':')) {
          // Split in ore, minuti, secondi
          const parts = duration.split(':');
          
          // Caso speciale per il formato 00:00:XX (invece di considerarlo come secondi, lo trattiamo come minuti)
          if (parts.length === 3 && parts[0] === '00' && parts[1] === '00') {
            return `${parseInt(parts[2])} minuti`;
          }
          
          // Normale gestione ore, minuti, secondi
          let totalMinutes = 0;
          if (parts.length === 3) {
            // HH:MM:SS
            totalMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            // Arrotondiamo i secondi al minuto più vicino se sono significativi
            if (parseInt(parts[2]) >= 30) {
              totalMinutes += 1;
            }
          } else if (parts.length === 2) {
            // MM:SS
            totalMinutes = parseInt(parts[0]);
            // Arrotondiamo i secondi al minuto più vicino se sono significativi
            if (parseInt(parts[1]) >= 30) {
              totalMinutes += 1;
            }
          }
          return `${totalMinutes} minuti`;
        }
        
        // Se è una stringa numerica
        const parsed = parseInt(duration);
        if (!isNaN(parsed)) {
          return `${parsed} minuti`;
        }
      }
      
      // Fallback
      return "0 minuti";
    }
    
    // Elementi DOM
    const elements = {
        modal: document.getElementById('workoutModal'),
        form: document.getElementById('workoutForm'),
        createBtn: document.getElementById('createWorkoutBtn'),
        searchInput: document.getElementById('searchWorkout'),
        filterActivity: document.getElementById('filterActivity'),
        workoutsList: document.getElementById('workoutsList'),
        logoutBtn: document.getElementById('logoutBtn'),
        resetDataBtn: document.getElementById('resetDataBtn'),
        closeModalBtns: document.querySelectorAll('.modal-close, .btn-secondary')
    };
    
    // Funzioni di utilità per l'interfaccia utente
    const UI = {
        showLoading: () => {
            const loading = document.createElement('div');
            loading.className = 'loading-overlay';
            loading.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Caricamento...</p>
            `;
            document.body.appendChild(loading);
            document.body.style.overflow = 'hidden';
            return loading;
        },
        
        hideLoading: (loadingElement) => {
            if (loadingElement && loadingElement.parentNode) {
                loadingElement.remove();
            }
            document.body.style.overflow = '';
            
            // Assicuriamoci che tutti i loader siano rimossi
            const remainingLoaders = document.querySelectorAll('.loading-overlay');
            remainingLoaders.forEach(loader => loader.remove());
        },
        
        showToast: (message, type = 'info', duration = 3000) => {
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
        },
        
        showModal: (modalId) => {
            const modal = document.getElementById(modalId || 'workoutModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        },
        
        hideModal: (modalId) => {
            const modal = document.getElementById(modalId || 'workoutModal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden');
                document.body.style.overflow = '';
                
                // Reset del form se presente
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        },
        
        updateWorkoutsList: (workouts) => {
            const workoutsList = document.getElementById('workoutsList');
            if (!workoutsList) return;
            
            if (workouts.length === 0) {
                workoutsList.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-dumbbell fs-xxl mb-3 text-secondary"></i>
                        <h3>Nessun allenamento trovato</h3>
                        <p class="text-secondary mb-4">Inizia creando il tuo primo allenamento</p>
                        <button class="btn btn-primary" onclick="UI.showModal()">
                            <i class="fas fa-plus"></i> Crea Allenamento
                        </button>
                    </div>
                `;
                return;
            }
            
            workoutsList.innerHTML = workouts.map((workout, index) => {
                // Determina l'icona in base al tipo di attività
                const activityName = workout.activities?.name || 'Allenamento';
                let icon = '🏃';
                
                if (activityName.toLowerCase().includes('corsa')) icon = '🏃‍♂️';
                else if (activityName.toLowerCase().includes('nuoto')) icon = '🏊‍♂️';
                else if (activityName.toLowerCase().includes('ciclismo')) icon = '🚴‍♂️';
                else if (activityName.toLowerCase().includes('yoga')) icon = '🧘‍♂️';
                else if (activityName.toLowerCase().includes('forza')) icon = '💪';
                else if (activityName.toLowerCase().includes('pesi')) icon = '🏋️‍♂️';
                
                // Determina il tipo per data-attribute
                let workoutType = 'cardio';
                if (activityName.toLowerCase().includes('forza') || activityName.toLowerCase().includes('pesi')) {
                    workoutType = 'forza';
                } else if (activityName.toLowerCase().includes('yoga') || activityName.toLowerCase().includes('stretching')) {
                    workoutType = 'flessibilita';
                } else if (activityName.toLowerCase().includes('hiit')) {
                    workoutType = 'hiit';
                } else if (activityName.toLowerCase().includes('recupero')) {
                    workoutType = 'recupero';
                }
                
                return `
                    <div class="workout-card" data-workout-type="${workoutType}" data-workout-id="${workout.id}" style="animation-delay: ${index * 0.1}s">
                        <div class="d-flex justify-between align-center mb-3">
                            <div class="d-flex align-center gap-2">
                                <span class="fs-xxl">${icon}</span>
                                <h3 class="fs-xl mb-0">${workout.name}</h3>
                            </div>
                            <span class="badge badge-primary">${activityName}</span>
                        </div>
                        <div class="mb-3">
                            <p class="mb-1"><strong>Obiettivo:</strong> ${workout.objective || 'Non specificato'}</p>
                            <p class="mb-1"><strong>Durata:</strong> ${formatDuration(workout.total_duration)}</p>
                        </div>
                        <div class="d-flex justify-between mt-auto">
                            <button class="btn btn-outline btn-sm workout-details-btn" data-id="${workout.id}">
                                <i class="fas fa-info-circle"></i> Dettagli
                            </button>
                            <div class="d-flex gap-2">
                                <button class="btn btn-success btn-sm" onclick="startWorkout('${workout.id}')">
                                    <i class="fas fa-play"></i> Inizia
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="confirmDeleteWorkout('${workout.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Aggiungi event listener per il bottone dettagli
            document.querySelectorAll('.workout-details-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const workoutId = btn.getAttribute('data-id');
                    const workout = workouts.find(w => w.id === workoutId);
                    
                    if (workout) {
                        showWorkoutDetails(workout);
                    }
                });
            });
        }
    };
    
    // Inizializzazione
    async function init() {
        console.log('Initializing dashboard...');
        try {
            const session = await checkAuth();
            if (session) {
                currentUser = session.user;
                setupEventListeners();
                await Promise.all([
                    loadActivities(),
                    loadStats(),
                    loadWorkouts()
                ]);
            }
        } catch (error) {
            console.error('Initialization error:', error);
            UI.showToast('Errore durante l\'inizializzazione', 'error');
        }
    }
    
    // Funzioni di autenticazione
    async function checkAuth() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            if (!session) {
                window.location.href = '/';
                return null;
            }
            return session;
        } catch (error) {
            console.error('Auth error:', error);
            UI.showToast('Errore di autenticazione', 'error');
            return null;
        }
    }
    
    async function logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            UI.showToast('Errore durante il logout', 'error');
        }
    }
    
    // Funzione per resettare i dati dell'utente
    async function resetUserData() {
        // Verifica sessione utente
        if (!currentUser) {
            UI.showToast('Sessione non valida. Effettua nuovamente il login.', 'error');
            return;
        }
        
        const loading = UI.showLoading();
        try {
            // Elimina tutti i workout completati dell'utente
            const { error: deleteCompletedError } = await supabaseClient
                .from('completed_workouts')
                .delete()
                .eq('user_id', currentUser.id);
                
            if (deleteCompletedError) throw deleteCompletedError;
            
            // Elimina tutti i workout pianificati dell'utente
            const { error: deleteWorkoutsError } = await supabaseClient
                .from('workout_plans')
                .delete()
                .eq('user_id', currentUser.id);
                
            if (deleteWorkoutsError) throw deleteWorkoutsError;
            
            // Elimina tutti i programmi di allenamento dell'utente
            const { error: deleteProgramsError } = await supabaseClient
                .from('training_programs')
                .delete()
                .eq('user_id', currentUser.id);
                
            if (deleteProgramsError) throw deleteProgramsError;
            
            // Elimina tutti i riepiloghi settimanali dell'utente
            const { error: deleteSummariesError } = await supabaseClient
                .from('weekly_summaries')
                .delete()
                .eq('user_id', currentUser.id);
                
            if (deleteSummariesError) throw deleteSummariesError;
            
            UI.showToast('Tutti i dati sono stati eliminati con successo', 'success');
            
            // Ricarica i dati
            await loadWorkouts();
            await loadStats();
        } catch (error) {
            console.error('Error resetting data:', error);
            UI.showToast('Errore durante l\'eliminazione dei dati: ' + error.message, 'error');
        } finally {
            UI.hideLoading(loading);
            UI.hideModal('resetConfirmModal');
        }
    }
    
    // Funzioni per la gestione degli allenamenti
    async function loadActivities() {
        try {
            const { data, error } = await supabaseClient
                .from('activities')
                .select('*')
                .order('name');
                
            if (error) throw error;
            activities = data || [];
            updateActivitySelects();
        } catch (error) {
            console.error('Error loading activities:', error);
            UI.showToast('Errore nel caricamento delle attività', 'error');
        }
    }
    
    function updateActivitySelects() {
        const activitySelect = document.getElementById('activityType');
        const filterSelect = document.getElementById('filterActivity');
        
        if (activitySelect && activities.length > 0) {
            activitySelect.innerHTML = `
                <option value="">Seleziona attività</option>
                ${activities.map(activity => `
                    <option value="${activity.id}">${activity.name}</option>
                `).join('')}
            `;
        }
        
        if (filterSelect && activities.length > 0) {
            filterSelect.innerHTML = `
                <option value="">Tutte le attività</option>
                ${activities.map(activity => `
                    <option value="${activity.id}">${activity.name}</option>
                `).join('')}
            `;
        }
    }
    
    async function loadStats() {
        const loading = UI.showLoading();
        try {
            // Verifica sessione utente
            if (!currentUser) {
                throw new Error('Utente non autenticato');
            }
            
            const { data, error } = await supabaseClient
                .from('completed_workouts')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('completed_at', { ascending: false });
                
            if (error) throw error;
            updateStats(data || []);
        } catch (error) {
            console.error('Error loading stats:', error);
            UI.showToast('Errore nel caricamento delle statistiche', 'error');
        } finally {
            UI.hideLoading(loading);
        }
    }
    
    function updateStats(completedWorkouts) {
        try {
            const weeklyDistance = calculateWeeklyDistance(completedWorkouts);
            const monthlyCount = calculateMonthlyWorkouts(completedWorkouts);
            const monthlyCalories = calculateMonthlyCalories(completedWorkouts);
            
            const weeklyDistanceEl = document.getElementById('weeklyDistance');
            const monthlyWorkoutsEl = document.getElementById('monthlyWorkouts');
            const monthlyCaloriesEl = document.getElementById('monthlyCalories');
            
            if (weeklyDistanceEl) weeklyDistanceEl.textContent = `${weeklyDistance.toFixed(1)} km`;
            if (monthlyWorkoutsEl) monthlyWorkoutsEl.textContent = monthlyCount;
            if (monthlyCaloriesEl) monthlyCaloriesEl.textContent = `${monthlyCalories} kcal`;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
    
    function calculateWeeklyDistance(workouts) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return workouts
            .filter(workout => new Date(workout.completed_at) >= oneWeekAgo)
            .reduce((total, workout) => total + (workout.distance || 0), 0);
    }
    
    function calculateMonthlyWorkouts(workouts) {
        const currentMonth = new Date().getMonth();
        
        return workouts.filter(workout => {
            const workoutDate = new Date(workout.completed_at);
            return workoutDate.getMonth() === currentMonth;
        }).length;
    }
    
    function calculateMonthlyCalories(workouts) {
        const currentMonth = new Date().getMonth();
        
        return workouts
            .filter(workout => {
                const workoutDate = new Date(workout.completed_at);
                return workoutDate.getMonth() === currentMonth;
            })
            .reduce((total, workout) => total + (workout.calories_burned || 0), 0);
    }
    
    async function loadWorkouts() {
        const loading = UI.showLoading();
        try {
            // Verifica sessione utente
            if (!currentUser) {
                throw new Error('Utente non autenticato');
            }
            
            const { data, error } = await supabaseClient
                .from('workout_plans')
                .select(`
                    *,
                    activities (
                        id, name, icon
                    )
                `)
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            // Rimuovi eventuali duplicati
            workouts = Array.from(new Map((data || []).map(item => [item.id, item])).values());
            UI.updateWorkoutsList(workouts);
        } catch (error) {
            console.error('Error loading workouts:', error);
            UI.showToast('Errore nel caricamento degli allenamenti', 'error');
        } finally {
            UI.hideLoading(loading);
        }
    }
    
    async function createWorkout(formData) {
        // Verifica sessione utente
        if (!currentUser) {
            UI.showToast('Sessione non valida. Effettua nuovamente il login.', 'error');
            return;
        }
        
        const loading = UI.showLoading();
        try {
            const workoutData = {
                name: formData.name,
                activity_id: formData.activity_id,
                total_duration: parseInt(formData.total_duration),
                objective: formData.objective || '',
                warmup: formData.warmup || '',
                main_phase: formData.main_phase || '',
                cooldown: formData.cooldown || '',
                notes: formData.notes || '',
                user_id: currentUser.id,
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabaseClient
                .from('workout_plans')
                .insert([workoutData])
                .select()
                .single();
            
            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message);
            }
            
            UI.showToast('Allenamento creato con successo', 'success');
            UI.hideModal();
            await loadWorkouts();
        } catch (error) {
            console.error('Error creating workout:', error);
            UI.showToast(`Errore nella creazione dell'allenamento: ${error.message}`, 'error');
        } finally {
            UI.hideLoading(loading);
        }
    }
    
    // Funzione per mostrare dettagli allenamento
    function showWorkoutDetails(workout) {
        // Crea una modal per i dettagli
        const detailsModal = document.createElement('div');
        detailsModal.id = 'workoutDetailsModal';
        detailsModal.className = 'modal';
        detailsModal.style.display = 'flex';
        
        detailsModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${workout.name}</h2>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="workout-details">
                    <div class="detail-item">
                        <strong>Attività:</strong> ${workout.activities?.name || 'Non specificata'}
                    </div>
                    <div class="detail-item">
                        <strong>Obiettivo:</strong> ${workout.objective || 'Non specificato'}
                    </div>
                    <div class="detail-item">
                        <strong>Durata Totale:</strong> ${formatDuration(workout.total_duration)}
                    </div>
                    
                    <div class="detail-section">
                        <h3>Riscaldamento</h3>
                        <p>${workout.warmup || 'Nessun riscaldamento specificato'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Fase Principale</h3>
                        <p>${workout.main_phase || 'Nessuna fase principale specificata'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Defaticamento</h3>
                        <p>${workout.cooldown || 'Nessun defaticamento specificato'}</p>
                    </div>
                    
                    ${workout.notes ? `
                    <div class="detail-section">
                        <h3>Note</h3>
                        <p>${workout.notes}</p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="startWorkout('${workout.id}')">
                        <i class="fas fa-play"></i> Inizia Allenamento
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(detailsModal);
        document.body.style.overflow = 'hidden';
        
        // Gestisci chiusura
        const closeBtn = detailsModal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            detailsModal.remove();
            document.body.style.overflow = '';
        });
        
        // Chiudi cliccando fuori
        detailsModal.addEventListener('click', function(e) {
            if (e.target === detailsModal) {
                detailsModal.remove();
                document.body.style.overflow = '';
            }
        });
    }
    
    // Funzione per mostrare il modal di completamento
    function showCompletionModal(workout) {
        // Rimuovi eventuali modal esistenti
        const existingModal = document.getElementById('completionModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Ottieni la data odierna in formato YYYY-MM-DD per il valore predefinito
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        // Estrai la durata numerica per il form
        let durationValue = 30; // Default
        if (typeof workout.total_duration === 'number') {
            durationValue = workout.total_duration;
        } else if (typeof workout.total_duration === 'string') {
            if (workout.total_duration.includes(':')) {
                const parts = workout.total_duration.split(':');
                // Caso speciale per 00:00:XX
                if (parts.length === 3 && parts[0] === '00' && parts[1] === '00') {
                    durationValue = parseInt(parts[2]);
                } else if (parts.length === 3) {
                    durationValue = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                }
            } else {
                durationValue = parseInt(workout.total_duration) || 30;
            }
        }
        
        // Crea la nuova modal
        const modalHtml = `
            <div id="completionModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Registra Allenamento: ${workout.name || 'Allenamento'}</h2>
                        <button type="button" class="modal-close" onclick="closeCompletionModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="completionForm">
                        <!-- Nuovo campo per la data dell'allenamento -->
                        <div class="form-group">
                            <label for="workoutDate">Data Allenamento</label>
                            <input
                                type="date"
                                id="workoutDate"
                                class="form-control"
                                required
                                value="${formattedDate}"
                                max="${formattedDate}"
                            >
                            <small class="text-muted">Seleziona la data in cui hai svolto l'allenamento</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="intensityLevel">Livello di Intensità</label>
                            <select id="intensityLevel" class="form-control" required>
                                <option value="facile">Facile</option>
                                <option value="normale" selected>Normale</option>
                                <option value="difficile">Difficile</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="actualDuration">Durata Effettiva (minuti)</label>
                            <input
                                type="number"
                                id="actualDuration"
                                class="form-control"
                                required
                                min="1"
                                value="${durationValue}"
                                placeholder="Es. 45"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="distanceCovered">Distanza Percorsa (km)</label>
                            <input
                                type="number"
                                id="distanceCovered"
                                class="form-control"
                                min="0"
                                step="0.1"
                                value="0"
                                placeholder="Es. 5.2"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="caloriesBurned">Calorie Bruciate (stima)</label>
                            <input
                                type="number"
                                id="caloriesBurned"
                                class="form-control"
                                required
                                min="0"
                                value="100"
                                placeholder="Es. 350"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="workoutNotes">Note sull'allenamento</label>
                            <textarea
                                id="workoutNotes"
                                class="form-control"
                                rows="3"
                                placeholder="Come è andato l'allenamento? Inserisci qui le tue note..."
                            ></textarea>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeCompletionModal()">
                                <i class="fas fa-times"></i> Annulla
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-check"></i> Completa Allenamento
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Aggiungi la modal al body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostra la modal
        const modal = document.getElementById('completionModal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Aggiungi event listener per il submit del form
        const form = document.getElementById('completionForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Prendi i valori dai campi del form
                const workoutDate = document.getElementById('workoutDate').value;
                const intensityLevel = document.getElementById('intensityLevel').value;
                const actualDuration = parseInt(document.getElementById('actualDuration').value);
                const distanceCovered = parseFloat(document.getElementById('distanceCovered').value) || 0;
                const caloriesBurned = parseInt(document.getElementById('caloriesBurned').value);
                const notes = document.getElementById('workoutNotes').value;
                
                // Validazione
                if (!workoutDate) {
                    throw new Error('Seleziona una data valida');
                }
                
                if (isNaN(actualDuration) || actualDuration <= 0) {
                    throw new Error('La durata deve essere un numero maggiore di zero');
                }
                
                if (isNaN(caloriesBurned) || caloriesBurned < 0) {
                    throw new Error('Le calorie devono essere un numero positivo');
                }
                
                if (isNaN(distanceCovered) || distanceCovered < 0) {
                    throw new Error('La distanza deve essere un numero positivo');
                }
                
                // Invia i dati per il completamento
                await completeWorkout(workout.id, {
                    workout_date: workoutDate,
                    intensity_level: intensityLevel,
                    duration: actualDuration,
                    actual_duration: actualDuration,
                    distance: distanceCovered,
                    calories_burned: caloriesBurned,
                    notes: notes
                });
            } catch (error) {
                console.error('Form submission error:', error);
                UI.showToast(error.message || 'Errore durante l\'invio del form', 'error');
            }
        });
    }
    
    // Funzione per chiudere il modal di completamento
    function closeCompletionModal() {
        const modal = document.getElementById('completionModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
    
    // Funzione per registrare il completamento dell'allenamento
    async function completeWorkout(workoutId, completionData) {
        const loading = UI.showLoading();
        try {
            // Verifica sessione utente
            if (!currentUser) {
                throw new Error('Utente non autenticato');
            }
            
            // Crea un oggetto Date dalla stringa di data nel formato YYYY-MM-DD
            const workoutDate = new Date(completionData.workout_date);
            // Imposta l'ora alla fine della giornata (23:59:59) per assicurarsi che venga registrata correttamente
            workoutDate.setHours(23, 59, 59, 999);
            
            console.log('Sending workout completion data:', {
                workout_plan_id: workoutId,
                user_id: currentUser.id,
                ...completionData,
                completed_at: workoutDate.toISOString()
            });
            
            // Invia i dati al database
            const { error } = await supabaseClient
                .from('completed_workouts')
                .insert([{
                    workout_plan_id: workoutId,
                    user_id: currentUser.id,
                    intensity_level: completionData.intensity_level,
                    duration: completionData.duration,
                    actual_duration: completionData.actual_duration,
                    distance: completionData.distance,
                    calories_burned: completionData.calories_burned,
                    notes: completionData.notes || '',
                    completed_at: workoutDate.toISOString()
                }]);
                    
            if (error) {
                console.error('Error details:', error);
                throw new Error(`Errore nel completamento: ${error.message}`);
            }
            
            UI.showToast('Allenamento completato con successo', 'success');
            closeCompletionModal();
            await loadStats(); // Aggiorna le statistiche
        } catch (error) {
            console.error('Error completing workout:', error);
            UI.showToast('Errore nel salvataggio dell\'allenamento: ' + error.message, 'error');
        } finally {
            UI.hideLoading(loading);
        }
    }
    
    // Gestione degli eventi
    function handleSearch() {
        const searchTerm = elements.searchInput?.value.toLowerCase() || '';
        const activityFilter = elements.filterActivity?.value || '';
        
        const filteredWorkouts = workouts.filter(workout => {
            const matchesSearch = workout.name.toLowerCase().includes(searchTerm);
            const matchesActivity = !activityFilter || 
                                    workout.activity_id.toString() === activityFilter;
            return matchesSearch && matchesActivity;
        });
        
        UI.updateWorkoutsList(filteredWorkouts);
    }
    
    // Funzione per aprire un modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    // Funzione per chiudere un modal
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    function setupEventListeners() {
        // Modal events
        if (elements.createBtn) {
            elements.createBtn.addEventListener('click', () => UI.showModal('workoutModal'));
        }
        
        elements.closeModalBtns?.forEach(btn =>
            btn.addEventListener('click', () => UI.hideModal('workoutModal'))
        );
        
        // Click fuori dal modal per chiudere
        window.addEventListener('click', (e) => {
            if (e.target === elements.modal) UI.hideModal('workoutModal');
        });
        
        // Form submit
        elements.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formElements = {
                    workoutName: document.getElementById('workoutname'),
                    activityType: document.getElementById('activityType'),
                    objective: document.getElementById('objective'),
                    duration: document.getElementById('duration'),
                    warmup: document.getElementById('warmup'),
                    mainPhase: document.getElementById('mainPhase'),
                    cooldown: document.getElementById('cooldown'),
                    notes: document.getElementById('notes')
                };
                
                // Verifica la presenza degli elementi necessari
                for (const [key, element] of Object.entries(formElements)) {
                    if (!element) {
                        console.error(`Campo mancante: ${key}`);
                    }
                }
                
                // Validazione
                if (!formElements.workoutName?.value) {
                    throw new Error('Il nome dell\'allenamento è obbligatorio');
                }
                
                if (!formElements.activityType?.value) {
                    throw new Error('Il tipo di attività è obbligatorio');
                }
                
                if (!formElements.duration?.value || parseInt(formElements.duration.value) <= 0) {
                    throw new Error('Inserisci una durata valida');
                }
                
                // Raccogli i dati
                const formData = {
                    name: formElements.workoutName.value,
                    activity_id: formElements.activityType.value,
                    objective: formElements.objective?.value,
                    total_duration: parseInt(formElements.duration.value),
                    warmup: formElements.warmup?.value,
                    main_phase: formElements.mainPhase?.value,
                    cooldown: formElements.cooldown?.value,
                    notes: formElements.notes?.value
                };
                
                await createWorkout(formData);
            } catch (error) {
                console.error('Form validation error:', error);
                UI.showToast(error.message, 'error');
            }
        });
        
        // Search and filter
        elements.searchInput?.addEventListener('input', handleSearch);
        elements.filterActivity?.addEventListener('change', handleSearch);
        
        // Logout
        elements.logoutBtn?.addEventListener('click', logout);
        
        // Reset Data
        if (elements.resetDataBtn) {
            elements.resetDataBtn.addEventListener('click', () => {
                openModal('resetConfirmModal');
            });
        }
        
        // Eventi per la conferma e annullamento del reset
        const confirmResetBtn = document.getElementById('confirmResetBtn');
        if (confirmResetBtn) {
            confirmResetBtn.addEventListener('click', resetUserData);
        }
        
        const cancelResetBtn = document.getElementById('cancelResetBtn');
        if (cancelResetBtn) {
            cancelResetBtn.addEventListener('click', () => {
                closeModal('resetConfirmModal');
            });
        }
        
        const resetModalClose = document.querySelector('#resetConfirmModal .modal-close');
        if (resetModalClose) {
            resetModalClose.addEventListener('click', () => {
                closeModal('resetConfirmModal');
            });
        }
    }
    
    // Avvia l'inizializzazione
    init();
    
    // Esponi funzioni per l'HTML
    window.startWorkout = async function(workoutId) {
        try {
            const targetWorkout = workouts.find(w => w.id === workoutId);
            if (!targetWorkout) {
                throw new Error('Allenamento non trovato');
            }
            
            showCompletionModal(targetWorkout);
        } catch (error) {
            console.error('Error starting workout:', error);
            UI.showToast('Errore nell\'avvio dell\'allenamento', 'error');
        }
    };
    
    window.confirmDeleteWorkout = async function(workoutId) {
        try {
            const { data: completions, error } = await supabaseClient
                .from('completed_workouts')
                .select('id')
                .eq('workout_plan_id', workoutId);
                
            if (error) throw error;
            
            const message = completions?.length > 0
                ? `Questo allenamento ha ${completions.length} completamenti associati. Eliminarli tutti?`
                : 'Sei sicuro di voler eliminare questo allenamento?';
                
            if (confirm(message)) {
                await deleteWorkout(workoutId);
            }
        } catch (error) {
            console.error('Error checking completions:', error);
            UI.showToast('Errore nella verifica dei completamenti', 'error');
        }
    };
    
    async function deleteWorkout(workoutId) {
        const loading = UI.showLoading();
        try {
            // Prima elimina eventuali completamenti associati
            await supabaseClient
                .from('completed_workouts')
                .delete()
                .eq('workout_plan_id', workoutId);
                
            // Poi elimina l'allenamento
            const { error } = await supabaseClient
                .from('workout_plans')
                .delete()
                .eq('id', workoutId);
                
            if (error) throw error;
            
            UI.showToast('Allenamento eliminato con successo', 'success');
            await loadWorkouts();
        } catch (error) {
            console.error('Error deleting workout:', error);
            UI.showToast('Errore nell\'eliminazione dell\'allenamento', 'error');
        } finally {
            UI.hideLoading(loading);
        }
    }
    
    window.closeCompletionModal = closeCompletionModal;
    window.openModal = openModal;
    window.closeModal = closeModal;
    
    // Esponi UI per l'uso globale
    window.UI = UI;
});