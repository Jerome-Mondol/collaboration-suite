import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../../../Utils/supabaseClient";
import { useAuth } from "../../../Context/Auth/AuthContext";
import { useParams } from "react-router-dom";

export default function Whiteboard() {
  const { id: boardId } = useParams();
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = useCallback((message) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-9), `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`]);
  }, []);

  if (!boardId) {
    return <div>No board ID provided</div>;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {isLoading && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "white", zIndex: 1000, fontSize: "18px", color: "#333",
        }}>
          Loading whiteboard {boardId}...
        </div>
      )}
      
      {/* Debug Panel */}
      <div style={{
        position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.8)", 
        color: "white", padding: 10, borderRadius: 5, maxHeight: 200, overflow: "auto",
        zIndex: 1000, fontSize: "12px", maxWidth: "400px"
      }}>
        <div><strong>Debug Log (Board: {boardId})</strong></div>
        {debugLog.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
      
      <Tldraw
        onMount={(editor) => {
          editorRef.current = editor;
          setIsLoading(false);
          addDebugLog("Tldraw mounted");
        }}
        autoFocus
        inferDarkMode
      />
      
      {editorRef.current && !isLoading && (
        <TldrawCompatibleSync 
          key={`sync-${boardId}`}
          editor={editorRef.current} 
          boardId={boardId} 
          onDebugLog={addDebugLog}
        />
      )}
      
      <ManualTest boardId={boardId} onDebugLog={addDebugLog} />
      <VideoCall boardId={boardId} onDebugLog={addDebugLog} />
    </div>
  );
}

