const express = require('express');
const router = express.Router();

// Stockage des clients SSE
const clients = [];
// Stockage circulaire pour les derniers messages (maximum 100)
const messageHistory = [];
const MAX_HISTORY_SIZE = 100;

// Fonction pour envoyer un message à tous les clients SSE
function sendToAllClients(data) {
  // Ajouter un timestamp s'il n'y en a pas
  if (!data.timestamp) {
    data.timestamp = new Date().toISOString();
  }
  
  console.log('Envoi de log aux clients SSE:', data);
  
  // Ajouter le message à l'historique
  messageHistory.push(data);
  if (messageHistory.length > MAX_HISTORY_SIZE) {
    messageHistory.shift(); // Supprimer le message le plus ancien
  }

  // Envoyer le message à tous les clients connectés
  clients.forEach(client => {
    try {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi au client:', error);
    }
  });
}

// Exporter la fonction pour l'utiliser dans d'autres modules
global.sendLogToClients = sendToAllClients;

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
    
    console.log('Requête MCP interceptée:', requestData);
    sendToAllClients(requestData);

    // Intercepter la réponse
    res.json = function(data) {
      const responseTime = new Date();
      const responseData = {
        type: 'response',
        timestamp: responseTime,
        content: `RESULT: ${JSON.stringify(data, null, 2)}`
      };
      
      console.log('Réponse MCP interceptée:', responseData);
      sendToAllClients(responseData);
      
      // Appeler la méthode originale
      return originalJson.call(this, data);
    };
  }
  
  next();
};

// Endpoint SSE pour les logs en streaming
router.get('/stream', (req, res) => {
  console.log('Nouvelle connexion SSE établie');
  
  // Configuration des en-têtes pour SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

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
  console.log(`Client SSE ajouté, ID: ${clientId}, total clients: ${clients.length}`);

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
      console.log(`Client SSE déconnecté: ${clientId}, clients restants: ${clients.length}`);
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
    timestamp: new Date().toISOString(),
    content
  };
  
  sendToAllClients(message);
  
  res.json({
    success: true,
    message: 'Log entry added'
  });
});

// Route pour tester la fonctionnalité de logs
router.get('/test', (req, res) => {
  // Envoyer un message de test
  sendToAllClients({
    type: 'info',
    content: 'Test message from server at ' + new Date().toLocaleTimeString()
  });
  
  res.json({
    success: true,
    message: 'Test message sent to all connected clients',
    connectedClients: clients.length
  });
});

// Exporter le middleware pour l'utiliser dans d'autres routes
router.logMcpMiddleware = logMcpMiddleware;

module.exports = router;
