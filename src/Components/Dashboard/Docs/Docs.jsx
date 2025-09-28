import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../Utils/supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function Document({ docId }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastContentRef = useRef('');
  const updateTimeoutRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      setContent(html);
      
      // Debounce the save to prevent glitching
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(async () => {
        if (html !== lastContentRef.current) {
          setIsSaving(true);
          try {
            await supabase
              .from('documents')
              .update({ content: html, updated_at: new Date() })
              .eq('id', docId);
            setLastSaved(new Date().toLocaleTimeString());
            lastContentRef.current = html;
          } catch (error) {
            console.error('Save error:', error);
          } finally {
            setIsSaving(false);
          }
        }
      }, 1000); // Save after 1 second of inactivity
    },
  });

  useEffect(() => {
    if (!docId || !editor) return;

    let subscription;
    let ignoreUpdate = false;

    const fetchOrCreate = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', docId)
          .maybeSingle();

        if (error) {
          console.error(error.message);
          return;
        }

        if (!data) {
          const { data: newDoc, error: insertError } = await supabase
            .from('documents')
            .insert([{ id: docId, content: '' }])
            .select()
            .maybeSingle();
          
          if (!insertError && newDoc) {
            editor.commands.setContent(newDoc.content || '');
            lastContentRef.current = newDoc.content || '';
          }
        } else {
          editor.commands.setContent(data.content || '');
          lastContentRef.current = data.content || '';
          if (data.updated_at) {
            setLastSaved(new Date(data.updated_at).toLocaleTimeString());
          }
        }

        // Set up real-time subscription with proper update handling
        subscription = supabase
          .channel('public:documents')
          .on(
            'postgres_changes',
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'documents', 
              filter: `id=eq.${docId}` 
            },
            (payload) => {
              // Only update if the content is different and not from current user
              if (payload.new.content !== lastContentRef.current) {
                ignoreUpdate = true;
                editor.commands.setContent(payload.new.content);
                lastContentRef.current = payload.new.content;
                setTimeout(() => {
                  ignoreUpdate = false;
                }, 100);
              }
            }
          )
          .subscribe();

      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreate();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [docId, editor]);

  if (!editor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Document Editor</h1>
            <div className="flex items-center space-x-4 mt-2">
              {lastSaved && (
                <span className="text-sm text-slate-500 flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${isSaving ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                  {isSaving ? 'Saving...' : `Last saved: ${lastSaved}`}
                </span>
              )}
              {isLoading && (
                <span className="text-sm text-blue-500 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
                  Loading...
                </span>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 font-medium">
              Export
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium">
              Share
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-2">
            <div className="flex space-x-1 border-r border-slate-200 pr-3 mr-3">
              <button 
                onClick={() => editor.chain().focus().toggleBold().run()} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editor.isActive('bold') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Bold"
              >
                <span className="font-bold text-base">B</span>
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleItalic().run()} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editor.isActive('italic') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Italic"
              >
                <span className="italic text-base">I</span>
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleStrike().run()} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editor.isActive('strike') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Strikethrough"
              >
                <span className="line-through text-base">S</span>
              </button>
            </div>

            <div className="flex space-x-1 border-r border-slate-200 pr-3 mr-3">
              <button 
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Heading 1"
              >
                <span className="font-bold text-base">H1</span>
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Heading 2"
              >
                <span className="font-bold text-base">H2</span>
              </button>
              <button 
                onClick={() => editor.chain().focus().setParagraph().run()} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editor.isActive('paragraph') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Paragraph"
              >
                <span className="font-normal text-base">P</span>
              </button>
            </div>

            <div className="flex space-x-1">
              <button 
                onClick={() => editor.chain().focus().toggleBulletList().run()} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Bullet List"
              >
                <span className="font-normal text-base">• List</span>
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Numbered List"
              >
                <span className="font-normal text-base">1. List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Editor - Fixed container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex-1 p-8 min-h-[70vh]">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="h-full">
                <EditorContent 
                  editor={editor} 
                  className="h-full focus:outline-none prose prose-lg max-w-none
                    [&_.tiptap]:h-full
                    [&_.tiptap]:outline-none
                    [&_.tiptap]:min-h-full
                    [&_.tiptap]:leading-relaxed
                    [&_.tiptap]:text-slate-800
                    [&_.tiptap.ProseMirror]:min-h-[60vh]
                    [&_.tiptap.ProseMirror]:p-0
                    [&_.tiptap.ProseMirror]:text-base
                    [&_.tiptap.ProseMirror]:leading-7
                    [&_h1]:text-3xl
                    [&_h1]:font-bold
                    [&_h1]:mt-6
                    [&_h1]:mb-4
                    [&_h2]:text-2xl
                    [&_h2]:font-bold
                    [&_h2]:mt-5
                    [&_h2]:mb-3
                    [&_p]:my-3
                    [&_ul]:my-3
                    [&_ol]:my-3
                    [&_li]:my-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500">
            Start typing to begin editing. Changes are saved automatically.
          </p>
        </div>
      </div>
    </div>
  );
}