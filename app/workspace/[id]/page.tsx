'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Save,
  Loader2,
  Download,
  Mail,
  Eye,
  Check,
  ArrowLeft,
  FileText,
  Table2,
  PenLine,
  Columns,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { getProject, updateProject, saveNewProject, type LocalProject } from '@/lib/storage';
import type { RowData, ViewMode } from '@/types';
import dynamic from 'next/dynamic';
import FileUploader from '@/components/FileUploader';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

const DataGridView = dynamic(() => import('@/components/DataGridView'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>
});
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>
});
const PreviewModal = dynamic(() => import('@/components/PreviewModal'), {
  ssr: false
});
const DownloadModal = dynamic(() => import('@/components/DownloadModal'), {
  ssr: false
});

const DEFAULT_BATCH_LIMIT = 200;

export default function WorkspacePage() {
  const [project, setProject] = useState<LocalProject | null>(null);
  const [projectName, setProjectName] = useState('');
  const [gridData, setGridData] = useState<RowData[]>([]);
  const [templateHtml, setTemplateHtml] = useState('');
  const [emailColumn, setEmailColumn] = useState<string | null>(null);
  const [filenamePattern, setFilenamePattern] = useState('{Name}');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isNewProject, setIsNewProject] = useState(false);
  const [batchLimit, setBatchLimit] = useState(DEFAULT_BATCH_LIMIT);
  const [showBatchWarning, setShowBatchWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<'preview' | 'download' | null>(null);

  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const columnHeaders = useMemo(() => {
    if (gridData.length === 0) return [];
    return Object.keys(gridData[0]);
  }, [gridData]);

  // Fetch user's batch limit from Supabase
  useEffect(() => {
    const fetchBatchLimit = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('batch_limit')
          .eq('id', user.id)
          .single();
        if (profile?.batch_limit) {
          setBatchLimit(profile.batch_limit);
        }
      }
    };
    fetchBatchLimit();
  }, [supabase]);

  useEffect(() => {
    const loadProjectData = () => {
      const id = params.id as string;
      let loadedProject = getProject(id);

      if (!loadedProject) {
        const unsavedData = sessionStorage.getItem(`unsaved_project_${id}`);
        if (unsavedData) {
          loadedProject = JSON.parse(unsavedData);
          setIsNewProject(true);
        } else {
          router.push('/dashboard');
          return;
        }
      }

      setProject(loadedProject);
      setProjectName(loadedProject!.name);
      setGridData(loadedProject!.gridData);
      setTemplateHtml(loadedProject!.templateHtml);
      setEmailColumn(loadedProject!.emailColumn);
      setFilenamePattern(loadedProject!.filenamePattern || '{Name}');
      setLoading(false);
    };

    loadProjectData();
  }, [params.id, router]);

  // Handle clicking Preview/Download with batch limit check
  const handleActionWithLimitCheck = (action: 'preview' | 'download') => {
    if (gridData.length > batchLimit) {
      setPendingAction(action);
      setShowBatchWarning(true);
    } else {
      if (action === 'preview') {
        setShowPreview(true);
      } else {
        setShowDownload(true);
      }
    }
  };

  // Proceed with limited data (truncated to batch_limit)
  const handleProceedWithLimit = () => {
    setShowBatchWarning(false);
    if (pendingAction === 'preview') {
      setShowPreview(true);
    } else if (pendingAction === 'download') {
      setShowDownload(true);
    }
    setPendingAction(null);
  };

  // Get limited data for preview/download
  const limitedData = useMemo(() => {
    return gridData.slice(0, batchLimit);
  }, [gridData, batchLimit]);

  const saveProject = async () => {
    if (!project) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const updatedProject: LocalProject = {
        ...project,
        name: projectName,
        gridData,
        templateHtml,
        emailColumn,
        filenamePattern,
        updatedAt: new Date().toISOString(),
      };

      if (isNewProject) {
        saveNewProject(updatedProject);
        sessionStorage.removeItem(`unsaved_project_${project.id}`);
        setIsNewProject(false);
      } else {
        updateProject(project.id, {
          name: projectName,
          gridData,
          templateHtml,
          emailColumn,
          filenamePattern,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 400));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDataLoaded = (data: RowData[]) => setGridData(data);
  const handleDataChange = (data: RowData[]) => setGridData(data);
  const handleSetEmailColumn = (columnKey: string) => setEmailColumn(columnKey || null);
  const handleContentChange = (html: string) => setTemplateHtml(html);
  const handleInsertVariable = (variable: string) => {
    // Variable insertion is handled by the RichTextEditor component
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 animate-pulse">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-purple-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-3 sm:px-6 py-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Back</span>
            </button>

            <div className="hidden sm:block h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial">
              <Logo variant="dark" size="sm" showText={false} />
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-base sm:text-lg font-semibold border-none outline-none bg-transparent text-gray-900 w-full sm:min-w-[200px] focus:ring-0"
                placeholder="Project Name"
              />
            </div>

            <div className="hidden xl:block h-6 w-px bg-gray-200" />

            {/* Filename Pattern Control - Hidden on mobile */}
            <div className="hidden xl:flex items-center gap-2 group relative">
              <label className="text-sm text-gray-600 whitespace-nowrap">Filename:</label>
              <input
                type="text"
                value={filenamePattern}
                onChange={(e) => setFilenamePattern(e.target.value)}
                placeholder="{Name}_{ID}"
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent w-[150px]"
                title="Use {ColumnName} to insert data from your columns"
              />
              {/* Tooltip */}
              <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <div className="font-medium mb-1">Available variables:</div>
                  {columnHeaders.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {columnHeaders.slice(0, 6).map(col => (
                        <span key={col} className="bg-gray-800 px-2 py-0.5 rounded">{`{${col}}`}</span>
                      ))}
                      {columnHeaders.length > 6 && <span>+{columnHeaders.length - 6} more</span>}
                    </div>
                  ) : (
                    <div className="text-gray-400">Upload data to see variables</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto overflow-x-auto">
            {/* View Mode Toggle - Hidden on mobile */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-xl p-1 gap-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('data')}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'data'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Table2 className="w-4 h-4" />
                <span className="hidden lg:inline">Data</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'split'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Columns className="w-4 h-4" />
                <span className="hidden lg:inline">Split</span>
              </button>
              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'editor'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <PenLine className="w-4 h-4" />
                <span className="hidden lg:inline">Editor</span>
              </button>
            </div>

            <div className="hidden md:block h-8 w-px bg-gray-200" />

            {/* Action Buttons - Responsive sizing */}
            <button
              onClick={() => handleActionWithLimitCheck('preview')}
              disabled={gridData.length === 0 || !templateHtml}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none flex-shrink-0"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            <button
              onClick={() => handleActionWithLimitCheck('download')}
              disabled={gridData.length === 0 || !templateHtml}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              disabled={true}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-400 rounded-xl font-medium cursor-not-allowed flex-shrink-0"
              title="Coming Soon"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
              <span className="text-[10px] bg-gray-300 text-gray-500 px-1.5 py-0.5 rounded-md font-medium">Soon</span>
            </button>

            <button
              onClick={saveProject}
              disabled={saving}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-60 shadow-sm hover:shadow-md flex-shrink-0 ${saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-violet-500/30'
                }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{saveSuccess ? 'Saved!' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      < div className="flex-1 overflow-hidden p-4" >
        {viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Data Panel */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                    <Table2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Data Grid</h2>
                    <p className="text-xs text-gray-500">Upload Excel/CSV or edit directly</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                {gridData.length === 0 ? (
                  <FileUploader onDataLoaded={handleDataLoaded} />
                ) : (
                  <DataGridView
                    data={gridData}
                    onDataChange={handleDataChange}
                    onSetEmailColumn={handleSetEmailColumn}
                    emailColumn={emailColumn || undefined}
                  />
                )}
              </div>
              {gridData.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Table2 className="w-3.5 h-3.5" />
                      {gridData.length} rows • {columnHeaders.length} cols
                    </span>
                    {emailColumn && (
                      <span className="text-sm text-violet-600 flex items-center gap-1.5 bg-violet-50 px-2 py-0.5 rounded-full">
                        <Mail className="w-3.5 h-3.5" />
                        {emailColumn}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setGridData([])}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Editor Panel */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
              <RichTextEditor
                content={templateHtml}
                onContentChange={handleContentChange}
                variables={columnHeaders}
                onInsertVariable={handleInsertVariable}
              />
            </div>
          </div>
        ) : viewMode === 'data' ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm h-full overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <Table2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Data Grid</h2>
                  <p className="text-xs text-gray-500">Upload Excel/CSV or edit directly</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {gridData.length === 0 ? (
                <FileUploader onDataLoaded={handleDataLoaded} />
              ) : (
                <DataGridView
                  data={gridData}
                  onDataChange={handleDataChange}
                  onSetEmailColumn={handleSetEmailColumn}
                  emailColumn={emailColumn || undefined}
                />
              )}
            </div>
            {gridData.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Table2 className="w-3.5 h-3.5" />
                    {gridData.length} rows • {columnHeaders.length} cols
                  </span>
                  {emailColumn && (
                    <span className="text-sm text-violet-600 flex items-center gap-1.5 bg-violet-50 px-2 py-0.5 rounded-full">
                      <Mail className="w-3.5 h-3.5" />
                      {emailColumn}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setGridData([])}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm h-full overflow-hidden flex flex-col">
            <RichTextEditor
              content={templateHtml}
              onContentChange={handleContentChange}
              variables={columnHeaders}
              onInsertVariable={handleInsertVariable}
            />
          </div>
        )
        }
      </div >

      {/* Preview Modal */}
      < PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        templateHtml={templateHtml}
        data={limitedData}
        emailColumn={emailColumn}
      />

      {/* Download Modal */}
      < DownloadModal
        isOpen={showDownload}
        onClose={() => setShowDownload(false)}
        templateHtml={templateHtml}
        data={limitedData}
        projectName={projectName}
        filenamePattern={filenamePattern}
      />

      {/* Batch Limit Warning Modal */}
      {
        showBatchWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setShowBatchWarning(false);
                setPendingAction(null);
              }}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md p-6">
              <button
                onClick={() => {
                  setShowBatchWarning(false);
                  setPendingAction(null);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Batch Size Limit Exceeded</h3>
                  <p className="text-sm text-gray-500">Your data exceeds the maximum batch size</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Your data rows:</span>
                  <span className="font-semibold text-gray-900">{gridData.length}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Your batch limit:</span>
                  <span className="font-semibold text-amber-600">{batchLimit}</span>
                </div>
                <hr className="my-2 border-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Documents to generate:</span>
                  <span className="font-semibold text-emerald-600">{Math.min(gridData.length, batchLimit)}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Only the first <strong>{batchLimit}</strong> records will be processed.
                To process more, contact your administrator to increase your batch limit.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBatchWarning(false);
                    setPendingAction(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedWithLimit}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/30 transition"
                >
                  Continue with {batchLimit}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
