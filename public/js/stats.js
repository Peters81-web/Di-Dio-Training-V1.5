// Gestione della pagina statistiche
document.addEventListener('DOMContentLoaded', async () => {
    // Inizializzazione Supabase
    const supabaseClient = createSupabaseClient();
    
    // Verifica autenticazione
    const checkAuth = async () => {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error || !session) {
            window.location.href = '/';
            return;
        }
        return session;
    };
    
    // Carica panoramica attività
    const loadActivityOverview = async () => {
        const loading = showLoading();
        try {
            const { data: workouts, error } = await supabaseClient
                .from('completed_workouts')
                .select(`
                    *,
                    workout_plans (
                        activities (name)
                    )
                `);
            if (error) throw error;
            
            const activityData = processActivityData(workouts);
            renderActivityChart(activityData);
        } catch (error) {
            showToast('Errore nel caricamento delle attività', 'error');
        } finally {
            hideLoading(loading);
        }
    };
    
    // Carica progressi settimanali
    const loadWeeklyProgress = async () => {
        const loading = showLoading();
        try {
            const { data: workouts, error } = await supabaseClient
                .from('completed_workouts')
                .select('*')
                .gte('completed_at', getLastWeekDate());
            if (error) throw error;
            
            const weeklyData = processWeeklyData(workouts);
            renderWeeklyChart(weeklyData);
        } catch (error) {
            showToast('Errore nel caricamento dei progressi', 'error');
        } finally {
            hideLoading(loading);
        }
    };
    
    // Carica metriche di prestazione
    const loadPerformanceMetrics = async () => {
        const loading = showLoading();
        try {
            const { data: workouts, error } = await supabaseClient
                .from('completed_workouts')
                .select('*')
                .order('completed_at', { ascending: false });
            if (error) throw error;
            
            const metrics = calculateMetrics(workouts);
            renderPerformanceMetrics(metrics);
        } catch (error) {
            showToast('Errore nel caricamento delle metriche', 'error');
        } finally {
            hideLoading(loading);
        }
    };
    
    // Funzioni di utilità per il processing dei dati
    const processActivityData = (workouts) => {
        const activityCounts = workouts.reduce((acc, workout) => {
            if (!workout.workout_plans || !workout.workout_plans.activities) return acc;
            
            const activityName = workout.workout_plans.activities.name;
            if (!activityName) return acc;
            
            acc[activityName] = (acc[activityName] || 0) + 1;
            return acc;
        }, {});
        
        return {
            labels: Object.keys(activityCounts),
            data: Object.values(activityCounts)
        };
    };
    
    const processWeeklyData = (workouts) => {
        const dailyData = {};
        const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dailyData[days[date.getDay()]] = 0;
        }
        
        workouts.forEach(workout => {
            const date = new Date(workout.completed_at);
            const day = days[date.getDay()];
            dailyData[day]++;
        });
        
        return {
            labels: Object.keys(dailyData),
            data: Object.values(dailyData)
        };
    };
    
    const calculateMetrics = (workouts) => {
        return {
            totalWorkouts: workouts.length,
            totalDistance: workouts.reduce((sum, w) => sum + (w.distance || 0), 0),
            averageDuration: calculateAverageDuration(workouts),
            consistency: calculateConsistency(workouts)
        };
    };
    
    // Funzioni di rendering dei grafici
    const renderActivityChart = (data) => {
        const ctx = document.getElementById('activityChart')?.getContext('2d');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: [
                        '#4361ee',
                        '#3a0ca3',
                        '#7209b7',
                        '#f72585'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    };
    
    const renderWeeklyChart = (data) => {
        const ctx = document.getElementById('weeklyChart')?.getContext('2d');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Allenamenti',
                    data: data.data,
                    backgroundColor: '#4361ee'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    };
    
    const renderPerformanceMetrics = (metrics) => {
        const container = document.getElementById('performanceMetrics');
        if (!container) return;
        
        container.innerHTML = `
            <div class="metric-item">
                <span class="metric-value">${metrics.totalWorkouts}</span>
                <span class="metric-label">Allenamenti Totali</span>
            </div>
            <div class="metric-item">
                <span class="metric-value">${metrics.totalDistance.toFixed(1)} km</span>
                <span class="metric-label">Distanza Totale</span>
            </div>
            <div class="metric-item">
                <span class="metric-value">${metrics.averageDuration} min</span>
                <span class="metric-label">Durata Media</span>
            </div>
            <div class="metric-item">
                <span class="metric-value">${metrics.consistency}%</span>
                <span class="metric-label">Costanza</span>
            </div>
        `;
    };
    
    // Funzioni helper
    const getLastWeekDate = () => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toISOString();
    };
    
    const calculateAverageDuration = (workouts) => {
        if (workouts.length === 0) return 0;
        const total = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
        return Math.round(total / workouts.length);
    };
    
    const calculateConsistency = (workouts) => {
        const last30Days = new Set();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        workouts.forEach(workout => {
            const date = new Date(workout.completed_at);
            if (date >= thirtyDaysAgo) {
                last30Days.add(date.toDateString());
            }
        });
        
        return Math.round((last30Days.size / 30) * 100);
    };
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { error } = await supabaseClient.auth.signOut();
            if (!error) {
                window.location.href = '/';
            }
        });
    }
    
    // Inizializzazione
    await checkAuth();
    await loadActivityOverview();
    await loadWeeklyProgress();
    await loadPerformanceMetrics();
});