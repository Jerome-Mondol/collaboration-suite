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

export const getMessageOrCreateMessage = async (senderId, recieverID) => {

}