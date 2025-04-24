/**
 * Workout Editor - Sistema migliorato per la gestione degli allenamenti
 * Questo file sostituisce la logica problematica negli editor di testo
 * nell'applicazione Di Dio Training
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Inizializzazione Supabase
    const supabaseClient = createSupabaseClient();
    
    // Elementi DOM
    const workoutForm = document.getElementById('workoutForm');
    
    // Verifica che siamo nella pagina corretta
    if (!workoutForm) return;
    
    // Verifica autenticazione
    const checkAuth = async () => {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error || !session) {
                window.location.href = '/';
                return null;
            }
            return session;
        } catch (error) {
            console.error('Auth error:', error);
            showToast('Errore di autenticazione', 'error');
            window.location.href = '/';
            return null;
        }
    };
    
    // Carica le attività disponibili
    async function loadActivities() {
        try {
            const { data: activities, error } = await supabaseClient
                .from('activities')
                .select('*')
                .order('name');
               
            if (error) throw error;
            
            const activitySelect = document.getElementById('activityType');
            if (activitySelect && activities && activities.length > 0) {
                activitySelect.innerHTML = activities.map(activity =>
                    `<option value="${activity.id}">${activity.name}</option>`
                ).join('');
            }
        } catch (error) {
            console.error('Error loading activities:', error);
            showToast('Errore nel caricamento delle attività', 'error');
        }
    }
    
    // Validazione form
    function validateWorkoutData() {
        // Valori dei campi
        const name = document.getElementById('workoutName').value.trim();
        const activityId = document.getElementById('activityType').value;
        const duration = parseInt(document.getElementById('duration').value);
        const objective = document.getElementById('objective').value.trim();
        const warmup = document.getElementById('warmup').value.trim();
        const mainPhase = document.getElementById('mainPhase').value.trim();
        const cooldown = document.getElementById('cooldown').value.trim();
        
        // Verifica campi obbligatori
        const errors = [];
        
        if (name.length < 3) {
            errors.push('Il nome deve contenere almeno 3 caratteri');
        }
        
        if (!activityId) {
            errors.push('Seleziona un tipo di attività');
        }
        
        if (isNaN(duration) || duration < 1) {
            errors.push('Inserisci una durata valida (minimo 1 minuto)');
        }
        
        if (!objective) {
            errors.push('Inserisci un obiettivo per l\'allenamento');
        }
        
        if (!warmup || warmup.length < 5) {
            errors.push('Il riscaldamento deve essere più dettagliato');
        }
        
        if (!mainPhase || mainPhase.length < 10) {
            errors.push('La fase principale deve essere più dettagliata');
        }
        
        if (!cooldown || cooldown.length < 5) {
            errors.push('Il defaticamento deve essere più dettagliato');
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    // Submit handler
    async function handleSubmit(e) {
        e.preventDefault();
        const loading = showLoading();
        
        try {
            // Verifica autenticazione
            const session = await checkAuth();
            if (!session) return;
            
            // Validazione
            const validation = validateWorkoutData();
            if (!validation.valid) {
                throw new Error(validation.errors.join('\n'));
            }
            
            // Raccolta dati
            const workoutData = {
                name: document.getElementById('workoutName').value.trim(),
                activity_id: parseInt(document.getElementById('activityType').value),
                total_duration: parseInt(document.getElementById('duration').value),
                difficulty: document.getElementById('difficulty').value,
                objective: document.getElementById('objective').value.trim(),
                warmup: document.getElementById('warmup').value.trim(),
                main_phase: document.getElementById('mainPhase').value.trim(),
                cooldown: document.getElementById('cooldown').value.trim(),
                notes: document.getElementById('notes')?.value?.trim() || '',
                user_id: session.user.id,
                created_at: new Date().toISOString()
            };
            
            // Debug: mostra i dati che verranno inviati
            console.log('Dati allenamento:', workoutData);
            
            // Inserimento nel database
            const { data, error } = await supabaseClient
                .from('workout_plans')
                .insert([workoutData])
                .select()
                .single();
                
            if (error) {
                console.error('Database error:', error);
                throw new Error(`Errore del database: ${error.message}`);
            }
            
            showToast('Allenamento creato con successo!', 'success');
           
            // Redirect alla dashboard dopo 1.5 secondi
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } catch (error) {
            console.error('Form submission error:', error);
            showToast(error.message, 'error');
        } finally {
            hideLoading(loading);
        }
    }
    
    // Inizializzazione
    await checkAuth();
    await loadActivities();
    
    // Form submit
    if (workoutForm) {
        // Rimuoviamo eventuali listener esistenti prima di aggiungere il nostro
        const clonedForm = workoutForm.cloneNode(true);
        workoutForm.parentNode.replaceChild(clonedForm, workoutForm);
        
        // Aggiungiamo il nostro listener al form clonato
        clonedForm.addEventListener('submit', handleSubmit);
    }
    
    // Input validation per la durata
    const durationInput = document.getElementById('duration');
    if (durationInput) {
        durationInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 1) e.target.value = 1;
            if (value > 300) e.target.value = 300;
        });
    }
});