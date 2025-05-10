const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '../../projects');

// Liste tous les projets
router.get('/list', async (req, res, next) => {
  try {
    console.log('GET /api/projects/list - Liste des projets demandée');
    
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

    console.log(`${projects.length} projets trouvés`);
    res.json({ projects });
  } catch (error) {
    console.error('Erreur lors de la liste des projets:', error);
    next(error);
  }
});

// Crée un nouveau projet
router.post('/create', async (req, res, next) => {
  try {
    console.log('POST /api/projects/create - Données reçues:', req.body);
    
    const { name, description = '' } = req.body;

    if (!name) {
      console.log('Erreur: nom de projet manquant');
      return res.status(400).json({ 
        success: false,
        error: 'Project name is required' 
      });
    }

    const projectPath = path.join(PROJECTS_DIR, name);

    // Vérifier si le projet existe déjà
    try {
      await fs.access(projectPath);
      console.log(`Erreur: le projet '${name}' existe déjà`);
      return res.status(409).json({ 
        success: false,
        error: 'Project already exists' 
      });
    } catch (error) {
      // C'est bien si le chemin n'existe pas encore
      console.log(`Le projet '${name}' n'existe pas, on peut le créer`);
    }

    // Créer le dossier du projet
    console.log(`Création du dossier ${projectPath}`);
    await fs.mkdir(projectPath, { recursive: true });

    // Créer un fichier README.md par défaut
    const readmePath = path.join(projectPath, 'README.md');
    const readmeContent = `# ${name}\n\n${description || 'A VibeServer project'}\n`;

    console.log(`Création du fichier README.md`);
    await fs.writeFile(readmePath, readmeContent, 'utf8');

    // Créer un fichier de configuration pour le projet
    const configPath = path.join(projectPath, '.vibeserver.json');
    const configContent = JSON.stringify({
      name,
      description: description || '',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }, null, 2);

    console.log(`Création du fichier de configuration .vibeserver.json`);
    await fs.writeFile(configPath, configContent, 'utf8');

    console.log(`Projet '${name}' créé avec succès`);
    res.status(201).json({
      success: true,
      message: `Project '${name}' created successfully`,
      project: { name, description, path: projectPath }
    });
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    res.status(500).json({
      success: false,
      error: `Failed to create project: ${error.message}`
    });
  }
});

// Supprime un projet
router.delete('/delete', async (req, res, next) => {
  try {
    console.log('DELETE /api/projects/delete - Données reçues:', req.body);
    
    const { name } = req.body;

    if (!name) {
      console.log('Erreur: nom de projet manquant');
      return res.status(400).json({ 
        success: false,
        error: 'Project name is required' 
      });
    }

    const projectPath = path.join(PROJECTS_DIR, name);

    // Vérifier si le projet existe
    try {
      await fs.access(projectPath);
    } catch {
      console.log(`Erreur: le projet '${name}' n'existe pas`);
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      });
    }

    // Option pour la suppression récursive
    const { recursive = false } = req.body;

    if (recursive) {
      // Supprimer récursivement (dangereux, demande confirmation)
      const { confirm } = req.body;
      if (confirm !== name) {
        console.log(`Erreur: confirmation nécessaire pour la suppression récursive`);
        return res.status(400).json({ 
          success: false,
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

      console.log(`Suppression récursive du dossier ${projectPath}`);
      await deleteDir(projectPath);
    } else {
      console.log(`Erreur: suppression récursive requise`);
      return res.status(400).json({ 
        success: false,
        error: 'Recursive deletion required',
        message: 'Set recursive=true and confirm=project_name to delete a project' 
      });
    }

    console.log(`Projet '${name}' supprimé avec succès`);
    res.json({
      success: true,
      message: `Project '${name}' deleted successfully`
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    res.status(500).json({
      success: false,
      error: `Failed to delete project: ${error.message}`
    });
  }
});

module.exports = router;
