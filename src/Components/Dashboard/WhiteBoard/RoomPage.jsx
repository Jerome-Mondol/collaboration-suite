import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

let socket = null;

export default function RoomPage() {
  const { id: roomId } = useParams();
  const localVideoRef = useRef(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  useEffect(() => {
    if (!roomId) return;
    let isMounted = true;

    async function getLocalStream() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(d => d.kind === 'videoinput');
        const hasAudio = devices.some(d => d.kind === 'audioinput');
        if (!hasVideo && !hasAudio) {
          alert('No camera or microphone found');
          return null;
        }
        return await navigator.mediaDevices.getUserMedia({
          video: hasVideo,
          audio: hasAudio,
        });
      } catch (err) {
        console.error('Error accessing media devices', err);
        alert('Could not access camera/microphone — check permissions');
        return null;
      }
    }

    (async () => {
      socket = io('http://localhost:3000'); // Change to your server address
      const stream = await getLocalStream();
      if (!stream) return;
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        await localVideoRef.current.play().catch(() => {});
      }
      socket.emit('join-room', roomId);
      socket.on('all-users', users => {
        if (!isMounted) return;
        users.forEach(createOffer);
      });
      socket.on('user-joined', createOffer);
      socket.on('offer', async ({ sdp, caller }) => {
        if (!isMounted) return;
        const pc = createPeerConnection(caller);
        await pc.setRemoteDescription(new window.RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { target: caller, sdp: pc.localDescription });
      });
      socket.on('answer', async ({ sdp, caller }) => {
        if (!isMounted) return;
        const pc = peersRef.current[caller];
        if (!pc) return;
        await pc.setRemoteDescription(new window.RTCSessionDescription(sdp));
      });
      socket.on('ice-candidate', async ({ candidate, from }) => {
        if (!isMounted) return;
        const pc = peersRef.current[from];
        if (!pc) return;
        try {
          await pc.addIceCandidate(new window.RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate', err);
        }
      });
      socket.on('user-left', cleanupPeer);
    })();

    return () => {
      isMounted = false;
      cleanupAll();
    };
    // eslint-disable-next-line
  }, [roomId]);

  function createPeerConnection(peerId) {
    if (peersRef.current[peerId]) return peersRef.current[peerId];
    const pc = new window.RTCPeerConnection(ICE_SERVERS);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }
    pc.ontrack = event => {
      const [stream] = event.streams;
      setRemoteStreams(prev => {
        if (prev.find(s => s.id === peerId)) return prev;
        return [...prev, { id: peerId, stream }];
      });
    };
    pc.onicecandidate = event => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { target: peerId, candidate: event.candidate });
      }
    };
    peersRef.current[peerId] = pc;
    return pc;
  }

  async function createOffer(peerId) {
    const pc = createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { target: peerId, sdp: pc.localDescription });
  }

  function cleanupPeer(peerId) {
    const pc = peersRef.current[peerId];
    if (pc) {
      try { pc.close(); } catch (e) {}
      delete peersRef.current[peerId];
    }
    setRemoteStreams(prev => prev.filter(s => s.id !== peerId));
  }

  function cleanupAll() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    Object.keys(peersRef.current).forEach(cleanupPeer);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
  }

  function toggleMic() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !micEnabled);
    setMicEnabled(prev => !prev);
  }

  function toggleCam() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !camEnabled);
    setCamEnabled(prev => !prev);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Room: {roomId}</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={toggleMic}>{micEnabled ? 'Mute Mic' : 'Unmute Mic'}</button>
        <button onClick={toggleCam} style={{ marginLeft: 8 }}>
          {camEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
        }}
      >
        <div style={{ border: '1px solid #ccc', padding: 8 }}>
          <h4>You (local)</h4>
          <video ref={localVideoRef} autoPlay playsInline style={{ width: '100%' }} />
        </div>
        {remoteStreams.map(r => (
          <div key={r.id} style={{ border: '1px solid #ccc', padding: 8 }}>
            <h4>Peer: {r.id}</h4>
            <video
              autoPlay
              playsInline
              ref={el => { if (el && r.stream) el.srcObject = r.stream; }}
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
