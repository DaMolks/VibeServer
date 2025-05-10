require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs').promises;
const path = require('path');

// Routes
const projectsRoutes = require('./routes/projects');
const filesRoutes = require('./routes/files');
const mcpRoutes = require('./routes/mcp');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Créer le dossier des projets s'il n'existe pas
const ensureProjectFolder = async () => {
  try {
    const projectsDir = path.join(__dirname, '../projects');
    await fs.mkdir(projectsDir, { recursive: true });
    console.log('Projects directory initialized');
  } catch (error) {
    console.error('Error creating projects directory:', error);
  }
};

// Utiliser le middleware de logs pour les routes MCP
app.use('/api/mcp', logsRoutes.logMcpMiddleware);

// Routes
app.use('/api/projects', projectsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/logs', logsRoutes);

// Route de test
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    features: ['file-management', 'project-management', 'mcp-commands', 'realtime-logs']
  });
});

// Ajouter un lien vers la console dans la page d'accueil
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Interface utilisateur simple
app.use(express.static(path.join(__dirname, '../public')));

// Gérer les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Démarrage du serveur
(async () => {
  await ensureProjectFolder();

  app.listen(PORT, () => {
    console.log(`VibeServer running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Console available at http://localhost:${PORT}/console.html`);
  });
})();
