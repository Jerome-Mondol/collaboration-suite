import React from 'react'
import CenterChat from './CenterChat'
import RightChat from './RightChat'

const Chat = () => {
  return (
    <>
      <div className='grid grid-cols-9 bg-yellow-500 w-screen'>
        <CenterChat />
        <RightChat />
      </div>
    </>
  )
}

export default Chat
