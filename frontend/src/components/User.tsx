import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';

const User = () => {
    const user = useSelector((state: RootState) => state.user.user);
    // console.log(user)
    return (
        <div>
            <h1>User</h1>
            {user && user.userData ? (
                <div className='flex flex-col justify-center items-center'>
                    <p className="nes-avatar is-large"><img className='nes-avatar is-large object-cover is-rounded' alt='avatar' src={user.userData.image} /></p>
                    <p>{user.userData.login}</p>
                    <p>{user.userData.email}</p>
                    <p>{user.userData.id}</p>
                </div>
            ) : (user) ? <p>Loading ...</p>: <p>Not logged in</p>}
        </div>
    )
}

export default User