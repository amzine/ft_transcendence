import { RootState } from "../state/store";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
// import Conversations from './Conversations';
import { setChat } from "../state/chat/chatSlice";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsThreeDotsVertical } from "react-icons/bs";
import { Menu } from '@headlessui/react'
import { MdSend } from "react-icons/md";
import Button from "./Button";
import axios from "axios";
import { setConversations } from "../state/conversations/conversationSlice";
import { SocketAddress } from "net";
import { Socket } from "socket.io-client";
import { Link, useNavigate } from "react-router-dom";
import PassOwnership from "./PassOwnership";
import { FaTrashAlt } from "react-icons/fa";
import { BiLeftArrow, BiRightArrow } from "react-icons/bi";
import { setIsMenuOpen } from "../state/menu/menuSlice";



const ChatRoom = (props: any) => {
    const { chat,
            user,
            socket,
            conversations,
            isMenuOpen,
            Blocked
        } = useSelector((state: RootState) => {
            return {
                chat:state.chat.chat,
                user: state.user.user,
                socket:state.socket.socket as Socket,
                conversations:state.conversations.conversations,
                isMenuOpen:state.isMenuOpen.isMenuOpen,
                Blocked: state.Blocked.Blocked,
            }
        });
    const [Tokick, setTokick] = useState<number>();
    const [ToBan, setToBan] = useState<string>("");
    const [MutedUsers, setMutedUsers] = useState<any[]>([]);
    // useEffect(()=>{
    //     props.setIsMenuOpen(false);
    // }, [])
    const SendMessage = (event : any) => {
        event.preventDefault();
        const message = document.getElementById("msg") as HTMLInputElement;
        if (!message.value) return;
        socket?.emit("", { sender:user.userData.login ,recepient: chat.id, message: message.value });
        console.log("verfy : ", { sender:user.userData.login ,recepient: chat.id, message: message.value })
        message.value = "";
        return null;
    }
    const [OwnerModuleOpen, setOwnerModuleOpen] = useState(false);
    const Quit= async () => {
        if (!chat) {
            toast.error("unknown error try again");
            return ;
        }
        const chatMember = chat.chatMembers.find((member:any)=> member.FK_user.username === user.userData.login);
        console.log("chatMember : ", chatMember)
        socket?.emit("leaveChat", {chatMember_id:chatMember.chatMember_id, chat_id:chat.id});
    }

    const KickUser = async () => {
        if (!chat || !Tokick) {
            toast.error("unknown error try again");
            return ;
        }
        const data = {
            user: user.userData.login,
            member_id: Tokick,
            chat_id: chat.id,

        }
        socket?.emit("kickUser", data);
    }

    useEffect(() => {
        setTimeout(()=>{
            const msgContainer = document.getElementById("msgContainer") as HTMLInputElement;
            msgContainer?.scrollTo(0, msgContainer.scrollHeight);
          }, 100)
          return () => {}
    }, [chat]);
    const deleteChat = async () => { 
        if (socket == null) {
            toast.error("Error Deleting Chat : Socket Not Connected .");
            return ;
        }
        if (!user || !user.userData) {
            toast.error("Error Deleting Chat : User Not Logged In, (try to refresh the page)");
            return ;
        }
        await axios.delete((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/chat/delete/"+chat.id,
        {
            headers:{ Authorization: `Bearer ${user.jwt}`}
        }
        ).then((res:any)=> {
            socket?.emit("deleteChat", {members: res.data.chatMembers, user: user.userData.login, chat_id: chat.id})
        }).catch((err:any)=> {
            toast.error(`Error Deleting Chat : ${err.message}`)
        })
    }

    const getMutedUsers = async () => {
        await axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/muted/"+chat.id,
        {
            headers : {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((res:any)=>res.data)
        .then((data:any)=>{
            if (data?.status == 500) {
                toast.error("Error: can't get muted users");
                return;
            }
            console.log("Muted Users : ", data);
            setMutedUsers(data);
        })
        .catch((err:any)=>{
            console.log("err : ", err);
            toast.error("Error: can't get muted users");
        })
    }

    const Mute= async (toMute:string) => {
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/Mute/" + toMute+"/"+chat?.id,
        {},
        {
            headers : {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((res:any)=>res.data)
        .then((data:any)=>{
            console.log("Mute res : ", data);
            if (data?.status == 500) {
                toast.error("Internal Server Error");
                return;
            }
            socket?.emit("MuteUser", data);
        }).catch((err:any)=>{
            toast.error("Internal Server Error");
            console.log("err : ", err.message);
        })
    }
    useEffect(() => {
        socket?.on("Muted", (data:any)=>{
            if (data == undefined) return;
            data = JSON.parse(data);
            setMutedUsers([...MutedUsers, data]);
            if (data.Muted_user == user.userData.login) {
                toast.warning(`You are muted  by ${data.MutedBy}`);
            }
            else {
                if (data.MutedBy == user.userData.login)
                    toast.warning(`You muted ${data.Muted_user} in this chat`);
                else
                    toast.warning(`${data.Muted_user} is muted by ${data.MutedBy}`)
            }
        })
        socket?.on("UnMuted", (data:any)=>{
            if (data == undefined) return;
            data = JSON.parse(data);
            setMutedUsers(MutedUsers.filter((elem:any)=>elem.Muted_user != data.Muted_user));
            if (data.Muted_user == user.userData.login) {
                toast.warning(`${data.MutedBy} UnMuted You .`);
            }
            else {
                if (data.UnMutedBy == user.userData.login)
                    toast.warning(`You Unmuted ${data.Muted_user}`);
                else
                    toast.warning(`${data.UnMutedBy} Unmuted ${data.Muted_user}.`);
            }
        })
        return ()=>{
            socket?.off("Muted");
            socket?.off("UnMuted");
        }
    });
    useEffect(()=>{

    }, [MutedUsers])
    const UnMute= async (toMute:string) => {
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/UnMute/" + toMute+"/"+chat?.id,
        {},
        {
            headers : {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((res:any)=>res.data)
        .then((data:any)=>{
            console.log("UnMute res : ", data);
            if (data?.status == 500) {
                toast.error("Internal Server Error");
                return;
            }
            socket?.emit("UnmuteUser", data);
        }).catch((err:any)=>{
            toast.error("Internal Server Error");
            console.log("err : ", err.message);
        })
    }

    useEffect(()=>{
        if (chat && chat.id && MutedUsers.length == 0)
            getMutedUsers();
    }, [])
    useEffect(() => {
        // console.log("chat:", conversations.find((elem:any)=>elem.id == chat.id));
    },[conversations])
    const Ban = async (toBlock:string) => {
        if (!user || !user.userData) {
            toast.error("Error Banning User : User Not Logged In, (try to refresh the page)");
            return ;
        }
        if (!toBlock) {
            toast.error("Error Banning User : Unknown Error");
            return ;
        }
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/Ban/" + toBlock+"/"+chat.id,
        {},
        {
            headers : {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((res:any)=>res.data)
        .then((data:any)=>{
            console.log("Ban res : ", data);
            if (data?.status == 500) {
                toast.error("Internal Server Error");
                return;
            }
            // setBannedUsers([...BannedUsers, data]);
            socket?.emit("banUser", data);
        }).catch((err:any)=>{
            console.log("err : ", err);
            toast.error("Error : " + err);
        })
    }
    const dispatch = useDispatch();
    if (!user || !user.userData) return (<>Loading ...</>);
    if (!chat) return (<></>);
    else return (
        <div className="relative nes-container bg-gradient-to-b from-slate-700 !border-y-0 to-transparent backdrop-blur-sm rounded-lg
         !mt-0 !outline-none !pt-0 text-black text-lg font-light h-full flex max-md:!p-0 flex-col w-full justify-end !max-h-full">
            <div className="flex flex-row flex-nowrap justify-around items-center">
                <button className="nes-btn is-rounded rounded-md h-14 w-14 items-center !m-2 is-warning
                bg-gradient-to-br from-slate-300 to-transparent text-lg  " title={isMenuOpen?"Hide Conversations":"Show Conversations"} onClick={()=>{
                    dispatch(setIsMenuOpen(!isMenuOpen));
                }}>
                    {
                        isMenuOpen?
                        <BiLeftArrow className="text-3xl " />    
                        :
                        <BiRightArrow className='text-3xl ' />
                    }
                </button> 
                <div className=" !mr-4 nes-container is-rounded is-dark !py-[10px] flex flex-row max-h-30 w-10/12 min-w-[230px] items-center justify-between">
                    <img src={
                                    chat.image
                        } alt="avatar" className="nes-avatar is-large object-cover rounded-xl" />
                    <h2 className="m-2 text-xl max-md:!text-sm  !max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis">
                        <Link to={"/Chat/profile/"+chat.id} className="text-white hover:text-gray-300 hover:no-underline">
                            {chat.name}
                        </Link>
                    </h2>
                    {/*  Modify this bullshit  */}
                    <div className="">
                        <Menu>
                            <Menu.Button className={" !outline-none !border-none"}>
                                <BsThreeDotsVertical id="dropdownDefaultButton" className="text-3xl" />
                            </Menu.Button>
                            <Menu.Items className="z-50 nes-container is-rounded rounded-lg bg-gray-400 bg-opacity-60 !absolute bg-gray min-h-full
                            p-4 top-14 flex flex-col text-sm right-0">
                                <Menu.Item >
                                    <Button  href={"/Chat/profile/"+chat.id} className="nes-btn is-primary is-rounded rounded-md text-sm !mt-3" onClick={(event:any)=>{
                                        const audio = document.getElementById('clickSound') as HTMLAudioElement;
                                        if (audio) {
                                            audio.volume = 0.4;
                                            audio.play().catch((error) => {});
                                        }
                                    }}>View Profile</Button>
                                </Menu.Item>
                                {/* <Menu.Item>
                                    <button type="submit" className="nes-btn is-error is-rounded rounded-md text-sm" 
                                    onClick={()=> {
                                        (document.getElementById('Block_user') as HTMLDialogElement).showModal();
                                    }}>Block</button>

                                </Menu.Item> */}
                                <Menu.Item>
                                    <button className="nes-btn is-error is-rounded rounded-md test-sm !mt-3" onClick={(e:any)=> {
                                        if (chat.owner_username == user.userData.login && chat.chatMembers.length > 1) {
                                            // setOwnerModuleOpen(true);
                                            toast.warning("You can't leave the chat, pass the ownership to another Admin from Profile Page");
                                        }else
                                            (document.getElementById('leaveChat') as HTMLDialogElement).showModal();
                                        }}>
                                        Leave Chat
                                    </button>
                                </Menu.Item>
                                <Menu.Item>
                                {
                                    chat.owner_username == user.userData.login ?
                                    <button className="nes-btn is-error is-rounded rounded-md test-sm !mt-3" onClick={(e:any)=> {
                                        (document.getElementById('delete_conf') as HTMLDialogElement).showModal();
                                    }}>
                                        delete Chat 
                                    </button>:<></>
                                }
                                </Menu.Item>
                            </Menu.Items>
                        </Menu>
                        {/* Chat Quiting Confirmation */}
                        <dialog className="nes-dialog is-dark is-rounded with-title is-centered" id="leaveChat">
                            <form method="dialog">
                                <p className="title"><u>Leave ChatGroup ?</u></p>
                                <menu className="dialog-menu">
                                    <button className="nes-btn">No</button>
                                    <button className="nes-btn is-primary" onClick={Quit}>Yes</button>
                                </menu>
                            </form>
                        </dialog>
                        
                        {/* block Confirmation */}
                        <dialog className="nes-dialog is-dark is-rounded with-title is-centered" id="Block_user">
                            <form method="dialog">
                            <p className="title"><u>Block The User</u></p>
                            <p>are You sure ?</p>
                            <menu className="dialog-menu">
                                <button className="nes-btn">No</button>
                                <button className="nes-btn is-primary" onClick={()=> {
                                    toast.error("User Blocked .")
                                }}>Yes</button>
                            </menu>
                            </form>
                        </dialog>
                        <dialog className="nes-dialog is-dark is-rounded with-title is-centered" id="delete_conf">
                            <form method="dialog">
                            <p className="title"><u>Delete "{chat.name}" Room</u></p>
                            <p>are You sure ?</p>
                            <menu className="dialog-menu">
                                <button className="nes-btn">No</button>
                                <button className="nes-btn is-primary" onClick={deleteChat}>Yes</button>
                            </menu>
                            </form>
                        </dialog>
                    </div>
                </div>      
            </div>
            <section key={"section_msg"} id="msgContainer" className="nes-container !border-none h-full w-full !overflow-auto">
                <section className="message-list flex justify-end w-full">
                {
                    chat?.conversation?.map((message:any) => {
                        const isRight = message?.FK_sender?.username === user.userData.login;
                        const direction = isRight ? "-right" : "-left";
                        const msg = "message items-end " + direction;
                        const balloon = "nes-balloon from" + direction;
                        const isKicked = !chat?.chatMembers?.find((member:any)=>member.FK_user.username === message?.FK_sender?.username);
                        const Kicked= isKicked ? " grayscale": " hover:scale-105 hover:grayscale-[50%]";
                        console.log("Blocked__: ", Blocked);
                        console.log("Blocked: ", Blocked.find((elem:any)=>elem.Blocker_Username === message?.FK_sender?.username && elem.Blocked_Username === user.userData.login 
                        || elem.Blocker_Username === user.userData.login && elem.Blocked_Username === message?.FK_sender?.username) 
                        );

                        return (
                            <div key={message.message_id+"_div"} className={msg + " relative max-w-[500px] "}>
                                <Menu key={message.message_id} >
                                        <section key={message.message_id} className="flex flex-row items items-end">
                                            
                                            { isRight ? <></> :
                                            <Menu.Button key={message.message_id} className={"transition ease-in-out delay-50 !outline-none " + Kicked} disabled={isKicked}>
                                                <img className='nes-avatar is-large object-cover  rounded-xl !min-h-[64px] !min-w-[64px]' 
                                                src={
                                                    (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+message.FK_sender.username + '?' + new Date().getTime()} />
                                            </Menu.Button>
                                                }
                                            <div className={balloon+" break-all "}>
                                                {
                                                    Blocked.find((elem:any)=>elem.Blocker_Username === message?.FK_sender?.username && elem.Blocked_Username === user.userData.login 
                                                    || elem.Blocker_Username === user.userData.login && elem.Blocked_Username === message?.FK_sender?.username)?
                                                        <p>{message.FK_sender.username} : <span className="text-red-500">Blocked</span></p>
                                                        :
                                                        <p>{message.message}</p>
                                                }
                                            </div>
                                            {user && user.userData && isRight ? <img className='nes-avatar is-large object-cover rounded-xl' 
                                            src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+user.userData.login + '?' + new Date().getTime()} /> : <></>}
                                        </section>
                                    <Menu.Items className="z-50 nes-container !absolute left-10 top-14 is-rounded bg-gradient-to-bl from-slate-800 to-slate-500 min-w-[200px] flex flex-col flex-nowrap">
                                        <Menu.Item>
                                            <Button href={"/profile/" + message?.FK_sender?.username} className="nes-btn is-primary is-rounded rounded-md text-sm !px-2" onClick={()=> {
                                                // (document.getElementById('delete_conf') as HTMLDialogElement).showModal();
                                            }}>Profile</Button>
                                        </Menu.Item>
                                        {
                                            (chat?.chatAdmins?.filter((member:any)=>{
                                                const usr = member["FK_user"];
                                                return usr.username == user.userData.login
                                                })?.length >0 
                                                &&
                                            chat?.chatAdmins?.filter((admin:any)=>{
                                                const usr = admin["FK_user"];
                                                return usr.username == message.FK_sender.username
                                                })?.length == 0 )
                                            || chat?.owner_username == user.userData.login
                                            ?
                                            <>
                                                <Menu.Item>
                                                    {
                                                        MutedUsers.find((elem:any)=>elem.Muted_user === message?.FK_sender?.username) ?
                                                            <button className="nes-btn is-warning is-rounded rounded-md text-sm !mt-3" onClick={(e:any)=> {
                                                                UnMute(message?.FK_sender?.username);
                                                            }}>
                                                            UnMute
                                                            </button>
                                                                :
                                                            <button className="nes-btn is-warning is-rounded rounded-md text-sm !mt-3" onClick={(e:any)=> {
                                                                Mute(message?.FK_sender?.username);
                                                            }}>
                                                                Mute
                                                            </button>
                                                    }
                                                </Menu.Item>
                                                <Menu.Item>
                                                    <button className="nes-btn is-error is-rounded rounded-md text-sm !mt-3" onClick={(e:any)=> {
                                                        (document.getElementById('Kick') as HTMLDialogElement).showModal();
                                                        const member = chat.chatMembers.find((elem:any)=>elem.FK_user.username === message?.FK_sender?.username);
                                                        console.log("message : ", chat.chatMembers);
                                                        if (member)
                                                            setTokick(member.chatMember_id);
                                                        else
                                                            toast.warning("User not found in chat members");
                                                    }}>
                                                        Kick
                                                    </button>
                                                </Menu.Item>
                                                <Menu.Item>
                                                    <button className="nes-btn is-error is-rounded rounded-md text-sm !mt-3" onClick={(e:any)=> {
                                                        (document.getElementById('Ban') as HTMLDialogElement).showModal();
                                                        setToBan(message.FK_sender.username);
                                                    }}>
                                                        Ban
                                                    </button>
                                                </Menu.Item>
                                            </> :
                                            <></>

                                        }
                                    </Menu.Items>
                                </Menu>

                            </div>
                        )
                    })
                }
                </section>
            </section>
            {/* Kick User Confirmation */}
            <dialog className="nes-dialog is-dark is-rounded with-title is-centered" id="Ban">
                    <form method="dialog">
                        <p className="title"><u>Ban user ?</u></p>
                        <menu className="dialog-menu">
                            <button className="nes-btn">No</button>
                            <button className="nes-btn is-primary" onClick={()=>{Ban(ToBan)}}>Yes</button>
                        </menu>
                    </form>
                </dialog>
                {/* Kick User Confirmation */}
                <dialog className="nes-dialog is-dark is-rounded with-title is-centered" id="Kick">
                    <form method="dialog">
                        <p className="title"><u>Kick user ?</u></p>
                        <menu className="dialog-menu">
                            <button className="nes-btn">No</button>
                            <button className="nes-btn is-primary" onClick={KickUser}>Yes</button>
                        </menu>
                    </form>
                </dialog>
                {
                    MutedUsers.find((elem:any)=>elem.Muted_user === user.userData.login) ?
                    <div className="nes-field is-inline !flex !flex-row !flex-nowrap">
                        <input type="text" id="msg" className="nes-input is-dark" placeholder="You are muted in this chat" disabled />
                    </div>:
                    <form>
                        <div className="nes-field is-inline !flex !flex-row !flex-nowrap">
                            <input type="text" id="msg" className="nes-input is-dark" placeholder="Message ..." autoComplete="off" />

                            <button type="submit" className="nes-btn is-dark " id="sendBtn" onClick={SendMessage}><MdSend className="text-3xl" /></button>
                        </div>
                    </form>

                }
            <PassOwnership OwnerModuleOpen={OwnerModuleOpen} setOwnerModuleOpen={setOwnerModuleOpen} />
        
        </div>
        
        
    );
};

export default ChatRoom;