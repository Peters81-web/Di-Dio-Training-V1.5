const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Imposta la cartella statica
app.use(express.static(path.join(__dirname, 'public')));

// Log delle configurazioni
console.log(`Directory root: ${__dirname}`);
console.log(`Directory public: ${path.join(__dirname, 'public')}`);

// Funzione per inviare file HTML
function sendHtmlFile(res, filename) {
    // Percorsi possibili del file
    const paths = [
        path.join(__dirname, filename),                    // Nella root
        path.join(__dirname, 'public', filename),          // In public
        path.join(__dirname, 'public', 'html', filename)   // In public/html
    ];
    
    // Cerca il file in tutti i percorsi possibili
    for (const filePath of paths) {
        console.log(`Cercando ${filename} in: ${filePath}`);
        if (fs.existsSync(filePath)) {
            console.log(`File trovato: ${filePath}`);
            return res.sendFile(filePath);
        }
    }
    
    // Se non trova il file, mostra un errore
    console.error(`File ${filename} non trovato in nessun percorso`);
    return res.status(404).send(`File ${filename} non trovato. Verifica la struttura delle tue cartelle`);
}

// Rotte per le pagine HTML
app.get('/', (req, res) => {
    sendHtmlFile(res, 'index.html');
});

app.get('/register', (req, res) => {
    sendHtmlFile(res, 'register.html');
});

app.get('/dashboard', (req, res) => {
    sendHtmlFile(res, 'dashboard.html');
});

app.get('/workout', (req, res) => {
    sendHtmlFile(res, 'workout.html');
});

app.get('/planner', (req, res) => {
    sendHtmlFile(res, 'planner.html');
});

app.get('/stats', (req, res) => {
    sendHtmlFile(res, 'stats.html');
});

app.get('/weekly_summary', (req, res) => {
    sendHtmlFile(res, 'weekly_summary.html');
});

app.get('/profile', (req, res) => {
    sendHtmlFile(res, 'profile.html');
});

// Gestione errori 404
app.use((req, res) => {
    sendHtmlFile(res, '404.html');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Aggiungi questo nelle route esistenti
app.get('*', (req, res) => {
  // Controlla se è una richiesta API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Altrimenti, serve sempre index.html per gestire le route lato client
  sendHtmlFile(res, 'index.html');
    
});
