// Gestione della pagina workout
document.addEventListener('DOMContentLoaded', async () => {
    // Inizializzazione Supabase
    const supabaseClient = createSupabaseClient();
    
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
    const loadActivities = async () => {
        try {
            const { data: activities, error } = await supabaseClient
                .from('activities')
                .select('*')
                .order('name');
               
            if (error) throw error;
            const activitySelect = document.getElementById('activityType');
            
            if (activitySelect) {
                activitySelect.innerHTML = activities.map(activity =>
                    `<option value="${activity.id}">${activity.name}</option>`
                ).join('');
            }
           
        } catch (error) {
            console.error('Error loading activities:', error);
            showToast('Errore nel caricamento delle attività', 'error');
        }
    };
    
    // Validazione form
    const validateWorkoutData = (formData) => {
        const errors = [];
        if (formData.name.length < 3) {
            errors.push('Il nome deve contenere almeno 3 caratteri');
        }
        
        if (!formData.activity_id) {
            errors.push('Seleziona un tipo di attività');
        }
        
        if (isNaN(formData.total_duration) || formData.total_duration < 1) {
            errors.push('Inserisci una durata valida (minimo 1 minuto)');
        }
        
        if (!formData.objective) {
            errors.push('Inserisci un obiettivo per l\\\'allenamento');
        }
        
        if (!formData.warmup || !formData.main_phase || !formData.cooldown) {
            errors.push('Compila tutte le fasi dell\\\'allenamento');
        }
        
        return errors;
    };
    
    // Raccolta dati form
    const getFormData = () => {
        return {
            name: document.getElementById('workoutName').value.trim(),
            activity_id: parseInt(document.getElementById('activityType').value),
            total_duration: parseInt(document.getElementById('duration').value),
            difficulty: document.getElementById('difficulty').value,
            objective: document.getElementById('objective').value.trim(),
            warmup: document.getElementById('warmup').value.trim(),
            main_phase: document.getElementById('mainPhase').value.trim(),
            cooldown: document.getElementById('cooldown').value.trim(),
            notes: document.getElementById('notes').value.trim()
        };
    };
    
    // Gestione submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        const loading = showLoading();
        try {
            const session = await checkAuth();
            if (!session) return;
            
            const formData = getFormData();
            const validationErrors = validateWorkoutData(formData);
            
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join('\n'));
            }
            
            // Aggiunta dati utente e timestamp
            const workoutData = {
                ...formData,
                user_id: session.user.id,
                created_at: new Date().toISOString()
            };
            
            // Inserimento nel database
            const { data, error } = await supabaseClient
                .from('workout_plans')
                .insert([workoutData])
                .select()
                .single();
                
            if (error) throw error;
            
            showToast('Allenamento creato con successo!', 'success');
           
            // Redirect alla dashboard dopo 1.5 secondi
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } catch (error) {
            console.error('Error saving workout:', error);
            showToast(error.message, 'error');
        } finally {
            hideLoading(loading);
        }
    };
    
    // Inizializzazione
    await checkAuth();
    await loadActivities();
    
    // Form submit
    const workoutForm = document.getElementById('workoutForm');
    if (workoutForm) {
        workoutForm.addEventListener('submit', handleSubmit);
    }
    
    // Input validations
    const durationInput = document.getElementById('duration');
    if (durationInput) {
        durationInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 1) e.target.value = 1;
            if (value > 300) e.target.value = 300;
        });
    }
});