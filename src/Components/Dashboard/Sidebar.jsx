import React, { useState, useEffect } from 'react';
import { supabase } from '../../Utils/supabaseClient';
import { useAuth } from '../../Context/Auth/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { IoMdChatbubbles, IoMdVideocam } from "react-icons/io";
import { FaVrCardboard } from "react-icons/fa";
import { SiGoogledocs } from "react-icons/si";

const Sidebar = () => {
  const [linksLoading, setLinksLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [skeletonCount, setSkeletonCount] = useState(4); // fallback if needed

  useEffect(() => {
  const fetchUrl = async () => {
    setLinksLoading(true); // start skeleton
    const { data, error } = await supabase.from("features").select().order("id");
    if (error) {
      toast.error(error.message);
      setLinksLoading(false);
      return;
    }
    setLinks(data);
    setSkeletonCount(data.length || 4);
    setLinksLoading(false); // stop skeleton
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

  const renderIcon = (icon) => {
    switch (icon) {
      case "chat":
        return <IoMdChatbubbles className="mr-2" />;
      case "video":
        return <IoMdVideocam className="mr-2" />;
      case "board":
        return <FaVrCardboard className="mr-2" />;
      case "docs":
        return <SiGoogledocs className="mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="px-5 py-10 flex flex-col gap-2 col-span-2 text-white border-1 border-gray-200">
      {linksLoading
        ? Array(skeletonCount).fill(0).map((_, i) => <SkeletonRow key={i} />)
        : links.map(({ id, name, path, icon }) => (
            <div
              key={id}
              className="hover:bg-zinc-800 ease-in duration-100 px-2 rounded-lg"
            >
              <Link to={path} className="flex items-center">
                {renderIcon(icon)}
                <p className="cursor-pointer px-4 py-2 text-lg">{name}</p>
              </Link>
            </div>
          ))
      }
    </div>
  );
};

export default Sidebar;
