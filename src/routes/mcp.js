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

// Exécute une commande MCP
router.post('/execute', async (req, res, next) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Ajouter la commande à l'historique
    mcpContext.lastCommand = command;
    mcpContext.history.push({
      command,
      timestamp: new Date().toISOString()
    });

    // Analyser la commande
    const { cmd, args } = parseCommand(command);
    
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
      case 'exec':
        result = await handleExecCommand(args);
        break;
      case 'git-commit':
        result = await handleGitCommit(args);
        break;
      default:
        return res.status(400).json({ error: `Unknown command: ${cmd}` });
    }

    res.json({ success: true, command, result });
  } catch (error) {
    next(error);
  }
});

// Récupère le contexte MCP actuel
router.get('/context', (req, res) => {
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
  if (args.length < 1) {
    throw new Error('Project name is required');
  }

  const name = args[0];
  const description = args.slice(1).join(' ');

  const projectPath = path.join(PROJECTS_DIR, name);

  // Vérifier si le projet existe déjà
  try {
    await fs.access(projectPath);
    throw new Error('Project already exists');
  } catch (error) {
    // Si l'erreur est différente de "le projet existe", la propager
    if (error.message !== 'Project already exists') {
      // Projet n'existe pas, c'est ce qu'on veut
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

  return { projects };
}

// Handler pour switch-project
async function handleSwitchProject(args) {
  if (args.length < 1) {
    throw new Error('Project name is required');
  }

  const projectName = args[0];
  const projectPath = path.join(PROJECTS_DIR, projectName);

  // Vérifier si le projet existe
  try {
    await fs.access(projectPath);
  } catch (error) {
    throw new Error('Project not found');
  }

  // Mettre à jour le contexte
  mcpContext.currentProject = projectName;

  return { 
    success: true, 
    message: `Switched to project '${projectName}'`,
    currentProject: projectName
  };
}

// Handler pour edit
async function handleEditFile(args) {
  if (!mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 2) {
    throw new Error('File path and line range are required');
  }

  const filePath = args[0];
  const lineRange = args[1];

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
    throw new Error('File not found');
  }

  // Lire le fichier
  const content = await fs.readFile(fullPath, 'utf8');
  const lines = content.split('\n');

  // Vérifier les limites des lignes
  if (endLine >= lines.length) {
    throw new Error(`File has only ${lines.length} lines`);
  }

  // Extraire les lignes demandées
  const selectedLines = lines.slice(startLine, endLine + 1).join('\n');

  return {
    success: true,
    filePath,
    startLine,
    endLine,
    content: selectedLines,
    message: `Ready to edit lines ${startLine + 1}-${endLine + 1} of ${filePath}`
  };
}

// Handler pour exec
async function handleExecCommand(args) {
  if (args.length < 1) {
    throw new Error('Command is required');
  }

  const command = args.join(' ');

  try {
    const { stdout, stderr } = await execPromise(command);
    return {
      success: true,
      command,
      stdout,
      stderr
    };
  } catch (error) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

// Handler pour git-commit
async function handleGitCommit(args) {
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
      await execPromise(`cd "${projectPath}" && git init`);
    }

    // Ajouter tous les fichiers
    await execPromise(`cd "${projectPath}" && git add .`);

    // Committer avec le message
    const { stdout, stderr } = await execPromise(`cd "${projectPath}" && git commit -m "${message}"`);

    return {
      success: true,
      message: `Changes committed successfully`,
      details: stdout,
      errors: stderr
    };
  } catch (error) {
    if (error.stderr && error.stderr.includes('nothing to commit')) {
      return {
        success: true,
        message: 'No changes to commit'
      };
    }
    throw new Error(`Git commit failed: ${error.message}`);
  }
}

module.exports = router;
