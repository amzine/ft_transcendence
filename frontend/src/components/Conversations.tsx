import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../state/store';
import { setChat } from '../state/chat/chatSlice';
import { MdAddCircle } from "react-icons/md";
import { IoEnter } from "react-icons/io5";
import 'react-responsive-modal/styles.css';
import {CreateRoom} from './CreateRoom';
import {JoinRoom} from './JoinRoom';
import { setDmRoom } from '../state/dmRoom/dmRoomSlice';
import {slide as Menu} from 'react-burger-menu';
import Button from './Button';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';


const Conversations = (props:any) => {
    const {user, socket, chat, conversations, dms, dmRoom, isMenuOpen} = useSelector((state: RootState) => {
        return {
            user:state.user.user,
            socket:state.socket.socket,
            chat:state.chat.chat,
            conversations:state.conversations.conversations,
            dms:state.dms.dms,
            dmRoom: state.dmRoom.dmRoom,
            isMenuOpen: state.isMenuOpen.isMenuOpen
        }
    });
    const dispatch = useDispatch();
    
    const [isChat, setIsChat] = useState(false);

    const [filteredDms, setFilteredDms] = useState(dms);
    const [filtered, setFiltered] = useState(conversations);
    useEffect(() => {
        setFiltered(conversations)
        return () => {}
    }, [conversations])

    const getSlice = (str:string, len:number) => {
        if (!str) return "";
        if (str.length > len) return str.slice(0, len) + "...";
        else return str;
    }

    const filterConversations = (e:any) => {
        if (e.target.value.trim() === "") {
            setFiltered(conversations);
            setFilteredDms(dms);
            return;
        
        };
        const filter = e.target.value
        setFiltered(conversations.filter((conversation:any) => conversation.name.toLowerCase().includes(filter.toLowerCase())))
        // setFilteredDms(dms.filter((dm:any) => {
        //     const data = dm.FK_user1?.username === user.userData.login ? dm.FK_user2 : dm.FK_user1;
        //     return data.username.toLowerCase().includes(filter.toLowerCase())
        // }))

    }
    const [open, setOpen] = useState(false);
    const [joinChatOpen, setJoinChatOpen] = useState(false);
    useEffect(()=>{
        console.log("dms bullshit : ", dms);
        return () => {}
    }, [dms])
    useEffect(()=>{
        if (chat) {
            setIsChat(true);
        }
        else if (dmRoom) {
            setIsChat(false);
        }
        return () => {}
    }, [chat, dmRoom])
    // console.log("dms.length : ", dms.length);
    return (
        <>
            {/* <slide /> */}
            {/* <Menu > */}
                <div key={"parent-conv"} className={`flex flex-col bg-gradient-to-b from-slate-500 !border-y-0 to-transparent backdrop-blur-sm justify-start  h-full overflow-auto px-1 
                transition-all duration-200 ease-linear max-h-[95vh] relative min-w-[240px] w-[240px]
                ` + (!isMenuOpen? "!w-0 !invisible !p-0 !min-w-0":"")}>
            {/* }> */}
                    <div key={"types-0"} className="flex flex-row w-full pb-2">
                        <button className={'!outline-none text-sm border-none w-1/2 p-2 is-rounded h-16  '  + (!isChat?' bg-slate-300 text-gray-700':"bg-slate-700 ")}
                            onClick={()=>{
                                setIsChat(false)
                            }}>Dms</button>
                        <button className={'!outline-none text-sm border-none  w-1/2 p-2 is-rounded h-16  ' + (isChat?' bg-slate-300 text-gray-700':'bg-slate-700')} 
                        onClick={()=>{
                            setIsChat(true)
                        }}>Groups</button>
                    </div>
                        {
                            isChat?
                                <div key={"search"} className='flex flex-row'>
                                    <input type="text" className="nes-input w-full text-lg text-black" placeholder="Chat Name ..." onChange={filterConversations} />
                                    <button title='Create ChatGroup' className="nes-btn is-rounded my-2 text-lg !flex !flex-row flex-wrap items-center justify-between is-success" onClick={() =>{
                                        setOpen(true)
                                    }}>
                                            <MdAddCircle className="text-3xl"  />
                                    </button>
                                    
                                    <CreateRoom joinChatOpen={joinChatOpen} open={open} setOpen={setOpen} setJoinChatOpen={setJoinChatOpen} />
                                    <JoinRoom joinChatOpen={joinChatOpen} open={open} setOpen={setOpen} setJoinChatOpen={setJoinChatOpen} getSlice={getSlice} />
                                    <button title="Join Chat" onClick={()=>{setJoinChatOpen(true)}} className="nes-btn is-rounded my-2 text-lg !flex !flex-row flex-wrap items-center justify-between is-warning">
                                        <IoEnter className="text-3xl text-white"  />
                                    </button>
                                </div>
                            :
                            <></>
                        }
                {
                    isChat?
                    filtered.map((conversation:any, index:number) => {
                        return (
                            <button key={index} className={"!w-full is-rounded rounded-lg p-1 !border-l-8 border-transparent bg-slate-400 !outline-none !my-[2px] text-lg "
                            +(chat && chat.id == conversation.id?" cursor-not-allowed   !border-blue-700 bg-gradient-to-r !from-slate-500 to-slate-300 ":"")} onClick={() => {
                                dispatch(setChat(conversation));
                                dispatch(setDmRoom(null))
                            }}>
                                <div className={'!flex !flex-row flex-nowrap items-center justify-start'}>
                                    <img className='nes-avatar is-large object-cover rounded-xl mr-4 ml-2' src={
                                        conversation.image
                                    } alt="" />
                                    <div className="!flex !flex-col flex-wrap items-start justify-between w-full">
                                        {/* <div>{getSlice(conversation.name, 6)}</div> */}
                                        <div className='text-ellipsis max-w-[90%] overflow-hidden whitespace-nowrap'>{conversation.name}</div>
                                        <div className={'text-gray-700 text-xs w-fit mr-2'
                                        + (chat && chat.id == conversation.id? " text-gray-200":"")} style={chat && chat.id == conversation.id?{
                                            textShadow: "1px 1px 1px #000000",
                                        }:{}}>{conversation.GroupState}</div>
                                    </div>
                                </div>
                                <div className={' text-sm text-gray-700 text-start px-2 mt-1 max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis'
                                    + (chat && chat.id == conversation.id? " text-gray-200":"")} style={chat && chat.id == conversation.id?{
                                        textShadow: "1px 1px 1px #000000",
                                    }:{}}>
                                    {conversation.conversation[conversation.conversation.length - 1]?.message}
                                </div>
                            </button>
                        )
                    }):
                    dms.length === 0    ?
                    <div className="text-center text-2xl text-gray-700">No Dms</div>
                    :
                    dms.map((dm:any, index:number) => {
                        const data = dm?.FK_user1?.username === user.userData.login ? dm?.FK_user2 : dm?.FK_user1;
                        if (!data) return <div key={index}></div>;
                        return <div key={index}>
                            <button key={dm.dm_id} className={"!w-full is-rounded rounded-lg p-1 !border-l-8 border-transparent bg-slate-400 !outline-none !my-[2px] text-lg "
                            +(dmRoom && dmRoom.dm_id == dm.dm_id?" cursor-not-allowed   !border-blue-700 bg-gradient-to-r !from-slate-500 to-slate-300":"")} onClick={() => {
                                dispatch(setDmRoom(dm));
                                dispatch(setChat(null))
                            }}>
                                <div className='!flex !flex-row flex-nowrap items-center justify-start'>
                                    <img className='nes-avatar is-large object-cover rounded-xl mr-4 ml-2' src={
                                        (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+data.username + '?' + new Date().getTime()
                                    } alt="" />
                                    <div className="!flex !flex-col flex-wrap items-start justify-between w-full">
                                        {/* <div>{getSlice(conversation.name, 6)}</div> */}
                                        <div className='text-ellipsis max-w-[90%] overflow-hidden whitespace-nowrap'>{data.username}</div>
                                        {/* <div className='text-gray-400 text-xs w-fit mr-2'>{dm.GroupState}</div> */}
                                    </div>
                                </div>
                                <div className={' text-sm text-gray-700 text-start px-2 mt-1 max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis'
                                    + (dmRoom && dmRoom.dm_id == dm.dm_id? " text-gray-200":"")} style={dmRoom && dmRoom.dm_id == dm.dm_id?{
                                        textShadow: "1px 1px 1px #000000",
                                    }:{}}>
                                    {dm.messages[dm.messages.length - 1]?.message}
                                </div>
                            </button>
                        </div>
                    })
                }
                </div>
            {/* </Menu> */}
        </>
    )
}

export default Conversations