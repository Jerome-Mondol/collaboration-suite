import React, { useState } from "react";
import { supabase } from "../../Functions/Auth/supabaseClient";

const PassRecovery = () => {
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setNewPassword(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (data) alert("Password updated successfully!");
    if (error) alert("Error updating password!");

    setIsLoading(false);
  };

  return (
    <div className='w-screen h-screen flex justify-evenly items-center flex-col'>
      <h1 className='text-white text-semibold text-3xl'>Don't Forget it again 😇</h1>
      <form onSubmit={handleSubmit} className='bg-gray-300 w-[30%] h-auto p-10 flex flex-col gap-5'>
        <div>
          <h1 className='text-2xl font-bold text-center'>Enter new password</h1>
        </div>

        <input
          onChange={handleChange}
          value={newPassword}
          className='bg-white p-5 border-none outline-none'
          type="password"
          placeholder='Enter new password'
        />

        {isLoading ? (
          <div>Loading</div>
        ) : (
          <button className='bg-black text-white p-3 font-semibold' type='submit'>
            Update Password
          </button>
        )}
      </form>
    </div>
  );
};

export default PassRecovery;
