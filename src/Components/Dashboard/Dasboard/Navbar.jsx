import React from 'react'

const Navbar = () => {
    return (
        <div>
            <div className="navbar w-full px-15 py-5 flex justify-between items-center">
                <div className="logo text-3xl text-white font-bold">RemoteX</div>
                <div className='profile'>
                    <img className='w-10 h-10 rounded-4xl'
                        src="https://www.shutterstock.com/image-vector/men-profile-icon-simple-design-260nw-1543690232.jpg"
                        alt="" />
                </div>
            </div>
        </div>
    )
}

export default Navbar