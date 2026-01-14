'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  Trash2,
  MoreHorizontal,
  Pencil,
  Copy,
  FolderOpen,
  X,
  Check,
  LogOut,
  AlertTriangle,
  FolderPlus,
  Clock,
  Grid3X3,
  Search,
  ChevronRight,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { getProjects, deleteProject, duplicateProject, renameProject, createProjectObject, type LocalProject } from '@/lib/storage';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<LocalProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHoveredCard, setIsHoveredCard] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setProjects(getProjects());

    // Check if user is admin
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      }
    };
    checkAdmin();
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = () => {
    const newProject = createProjectObject();
    sessionStorage.setItem(`unsaved_project_${newProject.id}`, JSON.stringify(newProject));
    router.push(`/workspace/${newProject.id}`);
  };

  const handleOpenProject = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    router.push(`/workspace/${id}`);
  };

  const handleDeleteProject = (e: React.MouseEvent, project: LocalProject) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setProjects(getProjects());
    }
    setDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  const handleDuplicateProject = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    duplicateProject(id);
    setProjects(getProjects());
  };

  const handleStartRename = (e: React.MouseEvent, project: LocalProject) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const handleConfirmRename = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (renamingId && renameValue.trim()) {
      renameProject(renamingId, renameValue.trim());
      setProjects(getProjects());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmRename(e);
    else if (e.key === 'Escape') {
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="group">
              <Logo variant="dark" size="md" />
            </Link>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-xl transition-all duration-200"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">Admin Panel</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Projects</h1>
            <p className="text-gray-500">Create and manage your document merge projects</p>
          </div>
          <button
            onClick={handleCreateProject}
            className="group flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            New Project
          </button>
        </div >

        {/* Search Bar */}
        {
          projects.length > 0 && (
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200"
              />
            </div>
          )
        }

        {/* Projects Grid */}
        {
          filteredProjects.length === 0 && projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6">
                <FolderPlus className="w-10 h-10 text-violet-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No projects yet</h2>
              <p className="text-gray-500 mb-8 text-center max-w-md">
                Create your first project to start generating personalized documents at scale
              </p>
              <button
                onClick={handleCreateProject}
                className="group flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-200"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Create Project
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No projects match your search</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onMouseEnter={() => setIsHoveredCard(project.id)}
                  onMouseLeave={() => setIsHoveredCard(null)}
                  onClick={() => router.push(`/workspace/${project.id}`)}
                  className="group relative bg-white rounded-2xl border border-gray-200/80 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 cursor-pointer transition-all duration-300"
                >
                  {/* Gradient Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl" />

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-6 h-6 text-violet-600" />
                      </div>

                      {/* Menu */}
                      <div className="relative" ref={openMenuId === project.id ? menuRef : null}>
                        <button
                          onClick={(e) => toggleMenu(e, project.id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${isHoveredCard === project.id || openMenuId === project.id
                            ? 'opacity-100 bg-gray-100 hover:bg-gray-200'
                            : 'opacity-0'
                            }`}
                        >
                          <MoreHorizontal className="w-5 h-5 text-gray-500" />
                        </button>

                        {openMenuId === project.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                            <button
                              onClick={(e) => handleOpenProject(e, project.id)}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <FolderOpen className="w-4 h-4 text-gray-400" />
                              Open
                            </button>
                            <button
                              onClick={(e) => handleStartRename(e, project)}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <Pencil className="w-4 h-4 text-gray-400" />
                              Rename
                            </button>
                            <button
                              onClick={(e) => handleDuplicateProject(e, project.id)}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                              Duplicate
                            </button>
                            <hr className="my-2 border-gray-100" />
                            <button
                              onClick={(e) => handleDeleteProject(e, project)}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project Name */}
                    {renamingId === project.id ? (
                      <form onSubmit={handleConfirmRename} className="mb-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            className="flex-1 px-3 py-2 text-lg font-semibold text-gray-900 border-2 border-violet-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                          />
                          <button type="submit" className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Check className="w-5 h-5" />
                          </button>
                          <button type="button" onClick={handleCancelRename} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors duration-200">
                        {project.name}
                      </h3>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Grid3X3 className="w-4 h-4" />
                        <span>{project.gridData.length} rows</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 truncate max-w-[150px]">{project.templateName}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </main >

      {/* Delete Confirmation Modal */}
      {
        deleteModalOpen && projectToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={cancelDelete}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Project</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">&quot;{projectToDelete.name}&quot;</span>?
                  All data will be permanently removed.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
