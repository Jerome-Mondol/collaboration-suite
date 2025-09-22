import { supabase } from './supabaseClient'

export const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.log("An error Login occurred : ", error.message)
    } else {
        console.log("user is successfully logged in")
    }
}

export const signup = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        data: {
            name
        }
    })

    if (error) {
        console.log("Error", error)
    } else {
        console.log("user is successfully signed up in")
    }
}

export const passwordReset = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/recover-password' 
    });
    if(error) {
        console.log("Error", error);
    } else {
        console.log("all good");
    }
}