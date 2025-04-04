// Dashboard management
document.addEventListener('DOMContentLoaded', async function() {
    // Inizializzazione Supabase
    const supabaseClient = createSupabaseClient();
    
    // Variabili globali
    let currentUser = null;
    let workouts = [];
    let activities = [];
    
    // Elementi DOM
    const elements = {
        modal: document.getElementById('workoutModal'),
        form: document.getElementById('workoutForm'),
        createBtn: document.getElementById('createWorkoutBtn'),
        searchInput: document.getElementById('searchWorkout'),
        filterActivity: document.getElementById('filterActivity'),
        workoutsList: document.getElementById('workoutsList'),
        logoutBtn: document.getElementById('logoutBtn'),
        closeModalBtns: document.querySelectorAll('.modal-close, .btn-secondary')
    };
    
    // Funzioni di utilità per l'interfaccia utente
    const UI = {
        showLoading,
        hideLoading,
        showToast,
        
        showModal() {
            if (elements.modal) {
                elements.modal.style.display = 'block';
                elements.modal.classList.remove('hidden');
            }
        },
        
        hideModal() {
            if (elements.modal) {
                elements.modal.style.display = 'none';
                elements.modal.classList.add('hidden');
                if (elements.form) elements.form.reset();
            }
        },
        
        updateWorkoutsList(workouts) {
            const workoutsList = document.getElementById('workoutsList');
            if (!workoutsList) return;
            
            workoutsList.innerHTML = workouts.length ? workouts.map(workout => `
                <div class="workout-card bg-white rounded-lg shadow-md p-6">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center">
                            <span class="text-2xl mr-3">${workout.activities?.icon || '🏃'}</span>
                            <h3 class="text-xl font-semibold">${workout.name}</h3>
                        </div>
                        <span class="badge bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            ${workout.activities?.name || workout.activity_type}
                        </span>
                    </div>
                    <div class="space-y-2 mb-4">
                        <p class="text-gray-600"><strong>Obiettivo:</strong> ${workout.objective}</p>
                        <p class="text-gray-600"><strong>Durata:</strong> ${workout.total_duration} minuti</p>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button
                            onclick="startWorkout('${workout.id}')"
                            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            <i class="fas fa-play mr-2"></i>Inizia
                        </button>
                        <button
                            onclick="confirmDeleteWorkout('${workout.id}')"
                            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            <i class="fas fa-trash mr-2"></i>Elimina
                        </button>
                    </div>
                </div>
            `).join('') : '<p class="text-center text-gray-500">Nessun allenamento trovato</p>';
        }
    };
    
    // Inizializzazione
    async function init() {
        console.log('Initializing dashboard...');
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
    
    // Funzioni per la gestione degli allenamenti
    async function loadActivities() {
        try {
            const { data, error } = await supabaseClient
                .from('activities')
                .select('*')
                .order('name');
            if (error) throw error;
            activities = data;
            updateActivitySelects();
        } catch (error) {
            console.error('Error loading activities:', error);
            UI.showToast('Errore nel caricamento delle attività', 'error');
        }
    }
    
    function updateActivitySelects() {
        const activitySelect = document.getElementById('activityType');
        const filterSelect = document.getElementById('filterActivity');
        
        if (activitySelect) {
            activitySelect.innerHTML = `
                <option value="">Seleziona attività</option>
                ${activities.map(activity => `
                    <option value="${activity.id}">${activity.name}</option>
                `).join('')}
            `;
        }
        
        if (filterSelect) {
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
            const { data, error } = await supabaseClient
                .from('completed_workouts')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('completed_at', { ascending: false });
            if (error) throw error;
            updateStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
            UI.showToast('Errore nel caricamento delle statistiche', 'error');
        } finally {
            UI.hideLoading(loading);
        }
    }
    
    function updateStats(completedWorkouts) {
        const weeklyDistance = calculateWeeklyDistance(completedWorkouts);
        const monthlyCount = calculateMonthlyWorkouts(completedWorkouts);
        const monthlyCalories = calculateMonthlyCalories(completedWorkouts);
        
        const weeklyDistanceEl = document.getElementById('weeklyDistance');
        const monthlyWorkoutsEl = document.getElementById('monthlyWorkouts');
        const monthlyCaloriesEl = document.getElementById('monthlyCalories');
        
        if (weeklyDistanceEl) weeklyDistanceEl.textContent = `${weeklyDistance.toFixed(1)} km`;
        if (monthlyWorkoutsEl) monthlyWorkoutsEl.textContent = monthlyCount;
        if (monthlyCaloriesEl) monthlyCaloriesEl.textContent = `${monthlyCalories} kcal`;
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
        return workouts.filter(workout =>
            new Date(workout.completed_at).getMonth() === currentMonth
        ).length;
    }
    
    function calculateMonthlyCalories(workouts) {
        const currentMonth = new Date().getMonth();
        return workouts
            .filter(workout => new Date(workout.completed_at).getMonth() === currentMonth)
            .reduce((total, workout) => total + (workout.calories_burned || 0), 0);
    }
    
    async function loadWorkouts() {
        const loading = UI.showLoading();
        try {
            const { data, error } = await supabaseClient
                .from('workout_plans')
                .select(`
                    *,
                    activities (
                        name,
                        icon
                    )
                `)
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            
            // Rimuovi eventuali duplicati
            workouts = Array.from(new Map(data.map(item => [item.id, item])).values());
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
    
    // Funzione per mostrare il modal di completamento
    function showCompletionModal(workout) {
        const modalHtml = `
            <!-- Modal Registrazione Allenamento - HTML Migliorato -->
<div id="completionModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Registra Allenamento: <span id="workoutName">Corsa Lunga</span></h2>
      <button type="button" class="modal-close" onclick="closeModal('completionModal')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <form id="completionForm">
      <div class="form-group">
        <label for="intensityLevel">Livello di Intensità</label>
        <select id="intensityLevel" class="form-control" required>
          <option value="facile">Facile</option>
          <option value="normale">Normale</option>
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
          placeholder="Es. 45"
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
        <button type="button" class="btn btn-secondary" onclick="closeModal('completionModal')">
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
        
        // Aggiungi il modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostra il modal
        const modal = document.getElementById('completionModal');
        modal.style.display = 'block';
        
        // Gestisci la chiusura del modal
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeCompletionModal);
        
        // Gestisci il submit del form
        const form = document.getElementById('completionForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await completeWorkout(workout.id, {
                intensity_level: document.getElementById('intensityLevel').value,
                actual_duration: parseInt(document.getElementById('actualDuration').value),
                calories_burned: parseInt(document.getElementById('caloriesBurned').value),
                notes: document.getElementById('workoutNotes').value
            });
        });
    }
    
    // Funzione per chiudere il modal di completamento
    function closeCompletionModal() {
        const modal = document.getElementById('completionModal');
        if (modal) {
            modal.remove();
        }
    }
    
    // Funzione per registrare il completamento dell'allenamento
    async function completeWorkout(workoutId, completionData) {
        const loading = UI.showLoading();
        try {
            const { error } = await supabaseClient
                .from('completed_workouts')
                .insert([{
                    workout_plan_id: workoutId,
                    user_id: currentUser.id,
                    intensity_level: completionData.intensity_level,
                    actual_duration: completionData.actual_duration,
                    calories_burned: completionData.calories_burned,
                    notes: completionData.notes,
                    completed_at: new Date().toISOString()
                }]);
            if (error) throw error;
            
            UI.showToast('Allenamento completato con successo', 'success');
            closeCompletionModal();
            await loadStats(); // Aggiorna le statistiche
        } catch (error) {
            console.error('Error completing workout:', error);
            UI.showToast('Errore nel salvataggio dell\'allenamento', 'error');
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
    
    function setupEventListeners() {
        // Modal events
        elements.createBtn?.addEventListener('click', UI.showModal);
        elements.closeModalBtns?.forEach(btn =>
            btn.addEventListener('click', UI.hideModal)
        );
        
        // Click fuori dal modal per chiudere
        window.addEventListener('click', (e) => {
            if (e.target === elements.modal) UI.hideModal();
        });
        
        // Form submit
        elements.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
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
            const missingElements = Object.entries(formElements)
                .filter(([key, element]) => !element)
                .map(([key]) => key);
                
            if (missingElements.length > 0) {
                console.error('Elementi mancanti:', missingElements);
                UI.showToast('Alcuni elementi del form sono mancanti', 'error');
                return;
            }
            
            // Raccogli i dati
            const formData = {
                name: formElements.workoutName.value,
                activity_id: formElements.activityType.value,
                objective: formElements.objective.value,
                total_duration: parseInt(formElements.duration.value),
                warmup: formElements.warmup.value,
                main_phase: formElements.mainPhase.value,
                cooldown: formElements.cooldown.value,
                notes: formElements.notes.value
            };
            
            await createWorkout(formData);
        });
        
        // Search and filter
        elements.searchInput?.addEventListener('input', handleSearch);
        elements.filterActivity?.addEventListener('change', handleSearch);
        
        // Logout
        elements.logoutBtn?.addEventListener('click', logout);
    }
    
    // Funzioni per le operazioni sugli allenamenti
    async function startWorkout(workoutId) {
        const loading = UI.showLoading();
        try {
            // Trova l'allenamento selezionato
            const workout = workouts.find(w => w.id === workoutId);
            if (!workout) throw new Error('Allenamento non trovato');
            
            // Mostra il modal di completamento
            showCompletionModal(workout);
            UI.hideLoading(loading);
        } catch (error) {
            console.error('Error starting workout:', error);
            UI.showToast('Errore nell\'avvio dell\'allenamento', 'error');
            UI.hideLoading(loading);
        }
    }
    
    async function confirmDeleteWorkout(workoutId) {
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
    }
    
    async function deleteWorkout(workoutId) {
        const loading = UI.showLoading();
        try {
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
    
    // Avvia l'inizializzazione
    init();
    
    // Esponi funzioni per l'HTML
    window.startWorkout = startWorkout;
    window.confirmDeleteWorkout = confirmDeleteWorkout;
    window.closeCompletionModal = closeCompletionModal;
});