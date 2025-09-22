import React, { useState } from 'react'
import { signup } from '../../Functions/Auth/Auth'

const Signup = () => {


    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    })

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
        setIsLoading(true)
        const {name, email, password} = formData;
        await signup(name, email, password)
        setIsLoading(false)
    }


  return (
    <>  
    <div className='w-screen h-screen flex justify-evenly items-center flex-col' >
        <h1 className='text-white text-semibold text-3xl' >Welcome to Remote Work Collaboration Suite</h1>
        <form onSubmit={handleSubmit} className='bg-gray-300 w-[30%] h-auto p-10 flex flex-col gap-5' >
            <div>
                <h1 className='text-2xl font-bold text-center'>SignUp</h1>
                <p className='text-lg text-center mt-2' >Already Have an account? Login</p>
            </div>


            <input onChange={handleChange} className='bg-white p-5 border-none outline-none' type="text" name="name" id="name" placeholder='Enter Name'/>
            <input onChange={handleChange} className='bg-white p-5 border-none outline-none' type="email" name="email" id="email" placeholder='Enter Email'/>
            <input onChange={handleChange} className='bg-white p-5 border-none outline-none' type="password" name="password" id="password" placeholder='Enter password'/>
            

            {
                isLoading ?
                <div>is loading</div>
                :
                <button className='bg-black text-white p-3 font-semibold text-xl' type='submit'>Sign up</button>
            }
        </form>
    </div>
    </>
  )
}

export default Signup
