'use client';

import { useEditor, EditorContent } from '@tiptap/react';
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
  Maximize2,
  Minimize2
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onContentChange: (html: string) => void;
  variables: string[];
  onInsertVariable: (variable: string) => void;
}

// Max image size in pixels (to prevent memory issues with large images)
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 600;

// Custom FontFamily extension for TipTap v2
const FontFamily = Extension.create({
  name: 'fontFamily',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: element => element.style.fontFamily?.replace(/['"]/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontFamily) {
                return {};
              }
              return {
                style: `font-family: ${attributes.fontFamily}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
          ({ chain }: any) => {
            return chain().setMark('textStyle', { fontFamily }).run();
          },
      unsetFontFamily:
        () =>
          ({ chain }: any) => {
            return chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
          },
    } as any;
  },
});

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
          ({ chain }: any) => {
            return chain().setMark('textStyle', { fontSize }).run();
          },
      unsetFontSize:
        () =>
          ({ chain }: any) => {
            return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
          },
    } as any;
  },
});

// Custom LineHeight extension
const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
          ({ chain }: any) => {
            return chain().updateAttributes('paragraph', { lineHeight }).updateAttributes('heading', { lineHeight }).run();
          },
      unsetLineHeight:
        () =>
          ({ chain }: any) => {
            return chain().updateAttributes('paragraph', { lineHeight: null }).updateAttributes('heading', { lineHeight: null }).run();
          },
    } as any;
  },
});

// Resize image to prevent memory issues during PDF generation
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Fill with white background first (prevents black borders on transparent PNGs)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw image on top
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to base64 with reasonable quality
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(resizedBase64);
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

// Custom Image extension with size and alignment support
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

export default function RichTextEditor({
  content,
  onContentChange,
  variables,
  onInsertVariable
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ node: any; pos: number } | null>(null);
  const [imageWidth, setImageWidth] = useState<string>('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      LineHeight.configure({
        types: ['paragraph', 'heading'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Start typing your template here...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none p-8',
      },
      handleClick: (view, pos, event) => {
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

  // Clear image selection when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.image-controls') && !target.closest('.ProseMirror img')) {
        setSelectedImage(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Image control functions
  const updateImageAttribute = useCallback((attr: string, value: any) => {
    if (!editor || !selectedImage) return;

    const { pos } = selectedImage;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    editor.chain().focus().setNodeSelection(pos).updateAttributes('image', { [attr]: value }).run();

    // Update selected image reference
    const updatedNode = editor.state.doc.nodeAt(pos);
    if (updatedNode) {
      setSelectedImage({ node: updatedNode, pos });
    }
  }, [editor, selectedImage]);

  const setImageAlign = (align: 'left' | 'center' | 'right') => {
    updateImageAttribute('align', align);
  };

  const setImageSize = (width: number) => {
    updateImageAttribute('width', width);
    setImageWidth(width.toString());
  };

  const insertVariable = (variable: string) => {
    if (!editor) return;
    // Simple plain text token
    editor.chain().focus().insertContent(`{${variable}}`).run();
    onInsertVariable(variable);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      // Resize image to optimize for PDF generation
      const resizedBase64 = await resizeImage(file);
      editor.chain().focus().setImage({ src: resizedBase64 }).run();
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  if (!editor) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b p-2 bg-gray-50 h-12 animate-pulse" />
        <div className="border-b p-3 bg-blue-50 h-16 animate-pulse" />
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="a4-page bg-white shadow-lg mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    title,
    children
  }: {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded text-gray-700 transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
      title={title}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-1 flex-wrap bg-gray-50">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Font Family Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              (editor.chain().focus() as any).setFontFamily(e.target.value).run();
            } else {
              (editor.chain().focus() as any).unsetFontFamily().run();
            }
          }}
          value={editor.getAttributes('textStyle').fontFamily || ''}
          className="h-8 px-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Font Family"
        >
          <option value="">Default</option>
          <option value="Times New Roman, serif" style={{ fontFamily: 'Times New Roman, serif' }}>Times New Roman</option>
          <option value="Arial, sans-serif" style={{ fontFamily: 'Arial, sans-serif' }}>Arial</option>
          <option value="Arial Black, sans-serif" style={{ fontFamily: 'Arial Black, sans-serif' }}>Arial Black</option>
          <option value="Poppins, sans-serif" style={{ fontFamily: 'Poppins, sans-serif' }}>Poppins</option>
        </select>

        {/* Font Size Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              (editor.chain().focus() as any).setFontSize(e.target.value).run();
            } else {
              (editor.chain().focus() as any).unsetFontSize().run();
            }
          }}
          value={editor.getAttributes('textStyle').fontSize || ''}
          className="h-8 px-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Font Size"
        >
          <option value="">Size</option>
          <option value="8pt">8</option>
          <option value="9pt">9</option>
          <option value="10pt">10</option>
          <option value="11pt">11</option>
          <option value="12pt">12</option>
          <option value="14pt">14</option>
          <option value="16pt">16</option>
          <option value="18pt">18</option>
          <option value="20pt">20</option>
          <option value="22pt">22</option>
          <option value="24pt">24</option>
          <option value="26pt">26</option>
          <option value="28pt">28</option>
          <option value="36pt">36</option>
          <option value="48pt">48</option>
          <option value="72pt">72</option>
        </select>

        {/* Line Height Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              (editor.chain().focus() as any).setLineHeight(e.target.value).run();
            } else {
              (editor.chain().focus() as any).unsetLineHeight().run();
            }
          }}
          value={editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight || ''}
          className="h-8 px-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Line Spacing"
        >
          <option value="">Normal</option>
          <option value="1.0">Single</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2.0">Double</option>
          <option value="2.5">2.5</option>
          <option value="3.0">3.0</option>
        </select>

        <Divider />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Block Elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Block Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Line"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={triggerImageUpload}
          title="Upload Image"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <Divider />

        {/* Clear Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Variables Sidebar */}
      <div className="border-b p-3 bg-blue-50">
        <p className="text-sm font-semibold text-gray-700 mb-2">Available Variables:</p>
        <div className="flex flex-wrap gap-2">
          {variables.length === 0 ? (
            <span className="text-sm text-gray-500">Upload data to see variables</span>
          ) : (
            variables.map((variable) => (
              <button
                key={variable}
                onClick={() => insertVariable(variable)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition"
              >
                {variable}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Image Controls Popup */}
      {selectedImage && (
        <div className="image-controls absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl border p-3 flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">Image:</span>

          {/* Alignment */}
          <div className="flex border rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setImageAlign('left')}
              className={`p-1.5 ${selectedImage.node.attrs.align === 'left' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Align left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setImageAlign('center')}
              className={`p-1.5 ${selectedImage.node.attrs.align === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Align center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setImageAlign('right')}
              className={`p-1.5 ${selectedImage.node.attrs.align === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Align right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Size presets */}
          <div className="flex items-center gap-1 border-l pl-3">
            <button
              type="button"
              onClick={() => setImageSize(100)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Small"
            >
              S
            </button>
            <button
              type="button"
              onClick={() => setImageSize(200)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Medium"
            >
              M
            </button>
            <button
              type="button"
              onClick={() => setImageSize(350)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Large"
            >
              L
            </button>
            <button
              type="button"
              onClick={() => setImageSize(500)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Extra Large"
            >
              XL
            </button>
          </div>

          {/* Custom width */}
          <div className="flex items-center gap-1 border-l pl-3">
            <input
              type="number"
              value={imageWidth}
              onChange={(e) => setImageWidth(e.target.value)}
              onBlur={() => {
                const width = parseInt(imageWidth);
                if (width > 0) setImageSize(width);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const width = parseInt(imageWidth);
                  if (width > 0) setImageSize(width);
                }
              }}
              className="w-16 px-2 py-1 text-xs border rounded"
              placeholder="Width"
            />
            <span className="text-xs text-gray-400">px</span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="p-1 hover:bg-gray-100 rounded ml-1"
            title="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8 relative">
        <div className="a4-page bg-white shadow-lg mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
