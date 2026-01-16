'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Undo,
  Redo,
  Highlighter,
  RemoveFormatting,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Indent,
  Outdent
} from 'lucide-react';

// --- Constants & Types ---

const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 600;
const PAGE_DELIMITER = '<div class="page-break-delimiter"></div>';

interface RichTextEditorProps {
  content: string; // "Page 1 <delimiter> Page 2"
  onContentChange: (html: string) => void;
  variables: string[];
  onInsertVariable: (variable: string) => void;
}

// --- Extensions (Same as before) ---
const FontFamily = Extension.create({
  name: 'fontFamily',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontFamily: {
          default: null,
          parseHTML: element => element.style.fontFamily?.replace(/['"]/g, ''),
          renderHTML: attributes => {
            if (!attributes.fontFamily) return {};
            return { style: `font-family: ${attributes.fontFamily}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontFamily: (fontFamily: string) => ({ chain }: any) => chain().setMark('textStyle', { fontFamily }).run(),
      unsetFontFamily: () => ({ chain }: any) => chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize?.replace(/['"]/g, ''),
          renderHTML: attributes => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }: any) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() { return { types: ['paragraph', 'heading'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: element => element.style.lineHeight,
          renderHTML: attributes => {
            if (!attributes.lineHeight) return {};
            return { style: `line-height: ${attributes.lineHeight}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ chain }: any) => chain().updateAttributes('paragraph', { lineHeight }).updateAttributes('heading', { lineHeight }).run(),
      unsetLineHeight: () => ({ chain }: any) => chain().updateAttributes('paragraph', { lineHeight: null }).updateAttributes('heading', { lineHeight: null }).run(),
    } as any;
  },
});

const Indentation = Extension.create({
  name: 'indentation',
  addOptions() { return { types: ['paragraph', 'heading', 'bulletList', 'orderedList'], indentLevels: [0, 30, 60, 90, 120, 150, 180, 210] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        indentLevel: {
          default: 0,
          parseHTML: element => {
            const marginLeft = element.style.marginLeft;
            return marginLeft ? parseInt(marginLeft, 10) : 0;
          },
          renderHTML: attributes => {
            if (!attributes.indentLevel) return {};
            return { style: `margin-left: ${attributes.indentLevel}px` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }: any) => {
        const { selection } = state;
        const { from, to } = selection;
        const indentLevels = this.options.indentLevels;

        tr.doc.nodesBetween(from, to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const currentLevel = node.attrs.indentLevel || 0;
            const nextLevel = indentLevels.find((l: number) => l > currentLevel) || currentLevel;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indentLevel: nextLevel });
            return false;
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
      outdent: () => ({ tr, state, dispatch }: any) => {
        const { selection } = state;
        const { from, to } = selection;
        const indentLevels = this.options.indentLevels;

        tr.doc.nodesBetween(from, to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const currentLevel = node.attrs.indentLevel || 0;
            const prevLevel = [...indentLevels].reverse().find((l: number) => l < currentLevel) || 0;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indentLevel: prevLevel });
            return false;
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
    } as any;
  },
  addKeyboardShortcuts() {
    return {
      'Tab': () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});

const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',
  addOptions() { return { types: ['paragraph', 'heading'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        marginTop: {
          default: null,
          parseHTML: element => element.style.marginTop,
          renderHTML: attributes => {
            if (!attributes.marginTop) return {};
            return { style: `margin-top: ${attributes.marginTop}` };
          },
        },
        marginBottom: {
          default: null,
          parseHTML: element => element.style.marginBottom,
          renderHTML: attributes => {
            if (!attributes.marginBottom) return {};
            return { style: `margin-bottom: ${attributes.marginBottom}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      addSpaceBefore: () => ({ commands }: any) => commands.updateAttributes('paragraph', { marginTop: '1em' }),
      removeSpaceBefore: () => ({ commands }: any) => commands.updateAttributes('paragraph', { marginTop: '0' }),
      addSpaceAfter: () => ({ commands }: any) => commands.updateAttributes('paragraph', { marginBottom: '1em' }),
      removeSpaceAfter: () => ({ commands }: any) => commands.updateAttributes('paragraph', { marginBottom: '0' }),
    } as any;
  },
});

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width') || element.style.width?.replace('px', ''),
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { width: attributes.width, style: `width: ${attributes.width}px` };
        },
      },
      align: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align') || 'center',
        renderHTML: attributes => {
          const alignStyles: Record<string, string> = {
            left: 'margin-right: auto; display: block;',
            center: 'margin-left: auto; margin-right: auto; display: block;',
            right: 'margin-left: auto; display: block;',
          };
          return {
            'data-align': attributes.align,
            style: `${alignStyles[attributes.align] || alignStyles.center} ${attributes.width ? `width: ${attributes.width}px;` : ''}`,
          };
        },
      },
    };
  },
});

// --- Sub-Component: Single Page Editor ---

interface SinglePageEditorProps {
  initialContent: string;
  isActive: boolean;
  pageIndex: number;
  onUpdate: (html: string) => void;
  onFocus: () => void;
  onEditorReady: (editor: Editor) => void;
  imageUploadHandler: (file: File) => Promise<string>;
}

const SinglePageEditor = ({
  initialContent,
  isActive,
  pageIndex,
  onUpdate,
  onFocus,
  onEditorReady,
  imageUploadHandler
}: SinglePageEditorProps) => {
  const [selectedImage, setSelectedImage] = useState<{ node: any; pos: number } | null>(null);
  const [imageWidth, setImageWidth] = useState<string>('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize.configure({ types: ['textStyle'] }),
      LineHeight.configure({ types: ['paragraph', 'heading'] }),
      Indentation.configure({ types: ['paragraph', 'heading', 'bulletList', 'orderedList'] }),
      ParagraphSpacing.configure({ types: ['paragraph', 'heading'] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      CustomImage.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: `Page ${pageIndex + 1} content...` }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    onFocus: () => {
      onFocus();
    },
    onCreate: ({ editor }) => {
      if (isActive) onEditorReady(editor);
    },
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none',
        style: 'min-height: 257mm; padding: 20mm; width: 210mm; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin: 0 auto;',
      },
      handleClick: (view: any, pos: number, event: MouseEvent) => {
        const node = view.state.doc.nodeAt(pos);
        if (node?.type.name === 'image') {
          setSelectedImage({ node, pos });
          setImageWidth(node.attrs.width?.toString() || '');
          return true;
        }
        setSelectedImage(null);
        return false;
      },
    },
  });

  // Notify parent of editor instance if active
  useEffect(() => {
    if (editor && isActive) {
      onEditorReady(editor);
    }
  }, [isActive, editor, onEditorReady]);

  // Image control functions (Duplicates logic but scoped to this editor)
  const updateImageAttribute = useCallback((attr: string, value: any) => {
    if (!editor || !selectedImage) return;
    const { pos } = selectedImage;
    editor.chain().focus().setNodeSelection(pos).updateAttributes('image', { [attr]: value }).run();
    const updatedNode = editor.state.doc.nodeAt(pos);
    if (updatedNode) setSelectedImage({ node: updatedNode, pos });
  }, [editor, selectedImage]);

  return (
    <div className="relative group mb-8">
      {/* Page Number Indicator */}
      <div className="absolute top-0 right-[-40px] text-gray-400 text-xs font-medium">
        P{pageIndex + 1}
      </div>

      {/* Editor Content */}
      <div
        className={`relative transition-all duration-200 ${isActive ? 'ring-2 ring-blue-400 ring-offset-4' : 'hover:ring-2 hover:ring-gray-200 hover:ring-offset-2'}`}
        onClick={onFocus}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Image Controls Popup (Per Editor) */}
      {selectedImage && isActive && (
        <div className="absolute top-4 right-4 z-50 bg-white rounded-lg shadow-xl border p-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => updateImageAttribute('align', 'left')} className="p-1 hover:bg-gray-100 rounded"><AlignLeft className="w-4 h-4" /></button>
          <button onClick={() => updateImageAttribute('align', 'center')} className="p-1 hover:bg-gray-100 rounded"><AlignCenter className="w-4 h-4" /></button>
          <button onClick={() => updateImageAttribute('align', 'right')} className="p-1 hover:bg-gray-100 rounded"><AlignRight className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button onClick={() => updateImageAttribute('width', 200)} className="text-xs hover:bg-gray-100 p-1 rounded">S</button>
          <button onClick={() => updateImageAttribute('width', 400)} className="text-xs hover:bg-gray-100 p-1 rounded">M</button>
          <button onClick={() => updateImageAttribute('width', 600)} className="text-xs hover:bg-gray-100 p-1 rounded">L</button>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export default function RichTextEditor({
  content,
  onContentChange,
  variables,
  onInsertVariable
}: RichTextEditorProps) {
  // State
  const [pages, setPages] = useState<string[]>(['']);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [version, setVersion] = useState(0); // Add version to force editor re-mount on load
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Initial Content
  useEffect(() => {
    // Only update if prop content is different from current state
    // This allows loading data from DB while avoiding circular updates during typing
    const currentContent = pages.join(PAGE_DELIMITER);
    if (content && content !== currentContent) {
      if (content.includes('page-break-delimiter')) {
        setPages(content.split(PAGE_DELIMITER));
      } else {
        setPages([content]);
      }
      setVersion(v => v + 1); // Increment version to force re-render of editors
    } else if (!content && pages.length === 1 && pages[0] === '') {
      // Keep blank if both are blank
    }
  }, [content]);

  // Sync back to parent (Join pages)
  const syncContent = (newPages: string[]) => {
    setPages(newPages);
    onContentChange(newPages.join(PAGE_DELIMITER));
  };

  const handlePageUpdate = (index: number, html: string) => {
    const newPages = [...pages];
    newPages[index] = html;
    // Debounce or direct update? Direct for now.
    syncContent(newPages);
  };

  const addPage = () => {
    const newPages = [...pages, ''];
    syncContent(newPages);
    setActivePageIndex(newPages.length - 1);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) return; // Prevent deleting last page
    const confirmDelete = window.confirm('Are you sure you want to delete this page?');
    if (!confirmDelete) return;

    const newPages = pages.filter((_, i) => i !== index);
    syncContent(newPages);
    setActivePageIndex(Math.min(index, newPages.length - 1));
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pages.length - 1) return;

    const newPages = [...pages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newPages[index], newPages[targetIndex]] = [newPages[targetIndex], newPages[index]];

    syncContent(newPages);
    setActivePageIndex(targetIndex);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEditor) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const resizedBase64 = await resizeImage(file);
      activeEditor.chain().focus().setImage({ src: resizedBase64 }).run();
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerImageUpload = () => fileInputRef.current?.click();

  // Toolbar Component
  const ToolbarButton = ({ onClick, isActive = false, title, children, disabled = false }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded text-gray-700 transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={title}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm p-2 flex items-center gap-1 flex-wrap">
        {/* Font Family */}
        <select
          onChange={(e) => (activeEditor?.chain().focus() as any)?.setFontFamily(e.target.value).run()}
          value={activeEditor?.getAttributes('textStyle').fontFamily || ''}
          className="h-8 px-2 text-sm border border-gray-300 rounded bg-white"
        >
          <option value="">Font</option>
          <option value="Times New Roman, serif">Times New Roman</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Arial Black, sans-serif">Arial Black</option>
          <option value="Poppins, sans-serif">Poppins</option>
        </select>

        {/* Font Size */}
        <select
          onChange={(e) => (activeEditor?.chain().focus() as any)?.setFontSize(e.target.value).run()}
          value={activeEditor?.getAttributes('textStyle').fontSize || ''}
          className="h-8 px-2 text-sm border border-gray-300 rounded bg-white w-20"
        >
          <option value="">Size</option>
          <option value="8pt">8</option>
          <option value="10pt">10</option>
          <option value="11pt">11</option>
          <option value="12pt">12</option>
          <option value="14pt">14</option>
          <option value="18pt">18</option>
          <option value="24pt">24</option>
          <option value="36pt">36</option>
        </select>

        {/* Line Height & Spacing */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'addSpaceBefore') (activeEditor?.chain().focus() as any)?.addSpaceBefore().run();
            else if (val === 'removeSpaceBefore') (activeEditor?.chain().focus() as any)?.removeSpaceBefore().run();
            else if (val === 'addSpaceAfter') (activeEditor?.chain().focus() as any)?.addSpaceAfter().run();
            else if (val === 'removeSpaceAfter') (activeEditor?.chain().focus() as any)?.removeSpaceAfter().run();
            else (activeEditor?.chain().focus() as any)?.setLineHeight(val).run();
          }}
          value={(activeEditor?.getAttributes('paragraph') || {}).lineHeight || (activeEditor?.getAttributes('heading') || {}).lineHeight || ''}
          className="h-8 px-2 text-sm border border-gray-300 rounded bg-white w-28"
        >
          <option value="">Spacing</option>
          <optgroup label="Line Spacing">
            <option value="1.0">1.0</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5</option>
            <option value="2.0">2.0</option>
            <option value="2.5">2.5</option>
            <option value="3.0">3.0</option>
          </optgroup>
          <optgroup label="Paragraph Spacing">
            <option value="addSpaceBefore">Add Space Before Paragraph</option>
            <option value="removeSpaceBefore">Remove Space Before Paragraph</option>
            <option value="addSpaceAfter">Add Space After Paragraph</option>
            <option value="removeSpaceAfter">Remove Space After Paragraph</option>
          </optgroup>
        </select>

        <Divider />

        <ToolbarButton onClick={() => activeEditor?.chain().focus().toggleBold().run()} isActive={activeEditor?.isActive('bold')} title="Bold"><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => activeEditor?.chain().focus().toggleItalic().run()} isActive={activeEditor?.isActive('italic')} title="Italic"><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => activeEditor?.chain().focus().toggleUnderline().run()} isActive={activeEditor?.isActive('underline')} title="Underline"><UnderlineIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()} isActive={activeEditor?.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()} isActive={activeEditor?.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()} isActive={activeEditor?.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => activeEditor?.chain().focus().setTextAlign('justify').run()} isActive={activeEditor?.isActive({ textAlign: 'justify' })} title="Align Justify"><AlignJustify className="w-4 h-4" /></ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => (activeEditor?.chain().focus() as any)?.outdent().run()} title="Outdent"><Outdent className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => (activeEditor?.chain().focus() as any)?.indent().run()} title="Indent"><Indent className="w-4 h-4" /></ToolbarButton>

        <ToolbarButton onClick={() => activeEditor?.chain().focus().toggleBulletList().run()} isActive={activeEditor?.isActive('bulletList')} title="Bullet List"><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()} isActive={activeEditor?.isActive('orderedList')} title="Ordered List"><ListOrdered className="w-4 h-4" /></ToolbarButton>

        <Divider />

        <ToolbarButton onClick={triggerImageUpload} title="Insert Image"><ImageIcon className="w-4 h-4" /></ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        <div className="flex-1" />

        {/* Page Controls */}
        <div className="flex items-center gap-2 border-l pl-2 bg-gray-50 rounded px-2">
          <span className="text-xs text-gray-500 font-medium">Page {activePageIndex + 1} of {pages.length}</span>
          <ToolbarButton onClick={() => deletePage(activePageIndex)} title="Delete Page" disabled={pages.length <= 1}><Trash2 className="w-4 h-4 text-red-500" /></ToolbarButton>
          <ToolbarButton onClick={addPage} title="Add Page"><Plus className="w-4 h-4 text-green-600" /></ToolbarButton>
        </div>
      </div>

      {/* Variables Sidebar */}
      <div className="border-b p-2 bg-blue-50 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        <span className="text-xs font-bold text-blue-800">Variables:</span>
        {variables.map(v => (
          <button
            key={v}
            onClick={() => {
              activeEditor?.chain().focus().insertContent(`{${v}}`).run();
              onInsertVariable(v);
            }}
            className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700 hover:bg-blue-100"
          >
            {v}
          </button>
        ))}
      </div>

      {/* Pages Container */}
      <div className="flex-1 overflow-auto p-8 flex flex-col items-center gap-8">
        {pages.map((pageContent, index) => (
          <SinglePageEditor
            key={`${index}-${version}`} // Force remount if version changes (e.g. data loaded)
            pageIndex={index}
            initialContent={pageContent}
            isActive={activePageIndex === index}
            onUpdate={(html) => handlePageUpdate(index, html)}
            onFocus={() => setActivePageIndex(index)}
            onEditorReady={(editor) => setActiveEditor(editor)}
            imageUploadHandler={resizeImage}
          />
        ))}

        {/* Add Page Button at Bottom */}
        <button
          onClick={addPage}
          className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors w-[210mm] justify-center border-dashed border-2 border-gray-300"
        >
          <Plus className="w-5 h-5" />
          Add New Page
        </button>
        <div className="h-20" /> {/* Bottom spacer */}
      </div>
    </div>
  );
}
