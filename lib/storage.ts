// Local storage utility for development without Supabase
import type { Project, RowData } from '@/types';

const PROJECTS_KEY = 'docify_projects';

export interface LocalProject {
  id: string;
  name: string;
  gridData: RowData[];
  templateHtml: string;
  templateName: string;
  emailColumn: string | null;
  filenamePattern?: string; // Pattern for generating PDF filenames (e.g., "{Name}_{ID}")
  createdAt: string;
  updatedAt: string;
}

// Generate a simple unique ID
export function generateId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get all projects from local storage
export function getProjects(): LocalProject[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PROJECTS_KEY);
  return data ? JSON.parse(data) : [];
}

// Get a single project by ID
export function getProject(id: string): LocalProject | null {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
}

// Create a new project object (without saving to storage)
export function createProjectObject(name: string = 'Untitled Project'): LocalProject {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    gridData: [],
    templateHtml: '',
    templateName: 'New Template',
    emailColumn: null,
    filenamePattern: '{Name}', // Default pattern
    createdAt: now,
    updatedAt: now,
  };
}

// Check if a project exists in storage
export function projectExists(id: string): boolean {
  const projects = getProjects();
  return projects.some(p => p.id === id);
}

// Save a new project to storage
export function saveNewProject(project: LocalProject): LocalProject {
  const projects = getProjects();
  projects.unshift(project);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return project;
}

// Create a new project and save it immediately (legacy behavior)
export function createProject(name: string = 'Untitled Project'): LocalProject {
  const newProject = createProjectObject(name);
  return saveNewProject(newProject);
}

// Update a project
export function updateProject(id: string, updates: Partial<LocalProject>): LocalProject | null {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);

  if (index === -1) return null;

  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return projects[index];
}

// Delete a project
export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);

  if (filtered.length === projects.length) return false;

  localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  return true;
}

// Rename a project
export function renameProject(id: string, newName: string): LocalProject | null {
  return updateProject(id, { name: newName });
}

// Duplicate a project
export function duplicateProject(id: string): LocalProject | null {
  const project = getProject(id);
  if (!project) return null;

  const now = new Date().toISOString();
  const duplicated: LocalProject = {
    ...project,
    id: generateId(),
    name: `${project.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };

  const projects = getProjects();
  projects.unshift(duplicated);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

  return duplicated;
}
