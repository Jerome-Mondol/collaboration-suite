import React, { useState, useEffect } from 'react'
import { CiPaperplane } from "react-icons/ci";
import { getUsers } from '../../../Utils/Chat/Chat'
import { supabase } from '../../../Utils/supabaseClient'
import News from '../News/News';
  


const DirectMessage = ({ name, id, email }) => {
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    
  } 

  useEffect(() => {
    const getCurrentLoggedInUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if(error) {
        console.log(error)
        return;
      }
      setCurrentUser(user)
    }
    getCurrentLoggedInUser();
  }, [])



  if(!name || !id || !email) return (
    <div className='col-span-6'>
      <h1 className='text-white text-4xl text-semibold text-center' >Welcome {currentUser?.user_metadata.name}</h1>
      <p className='text-white text-xl text-center' >How are you felling today!</p>

      <News />
    </div>
  )

  return (
    <>
        <div className='col-span-6'>
            <div className='h-full' >
              <div className=" h-[10%] flex  items-center gap-2 text-white font-semibold px-5">
                <img 
                className='w-8 h-8 rounded-4xl'
                src="https://www.shutterstock.com/image-vector/men-profile-icon-simple-design-260nw-1543690232.jpg" 
                alt="" />
                <h1>{name}</h1>
              </div>
              <div className='bg-zinc-700 h-[73%]' >

              </div>
              <div className=' text-white'>
                <form onSubmit={handleSubmit} className='flex items-center  px-5' >
                  <input 
                  value={message}
                  type="text" 
                  placeholder='text!'
                  className='w-full p-3 border-none outline-none text-gray-300 text-2xl'
                  onChange={(e) => setMessage(e.target.value)}
                  />
                  <button className='text-2xl' ><CiPaperplane /></button>
                </form>
              </div>
            </div>
        </div>
    </>
  )
}

export default DirectMessage