function TldrawCompatibleSync({ editor, boardId, onDebugLog }) {
  const { user } = useAuth();
  
  const refs = useRef({
    clientId: Math.random().toString(36).slice(2),
    isProcessingRemote: false,
    changeCount: 0,
    mounted: true,
    channel: null,
    unsubscribe: null,
    lastSentShapes: new Set()
  }).current;

  // Helper function to validate and fix Tldraw shape data
  const validateTldrawShape = (shape) => {
    if (!shape) return null;
    
    // Ensure ID starts with "shape:"
    if (shape.id && !shape.id.startsWith('shape:')) {
      shape.id = `shape:${shape.id}`;
    }
    
    // Ensure typeName is 'shape'
    shape.typeName = 'shape';
    
    // Ensure proper structure for Tldraw with all required fields
    if (!shape.type) shape.type = 'draw';
    if (!shape.parentId) shape.parentId = 'page:page';
    if (!shape.index) shape.index = 'a1';
    
    // FIX: Ensure boolean fields have proper defaults
    if (shape.isLocked === undefined) shape.isLocked = false;
    if (shape.isLocked === null) shape.isLocked = false;
    
    // Ensure props exists and has required fields
    if (!shape.props) shape.props = {};
    if (shape.props.isComplete === undefined) shape.props.isComplete = true;
    if (shape.props.isPen === undefined) shape.props.isPen = false;
    
    return shape;
  };

  useEffect(() => {
    if (!editor || !boardId) return;

    refs.mounted = true;
    onDebugLog(`🚀 Starting sync (Client: ${refs.clientId})`);

    // Set up real-time channel
    const channel = supabase.channel(`whiteboard-${boardId}`);
    
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whiteboard_operations",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (!refs.mounted) return;
          
          const operation = payload.new;
          if (!operation) {
            onDebugLog("❌ No operation in payload");
            return;
          }

          // Ignore our own operations
          if (operation.client_id === refs.clientId) {
            return;
          }

          onDebugLog(`📨 Remote: ${operation.operation_type} (${operation.data?.length || 0} items)`);

          try {
            refs.isProcessingRemote = true;

            if (operation.operation_type === 'store_put' && operation.data && Array.isArray(operation.data)) {
              const validShapes = operation.data.map(validateTldrawShape).filter(shape => shape && shape.id);
              
              if (validShapes.length > 0) {
                editor.store.mergeRemoteChanges(() => {
                  validShapes.forEach(shape => {
                    if (!refs.lastSentShapes.has(shape.id)) {
                      try {
                        editor.store.put([shape]);
                        onDebugLog(`✅ Added remote shape: ${shape.type}`);
                      } catch (shapeError) {
                        onDebugLog(`❌ Shape error: ${shapeError.message}`);
                        console.error("Shape validation error:", shape, shapeError);
                      }
                    }
                  });
                });
              }
            } else if (operation.operation_type === 'store_remove' && operation.data && Array.isArray(operation.data)) {
              editor.store.mergeRemoteChanges(() => {
                editor.store.remove(operation.data);
                onDebugLog(`✅ Removed ${operation.data.length} remote shapes`);
              });
            }
          } catch (error) {
            onDebugLog(`❌ Apply error: ${error.message}`);
            console.error("Apply operation error:", error);
          } finally {
            refs.isProcessingRemote = false;
          }
        }
      )
      .subscribe((status) => {
        if (refs.mounted) {
          onDebugLog(`📡 Realtime: ${status}`);
        }
      });

    refs.channel = channel;

    // Set up store listener
    const handleStoreChange = (changes) => {
      if (!refs.mounted || refs.isProcessingRemote) return;

      // Get current page ID to set as parentId
      const currentPageId = editor.getCurrentPageId();

      // Process shapes with Tldraw compatibility
      const addedShapes = changes.added ? 
        Object.values(changes.added)
          .filter(record => 
            record.typeName === 'shape' && 
            record.type !== 'cursor'
          )
          .map(shape => ({
            ...shape,
            parentId: shape.parentId || currentPageId,
            index: shape.index || 'a1',
            // FIX: Ensure isLocked is always a boolean
            isLocked: Boolean(shape.isLocked)
          }))
        : [];

      const updatedShapes = changes.updated ? 
        Object.values(changes.updated)
          .map(([_, newRecord]) => newRecord)
          .filter(record => 
            record.typeName === 'shape' && 
            record.type !== 'cursor'
          )
          .map(shape => ({
            ...shape,
            parentId: shape.parentId || currentPageId,
            index: shape.index || 'a1',
            // FIX: Ensure isLocked is always a boolean
            isLocked: Boolean(shape.isLocked)
          }))
        : [];

      const removedIds = changes.removed ? 
        Object.values(changes.removed)
          .filter(record => record.typeName === 'shape')
          .map(shape => shape.id)
        : [];

      // Only process if we have real changes
      if (addedShapes.length > 0 || updatedShapes.length > 0 || removedIds.length > 0) {
        refs.changeCount++;
        onDebugLog(`📝 Changes: +${addedShapes.length} ↑${updatedShapes.length} -${removedIds.length}`);
      }

      // Send added shapes
      if (addedShapes.length > 0) {
        const finalShapes = addedShapes.filter(shape => 
          shape.type !== 'draw' || (shape.props?.isComplete !== false && shape.props?.isComplete !== undefined)
        );

        if (finalShapes.length > 0) {
          const operationId = `${refs.clientId}-add-${refs.changeCount}`;
          onDebugLog(`📤 Sending ${finalShapes.length} shapes to DB`);
          
          // Track shapes we're sending
          finalShapes.forEach(shape => refs.lastSentShapes.add(shape.id));
          
          supabase
            .from("whiteboard_operations")
            .insert({
              operation_id: operationId,
              client_id: refs.clientId,
              operation_type: 'store_put',
              data: finalShapes,
              board_id: boardId,
              user_id: user?.id || null,
            })
            .then(({ error }) => {
              if (refs.mounted) {
                if (error) {
                  onDebugLog(`❌ DB error: ${error.message}`);
                  finalShapes.forEach(shape => refs.lastSentShapes.delete(shape.id));
                } else {
                  onDebugLog(`✅ DB confirmed ${finalShapes.length} shapes saved`);
                }
              }
            });
        }
      }

      // Send updated shapes
      if (updatedShapes.length > 0) {
        const meaningfulUpdates = updatedShapes.filter(shape => 
          !refs.lastSentShapes.has(shape.id)
        );

        if (meaningfulUpdates.length > 0) {
          const operationId = `${refs.clientId}-update-${refs.changeCount}`;
          onDebugLog(`📤 Sending ${meaningfulUpdates.length} updates to DB`);
          
          meaningfulUpdates.forEach(shape => refs.lastSentShapes.add(shape.id));
          
          supabase
            .from("whiteboard_operations")
            .insert({
              operation_id: operationId,
              client_id: refs.clientId,
              operation_type: 'store_put',
              data: meaningfulUpdates,
              board_id: boardId,
              user_id: user?.id || null,
            })
            .then(({ error }) => {
              if (refs.mounted) {
                if (error) {
                  onDebugLog(`❌ Update error: ${error.message}`);
                  meaningfulUpdates.forEach(shape => refs.lastSentShapes.delete(shape.id));
                } else {
                  onDebugLog(`✅ DB confirmed ${meaningfulUpdates.length} updates saved`);
                }
              }
            });
        }
      }

      // Send removed shapes
      if (removedIds.length > 0) {
        const operationId = `${refs.clientId}-remove-${refs.changeCount}`;
        onDebugLog(`📤 Sending ${removedIds.length} removed shapes to DB`);
        
        supabase
          .from("whiteboard_operations")
          .insert({
            operation_id: operationId,
            client_id: refs.clientId,
            operation_type: 'store_remove',
            data: removedIds,
            board_id: boardId,
            user_id: user?.id || null,
          })
          .then(({ error }) => {
            if (refs.mounted) {
              if (error) {
                onDebugLog(`❌ Remove error: ${error.message}`);
              } else {
                onDebugLog(`✅ DB confirmed ${removedIds.length} removes saved`);
                removedIds.forEach(id => refs.lastSentShapes.delete(id));
              }
            }
          });
      }
    };

    refs.unsubscribe = editor.store.listen(handleStoreChange);
    onDebugLog("👂 Store listener active");

    // Cleanup function
    return () => {
      onDebugLog("🧹 Cleaning up sync");
      refs.mounted = false;
      
      if (refs.unsubscribe) {
        refs.unsubscribe();
      }
      
      if (refs.channel) {
        supabase.removeChannel(refs.channel);
      }
    };
  }, [editor, boardId, user?.id]);

  return null;
}

