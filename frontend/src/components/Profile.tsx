import React from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileMain from './ProfileMain';
import { RootState } from '../state/store';
import { useSelector } from 'react-redux';

const Profile = (props:any) => {
    const user = useSelector((state: RootState) => state.user.user);
    return (
        user && user.userData ?
            <div className='h-full w-full grid grid-cols-profile max-[1000px]:flex max-[1000px]:flex-col max-[1000px]:!items-center max-[1000px]:!text-sm max-[1000px]:!max-w-full overflow-scroll'>
                <ProfileHeader className=" self-center h-fit w-full flex flex-col justify-between items-center p-4 max-[1000px]:!p-0 overflow-scroll" />
                <ProfileMain className="flex flex-col w-full items-center p-4 max-[1000px]:!p-0 max-h-full overflow-x-auto " />
            </div>
        :
            <div>Loading ...</div> 
    )
}

export default Profile;