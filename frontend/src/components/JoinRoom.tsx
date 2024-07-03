import { Modal } from 'react-responsive-modal';

import { IoMdCloseCircle } from "react-icons/io";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { toast } from 'react-toastify';
import axios from "axios";
import { useSelector } from "react-redux";
import { useEffect, useState } from 'react';
import { IoSearchSharp } from "react-icons/io5";
import { useDispatch } from 'react-redux';
import { RootState } from '../state/store';
import { setConnectedUsers } from '../state/connected/connectedSlice';
import { setConversations } from '../state/conversations/conversationSlice';
import { Socket } from 'socket.io-client';
import PassOwnership from './PassOwnership';



export const JoinRoom = (props : any) => {
    const [isPublic, setIsPublic] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [filter, setFilter] = useState<string>("");
    const user = useSelector((state:any)=>state.user.user);
    const [chats, setchats] = useState<any>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [disabled, setDisabled] = useState<boolean>(true);
    const [password, setPassword] = useState<string>("");
    const dispatch = useDispatch();
    const [OwnerModuleOpen, setOwnerModuleOpen] = useState(false);
    const {conversations, socket} = useSelector((state:RootState)=>{
        return {
            conversations: state.conversations.conversations,
            socket: state.socket.socket as Socket,
        }
    });
    const JoinChat = async () => {
        if (!selectedChat) {
            toast.error("No chat selected");
            return;
        }
            await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + "/chat/join", {
                chatId: selectedChat.chat_id,
                password: password
            },
            {
                headers:{
                    Authorization: `Bearer ${user.jwt}`
                }
            }).then((res:any)=>{
                if(res.data.status != undefined && res.data.status === 500 ) {
                    toast.error(res.data.message);
                    return;
                }
                // console.log("res : ", res.data);
                const data = {
                    id: res.data.chat_id,
                    image: ((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/chat/image/" + res.data.chat_id) + "?" + new Date().getTime(),
                    type: res.data.chatType,
                    name: res.data.chatName,
                    conversation: res.data.messages,
                    chatMembers: res.data?.chatMembers,
                    admins: res.data?.chatAdmins,
                    owner_username: res.data?.FK_chatOwner?.username,
                    GroupState: res.data?.GroupState
                }
                dispatch(setConversations([data, ...conversations]));
                toast.success("joined ChatGroup successfully !");
                socket?.emit("joingChat", {...data, user:user.userData.login});
                props.setJoinChatOpen(false);
                setPassword("");
                setFilter("");
            }).catch((err:any)=>{
                console.log("err : ", err);
                toast.error(err.message);
            })
        // toast.success('Joining Chat ...');

        return null;
    }
    const fetchChats = async () => {
        // console.log("filter: ", filter)
        if (!filter.length) {
            setchats([]);
            return; 
        }
        await axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/chat/filter/"+filter,
        {headers:{ Authorization: `Bearer ${user.jwt}`}})
        .then((res:any)=>{
            console.log("filtered data : ", res.data);
            setchats(res.data);
        })
        .catch((err:any)=>{
            toast.error(err.message);
            console.log("Error : ", err.message);
        })
    }
    useEffect(()=>{
        if (selectedChat) {
            setIsPublic(selectedChat.isPublic);
        }
    },[selectedChat])
    useEffect(()=>{
        if (selectedChat && selectedChat.GroupState !== "PROTECTED") {
            setDisabled(false);
        }
        else if (selectedChat && selectedChat.GroupState === "PROTECTED") {
            if (password.length) {
                setDisabled(false);
            }
            else {
                setDisabled(true);
            }
        }
    }, [password, selectedChat])
    useEffect(() => {
    // ``
        fetchChats();
        setSelectedChat(null);
        setIsPublic(true);
    },[filter])
  return (<>
                {/* Join Chat Modal */}
                <Modal
                    open={props.joinChatOpen}
                    onClose={() => props.setJoinChatOpen(false)}
                    center
                    closeIcon={<IoMdCloseCircle className="text-3xl text-white bg-transparent outline-none border-0" />}
                    classNames={{
                        overlayAnimationIn: 'customEnterOverlayAnimation',
                        overlayAnimationOut: 'customLeaveOverlayAnimation',
                        modalAnimationIn: 'customEnterModalAnimation',
                        modalAnimationOut: 'customLeaveModalAnimation',
                    }}
                    // styles={="nes-container is-rounded is-dark"}
                    animationDuration={400}
                >
                    <div className="nes-container is-rounded rounded-md is-dark min-md:min-w-[500px]  with-title is-centered">
                        <p className="title">Join Room</p>
                        <div className='flex flex-col flex-wrap justify-center'>
                            {/* <label htmlFor="chatName" className='w-3/6'>Name *:</label> */}
                            <div className="flex flex-row items-center">
                                <IoSearchSharp className="text-xl !p-0 !m-0" />
                                <input type="text" id='chatName' className="nes-input w-3/6 text-sm text-black !m-0" value={filter} 
                                onChange={(e:any)=>setFilter(e.target.value)} placeholder="Chat name ..." />
                            </div>
                            {/* Filtered ChatGroups */}
                            <section className='nes-container min-w-[300px] bg-gray-200 min-h-[200px] max-h-[400px] flex flex-col overflow-y-auto !p-1 no-scroll'>
                                {
                                    chats?.map((elem:any)=>{
                                        // console.log("selectedChat);
                                        return (
                                            <button  key={elem.chat_id} onClick={()=>{setSelectedChat(elem)}}
                                            className={'nes-btn nes-container is-rounded is-black !pl-1 flex flex-row items-center mx-w-[300px] !bg-slate-500 !bg-opacity-45 justify-between !mt-3 '+ (selectedChat && elem && elem?.chat_id === selectedChat?.chat_id? "is-disabled":"")}>
                                                <div className='flex flex-row items-center'>
                                                    <img src={
                                                        ((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/chat/image/" + elem.chat_id)
                                                    } alt="avatar" className="nes-avatar is-large object-cover rounded-xl pr-3 !min-h-[70px] !min-w-[70px] mr-4" />
                                                    <p className='text-sm '>{props.getSlice(elem.chatName, 9)}</p>
                                                    <span className='flex flex-col flex-nowrap border-l-2 border-gray-600 absolute right-0 p-1'>
                                                        <p className='text-xs text-gray-600 border-b-2 border-gray-600 mb-0 pb-1'>{elem._count.chatMembers}</p>
                                                        <p className='text-xs text-gray-600 items-start pt-1'>{elem.GroupState}</p>
                                                    </span>
                                                </div>
                                                {/* <button className='nes-btn is-success' onClick={JoinChat}>Join</button> */}
                                            </button>
                                        )
                                    })
                                }
                            </section>
                        </div>

                        {/* is Public */}
                        <div className='flex flex-col mt-2'>
                            <div id='password_setion' className={selectedChat?.GroupState !== "PROTECTED"? "hidden":""}>
                                <div className='flex flex-row items-center'>
                                    <input type="password" name='password' id='password' 
                                    className="nes-input is-rounded w-5/6 text-sm text-black"
                                     placeholder="Password* ..." value={password} onChange={(e:any)=>{setPassword(e.target.value)}} />
                                    {showPassword ? 
                                    <FaRegEyeSlash className="text-3xl p-0 m-0 text-blackbg-white outline-none" 
                                    onClick={() => {setShowPassword(false)}} />
                                    : 
                                    <FaRegEye className="text-3xl p-0 m-0 text-blackbg-white outline-none" 
                                    onClick={() => {setShowPassword(true)}} />}

                                </div>
                            </div>
                            <button className={'nes-btn ' + (disabled? "is-disabled":'')} onClick={JoinChat} disabled={disabled}>Join Chat</button>
                        </div>
                    </div>
            </Modal>
            </>
  );
};
