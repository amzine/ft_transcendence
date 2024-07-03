import React, { useState } from 'react';
import ChatRoom from './ChatRoom';
import Conversations from './Conversations';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import DmRoom from './DmRoom';

const Chat = (props:any) => {
    const {chat, dmRoom} = useSelector((state:RootState)=>{
        return {
            chat:state.chat.chat,
            dmRoom:state.dmRoom.dmRoom,
        }
    })
    
    return (
        <div className='relative w-full h-full flex flex-row items-start border-none !overflow-hidden max-md:max-w-full'>
            <Conversations />
            {
                chat ? 
                <ChatRoom />
                :
                dmRoom ? 
                <DmRoom />:<></>
            }
            {/* <div>"RightBar"</div> */}
        </div>
    )
}

export default Chat;