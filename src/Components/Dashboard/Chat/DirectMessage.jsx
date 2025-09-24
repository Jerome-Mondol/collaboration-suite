import React, { useState, useEffect, useRef } from 'react';
import { CiPaperplane } from "react-icons/ci";
import { supabase } from '../../../Utils/supabaseClient';
import { getMessageOrCreateMessage, sendMessage } from '../../../Utils/Chat/Chat';
import News from '../News/News';

const DirectMessage = ({ name, id: otherUserId, email }) => {
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Get logged in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return console.log(error);
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // Get or create conversation
  useEffect(() => {
    if (!currentUser || !otherUserId) return;

    const fetchConversation = async () => {
      const conversation = await getMessageOrCreateMessage(currentUser.id, otherUserId);
      setConversationId(conversation.id);

      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      if (!error) setMessages(msgs);
    };

    fetchConversation();
  }, [currentUser, otherUserId]);

  // Real-time subscription
  // Real-time subscription
useEffect(() => {
  if (!conversationId) return;

  // create a new realtime channel
  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }
    );

  // subscribe to channel (no await)
  channel.subscribe();

  // cleanup when component unmounts or conversation changes
  return () => {
    supabase.removeChannel(channel);
  };
}, [conversationId]);



  // Send message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !conversationId || !currentUser) return;

    await sendMessage(conversationId, currentUser.id, message);
    setMessage('');
  };

  if (!name || !otherUserId || !email) {
    return (
      <div className='col-span-6 flex flex-col items-center justify-center h-full'>
        <h1 className='text-white text-4xl font-semibold text-center'>
          Welcome {currentUser?.user_metadata.name || 'Legend'}
        </h1>
        <p className='text-white text-xl text-center mt-2'>
          How are you feeling today?
        </p>
        <News />
      </div>
    );
  }

  return (
    <div className='col-span-6 flex flex-col h-full'>
      <div className="h-[10%] flex items-center gap-2 text-white font-semibold px-5">
        <img
          className='w-8 h-8 rounded-full'
          src="https://www.shutterstock.com/image-vector/men-profile-icon-simple-design-260nw-1543690232.jpg"
          alt={name}
        />
        <h1>{name}</h1>
      </div>

      <div className='bg-zinc-700 flex-1 p-4 overflow-y-auto flex flex-col gap-2'>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`max-w-[70%] p-2 rounded-lg text-white break-words
              ${msg.sender_id === currentUser.id ? 'self-end bg-blue-600' : 'self-start bg-gray-500'}`}
          >
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className='flex items-center px-5 py-3 bg-zinc-800'>
        <input
          value={message}
          type="text"
          placeholder='Type a message...'
          className='w-full p-3 border-none outline-none text-gray-300 text-lg rounded-l-lg bg-zinc-700'
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit" className='bg-blue-600 p-3 rounded-r-lg text-white text-xl'>
          <CiPaperplane />
        </button>
      </form>
    </div>
  );
};

export default DirectMessage;
