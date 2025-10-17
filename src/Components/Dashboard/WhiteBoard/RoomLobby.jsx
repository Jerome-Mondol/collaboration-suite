import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function RoomLobby() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');

  const createRoom = () => {
    const id = uuidv4();
    navigate(`/room/${id}`);
  };

  const joinRoom = () => {
    if (!roomId) return alert('Enter room id');
    navigate(`/room/${roomId}`);
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40 }}>
      <h1>React Video Conferencing (Demo)</h1>
      <div>
        <button onClick={createRoom}>Create New Room</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <input placeholder="paste room id" value={roomId} onChange={e => setRoomId(e.target.value)} />
        <button onClick={joinRoom} style={{ marginLeft: 8 }}>Join Room</button>
      </div>
      <p style={{ maxWidth: 600, textAlign: 'center' }}>Create a room and share the room ID with others to join. Local video will be muted to avoid echo.</p>
    </main>
  );
}
