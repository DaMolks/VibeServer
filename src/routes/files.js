const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '../../projects');

// Liste les fichiers d'un projet
router.get('/list', async (req, res, next) => {
  try {
    const { project, dir = '' } = req.query;

    if (!project) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const fullPath = path.join(PROJECTS_DIR, project, dir);

    // Vérifier si le dossier existe
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'Directory not found' });
    }

    // Lire le contenu du dossier
    const items = await fs.readdir(fullPath, { withFileTypes: true });

    // Formater les résultats
    const files = items.map(item => ({
      name: item.name,
      path: path.join(dir, item.name).replace(/\\/g, '/'),
      type: item.isDirectory() ? 'directory' : 'file',
      isHidden: item.name.startsWith('.')
    }));

    res.json({ files });
  } catch (error) {
    next(error);
  }
});

// Lit le contenu d'un fichier
router.get('/read', async (req, res, next) => {
  try {
    const { project, path: filePath } = req.query;

    if (!project || !filePath) {
      return res.status(400).json({ error: 'Project name and file path are required' });
    }

    const fullPath = path.join(PROJECTS_DIR, project, filePath);

    // Vérifier si le fichier existe
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Lire le contenu du fichier
    const content = await fs.readFile(fullPath, 'utf8');

    res.json({ content });
  } catch (error) {
    next(error);
  }
});

// Écrit un fichier complet
router.post('/write', async (req, res, next) => {
  try {
    const { project, path: filePath, content } = req.body;

    if (!project || !filePath || content === undefined) {
      return res.status(400).json({ error: 'Project name, file path, and content are required' });
    }

    const fullPath = path.join(PROJECTS_DIR, project, filePath);

    // Assurer que le dossier parent existe
    const dirPath = path.dirname(fullPath);
    await fs.mkdir(dirPath, { recursive: true });

    // Écrire le contenu dans le fichier
    await fs.writeFile(fullPath, content, 'utf8');

    res.json({
      success: true,
      message: 'File written successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Édite des lignes spécifiques d'un fichier
router.patch('/edit-lines', async (req, res, next) => {
  try {
    const { project, path: filePath, startLine, endLine, newContent } = req.body;

    if (!project || !filePath || startLine === undefined || endLine === undefined || newContent === undefined) {
      return res.status(400).json({ error: 'Project name, file path, line numbers, and new content are required' });
    }

    const fullPath = path.join(PROJECTS_DIR, project, filePath);

    // Vérifier si le fichier existe
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Lire le fichier existant
    const existingContent = await fs.readFile(fullPath, 'utf8');
    const lines = existingContent.split('\n');

    // Valider les numéros de ligne
    if (startLine < 0 || endLine >= lines.length || startLine > endLine) {
      return res.status(400).json({ error: 'Invalid line numbers' });
    }

    // Remplacer les lignes spécifiées
    const newLines = newContent.split('\n');
    lines.splice(startLine, endLine - startLine + 1, ...newLines);

    // Écrire le fichier modifié
    await fs.writeFile(fullPath, lines.join('\n'), 'utf8');

    res.json({
      success: true,
      message: `Lines ${startLine} to ${endLine} updated successfully`,
      lineCount: newLines.length
    });
  } catch (error) {
    next(error);
  }
});

// Supprime un fichier
router.delete('/delete', async (req, res, next) => {
  try {
    const { project, path: filePath } = req.body;

    if (!project || !filePath) {
      return res.status(400).json({ error: 'Project name and file path are required' });
    }

    const fullPath = path.join(PROJECTS_DIR, project, filePath);

    // Vérifier si le fichier existe
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Supprimer le fichier
    await fs.unlink(fullPath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
