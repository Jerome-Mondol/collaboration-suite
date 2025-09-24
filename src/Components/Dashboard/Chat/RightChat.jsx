import React, { useState, useEffect } from 'react';
import { getUsers } from '../../../Utils/Chat/Chat';

const RightChat = ({ getUserId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState([]);
    const [expectedCount, setExpectedCount] = useState(5);
  
  useEffect(() => {
      const fetchUsers = async () => {
          setIsLoading(true);
          
          const data = await getUsers();
          if (data) {
              setUserData(data);
              setExpectedCount(data.length);
            }
            setIsLoading(false);
        };
        
        fetchUsers();
    }, []);
    
    
  const SkeletonRow = () => (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-zinc-800 animate-pulse h-10 my-2">
      <div className="h-6 w-6 bg-zinc-700 rounded-full"></div>
      <div className="h-4 w-32 bg-zinc-700 rounded"></div>
    </div>
  );

  return (
    <div className="py-10 m-2">
      {isLoading
        ? Array(expectedCount)
            .fill(0)
            .map((_, i) => <SkeletonRow key={i} />)
        : userData.map(({ id, email, username }) => (
            <div
              key={id}
              className="flex gap-2 items-center p-3 text-white hover:bg-zinc-800 duration-100 ease-in"
              onClick={() => getUserId(id, email, username)}
            >
              <img
                className="w-8 h-8 rounded-4xl"
                src="https://www.shutterstock.com/image-vector/men-profile-icon-simple-design-260nw-1543690232.jpg"
                alt=""
              />
              <h1>{username}</h1>
            </div>
          ))}
    </div>
  );
};

export default RightChat;
