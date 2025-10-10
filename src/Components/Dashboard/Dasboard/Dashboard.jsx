// Components/Dashboard/Dasboard/Dashboard.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Chat from '../Chat/Chat';
import Document from '../Docs/Docs';
import Whiteboard from '../WhiteBoard/WhiteBoard';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [navState, setNavState] = useState('default');
  const navigate = useNavigate();

  const handleViewChange = (viewName) => {
    setNavState(viewName);
    
    // Navigate to specific whiteboard when selected
    if (viewName.startsWith('whiteboard-')) {
      const boardId = viewName.replace('whiteboard-', '');
      navigate(`/whiteboard/${boardId}`);
    }
  };

  const renderCenterContent = () => {
    switch(navState) {
      case 'default':
      case 'chat':
        return <Chat />;
      case 'video':
        return <div>Video Placeholder</div>;
      case 'docs':
        return <Document docId="default-doc-id" />;
      default:
        if (navState.startsWith('whiteboard-')) {
          const boardId = navState.replace('whiteboard-', '');
          return <Whiteboard boardId={boardId} />;
        }
        return <Chat />;
    }
  };

  return (
    <div className="main h-screen w-screen overflow-x-hidden">
      <Navbar />
      <div className="grid grid-cols-12 h-full">
        <Sidebar onViewChange={handleViewChange} />
        {renderCenterContent()}
      </div>
    </div>
  );
};

export default Dashboard;