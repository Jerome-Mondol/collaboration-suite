// Components/Dashboard/Dasboard/Dashboard.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Chat from '../Chat/Chat';
import Document from '../Docs/Docs';

const Dashboard = () => {
  const [navState, setNavState] = useState('default');

  const handleViewChange = (viewName) => {
    setNavState(viewName);
  };

  const renderCenterContent = () => {
    switch(navState) {
      case 'default':
      case 'chat':
        return <Chat />;
      case 'video':
        return <div>Video Placeholder</div>; // replace with Video component later
      case 'docs':
        return <Document docId="default-doc-id" />; // default doc for testing
      default:
        return <Chat />;
    }
  };

  return (
    <div className="main h-screen w-screen overflow-x-hidden">
      <Navbar />
      <div className="grid grid-cols-12 h-full">
        <Sidebar />
        {renderCenterContent()}
      </div>
    </div>
  );
};

export default Dashboard;
