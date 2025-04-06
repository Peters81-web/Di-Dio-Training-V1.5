// Gestione del profilo utente
document.addEventListener('DOMContentLoaded', async () => {
    // Inizializzazione Supabase
    const supabaseClient = createSupabaseClient();
    
    let currentUser = null;
    
    const loadUserProfile = async () => {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError) {
            console.error('Error loading user:', authError);
            window.location.href = '/';
            return;
        }
        
        currentUser = user;
        
        // Carica i dati del profilo
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error loading profile:', profileError);
            return;
        }
        
        // Popola i campi del form
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const distanceUnitSelect = document.getElementById('distanceUnit');
        
        if (usernameInput) usernameInput.value = profile?.username || user.user_metadata?.username || '';
        if (emailInput) emailInput.value = user.email;
        if (distanceUnitSelect) distanceUnitSelect.value = profile?.preferences?.distance_unit || 'km';
        
        // Aggiungi la sezione delle statistiche personali
        await loadPersonalStats();
    };
    
    const loadPersonalStats = async () => {
        const { data: workouts, error } = await supabaseClient
            .from('completed_workouts')
            .select(`
                *,
                workout_plans(
                    name,
                    activities(name)
                )
            `)
            .eq('user_id', currentUser.id)
            .order('completed_at', { ascending: false });
            
        if (error) {
            console.error('Error loading personal stats:', error);
            return;
        }
        
        // Crea una nuova card per le statistiche personali
        const profileContainer = document.querySelector('.profile-container');
        if (!profileContainer) return;
        
        const statsHtml = `
            <div class="profile-card">
                <h2>I tuoi progressi</h2>
                <div class="stats-summary">
                    <div class="stat-item">
                        <span class="stat-label">Allenamenti Totali</span>
                        <span class="stat-value">${workouts.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Questo Mese</span>
                        <span class="stat-value">${workouts.filter(w =>
                            new Date(w.completed_at).getMonth() === new Date().getMonth()
                        ).length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Attività Preferita</span>
                        <span class="stat-value">${getFavoriteActivity(workouts)}</span>
                    </div>
                </div>
                <div class="recent-activities">
                    <h3>Attività Recenti</h3>
                    ${getRecentActivitiesHtml(workouts.slice(0, 5))}
                </div>
            </div>
        `;
        
        // Inserisci le statistiche nel DOM
        profileContainer.insertAdjacentHTML('beforeend', statsHtml);
    };
    
    const getFavoriteActivity = (workouts) => {
        const activityCounts = workouts.reduce((acc, workout) => {
            if (!workout.workout_plans || !workout.workout_plans.activities) return acc;
            
            const activity = workout.workout_plans.activities.name;
            if (activity) {
                acc[activity] = (acc[activity] || 0) + 1;
            }
            return acc;
        }, {});
        
        if (Object.keys(activityCounts).length === 0) return 'Nessuna';
        
        return Object.entries(activityCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Nessuna';
    };
    
    const getRecentActivitiesHtml = (workouts) => {
        if (workouts.length === 0) return '<p>Nessuna attività recente</p>';
        
        return `
            <div class="activities-list">
                ${workouts.map(workout => `
                    <div class="activity-item">
                        <div class="activity-header">
                            <span class="activity-name">${workout.workout_plans?.name || 'Allenamento'}</span>
                            <span class="activity-date">
                                ${new Date(workout.completed_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div class="activity-details">
                            <span class="activity-type">${workout.workout_plans?.activities?.name || 'Generico'}</span>
                            <span class="activity-duration">${workout.actual_duration} min</span>
                            ${workout.distance ?
                                `<span class="activity-distance">${workout.distance} km</span>` :
                                ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };
    
    // Gestione aggiornamento profilo
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
                    id: currentUser.id,
                    username,
                    updated_at: new Date().toISOString()
                });
                
            if (error) {
                showToast('Errore nell\'aggiornamento del profilo', 'error');
                return;
            }
            
            showToast('Profilo aggiornato con successo', 'success');
        });
    }
    
    // Gestione preferenze
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const distanceUnit = document.getElementById('distanceUnit').value;
            
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
                    id: currentUser.id,
                    preferences: { distance_unit: distanceUnit },
                    updated_at: new Date().toISOString()
                });
                
            if (error) {
                showToast('Errore nell\'aggiornamento delle preferenze', 'error');
                return;
            }
            
            showToast('Preferenze salvate con successo', 'success');
        });
    }
    
    // Aggiungi stili specifici per il profilo
    const addProfileStyles = () => {
        if (document.getElementById('profileStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'profileStyles';
        style.textContent = `
            .profile-container {
                max-width: 800px;
                margin: 2rem auto;
                display: grid;
                gap: 1.5rem;
            }
            
            .profile-card {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .stats-summary {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin: 1.5rem 0;
            }
            
            .stat-item {
                text-align: center;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .stat-label {
                display: block;
                color: #6c757d;
                margin-bottom: 0.5rem;
            }
            
            .stat-value {
                display: block;
                font-size: 1.5rem;
                font-weight: bold;
                color: #4CAF50;
            }
            
            .activities-list {
                margin-top: 1rem;
            }
            
            .activity-item {
                padding: 1rem;
                border-bottom: 1px solid #e9ecef;
            }
            
            .activity-item:last-child {
                border-bottom: none;
            }
            
            .activity-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }
            
            .activity-name {
                font-weight: bold;
            }
            
            .activity-date {
                color: #6c757d;
            }
            
            .activity-details {
                display: flex;
                gap: 1rem;
                color: #6c757d;
                font-size: 0.9rem;
            }
        `;
        
        document.head.appendChild(style);
    };
    
    // Inizializzazione
    addProfileStyles();
    await loadUserProfile();
});