import React, { useState, useEffect } from 'react';
import { supabase } from '../../Utils/Auth/supabaseClient';
import { useAuth } from '../../Context/Auth/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { IoMdChatbubbles, IoMdVideocam } from "react-icons/io";
import { FaVrCardboard } from "react-icons/fa";
import { SiGoogledocs } from "react-icons/si";

const Sidebar = () => {
  const { user, loading } = useAuth();
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const fetchUrl = async () => {
      const { data, error } = await supabase.from("features").select().order("id");
      if (error) {
        toast.error(error.message);
        return;
      }
      setLinks(data);
    };
    fetchUrl();
  }, []);

  // Skeleton row
  const SkeletonRow = () => (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-zinc-800 animate-pulse">
      <div className="h-6 w-6 bg-zinc-700 rounded-full"></div>
      <div className="h-4 w-32 bg-zinc-700 rounded"></div>
    </div>
  );

  return (
    <div className="px-5 py-10 flex flex-col gap-5 col-span-2 text-white">
      {loading || links.length === 0
        ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
        : links.map(row => {
            const { name, id, path, icon } = row;
            return (
              <div
                key={id}
                className="hover:bg-zinc-800 ease-in duration-100 px-2 rounded-lg"
              >
                <Link to={path} className="flex items-center">
                  {icon === "chat" ? <IoMdChatbubbles /> :
                   icon === "video" ? <IoMdVideocam /> :
                   icon === "board" ? <FaVrCardboard /> :
                   icon === "docs" ? <SiGoogledocs /> : null
                  }
                  <p className="cursor-pointer px-4 py-2 text-lg">{name}</p>
                </Link>
              </div>
            );
          })
      }
    </div>
  );
};

export default Sidebar;