function ManualTest({ boardId, onDebugLog }) {
  const testRealtime = async () => {
    // Create a properly formatted Tldraw shape with all required fields
    const testData = [{
      id: `shape:test-${Date.now()}`,
      typeName: 'shape',
      type: 'draw',
      x: Math.random() * 500,
      y: Math.random() * 500,
      rotation: 0,
      parentId: 'page:page',
      index: 'a1',
      // FIX: Add the required isLocked field
      isLocked: false,
      props: {
        segments: [{ 
          type: 'free', 
          points: [{ x: 0, y: 0 }, { x: 50, y: 50 }] 
        }],
        color: 'black',
        size: 'm',
        isComplete: true,
        isPen: false,
        scale: 1
      }
    }];

    onDebugLog("🎯 Sending manual test shape...");
    
    const result = await supabase
      .from('whiteboard_operations')
      .insert({
        operation_id: `manual-test-${Date.now()}`,
        client_id: 'manual-test-client',
        operation_type: 'store_put',
        data: testData,
        board_id: boardId,
      });

    if (result.error) {
      onDebugLog(`❌ Manual test failed: ${result.error.message}`);
      console.error("Manual test error details:", result.error);
    } else {
      onDebugLog(`✅ Manual test sent successfully`);
    }
  };

  return (
    <button 
      onClick={testRealtime}
      style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        zIndex: 1000,
        padding: '10px',
        background: 'green',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      Test Real-time
    </button>
  );
}

