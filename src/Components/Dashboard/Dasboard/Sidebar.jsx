import React, { useState, useEffect } from 'react';
import { supabase } from '../../../Utils/supabaseClient';
import { useAuth } from '../../../Context/Auth/AuthContext';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import { IoMdChatbubbles, IoMdVideocam } from "react-icons/io";
import { FaVrCardboard } from "react-icons/fa";
import { SiGoogledocs } from "react-icons/si";

const Sidebar = () => {
  const [linksLoading, setLinksLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [skeletonCount, setSkeletonCount] = useState(4);
  const [whiteboards, setWhiteboards] = useState([]);
  const [whiteboardsLoading, setWhiteboardsLoading] = useState(true);
  const [showWhiteboards, setShowWhiteboards] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch features/links
  useEffect(() => {
    const fetchUrl = async () => {
      setLinksLoading(true);
      const { data, error } = await supabase.from("features").select().order("id");
      if (error) {
        toast.error(error.message);
        setLinksLoading(false);
        return;
      }
      setLinks(data);
      setSkeletonCount(data.length || 4);
      setLinksLoading(false);
    };
    fetchUrl();
  }, []);

  // Fetch whiteboards
  useEffect(() => {
    const fetchWhiteboards = async () => {
      if (!user) return;
      
      setWhiteboardsLoading(true);
      try {
        // Fetch user's whiteboards from database
        const { data, error } = await supabase
          .from("whiteboards")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setWhiteboards(data || []);
      } catch (error) {
        console.error("Error fetching whiteboards:", error);
        // If table doesn't exist, show some default boards
        setWhiteboards([
          { id: 'default-1', name: 'Main Whiteboard', board_id: 'main-board' },
          { id: 'default-2', name: 'Project Brainstorm', board_id: 'project-board' }
        ]);
      } finally {
        setWhiteboardsLoading(false);
      }
    };

    fetchWhiteboards();
  }, [user]);

  // Create new whiteboard
  const createNewWhiteboard = async () => {
    if (!user) {
      toast.error('Please login to create whiteboards');
      return;
    }

    const boardId = `board-${Date.now()}`;
    const whiteboardName = `Whiteboard ${whiteboards.length + 1}`;

    try {
      // Add to database if table exists
      const { error } = await supabase
        .from("whiteboards")
        .insert({
          name: whiteboardName,
          board_id: boardId,
          user_id: user.id
        });

      if (error && error.code !== '42P01') { // Ignore "table doesn't exist" error
        throw error;
      }

      // Add to local state
      const newWhiteboard = {
        id: `local-${boardId}`,
        name: whiteboardName,
        board_id: boardId
      };

      setWhiteboards(prev => [newWhiteboard, ...prev]);
      
      // Navigate to the new whiteboard
      navigate(`/whiteboard/${boardId}`);
      toast.success('New whiteboard created!');
    } catch (error) {
      console.error('Error creating whiteboard:', error);
      // Fallback: just navigate to the board
      navigate(`/whiteboard/${boardId}`);
      toast.success('New whiteboard created!');
    }
  };

  // Skeleton row
  const SkeletonRow = () => (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-zinc-800 animate-pulse">
      <div className="h-6 w-6 bg-zinc-700 rounded-full"></div>
      <div className="h-4 w-32 bg-zinc-700 rounded"></div>
    </div>
  );

  // Whiteboard skeleton
  const WhiteboardSkeleton = () => (
    <div className="flex items-center gap-2 px-2 py-1 ml-6 rounded-lg bg-zinc-800 animate-pulse">
      <div className="h-4 w-4 bg-zinc-700 rounded-full"></div>
      <div className="h-3 w-24 bg-zinc-700 rounded"></div>
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
      {/* Main Features */}
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

      {/* Whiteboards Section */}
      <div className="mt-4">
        {/* Whiteboards Header */}
        <div 
          className="flex items-center justify-between hover:bg-zinc-800 ease-in duration-100 px-2 rounded-lg cursor-pointer"
          onClick={() => setShowWhiteboards(!showWhiteboards)}
        >
          <div className="flex items-center">
            {/* Using emoji instead of problematic icon import */}
            <span className="mr-2 text-lg">📋</span>
            <p className="cursor-pointer px-4 py-2 text-lg">Whiteboards</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              createNewWhiteboard();
            }}
            className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
          >
            + New
          </button>
        </div>

        {/* Whiteboards List */}
        {showWhiteboards && (
          <div className="ml-4 mt-2 space-y-1">
            {whiteboardsLoading ? (
              Array(2).fill(0).map((_, i) => <WhiteboardSkeleton key={i} />)
            ) : whiteboards.length > 0 ? (
              whiteboards.map((whiteboard) => (
                <div
                  key={whiteboard.id}
                  className="hover:bg-zinc-800 ease-in duration-100 px-2 rounded-lg"
                >
                  <Link 
                    to={`/whiteboard/${whiteboard.board_id}`}
                    className="flex items-center py-1 text-sm text-gray-300"
                  >
                    {/* Using emoji for individual whiteboards */}
                    <span className="mr-2">🖊️</span>
                    <span className="truncate">{whiteboard.name}</span>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400 px-2 py-1">
                No whiteboards yet. Click "+ New" to create one!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;