const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '../../projects');

// Liste tous les projets
router.get('/list', async (req, res, next) => {
  try {
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
            updated: config.updated
          });
        } catch (error) {
          // Si le fichier de configuration n'existe pas, ajouter juste le nom
          projects.push({ 
            name: item.name, 
            description: '', 
            created: null, 
            updated: null
          });
        }
      }
    }

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// Crée un nouveau projet
router.post('/create', async (req, res, next) => {
  try {
    const { name, description = '' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectPath = path.join(PROJECTS_DIR, name);

    // Vérifier si le projet existe déjà
    try {
      await fs.access(projectPath);
      return res.status(409).json({ error: 'Project already exists' });
    } catch {
      // C'est bien si le chemin n'existe pas encore
    }

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

    res.status(201).json({
      success: true,
      message: `Project '${name}' created successfully`,
      project: { name, description, path: projectPath }
    });
  } catch (error) {
    next(error);
  }
});

// Supprime un projet
router.delete('/delete', async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectPath = path.join(PROJECTS_DIR, name);

    // Vérifier si le projet existe
    try {
      await fs.access(projectPath);
    } catch {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Option pour la suppression récursive
    const { recursive = false } = req.body;

    if (recursive) {
      // Supprimer récursivement (dangereux, demande confirmation)
      const { confirm } = req.body;
      if (confirm !== name) {
        return res.status(400).json({ 
          error: 'Confirmation required for recursive deletion',
          message: `To delete this project recursively, set 'confirm' field equal to project name '${name}'` 
        });
      }

      // Fonction récursive pour supprimer un dossier et son contenu
      const deleteDir = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            await deleteDir(fullPath);
          } else {
            await fs.unlink(fullPath);
          }
        }
        
        await fs.rmdir(dirPath);
      };

      await deleteDir(projectPath);
    } else {
      return res.status(400).json({ 
        error: 'Recursive deletion required',
        message: 'Set recursive=true and confirm=project_name to delete a project' 
      });
    }

    res.json({
      success: true,
      message: `Project '${name}' deleted successfully`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
