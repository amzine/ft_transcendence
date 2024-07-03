import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../state/store";
import { BsThreeDotsVertical } from "react-icons/bs";
import { Menu } from "@headlessui/react";
import Button from "./Button";
import axios from "axios";
import { toast } from "react-toastify";


const ChatProfile_Members = (props:any) => {
    const {connectedUsers, user, socket} = useSelector((state:RootState)=>{
        return {
            connectedUsers: state.connectedUsers.connectedUsers,
            user: state.user.user,
            socket: state.socket.socket
        }
    })
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [BannedUsers, setBannedUsers] = useState<any[]>([]);
    const [MutedUsers, setMutedUsers] = useState<any[]>([]);
    const conversations = useSelector((state:RootState)=>state.conversations.conversations);
    useEffect(()=>{
        // console.log("connectedUsers : ", connectedUsers)
        if (props.data.chatAdmins.find((admin:any)=>admin.FK_user.username === user?.userData?.login)) {
            setIsAdmin(true);
        }else
            setIsAdmin(false);
        return () => {}
    }, [connectedUsers, conversations])
    // console.log("chatAdmins : ", props.data.chatAdmins)
    const promoteMember = async (username:string) => {

        if (props.data.chatAdmins.find((admin:any)=>admin.FK_user.username === user?.userData?.login)) {
            socket.emit("promoteMember", {chat_id:props.data.chat_id, toPromote:username, user:user.userData.login});
        }else
            toast.error("Operations denied : You are not an Admin");
    }

    const demoteAdmin = async (admin_id:number) => {
        if (admin_id === props.data.FK_chatOwner.user_id) {
            toast.error("You can't demote the owner of the chat");
        }else
            socket.emit("demoteAdmin", {chat_id:props.data.chat_id, toDemote:admin_id, user:user.userData.login});
    }
    const giveOwnership = async (admin_id:number) => {
        if (props.data?.chatAdmins.find((admin:any)=>admin.chatAdmin_id === admin_id)) {
            socket.emit("giveOwnership", {chat_id:props.data.chat_id, newOwner:admin_id, user:user?.userData?.login});
        }else
            toast.error("You can't give ownership to a member who is not an admin");
    }
    const Ban = async (toBlock:string) => {
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/Ban/" + toBlock+"/"+props.data.chat_id,
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
            setBannedUsers([...BannedUsers, data]);
            socket?.emit("banUser", data);
        }).catch((err:any)=>{
            console.log("err : ", err);
            toast.error("Error : " + err);
        })
    }
    const unBan = async (toUnblock:string) => {
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/UnBan/" + toUnblock+"/"+props.data.chat_id,
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
            setBannedUsers(BannedUsers.filter((user:any)=>user.Banned_user !== toUnblock));
            socket?.emit("unBanUser", data);
        }).catch((err:any)=>{
            console.log("err : ", err);
            toast.error("Error : " + err);
        })
    }

    const KickUser = async (chat_id:number, ToKick:number, ) => {
        if (!chat_id || !ToKick) {
            toast.error("unknown error try again");
            return ;
        }
        const data = {
            user: user.userData.login,
            member_id: ToKick,
            chat_id: chat_id,

        }
        socket?.emit("kickUser", data);
    }

    const GetBannedUsers = async () =>{
        await axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/BannedUsers/"+props.data.chat_id,{
            headers : {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((res:any)=>res.data)
        .then((data:any)=>{
            if (data?.status == 500) {
                toast.error("Internal Server Error");
                return;
            }
            setBannedUsers(data);
            console.log("Banned Users : ", data);
        }).catch((err:any)=>{
            toast.error("Can't Fetch Banned Users");
            console.log("err : ", err);
        })
    }

    const getMutedUsers = async () => {
        await axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/muted/"+props.data.chat_id,
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
    // The Mute and the Unmute functions need to send a socket to the server let the other users know that the user is muted or unmuted
    const Mute= async (toMute:string) => {
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/Mute/" + toMute+"/"+props.data.chat_id,
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
    const UnMute= async (toMute:string) => {
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/UnMute/" + toMute+"/"+props.data.chat_id,
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
        if (user?.userData?.login === props.data.FK_chatOwner.username && BannedUsers.length === 0)
            GetBannedUsers()
        getMutedUsers()
        return () => {}
    }, [])
    return (
        <div className="!text-[16px] w-full h-full flex flex-col ">
            <span className="text-gray-500 mb-[6px]">{props.data.chatMembers.length} Member(s)</span>
            {/* owner */}
            <div className="flex flex-col border-t-2 items items-center p-1">
                {/* the Owner */}
                <span className="title text-gray-500">Owner</span>
                 {/*  */}
                    <div
                        className='nes-container !relative !shadow-inner  overflow-x-hidden
                        !my-[6px] is-rounded is-black flex flex-row !w-4/6 min-w-[250px] items-center  !bg-slate-500 !bg-opacity-45 justify-between h-[80px]'>
                        <div className='flex flex-row items-center h-full p-2 w-full'>
                            <img src={
                                (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+props.data.FK_chatOwner.username+ '?' + new Date().getTime()
                            } alt="avatar" className="nes-avatar is-large object-cover rounded-xl !min-h-[70px] !min-w-[70px] mr-4" />
                            <p className='text-md max-md:!text-sm !max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis '>
                                {props.data.FK_chatOwner.username} {props.data.FK_chatOwner.username === user?.userData?.login ? "(You)" : ""}
                                </p>
                            {/* <span className='flex flex-col flex-nowrap border-l-2 border-gray-600 absolute right-0 p-1'>
                                <p className='text-xs text-gray-600 border-b-2 border-gray-600 mb-0 pb-1'></p>
                            </span> */}
                        </div>
                    </div>
            </div>
                {/* Acive Users */}
                <div className="flex flex-col border-t-2">
                    <span className="title text-gray-500">Active Users</span>
                    <div className="nes-container is-rounded overflow-x-hidden bg-gray-400 bg-opacity-40 flex flex-col items items-center  !max-h-[250px] min-h-[150px] overflow-auto no-scroll !shadow-inner">
                        {
                            props.data.chatMembers.map((member:any)=>{
                                if (connectedUsers.find((user:any)=>user === member.FK_user?.username)) {
                                    return (
                                        <div
                                            key={member.FK_user.username}
                                        className='nes-container !relative !my-[6px] is-rounded is-black flex flex-row !w-4/6 min-w-[250px] items-center  !bg-slate-500 !bg-opacity-45 justify-between h-[80px]'>
                                            <div className='flex flex-row items-center h-full p-2 w-full'>
                                                <div className="relative">
                                                    <img src={
                                                        (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+member.FK_user.username+ '?' + new Date().getTime()
                                                    } alt="avatar" className="nes-avatar is-large object-cover rounded-xl !min-h-[70px] !min-w-[70px] mr-4" />
                                                    <div className="absolute right-2 bottom-[-5px] bg-green-400 w-[17px] h-[17px] rounded-full"/>
                                                </div>
                                                <p className='text-md max-md:!text-sm !max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis '>
                                                    {member?.FK_user.username}  {member.FK_user.username === user?.userData?.login ? "(You)" : ""}
                                                </p>
                                                {/* three dots */}
                                                    {
                                                        props.data.FK_chatOwner.username === member.FK_user.username ? 
                                                        <></> :
                                                        props.data.chatAdmins.find((admin:any)=>admin.FK_user.username === member.FK_user.username) ?
                                                            <Menu>
                                                                <Menu.Button>
                                                                    <BsThreeDotsVertical id="dropdownDefaultButton" className="text-3xl absolute right-0 top-[20px]" />
                                                                </Menu.Button>
                                                                <Menu.Items className="nes-container is-rounded rounded-lg bg-gray-400 bg-opacity-60 
                                                                    !absolute min-h-full p-4 flex flex-col text-sm right-0 top-8 !z-50">
                                                                    <Menu.Item>
                                                                        <button className="nes-btn is-primary is-rounded rounded-md"
                                                                            onClick={()=>{giveOwnership(props.data.chatAdmins.find((admin:any)=>admin.FK_user.username === member.FK_user.username)?.chatAdmin_id)}}>Give Ownership</button>
                                                                    </Menu.Item>
                                                                    <Menu.Item>
                                                                        <button className="nes-btn is-error is-rounded rounded-md !mb-2"
                                                                        onClick={()=>{demoteAdmin(props.data.chatAdmins.find((admin:any)=>admin.FK_user.username === member.FK_user.username)?.chatAdmin_id)}}>demote</button>
                                                                    </Menu.Item>
                                                                    {
                                                                        props.data.FK_chatOwner.username === user?.userData?.login ?
                                                                        <>
                                                                            <Menu.Item>
                                                                                {
                                                                                    MutedUsers.find((user:any)=>user.Muted_user === member.FK_user.username) ?
                                                                                    <button className="nes-btn is-warning is-rounded rounded-md line-through decoration-2"
                                                                                    onClick={()=>{UnMute(member.FK_user.username)}}>Unmute</button>
                                                                                    :
                                                                                    <button className="nes-btn is-warning is-rounded rounded-md"
                                                                                    onClick={()=>{Mute(member.FK_user.username)}}>Mute</button>
            
                                                                                }
                                                                            </Menu.Item>
                                                                            <Menu.Item>
                                                                                <button className="nes-btn is-error is-rounded rounded-md"
                                                                                onClick={()=>{
                                                                                    KickUser(props.data.chat_id, member.chatMember_id)
                                                                                }}>Kick</button>
                                                                            </Menu.Item>
                                                                            <Menu.Item>
                                                                                <button className="nes-btn is-error is-rounded rounded-md"
                                                                                onClick={()=>{Ban(member.FK_user.username)}}>Ban</button>
                                                                            </Menu.Item>
                                                                        </>
                                                                        :<></>
                                                                    }
                                                                </Menu.Items>
                                                            </Menu>
                                                            :
                                                            <Menu>
                                                                <Menu.Button>
                                                                    <BsThreeDotsVertical id="dropdownDefaultButton" className="text-3xl absolute right-0 top-[20px]" />
                                                                </Menu.Button>
                                                                <Menu.Items className="nes-container is-rounded rounded-lg bg-gray-400 bg-opacity-60 
                                                                    !absolute min-h-full p-4 flex flex-col text-sm right-0 top-8 !z-50">
                                                                    <Menu.Item>
                                                                        <button className="nes-btn is-primary is-rounded rounded-md !mb-2"
                                                                        onClick={()=>{promoteMember(member?.FK_user?.username)}}>Promote</button>
                                                                    </Menu.Item>
                                                                    {
                                                                        isAdmin 
                                                                        ?
                                                                        <>
                                                                            <Menu.Item>
                                                                                {
                                                                                    MutedUsers.find((user:any)=>user.Muted_user === member.FK_user.username) ?
                                                                                    <button className="nes-btn is-warning is-rounded rounded-md line-through decoration-2"
                                                                                    onClick={()=>{UnMute(member.FK_user.username)}}>Unmute</button>
                                                                                    :
                                                                                    <button className="nes-btn is-warning is-rounded rounded-md"
                                                                                    onClick={()=>{Mute(member.FK_user.username)}}>Mute</button>
            
                                                                                }
                                                                            </Menu.Item>
                                                                            <Menu.Item>
                                                                                <button className="nes-btn is-error is-rounded rounded-md"
                                                                                onClick={()=>{
                                                                                    KickUser(props.data.chat_id, member.chatMember_id)
                                                                                }}>Kick</button>
                                                                            </Menu.Item>
                                                                            <Menu.Item>
                                                                                <button className="nes-btn is-error is-rounded rounded-md"
                                                                                onClick={()=>{Ban(member.FK_user.username)}}>Ban</button>
                                                                            </Menu.Item>
                                                                        </>
                                                                            :
                                                                            <></>
                                                                    }
                                                                </Menu.Items>
                                                            </Menu>

                                                        }

                                            </div>
                                    </div>
                                    )
                                }
                            })
                        }
                    </div>

                </div>

            {/* admins */}
            <div className="flex flex-col border-t-2 w-full p-1">
                <span className="title text-gray-500">Admins</span>
                <div className="nes-container is-rounded overflow-x-hidden bg-gray-400 bg-opacity-40 flex flex-col items items-center  !max-h-[250px] min-h-[150px] overflow-auto no-scroll  !shadow-inner">
                    {
                        props.data.chatAdmins.map((admin:any)=>{
                            return <div 
                                key={admin.chatAdmin_id}
                            className='nes-container !relative !my-[6px] is-rounded is-black flex flex-row !w-4/6 min-w-[250px] items-center  !bg-slate-500 !bg-opacity-45 justify-between h-[80px]'>
                                        <div className='flex flex-row items-center h-full p-2 w-full'>
                                            <img src={
                                                 (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+admin.FK_user.username+ '?' + new Date().getTime()
                                            } alt="avatar" className="nes-avatar is-large object-cover rounded-xl !min-h-[70px] !min-w-[70px] mr-4" />
                                            <p className='text-md max-md:!text-sm !max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis '>
                                                {admin.FK_user.username}  {admin.FK_user.username === user?.userData?.login ? "(You)" : ""}
                                            </p>
                                            {
                                                props.data.FK_chatOwner.username === admin.FK_user.username ? 
                                                <></> :
                                                <Menu>
                                                    <Menu.Button>
                                                        <BsThreeDotsVertical id="dropdownDefaultButton" className="text-3xl absolute right-0 top-[20px]" />
                                                    </Menu.Button>
                                                    <Menu.Items className="nes-container is-rounded rounded-lg bg-gray-400 bg-opacity-60 
                                                        !absolute min-h-full p-4 flex flex-col text-sm right-0 top-8 !z-50">
                                                        <Menu.Item>
                                                            <button className="nes-btn is-primary is-rounded rounded-md"
                                                                onClick={()=>{giveOwnership(admin?.chatAdmin_id)}}>Give Ownership</button>
                                                        </Menu.Item>
                                                        <Menu.Item>
                                                            <button className="nes-btn is-error is-rounded rounded-md !mb-2"
                                                            onClick={()=>{demoteAdmin(admin?.chatAdmin_id)}}>demote</button>
                                                        </Menu.Item>
                                                        {
                                                            props.data.FK_chatOwner.username === user?.userData?.login ?
                                                            <>
                                                                <Menu.Item>
                                                                    {
                                                                        MutedUsers.find((user:any)=>user.Muted_user === admin.FK_user.username) ?
                                                                        <button className="nes-btn is-warning is-rounded rounded-md line-through decoration-2"
                                                                        onClick={()=>{UnMute(admin.FK_user.username)}}>Unmute</button>
                                                                        :
                                                                        <button className="nes-btn is-warning is-rounded rounded-md"
                                                                        onClick={()=>{Mute(admin.FK_user.username)}}>Mute</button>

                                                                    }
                                                                </Menu.Item>
                                                                <Menu.Item>
                                                                    <button className="nes-btn is-error is-rounded rounded-md"
                                                                    onClick={()=>{
                                                                        KickUser(props.data.chat_id, admin.chatAdmin_id)
                                                                    }}>Kick</button>
                                                                </Menu.Item>
                                                                <Menu.Item>
                                                                    <button className="nes-btn is-error is-rounded rounded-md"
                                                                    onClick={()=>{Ban(admin.FK_user.username)}}>Ban</button>
                                                                </Menu.Item>
                                                            </>
                                                            :<></>
                                                        }
                                                    </Menu.Items>
                                                </Menu>

                                            }
                                        </div>
                                    </div>
                        })
                    }
                </div>
            </div>
            {/* ordinary members */}
            <div className="flex flex-col border-t-2 w-full p-1">
                <span className="title text-gray-500">Ordinary members</span>
                <div className="nes-container is-rounded overflow-x-hidden bg-gray-400 bg-opacity-40 flex flex-col items items-center  !max-h-[250px] min-h-[150px] overflow-auto no-scroll !z-50 !shadow-inner">
                    {
                        props.data.chatMembers.map((member:any)=>{
                            if (props.data.chatAdmins.find((admin:any)=>admin.FK_user.username === member.FK_user.username)) return;
                            return <div
                                key={member.chatMember_id}
                                className='nes-container !relative !my-[6px] is-rounded is-black flex flex-row 
                                    !w-4/6 min-w-[250px] items-center  !bg-slate-500 !bg-opacity-45 justify-between h-[80px]'>
                                        <div className='flex flex-row items-center h-full p-2 w-full'>
                                            <img src={
                                               (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+member.FK_user.username+ '?' + new Date().getTime()
                                            } alt="avatar" className="nes-avatar is-large object-cover rounded-xl !min-h-[70px] !min-w-[70px] mr-4" />
                                            <p className='text-md max-md:!text-sm !max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis '>
                                                {member.FK_user.username} {member.FK_user.username === user?.userData?.login ? "(You)" : ""}
                                            </p>
                                                <Menu>
                                                    <Menu.Button>
                                                        <BsThreeDotsVertical id="dropdownDefaultButton" className="text-3xl absolute right-0 top-[20px]" />
                                                    </Menu.Button>
                                                    <Menu.Items className="nes-container is-rounded rounded-lg bg-gray-400 bg-opacity-60 
                                                        !absolute min-h-full p-4 flex flex-col text-sm right-0 top-8 !z-50">
                                                        <Menu.Item>
                                                            <button className="nes-btn is-primary is-rounded rounded-md !mb-2"
                                                            onClick={()=>{promoteMember(member?.FK_user?.username)}}>Promote</button>
                                                        </Menu.Item>
                                                        {
                                                            isAdmin 
                                                            ?
                                                            <>
                                                                <Menu.Item>
                                                                    {
                                                                        MutedUsers.find((user:any)=>user.Muted_user === member.FK_user.username) ?
                                                                        <button className="nes-btn is-warning is-rounded rounded-md line-through decoration-2"
                                                                        onClick={()=>{UnMute(member.FK_user.username)}}>Unmute</button>
                                                                        :
                                                                        <button className="nes-btn is-warning is-rounded rounded-md"
                                                                        onClick={()=>{Mute(member.FK_user.username)}}>Mute</button>

                                                                    }
                                                                </Menu.Item>
                                                                <Menu.Item>
                                                                    <button className="nes-btn is-error is-rounded rounded-md"
                                                                    onClick={()=>{
                                                                        KickUser(props.data.chat_id, member.chatMember_id)
                                                                    }}>Kick</button>
                                                                </Menu.Item>
                                                                <Menu.Item>
                                                                    <button className="nes-btn is-error is-rounded rounded-md"
                                                                    onClick={()=>{Ban(member.FK_user.username)}}>Ban</button>
                                                                </Menu.Item>
                                                            </>
                                                                 :
                                                                <></>
                                                        }

                                                    </Menu.Items>
                                                </Menu>
                                                    {/* <BsThreeDotsVertical /> */}
                                        </div>
                                    </div>
                        })
                    }
                    
                    </div>
            </div>
            {/* Banned Users */}
            <div className="flex flex-col border-t-2 w-full p-1">
                <span className="title text-gray-500">Banned Users</span>
                <div className="nes-container overflow-x-hidden is-rounded bg-gray-400 bg-opacity-40 flex flex-col items items-center  !max-h-[250px] min-h-[150px] overflow-auto no-scroll !z-50 !shadow-inner">
                    {
                        BannedUsers.map((user:any)=>{
                            return <div 
                                key={user.ban_id}
                                className='nes-container  !relative !z-10 !my-[6px] is-rounded is-black flex flex-row 
                                    !w-4/6 min-w-[250px] items-center  !bg-slate-500 !bg-opacity-45 justify-between h-[80px]'>
                                        <div className='flex flex-row items-center h-full p-2 w-full justify-between'>
                                            <img src={
                                                (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+user.Banned_user+ '?' + new Date().getTime()
                                            } alt="avatar" className="nes-avatar is-large object-cover rounded-xl !min-h-[70px] !min-w-[70px] mr-4" />
                                            <div className="flex flex-col items-start  justify-start w-full">
                                                <p className='text-md max-md:!text-sm !max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis text-start'>
                                                    {user.Banned_user} 
                                                </p>
                                                <p className="text-sm text-gray-300md max-md:!text-sm !max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis ">
                                                    Bannedby : {user.BannedBy_user} {user.BannedBy_user === user?.userData?.login ? "(You)" : ""}
                                                </p>
                                            </div>
                                            <Button 
                                                className="nes-btn is-error is-rounded rounded-md !text-sm "
                                                onClick={()=>{unBan(user.Banned_user)}}
                                                >Unban</Button>
                                        </div>
                                    </div>
                        })
                    }
                    
                    </div>
                </div>
        </div>
    )
}

export default ChatProfile_Members;
