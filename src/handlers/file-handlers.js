/**
 * file-handlers.js
 * 
 * Handlers pour les commandes de gestion de fichiers dans le système MCP
 */

const fs = require('fs').promises;
const path = require('path');
const { logToConsole, getActiveProject } = require('./shared');

const PROJECTS_DIR = path.join(__dirname, '../../projects');

/**
 * Crée un nouveau fichier dans le projet actif
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleCreateFile(args) {
  logToConsole('info', `Exécution de create-file avec args: ${JSON.stringify(args)}`);
  
  if (!global.mcpContext.currentProject) {
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
  const fullPath = path.join(PROJECTS_DIR, global.mcpContext.currentProject, filePath);
  
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

/**
 * Liste les fichiers dans un répertoire du projet actif
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleListFiles(args) {
  logToConsole('info', `Exécution de list-files avec args: ${JSON.stringify(args)}`);
  
  if (!global.mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  // Le directory est optionnel, par défaut c'est la racine du projet
  const dirPath = args.length > 0 ? args[0] : '';
  
  // Construire le chemin complet
  const fullPath = path.join(PROJECTS_DIR, global.mcpContext.currentProject, dirPath);
  
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

/**
 * Lit le contenu d'un fichier dans le projet actif
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleReadFile(args) {
  logToConsole('info', `Exécution de read-file avec args: ${JSON.stringify(args)}`);
  
  if (!global.mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('File path is required');
  }

  const filePath = args[0];
  const fullPath = path.join(PROJECTS_DIR, global.mcpContext.currentProject, filePath);
  
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

/**
 * Met à jour le contenu d'un fichier dans le projet actif
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleUpdateFile(args) {
  logToConsole('info', `Exécution de update-file avec args: ${JSON.stringify(args)}`);
  
  if (!global.mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 2) {
    throw new Error('File path and content are required');
  }

  const filePath = args[0];
  const content = args.slice(1).join(' ');
  const fullPath = path.join(PROJECTS_DIR, global.mcpContext.currentProject, filePath);
  
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

/**
 * Supprime un fichier ou un répertoire dans le projet actif
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleDeleteFile(args) {
  logToConsole('info', `Exécution de delete-file avec args: ${JSON.stringify(args)}`);
  
  if (!global.mcpContext.currentProject) {
    throw new Error('No active project. Use switch-project command first.');
  }

  if (args.length < 1) {
    throw new Error('File path is required');
  }

  const filePath = args[0];
  const fullPath = path.join(PROJECTS_DIR, global.mcpContext.currentProject, filePath);
  
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

/**
 * Édite des lignes spécifiques d'un fichier dans le projet actif
 * @param {Array} args - Arguments de la commande
 * @returns {Promise<Object>} - Résultat de l'opération
 */
async function handleEditFile(args) {
  logToConsole('info', `Exécution de edit avec args: ${JSON.stringify(args)}`);
  
  if (!global.mcpContext.currentProject) {
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

  const fullPath = path.join(PROJECTS_DIR, global.mcpContext.currentProject, filePath);

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

module.exports = {
  handleCreateFile,
  handleListFiles,
  handleReadFile,
  handleUpdateFile,
  handleDeleteFile,
  handleEditFile
};
