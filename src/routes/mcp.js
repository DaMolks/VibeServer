const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const PROJECTS_DIR = path.join(__dirname, '../../projects');

// État global pour le contexte MCP
let mcpContext = {
  currentProject: null,
  lastCommand: null,
  history: []
};

// Fonction helper pour envoyer des logs à la console
function logToConsole(type, content) {
  console.log(`[MCP] ${type.toUpperCase()}: ${content}`);
  
  // Utiliser la fonction globale si elle existe
  if (global.sendLogToClients) {
    global.sendLogToClients({
      type,
      timestamp: new Date(),
      content
    });
  }
}

// Exécute une commande MCP
router.post('/execute', async (req, res, next) => {
  try {
    const { command } = req.body;
    logToConsole('info', `Commande reçue: ${command}`);

    if (!command) {
      logToConsole('error', 'Commande manquante');
      return res.status(400).json({ 
        success: false,
        error: 'Command is required' 
      });
    }

    // Ajouter la commande à l'historique
    mcpContext.lastCommand = command;
    mcpContext.history.push({
      command,
      timestamp: new Date().toISOString()
    });

    // Analyser la commande
    const { cmd, args } = parseCommand(command);
    logToConsole('info', `Commande analysée: cmd=${cmd}, args=${JSON.stringify(args)}`);
    
    let result;

    // Exécuter la commande appropriée
    switch (cmd) {
      case 'create-project':
        result = await handleCreateProject(args);
        break;
      case 'list-projects':
        result = await handleListProjects();
        break;
      case 'switch-project':
      case 'use-project':
        result = await handleSwitchProject(args);
        break;
      case 'edit':
        result = await handleEditFile(args);
        break;
      case 'create-file':
        result = await handleCreateFile(args);
        break;
      case 'list-files':
        result = await handleListFiles(args);
        break;
      case 'read-file':
        result = await handleReadFile(args);
        break;
      case 'update-file':
        result = await handleUpdateFile(args);
        break;
      case 'delete-file':
        result = await handleDeleteFile(args);
        break;
      case 'exec':
        result = await handleExecCommand(args);
        break;
      case 'git-commit':
        result = await handleGitCommit(args);
        break;
      case 'help':
        result = handleHelp();
        break;
      default:
        logToConsole('error', `Commande inconnue: ${cmd}`);
        return res.status(400).json({ 
          success: false,
          error: `Unknown command: ${cmd}` 
        });
    }

    logToConsole('info', `Résultat de la commande ${cmd}: ${JSON.stringify(result)}`);
    
    // Envoyer la réponse formatée
    const response = { success: true, command, result };
    res.json(response);
    
    // Envoyer également le résultat à la console web
    logToConsole('response', `Réponse pour ${cmd}: ${JSON.stringify(response)}`);
    
  } catch (error) {
    logToConsole('error', `Erreur lors de l'exécution de la commande MCP: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: `Error executing MCP command: ${error.message}` 
    });
  }
});

// Récupère le contexte MCP actuel
router.get('/context', (req, res) => {
  logToConsole('info', 'Récupération du contexte MCP');
  res.json({ context: mcpContext });
});

// Analyse une commande
function parseCommand(command) {
  const parts = command.trim().split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  return { cmd, args };
}

// Handler pour create-project
async function handleCreateProject(args) {
  logToConsole('info', `Exécution de create-project avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 1) {
    throw new Error('Project name is required');
  }

  const name = args[0];
  const description = args.slice(1).join(' ');

  const projectPath = path.join(PROJECTS_DIR, name);

  // Vérifier si le projet existe déjà
  try {
    await fs.access(projectPath);
    logToConsole('error', `Le projet ${name} existe déjà`);
    throw new Error('Project already exists');
  } catch (error) {
    // Si l'erreur est différente de "le projet existe", la propager
    if (error.message !== 'Project already exists') {
      // Projet n'existe pas, c'est ce qu'on veut
      logToConsole('info', `Le projet ${name} n'existe pas, création en cours...`);
      
      // Créer le dossier du projet
      await fs.mkdir(projectPath, { recursive: true });

      // Créer un fichier README.md par défaut
      const readmePath = path.join(projectPath, 'README.md');
      const readmeContent = `# ${name}\n\n${description || 'A VibeServer project'}\n`;

      await fs.writeFile(readmePath, readmeContent, 'utf8');

      // Créer un fichier de configuration pour le projet
      const configPath = path.join(projectPath, '.vibeserver.json');
      const configContent = JSON.stringify({
        name,
        description: description || '',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }, null, 2);

      await fs.writeFile(configPath, configContent, 'utf8');

      // Mettre à jour le contexte
      mcpContext.currentProject = name;

      logToConsole('info', `Projet ${name} créé avec succès`);
      return { 
        success: true, 
        message: `Project '${name}' created successfully`,
        project: { name, description, path: projectPath }
      };
    }
    throw error;
  }
}

// Handler pour list-projects
async function handleListProjects() {
  logToConsole('info', `Exécution de list-projects`);
  
  const items = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
  const projects = [];

  for (const item of items) {
    if (item.isDirectory()) {
      try {
        const configPath = path.join(PROJECTS_DIR, item.name, '.vibeserver.json');
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);

        projects.push({
          name: config.name,
          description: config.description,
          created: config.created,
          updated: config.updated,
          isActive: config.name === mcpContext.currentProject
        });
      } catch (error) {
        // Si le fichier de configuration n'existe pas, ajouter juste le nom
        projects.push({ 
          name: item.name, 
          description: '', 
          created: null, 
          updated: null,
          isActive: item.name === mcpContext.currentProject
        });
      }
    }
  }

  logToConsole('info', `${projects.length} projets trouvés`);
  return { projects };
}

// Handler pour switch-project
async function handleSwitchProject(args) {
  logToConsole('info', `Exécution de switch-project avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 1) {
    throw new Error('Project name is required');
  }

  const projectName = args[0];
  const projectPath = path.join(PROJECTS_DIR, projectName);

  // Vérifier si le projet existe
  try {
    await fs.access(projectPath);
  } catch (error) {
    logToConsole('error', `Le projet ${projectName} n'existe pas`);
    throw new Error('Project not found');
  }

  // Mettre à jour le contexte
  mcpContext.currentProject = projectName;

  logToConsole('info', `Projet actif changé pour ${projectName}`);
  return { 
    success: true, 
    message: `Switched to project '${projectName}'`,
    currentProject: projectName
  };
}

// Handler pour create-file
async function handleCreateFile(args) {
  logToConsole('info', `Exécution de create-file avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('File path is required');
  }

  // Le premier argument est le chemin du fichier
  const filePath = args[0];
  
  // Le reste des arguments est considéré comme le contenu initial du fichier
  const initialContent = args.slice(1).join(' ') || '';

  // Construire le chemin complet
  const fullPath = path.join(PROJECTS_DIR, mcpContext.currentProject, filePath);
  
  // Vérifier si le fichier existe déjà
  try {
    await fs.access(fullPath);
    logToConsole('error', `Le fichier ${filePath} existe déjà`);
    throw new Error('File already exists');
  } catch (error) {
    // Si l'erreur est différente de "file exists", la propager
    if (error.message !== 'File already exists') {
      // Créer le dossier parent si nécessaire
      const dirPath = path.dirname(fullPath);
      await fs.mkdir(dirPath, { recursive: true });
      
      // Écrire le contenu initial dans le fichier
      await fs.writeFile(fullPath, initialContent, 'utf8');
      
      logToConsole('info', `Fichier ${filePath} créé avec succès`);
      return {
        success: true,
        message: `File '${filePath}' created successfully`,
        path: filePath
      };
    }
    throw error;
  }
}

// Handler pour list-files
async function handleListFiles(args) {
  logToConsole('info', `Exécution de list-files avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  // Le directory est optionnel, par défaut c'est la racine du projet
  const dirPath = args.length > 0 ? args[0] : '';
  
  // Construire le chemin complet
  const fullPath = path.join(PROJECTS_DIR, mcpContext.currentProject, dirPath);
  
  // Vérifier si le répertoire existe
  try {
    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path '${dirPath}' is not a directory`);
    }
  } catch (error) {
    logToConsole('error', `Le répertoire ${dirPath} n'existe pas ou n'est pas accessible`);
    throw new Error(`Directory not found or not accessible: ${error.message}`);
  }

  // Lister les fichiers et dossiers
  const items = await fs.readdir(fullPath, { withFileTypes: true });
  const entries = [];

  for (const item of items) {
    try {
      const itemPath = path.join(dirPath, item.name);
      const itemFullPath = path.join(fullPath, item.name);
      const stats = await fs.stat(itemFullPath);
      
      entries.push({
        name: item.name,
        path: itemPath.replace(/\\/g, '/'),  // Normaliser les chemins pour la sortie
        type: item.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime,
        isHidden: item.name.startsWith('.')
      });
    } catch (error) {
      // En cas d'erreur sur un fichier spécifique, on continue
      console.error(`Erreur lors de l'accès à ${item.name}:`, error);
    }
  }

  // Trier : dossiers d'abord, puis fichiers, par ordre alphabétique
  entries.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  logToConsole('info', `${entries.length} fichiers trouvés dans ${dirPath || '/'}`);
  return { 
    currentPath: dirPath || '/',
    files: entries 
  };
}

// Handler pour read-file
async function handleReadFile(args) {
  logToConsole('info', `Exécution de read-file avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('File path is required');
  }

  const filePath = args[0];
  const fullPath = path.join(PROJECTS_DIR, mcpContext.currentProject, filePath);
  
  // Vérifier si le fichier existe
  try {
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      throw new Error(`Path '${filePath}' is not a file`);
    }
  } catch (error) {
    logToConsole('error', `Le fichier ${filePath} n'existe pas ou n'est pas accessible`);
    throw new Error(`File not found or not accessible: ${error.message}`);
  }

  // Lire le contenu du fichier
  const content = await fs.readFile(fullPath, 'utf8');
  
  logToConsole('info', `Lecture du fichier ${filePath} (${content.length} caractères)`);
  return {
    path: filePath,
    content,
    size: content.length,
    lines: content.split('\n').length
  };
}

// Handler pour update-file
async function handleUpdateFile(args) {
  logToConsole('info', `Exécution de update-file avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 2) {
    throw new Error('File path and content are required');
  }

  const filePath = args[0];
  const content = args.slice(1).join(' ');
  const fullPath = path.join(PROJECTS_DIR, mcpContext.currentProject, filePath);
  
  // Vérifier si le fichier existe
  try {
    await fs.access(fullPath);
  } catch (error) {
    logToConsole('error', `Le fichier ${filePath} n'existe pas`);
    throw new Error('File not found');
  }

  // Écrire le contenu dans le fichier
  await fs.writeFile(fullPath, content, 'utf8');
  
  logToConsole('info', `Mise à jour du fichier ${filePath} (${content.length} caractères)`);
  return {
    success: true,
    message: `File '${filePath}' updated successfully`,
    path: filePath,
    size: content.length
  };
}

// Handler pour delete-file
async function handleDeleteFile(args) {
  logToConsole('info', `Exécution de delete-file avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('File path is required');
  }

  const filePath = args[0];
  const fullPath = path.join(PROJECTS_DIR, mcpContext.currentProject, filePath);
  
  // Vérifier si le fichier existe
  try {
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      await fs.rmdir(fullPath, { recursive: true });
      logToConsole('info', `Suppression du répertoire ${filePath}`);
    } else {
      await fs.unlink(fullPath);
      logToConsole('info', `Suppression du fichier ${filePath}`);
    }
  } catch (error) {
    logToConsole('error', `Le fichier/répertoire ${filePath} n'existe pas`);
    throw new Error('File or directory not found');
  }

  return {
    success: true,
    message: `'${filePath}' deleted successfully`,
    path: filePath
  };
}

// Handler pour edit
async function handleEditFile(args) {
  logToConsole('info', `Exécution de edit avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 2) {
    throw new Error('File path and line range are required');
  }

  const filePath = args[0];
  const lineRange = args[1];
  const newContent = args.slice(2).join(' ') || '';

  // Analyser la plage de lignes (format: début-fin)
  const rangeMatch = lineRange.match(/^(\d+)-(\d+)$/);
  if (!rangeMatch) {
    throw new Error('Invalid line range format. Use: start-end');
  }

  const startLine = parseInt(rangeMatch[1], 10) - 1; // Ajustement pour index 0
  const endLine = parseInt(rangeMatch[2], 10) - 1;   // Ajustement pour index 0

  if (startLine < 0 || startLine > endLine) {
    throw new Error('Invalid line range');
  }

  const fullPath = path.join(PROJECTS_DIR, mcpContext.currentProject, filePath);

  // Vérifier si le fichier existe
  try {
    await fs.access(fullPath);
  } catch (error) {
    logToConsole('error', `Le fichier ${filePath} n'existe pas`);
    throw new Error('File not found');
  }

  // Lire le fichier
  const content = await fs.readFile(fullPath, 'utf8');
  const lines = content.split('\n');

  // Vérifier les limites des lignes
  if (endLine >= lines.length) {
    throw new Error(`File has only ${lines.length} lines`);
  }

  // Si le nouveau contenu est fourni, mettre à jour les lignes
  if (newContent) {
    const newLines = newContent.split('\n');
    lines.splice(startLine, endLine - startLine + 1, ...newLines);
    
    // Écrire le fichier modifié
    await fs.writeFile(fullPath, lines.join('\n'), 'utf8');
    
    logToConsole('info', `Mise à jour des lignes ${startLine+1}-${endLine+1} du fichier ${filePath}`);
    return {
      success: true,
      filePath,
      startLine,
      endLine,
      newLineCount: newLines.length,
      message: `Lines ${startLine + 1}-${endLine + 1} of ${filePath} updated successfully`
    };
  } else {
    // Extraire les lignes demandées si pas de nouveau contenu
    const selectedLines = lines.slice(startLine, endLine + 1).join('\n');

    logToConsole('info', `Lecture des lignes ${startLine+1}-${endLine+1} du fichier ${filePath}`);
    return {
      success: true,
      filePath,
      startLine,
      endLine,
      content: selectedLines,
      message: `Ready to edit lines ${startLine + 1}-${endLine + 1} of ${filePath}`
    };
  }
}

// Handler pour exec
async function handleExecCommand(args) {
  logToConsole('info', `Exécution de exec avec args: ${JSON.stringify(args)}`);
  
  if (args.length < 1) {
    throw new Error('Command is required');
  }

  const command = args.join(' ');

  try {
    logToConsole('info', `Exécution de la commande shell: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    return {
      success: true,
      command,
      stdout,
      stderr
    };
  } catch (error) {
    logToConsole('error', `Erreur lors de l'exécution de la commande: ${error.message}`);
    throw new Error(`Command failed: ${error.message}`);
  }
}

// Handler pour git-commit
async function handleGitCommit(args) {
  logToConsole('info', `Exécution de git-commit avec args: ${JSON.stringify(args)}`);
  
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('Commit message is required');
  }

  const message = args.join(' ');
  const projectPath = path.join(PROJECTS_DIR, mcpContext.currentProject);

  try {
    // Vérifier si c'est un repo git
    try {
      await fs.access(path.join(projectPath, '.git'));
    } catch (error) {
      // Initialiser git si pas déjà fait
      logToConsole('info', `Initialisation de Git dans ${projectPath}`);
      await execPromise(`cd "${projectPath}" && git init`);
    }

    // Ajouter tous les fichiers
    logToConsole('info', `Ajout des fichiers avec git add`);
    await execPromise(`cd "${projectPath}" && git add .`);

    // Committer avec le message
    logToConsole('info', `Création du commit avec le message: ${message}`);
    const { stdout, stderr } = await execPromise(`cd "${projectPath}" && git commit -m "${message}"`);

    return {
      success: true,
      message: `Changes committed successfully`,
      details: stdout,
      errors: stderr
    };
  } catch (error) {
    if (error.stderr && error.stderr.includes('nothing to commit')) {
      logToConsole('info', `Aucune modification à committer`);
      return {
        success: true,
        message: 'No changes to commit'
      };
    }
    logToConsole('error', `Erreur Git: ${error.message}`);
    throw new Error(`Git commit failed: ${error.message}`);
  }
}

// Handler pour help
function handleHelp() {
  const commands = [
    { name: 'help', description: 'Affiche la liste des commandes disponibles' },
    { name: 'create-project <nom> [description]', description: 'Crée un nouveau projet' },
    { name: 'list-projects', description: 'Liste tous les projets disponibles' },
    { name: 'switch-project <nom>', description: 'Change le projet actif' },
    { name: 'create-file <chemin> [contenu]', description: 'Crée un nouveau fichier avec un contenu optionnel' },
    { name: 'list-files [répertoire]', description: 'Liste les fichiers d\'un répertoire (par défaut: racine du projet)' },
    { name: 'read-file <chemin>', description: 'Lit le contenu d\'un fichier' },
    { name: 'update-file <chemin> <contenu>', description: 'Met à jour le contenu d\'un fichier' },
    { name: 'delete-file <chemin>', description: 'Supprime un fichier ou un répertoire' },
    { name: 'edit <chemin> <début-fin> [contenu]', description: 'Édite des lignes spécifiques d\'un fichier' },
    { name: 'exec <commande>', description: 'Exécute une commande shell' },
    { name: 'git-commit <message>', description: 'Crée un commit Git dans le projet actif' }
  ];

  logToConsole('info', 'Affichage de l\'aide');
  return {
    title: 'Commandes MCP disponibles',
    commands,
    currentProject: mcpContext.currentProject
  };
}

module.exports = router;