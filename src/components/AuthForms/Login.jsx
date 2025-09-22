import React, { useState } from 'react'
import { login, passwordReset } from '../../Functions/Auth/Auth'
import { Link } from 'react-router-dom'


const Login = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })
    const {email, password} = formData;
    
        const handleChange = (event) => {
            setFormData((prevFormData) => {
                return {
                    ...prevFormData,
                    [event.target.name]: event.target.value,
                }
            })
        }
    
        const handleSubmit = async(e) => {
            e.preventDefault();
            setIsLoading(true);
            await login(email, password)
            setIsLoading(false)
        }

  return (
    <>  
    <div className='w-screen h-screen flex justify-evenly items-center flex-col' >
        <h1 className='text-white text-semibold text-3xl' >Welcome to Remote Work Collaboration Suite</h1>
        <form onSubmit={handleSubmit} className='bg-gray-300 w-[30%] h-auto p-10 flex flex-col gap-5' >
            <div>
                <h1 className='text-2xl font-bold text-center'>Login</h1>
                <p className='text-lg text-center mt-2' >Don't have an account? <Link to={'/signup'} className='text-blue-700' >Sign Up</Link></p>
            </div>

            <input onChange={handleChange} className='bg-white p-5 border-none outline-none' type="email" name="email" id="email" placeholder='Enter Email'/>
            <input onChange={handleChange} className='bg-white p-5 border-none outline-none' type="password" name="password" id="password" placeholder='Enter password'/>

            <button className='text-left text-blue-700' type='button' ><Link to={'/recover'}>Forgot password?</Link></button>

            {
                isLoading ? 
                <button className='bg-black text-white p-3 font-semibold text-xl' type='submit'>Login...</button>

                :
                <button className='bg-black text-white p-3 font-semibold text-xl' type='submit'>Login</button>
            }
        </form>
    </div>
    </>
  )
}

export default Login
