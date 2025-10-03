import { Tldraw, useEditor } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../Utils/supabaseClient";
import { useAuth } from "../../../Context/Auth/AuthContext";

export default function Whiteboard({ boardId }) {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            zIndex: 1000,
            fontSize: "18px",
            color: "#333",
          }}
        >
          Loading whiteboard...
        </div>
      )}
      
      <Tldraw
        onMount={(editor) => {
          editorRef.current = editor;
          setIsLoading(false);
        }}
        autoFocus
        inferDarkMode
      />
      
      {editorRef.current && (
        <CollaborativeSync 
          editor={editorRef.current} 
          boardId={boardId} 
          onLoadingStateChange={setIsLoading}
        />
      )}
    </div>
  );
}

function CollaborativeSync({ editor, boardId, onLoadingStateChange }) {
  const { user } = useAuth();
  const clientId = useRef(Math.random().toString(36).slice(2));
  const isProcessing = useRef(false);
  const lastSnapshotTime = useRef(0);
  const pendingChanges = useRef(new Set());

  // Load initial snapshot
  useEffect(() => {
    if (!editor || !boardId) return;

    const loadSnapshot = async () => {
      onLoadingStateChange?.(true);
      try {
        const { data, error } = await supabase
          .from("whiteboard_snapshots")
          .select("snapshot_data")
          .eq("board_id", boardId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
          console.error("Error loading snapshot:", error);
        }

        if (data?.snapshot_data) {
          // Load the entire snapshot
          editor.store.loadSnapshot(data.snapshot_data);
        }
      } catch (error) {
        console.error("Error loading snapshot:", error);
      } finally {
        onLoadingStateChange?.(false);
      }
    };

    loadSnapshot();
  }, [editor, boardId, onLoadingStateChange]);

  // Real-time collaboration using store changes
  useEffect(() => {
    if (!editor || !boardId) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`whiteboard-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whiteboard_operations",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const operation = payload.new;
          if (!operation) return;

          // Ignore our own operations
          if (operation.client_id === clientId.current) return;
          if (pendingChanges.current.has(operation.operation_id)) return;

          try {
            isProcessing.current = true;
            
            // Apply the remote operation
            if (operation.operation_type === 'store_put') {
              editor.store.put(operation.data);
            } else if (operation.operation_type === 'store_remove') {
              editor.store.remove(operation.data);
            } else if (operation.operation_type === 'store_merge') {
              // Handle merge operations if needed
            }
          } catch (error) {
            console.error("Error applying remote operation:", error);
          } finally {
            isProcessing.current = false;
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [editor, boardId]);

  // Send local changes to Supabase
  useEffect(() => {
    if (!editor || !boardId) return;

    const handleStoreChange = (changes) => {
      // Don't process changes if we're applying remote operations
      if (isProcessing.current) return;

      // Generate unique ID for this batch of changes
      const operationId = Math.random().toString(36).slice(2);

      // Handle added shapes
      if (changes.added && Object.keys(changes.added).length > 0) {
        const addedShapes = Object.values(changes.added).filter(
          (record) => record.typeName === 'shape'
        );
        
        if (addedShapes.length > 0) {
          pendingChanges.current.add(operationId);
          
          const payload = {
            operation_id: operationId,
            client_id: clientId.current,
            operation_type: 'store_put',
            data: addedShapes,
            board_id: boardId,
            user_id: user?.id || null,
          };

          supabase
            .from("whiteboard_operations")
            .insert([payload])
            .then(({ error }) => {
              pendingChanges.current.delete(operationId);
              if (error) console.error("Error sending add operation:", error);
            });
        }
      }

      // Handle updated shapes
      if (changes.updated && Object.keys(changes.updated).length > 0) {
        const updatedShapes = Object.values(changes.updated)
          .map(([_, newRecord]) => newRecord)
          .filter(record => record.typeName === 'shape');
        
        if (updatedShapes.length > 0) {
          pendingChanges.current.add(operationId);
          
          const payload = {
            operation_id: operationId,
            client_id: clientId.current,
            operation_type: 'store_put',
            data: updatedShapes,
            board_id: boardId,
            user_id: user?.id || null,
          };

          supabase
            .from("whiteboard_operations")
            .insert([payload])
            .then(({ error }) => {
              pendingChanges.current.delete(operationId);
              if (error) console.error("Error sending update operation:", error);
            });
        }
      }

      // Handle removed shapes
      if (changes.removed && Object.keys(changes.removed).length > 0) {
        const removedShapes = Object.values(changes.removed).filter(
          (record) => record.typeName === 'shape'
        );
        
        if (removedShapes.length > 0) {
          pendingChanges.current.add(operationId);
          
          const payload = {
            operation_id: operationId,
            client_id: clientId.current,
            operation_type: 'store_remove',
            data: removedShapes.map(shape => shape.id),
            board_id: boardId,
            user_id: user?.id || null,
          };

          supabase
            .from("whiteboard_operations")
            .insert([payload])
            .then(({ error }) => {
              pendingChanges.current.delete(operationId);
              if (error) console.error("Error sending remove operation:", error);
            });
        }
      }

      // Save snapshot periodically (every 10 seconds)
      const now = Date.now();
      if (now - lastSnapshotTime.current > 10000) {
        lastSnapshotTime.current = now;
        saveSnapshot();
      }
    };

    const unsubscribe = editor.store.listen(handleStoreChange);

    // Save initial snapshot
    const saveSnapshot = async () => {
      try {
        const snapshot = editor.store.getSnapshot();
        await supabase
          .from("whiteboard_snapshots")
          .upsert({
            board_id: boardId,
            snapshot_data: snapshot,
            user_id: user?.id || null,
          });
      } catch (error) {
        console.error("Error saving snapshot:", error);
      }
    };

    // Cleanup
    return () => {
      unsubscribe();
      saveSnapshot(); // Save on unmount
    };
  }, [editor, boardId, user]);

  return null;
}