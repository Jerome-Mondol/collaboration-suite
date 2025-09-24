import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Chat from '../Chat/Chat'


const Dashboard = () => {

    const [navState, setNavState] = useState('default')

    const handleViewChange = (viewName) => {
        setNavState(viewName)
    } 

    const renderCenterContent = () => {
        switch(navState) {
            case 'default':
                return <Chat />
            case 'chat':
                return <Chat />
            case 'video':
                return <Video />
            case 'docs':
                return <Docs />
        }
    }

  return (
    <>
        <div className="main h-screen w-screen overflow-x-hidden">
            <Navbar />
            <div className='grid grid-cols-12 h-full '>
                <Sidebar />
                <Chat />
            </div>
        </div>
    </>
  )
}

export default Dashboard
