import { supabase } from './supabaseClient'
import toast from 'react-hot-toast';


export const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        toast.error(error.message)
        return
    } else {
        toast.success("Successfully logged in")
    }
}

export const signup = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
        
    })

    if (error) {
        toast.error(error.message)
        return
    }

    toast.success("Successfully signed up")
}

export const passwordReset = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/recover-password' 
    });
    if(error) {
        toast.error(error.message);
        return
    } else {
        toast("Check your email")
    }
}