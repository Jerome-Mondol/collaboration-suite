import React, { useState } from 'react'
import RightChat from './RightChat'
import DirectMessage from './DirectMessage'

const Chat = () => {

    const[userEmail, setUserEmail] = useState();
    const[userId, setUserId] = useState();
    const[username, setUsername] = useState();

    const getUserId = (id, email, username) => {
        // console.log(id, email, username)
        setUserEmail(email);
        setUserId(id);
        setUsername(username);
        console.log(userEmail, userId, username)
    }

  return (
    <>
      <div className='grid grid-cols-9 w-screen'>
        <DirectMessage name={username} id={userId} email={userEmail}/>
        <RightChat getUserId={getUserId} />
      </div>
    </>
  )
}

export default Chat
