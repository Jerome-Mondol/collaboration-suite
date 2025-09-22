import React, { useState } from 'react'
import { login, passwordReset } from '../../Functions/Auth/Auth'


const ForgotPassword = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
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
            passwordReset(email)
        }

  return (
    <>  
    <div className='w-screen h-screen flex justify-evenly items-center flex-col' >
        <h1 className='text-white text-semibold text-3xl' >Why did you forgot your password 😠</h1>
        <form onSubmit={handleSubmit} className='bg-gray-300 w-[30%] h-auto p-10 flex flex-col gap-5' >
            <div>
                <h1 className='text-2xl font-bold text-center'>Password Recovery</h1>
            </div>

            <input onChange={handleChange} className='bg-white p-5 border-none outline-none' type="email" name="email" id="email" placeholder='Enter Email'/>


            {
                isLoading ? 
                <div>Loading</div>
                :
                <button className='bg-black text-white p-3 font-semibold' type='submit'>Get password Reset link</button>
            }
        </form>
    </div>
    </>
  )
}

export default ForgotPassword
