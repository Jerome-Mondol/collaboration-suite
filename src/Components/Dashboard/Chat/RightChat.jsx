import React, { useState, useEffect } from 'react'
import { getUsers } from '../../../Utils/Chat/Chat'

const RightChat = ({ getUserId }) => {

    const [userData, setUserData] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getUsers();
            setUserData(data);
        }
        fetchUsers();
    }, [])
    return (
        <>
            <div className='col-span-3  py-10 '>
                {
                    userData.map(data => {
                        const { createdAt, email, id, username } = data;
                        return (
                            <div key={id} className=' flex gap-2 items-center p-3 text-white hover:bg-zinc-800 duration-100 ease-in'
                                onClick={() => getUserId(id, email, username)}
                            >

                                <img className='w-8 h-8 rounded-4xl'
                                    src="https://www.shutterstock.com/image-vector/men-profile-icon-simple-design-260nw-1543690232.jpg"
                                    alt="" />

                                <h1>{username}</h1>
                            </div>
                        )
                    })
                }
            </div>
        </>
    )
}

export default RightChat