import React, { useEffect, useState } from "react";
import { RootState } from "../state/store";
import { useSelector } from "react-redux";
import { Menu } from "@headlessui/react";
import Button from "./Button";
import { Link } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import { toast } from "react-toastify";
import { MdSend } from "react-icons/md";
import axios from "axios";
import { isBlock } from "typescript";
import { BiLeftArrow, BiRightArrow } from "react-icons/bi";
import { GiGamepadCross } from "react-icons/gi";
import { useDispatch } from "react-redux";
import { setIsMenuOpen } from "../state/menu/menuSlice";
import { setPvSocket } from "../state/socket/socketSlice";
import { io } from "socket.io-client";
import { setAwaiting, setFriends, setUsers } from "../state/users/usersSlice";
import { setBlocked } from "../state/Blocked/BlockedSlice";
// import {Slide as BurgerMenu} from 'react-burger-menu';




const DmRoom = (props:any) => {
    const {user, socket, dms, dm, Blocked, isMenuOpen, prevsSocket} = useSelector((state: RootState) => {
        return {
            user:state.user.user,
            socket:state.socket.socket,
            chat:state.chat.chat,
            conversations:state.conversations.conversations,
            dms:state.dms.dms,
            dm: state.dmRoom.dmRoom,
            Blocked: state.Blocked.Blocked,
            isMenuOpen: state.isMenuOpen.isMenuOpen,
            prevsSocket: state.socket.pvsocket,
        }
    });

    // useEffect(()=>{
    //     props.setIsMenuOpen(false);
    // }, [])
    const [message, setMessage] = useState("");
    // console.log("DMRoom : ", dm)

    const dmRoom = dm?.FK_user1.username === user.userData.login ? dm?.FK_user2 : dm?.FK_user1;
    const [isBlocked, setIsBlocked] = useState(false);
    const SendDmMessage = (e:any) => {
        e.preventDefault();
        if (!message) {
            toast.error("Message cannot be empty");
            return null;
        }
        socket?.emit("dm", { sender:user.userData.login ,recepient: dm.dm_id, message: message });
        setMessage("");
        return null;
    }
    useEffect(()=>{
        console.log("DMs modified")
        // console.log("DMs : ", dms)
    }, [dms])
    const [isBlocker, setIsBlocker] = useState(false);
    useEffect(()=>{
        console.log("Blocked modified : ", Blocked)
        if (Blocked.find((elem:any)=>{
            return elem.Blocked_Username === user.userData.login && elem.Blocker_Username === dmRoom.username
        })) {
            setIsBlocked(true);
            setIsBlocker(false);
        }
        else if (Blocked.find((elem:any)=>{
            return elem.Blocked_Username === dmRoom.username && elem.Blocker_Username === user.userData.login
        })){
            setIsBlocked(true);
            setIsBlocker(true);
        }
        else {
            setIsBlocked(false);
            setIsBlocker(false);
        }
    }, [Blocked])
    useEffect(() => {
        setTimeout(()=>{
            const msgContainer = document.getElementById("msgContainer") as HTMLInputElement;
            msgContainer?.scrollTo(0, msgContainer.scrollHeight);
          }, 100)
    }, [dm]);

    const getBlocked = async () => {
        if (!user)
            return;
        await axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/users/blocked",{
            headers:{ Authorization: `Bearer ${user?.jwt}`}
        }).then((res:any)=>{
            if (res.data?.status === 500) {
            toast.error("internal server error");
            return ;
            }
            dispatch(setBlocked(res.data));
        }).catch((err:any)=>{
            console.log("getBlocked err : ", err.message);
        })
    
    }

    const blockFriend = (username:string) => {
        axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/friends/blocked", {
            username:username
        },
        {
            headers: {
                Authorization: `Bearer ${user.jwt}`
            }
        
        }).then((response) => {
            if (response.data.error) {
                toast.error(response.data.message);
                return;
            }
            dispatch(setUsers(response.data.users))
            dispatch(setFriends(response.data.friends?.filter((userData:any) => {
                return !(userData.state === "pending" && userData.user_id === user.userData.login)
            }))
            )
            dispatch(setAwaiting(response.data.friends?.filter((userData:any) => {
                return (userData.state === "pending" && userData.user_id === user.userData.login)
            }))
            )
            toast.success(response.data.message);
            if (response.data?.DM)
            socket?.emit("deleteFriend", response.data);
            getBlocked();
        }).catch((error) => {
            toast.error("Failed to block friend.");
        })
    }
    const unBlock = async ()=>{
        await axios.delete( (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + "/Block/" 
        + dmRoom.username + "/" + Blocked.find((elem:any)=>elem.Blocker_Username === user.userData.login && elem.Blocked_Username === dmRoom.username)?.blocked_id,
            {
                headers : {
                    Authorization: `Bearer ${user.jwt}`
                }
            }
        )
        .then((res:any)=>{
            console.log("Unblocking User res: ", res.data)
            if (res.data?.status === 500) {
                toast.error("Error unblocking user");
                return;
            }
            socket?.emit("Unblock", {toUnBlock: dmRoom.username, Unblocker: user.userData.login, dm_id: dm.dm_id,data: res.data});
        }).catch((err:any)=>{
            toast.error("Error unblocking user");
            console.log("err in unblocking user : ", err.message)
        })
    }
    useEffect(()=>{
        console.log("Blocked : ", Blocked)
    }, [Blocked])
    const SendGameInv=(username:string)=>{
        if (!user) {
            toast.error("An error uncountrered, please try again later.");
            return;
        }
        // if (!connected?.find((user:any)=>user?.username===username)) {
        //     toast.error("User is not connected");
        //     return;
        // }

        const ssocket = io(
            (process.env.REACT_APP_GAME_SERVER ? "ws://"+process.env.REACT_APP_GAME_SERVER : ("ws://localhost:" + process.env.REACT_APP_GAME_PORT || "4000")),
              {
                transportOptions: {
                  polling:{
                      extraHeaders: {
                          token : localStorage.getItem("jwtToken"),
                      },
                },
              },
              auth: {
                  token: localStorage.getItem("jwtToken") || "#########",
              }
          });
        if (ssocket)
            if (prevsSocket)
                prevsSocket?.disconnect();
            dispatch(setPvSocket(ssocket));

            ssocket?.emit('start_private', {}, (data:any, error:any) => {
                if (error) {
                    console.log("error : ", error);
                    return;
                }
                // alert(JSON.stringify(data))
                socket?.emit("gameInvitation", {sender: user.userData.login, recipient: username, gameData: JSON.stringify(data)});
            })

    }
    const dispatch = useDispatch();
    if (!dm) return (<></>);
    return (
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
                    (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+dmRoom.username + '?' + new Date().getTime()
                    } alt="avatar" className="nes-avatar is-large object-cover rounded-xl" />
                <h2 className="m-2 text-xl max-md:!text-sm  !max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis">
                    <Link to={"/profile/"+dmRoom.username} className="text-white hover:text-gray-300 hover:no-underline">
                        {dmRoom.username}
                    </Link>
                </h2>
                {/*  Modify this bullshit  */}
                <div className="">
                    <Menu>  
                        <Menu.Button >
                            <BsThreeDotsVertical id="dropdownDefaultButton" className="text-3xl" />
                        </Menu.Button>
                        <Menu.Items className="z-50 nes-container is-rounded rounded-lg bg-gray-400 bg-opacity-60 !absolute bg-gray min-h-full
                        p-4 top-14 flex flex-col text-sm right-0">
                            <Menu.Item >
                                <Button  href={"/profile/"+dmRoom.username} className="nes-btn is-primary is-rounded rounded-md text-sm !mt-3" onClick={(event:any)=>{
                                    const audio = document.getElementById('clickSound') as HTMLAudioElement;
                                    if (audio) {
                                        audio.volume = 0.4;
                                        audio.play().catch((error) => {});
                                    }
                                }}>View Profile</Button>
                            </Menu.Item>
                            <Menu.Item>
                                <button className="nes-btn is-primary text-white !flex !flex-row flex-nowrap items-center" 
                                title="Send Game Invitation" onClick={()=>{SendGameInv(dmRoom.username)}}>
                                    <GiGamepadCross className="scale-[130%] font-bold mx-1 text-lg"/> Game Invitation
                                </button>
                            </Menu.Item>
                            {
                                isBlocker ?
                                    <Menu.Item>
                                        <button className="nes-btn is-error is-rounded rounded-md test-sm !mt-3" onClick={unBlock}>
                                            Unblock User
                                        </button>
                                    </Menu.Item>
                                :
                                    isBlocked ?
                                    <></>:
                                    <Menu.Item>
                                        <button className="nes-btn is-error is-rounded rounded-md test-sm !mt-3" onClick={(e:any)=> {
                                            (document.getElementById('Block_conf') as HTMLDialogElement).showModal();
                                        }}>
                                            Block User
                                        </button>
                                    </Menu.Item>
                            }
                        </Menu.Items>
                    </Menu>

                    <dialog className="nes-dialog is-dark is-rounded with-title is-centered" id="Block_conf">
                        <form method="dialog">
                        <p className="title"><u>Block "{dmRoom.username}"</u></p>
                        <p>are You sure ?</p>
                        <menu className="dialog-menu">
                            <button className="nes-btn">No</button>
                            <button className="nes-btn is-primary" onClick={()=>{blockFriend(dmRoom.username)}}>Yes</button>
                        </menu>
                        </form>
                    </dialog>
                </div>
            </div> 
            </div>     
            <section key={"section_msg"} id="msgContainer" className="nes-container !border-none h-full w-full !overflow-auto">
                <section className="message-list flex justify-end w-full">
                {
                    dm?.messages?.map((message:any) => {
                        if (!message) return <></>;
                        const isRight = message?.FK_sender?.username === user.userData.login;
                        const direction = isRight ? "-right" : "-left";
                        const msg = "message items-end " + direction;
                        const balloon = "nes-balloon from" + direction;
                        return (
                            <div key={message.message_id+"_div"} className={msg + " relative max-w-[500px] "}>
                                <Menu key={message.message_id} >
                                        <section key={message.message_id} className="flex flex-row items items-end">
                                            
                                            { isRight ? <></> :
                                            <Menu.Button key={message.message_id} className={"transition ease-in-out delay-50 !outline-none "}>
                                                <img className='nes-avatar is-large object-cover  rounded-xl !min-h-[64px] !min-w-[64px]' src={
                                                    (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+message.FK_sender.username + '?' + new Date().getTime()} />
                                            </Menu.Button>
                                                }
                                            <div className={balloon+" break-all "}>
                                                <p>{message.message}</p>
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
                                        <Menu.Item>
                                            <button className="nes-btn is-warning is-rounded rounded-md text-sm !mt-3" onClick={(e:any)=> {
                                                // (document.getElementById('Block_user') as HTMLDialogElement).showModal();
                                            }}>
                                                Mute
                                            </button>
                                        </Menu.Item>
                                    </Menu.Items>
                                </Menu>

                            </div>
                        )
                    })
                }
                </section>
            </section>
            <form>
                <div className="nes-field is-inline !flex !flex-row !flex-nowrap">
                    <input type="text" id="msgDm" className={"nes-input is-dark " + (isBlocked? "is-disabled":"")} value={message} onChange={(e:any)=>{setMessage(e.target.value)}} 
                    disabled={isBlocked} placeholder={!isBlocked?"Message ...":"You Can't Send Message"} autoComplete="off"  />

                   {
                    isBlocked ? <></> :
                    <button type="submit" className="nes-btn is-dark !mx-2 !py-0 !h-full" id="sendDmBtn" onClick={SendDmMessage}><MdSend className="text-3xl" /></button>
                   }
                </div>        
            </form>
        </div>
    )
}

export default DmRoom;