// Add VideoCall UI + WebRTC signaling via Supabase
function VideoCall({ boardId, onDebugLog }) {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const channelRef = useRef(null)
  const localStreamRef = useRef(null)
  const clientId = useRef(Math.random().toString(36).slice(2))
  const [inCall, setInCall] = useState(false)

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopCall()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startCall = async () => {
    if (!boardId) {
      onDebugLog?.("❌ Video: no boardId for call");
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      })
      pcRef.current = pc

      // Add local tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // Remote track handling
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
      }

      // ICE candidates -> signaling
      pc.onicecandidate = async (evt) => {
        if (!evt.candidate) return
        const payload = {
          board_id: boardId,
          client_id: clientId.current,
          type: 'candidate',
          candidate: evt.candidate.toJSON(),
        }
        // best-effort insert
        try {
          await supabase.from('webrtc_signaling').insert([payload], { returning: 'minimal' })
        } catch (err) {
          console.warn('Video signaling insert failed (candidate):', err)
        }
      }

      // Subscribe to signaling channel for this board
      const room = supabase.channel(`webrtc-${boardId}`)
      room.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'webrtc_signaling', filter: `board_id=eq.${boardId}` }, async (payload) => {
        const row = payload.new
        if (!row) return
        if (row.client_id === clientId.current) return // ignore own messages

        try {
          if (row.type === 'offer' && row.sdp) {
            // remote offered -> set remote and answer
            await pc.setRemoteDescription(new RTCSessionDescription(row.sdp))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            await supabase.from('webrtc_signaling').insert([{ board_id: boardId, client_id: clientId.current, type: 'answer', sdp: pc.localDescription }], { returning: 'minimal' })
            onDebugLog?.('✅ Video: sent answer')
          } else if (row.type === 'answer' && row.sdp) {
            // remote answered our offer
            await pc.setRemoteDescription(new RTCSessionDescription(row.sdp))
            onDebugLog?.('✅ Video: applied answer')
          } else if (row.type === 'candidate' && row.candidate) {
            try {
              await pc.addIceCandidate(row.candidate)
            } catch (e) {
              console.warn('Video: addIceCandidate failed', e)
            }
          }
        } catch (e) {
          console.error('Video signaling handler error', e)
        }
      }).subscribe()

      channelRef.current = room

      // Create offer and send
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      try {
        await supabase.from('webrtc_signaling').insert([{ board_id: boardId, client_id: clientId.current, type: 'offer', sdp: pc.localDescription }], { returning: 'minimal' })
        onDebugLog?.('📤 Video: offer sent')
      } catch (err) {
        console.warn('Video signaling insert failed (offer):', err)
      }

      setInCall(true)
    } catch (err) {
      console.error('Failed to start call', err)
      onDebugLog?.(`❌ Video start error: ${err.message || err}`)
    }
  }

  const stopCall = async () => {
    try {
      if (pcRef.current) {
        try { pcRef.current.close() } catch(_) {}
        pcRef.current = null
      }
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current) } catch(_) {}
        channelRef.current = null
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
        localStreamRef.current = null
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
      setInCall(false)
      onDebugLog?.('🛑 Video call stopped')
    } catch (err) {
      console.error('Error stopping call', err)
    }
  }

  return (
    <div style={{ position: 'absolute', bottom: 80, left: 20, zIndex: 1001, display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 160, height: 120, background: '#000', borderRadius: 6 }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 320, height: 240, background: '#000', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!inCall ? (
          <button onClick={startCall} style={{ padding: '8px 12px', background: 'green', color: 'white', border: 'none', borderRadius: 6 }}>Start Call</button>
        ) : (
          <button onClick={stopCall} style={{ padding: '8px 12px', background: 'red', color: 'white', border: 'none', borderRadius: 6 }}>End Call</button>
        )}
        <div style={{ color: 'white', fontSize: 12 }}>{inCall ? 'In call' : 'Idle'}</div>
      </div>
    </div>
  )
}