import React from 'react'
import Sidebar from './Sidebar'

const Dashboard = () => {
  return (
    <>
        <div className="main h-screen w-screen overflow-x-hidden">
            <div className="navbar bg-red-500 w-full px-15 py-5 flex justify-between items-center">
                <div className="logo text-3xl text-white font-bold">RemoteX</div>
                <div className='profile'>
                    <img className='w-10 h-10 rounded-4xl' src="https://www.shutterstock.com/image-vector/men-profile-icon-simple-design-260nw-1543690232.jpg" alt="" />
                </div>
            </div>
            <div className='grid grid-cols-12 h-full'>
                <Sidebar />
                <div className="hero-middle col-span-7 bg-green-500"></div>
                <div className="status-bar bg-purple-500 col-span-3"></div>
            </div>
        </div>
    </>
  )
}

export default Dashboard
