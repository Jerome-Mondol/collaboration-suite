import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast';

export const getUsers = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    toast.error(userError.message);
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')   
    .select('*')
    .neq('id', user.id);

  if (error) {
    toast.error(error.message);
    return [];
  }

  return data;
}

export const getMessageOrCreateMessage = async (userId_1, userId_2) => {
  let { data: conversation, error } = await supabase
  .from("conversations").select('*')
  .or(`and(userId_1.eq.${userId_1},userId_2.eq.${userId_2}),and(userId_1.eq.${userId_2},userId_2.eq.${userId_1})`)
  .single();

  if(error && error.code !== "PGRST116") {
    console.log(error)
    return;
  }

  if(!conversation) {
    const { data, error: insertError } = await supabase
      .from('conversations')
      .insert([{ userId_1, userId_2 }])
      .select()
      .single();

      if(insertError) {
        console.log(insertError.message)
        return
      }

      conversation = data
  }

  return conversation
} 

export const sendMessage = async (conversation_id, sender_id, message) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ conversation_id, sender_id, message }])
    .select()
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  await supabase
    .from('conversations')
    .update({ last_message: message, updated_at: new Date() })
    .eq('id', conversation_id);

  return data;
};




