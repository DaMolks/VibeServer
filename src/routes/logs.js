const express = require('express');
const router = express.Router();

// Stockage des clients SSE
const clients = [];
// Stockage circulaire pour les derniers messages (maximum 100)
const messageHistory = [];
const MAX_HISTORY_SIZE = 100;

// Fonction pour envoyer un message à tous les clients SSE
function sendToAllClients(data) {
  // Ajouter le message à l'historique
  messageHistory.push(data);
  if (messageHistory.length > MAX_HISTORY_SIZE) {
    messageHistory.shift(); // Supprimer le message le plus ancien
  }

  // Envoyer le message à tous les clients connectés
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Middleware pour enregistrer et diffuser les requêtes MCP
const logMcpMiddleware = (req, res, next) => {
  // Sauvegarder la méthode originale res.json pour l'intercepter
  const originalJson = res.json;

  // Intercepter les requêtes MCP
  if (req.path === '/execute' && req.method === 'POST') {
    const requestTime = new Date();
    const requestData = {
      type: 'request',
      timestamp: requestTime,
      content: `MCP COMMAND: ${req.body.command || 'N/A'}`
    };
    
    sendToAllClients(requestData);

    // Intercepter la réponse
    res.json = function(data) {
      const responseTime = new Date();
      const responseData = {
        type: 'response',
        timestamp: responseTime,
        content: `RESULT: ${JSON.stringify(data)}`
      };
      
      sendToAllClients(responseData);
      
      // Appeler la méthode originale
      return originalJson.call(this, data);
    };
  }
  
  next();
};

// Endpoint SSE pour les logs en streaming
router.get('/stream', (req, res) => {
  // Configuration des en-têtes pour SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Envoyer l'historique des messages au nouveau client
  messageHistory.forEach(message => {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  });

  // Ajouter le client à la liste
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  // Envoyer un événement de connexion
  const connectionMessage = {
    type: 'info',
    timestamp: new Date(),
    content: 'Connexion établie à la console de logs'
  };
  res.write(`data: ${JSON.stringify(connectionMessage)}\n\n`);

  // Nettoyer à la déconnexion
  req.on('close', () => {
    const index = clients.findIndex(client => client.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
      console.log(`Client déconnecté: ${clientId}`);
    }
  });
});

// Endpoint pour consigner manuellement un message via API
router.post('/add', (req, res) => {
  const { type, content } = req.body;
  
  if (!type || !content) {
    return res.status(400).json({ error: 'Type and content are required' });
  }
  
  const validTypes = ['request', 'response', 'info', 'error'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be one of: request, response, info, error' });
  }
  
  const message = {
    type,
    timestamp: new Date(),
    content
  };
  
  sendToAllClients(message);
  
  res.json({
    success: true,
    message: 'Log entry added'
  });
});

// Exporter le middleware pour l'utiliser dans d'autres routes
router.logMcpMiddleware = logMcpMiddleware;

module.exports = router;
