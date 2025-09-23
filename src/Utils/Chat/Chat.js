import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast';

export const getUsers = async () => {
    const { data, error } = await supabase.from('profiles').select();
    if(error) { 
        toast.error(error.message) 
        return
    }
    return data
}

// export const getOrCreateDirectMessage = async () => {
    
// } 