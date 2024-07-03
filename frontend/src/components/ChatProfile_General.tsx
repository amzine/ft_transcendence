import moment from "moment";
import React, { useEffect, useState } from "react";
import { BsPencil, BsPlus, BsPlusCircle, BsSearch } from "react-icons/bs";
import { FaPen, FaPenAlt, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import Button from "./Button";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../state/store";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


const ChatProfile_General = (props : any) => {

    const [name, setName] = useState<string>(props.data?.chatName || "");
    const [bio, setBio] = useState<string>(props.data?.chatBio || "");
    const [state, setState] = useState<string>(props.data?.GroupState || "PUBLIC");
    const [file, setFile] = useState<HTMLInputElement>();
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [password, setPassword] = useState<string>("");
    const [password_conf, setPassword_conf] = useState<string>("");
    const {user, socket, Friends} = useSelector((state:RootState) => {
        return {
            user: state.user.user,
            socket: state.socket.socket,
            Friends: state.users.friends
        }
    });
    const [friends, setFriends] = useState<any>(Friends);
    const [filterFriends, setFilterFriends] = useState<any>();
    const [filter, setFilter] = useState<string>("");
    useEffect(()=>{
        setFriends(Friends.filter((Friend:any)=>{
            return !props.data?.chatMembers?.find((elem:any)=>elem.FK_user.username === Friend.user.username);
        } ))
        return () => {}

    }, [Friends, props.data?.chatMembers])
    useEffect(()=>{
        // console.log("friends : ", friends)
        if (friends){
            if (filter.length === 0)
                setFilterFriends(friends);
            else
                setFilterFriends(friends.filter((elem:any)=>elem.user.username.toLowerCase().includes(filter.toLowerCase())));
        }
        return () => {}
    }, [friends, filter, props.data?.chatMembers])
    // console.log("data : ", props.data)
    const isAdmin = props.data?.chatAdmins?.find((elem:any)=>elem.FK_user.username === user?.userData?.login);
    const isOwner = props.data?.FK_chatOwner?.username === user?.userData?.login;
    
    const reset = () => {
        const image = document.getElementById('image') as HTMLImageElement;
        image.src = (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + "/chat/image/"+props.data?.chat_id;
        setName(props.data?.chatName);
        setBio(props.data?.chatBio);
        const fileInput = document.getElementById('file') as HTMLInputElement;
        fileInput.value = "";
    }
    const checkname = async () => {
        await axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/Available/"+name, {
            headers : {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((res:any) => {
            setIsAvailable(res.data)
        }).catch((err:any) => {
            toast.error(`Error in Checking Chat Name : ${err.message}`)
        })
    }
    // update the name , bio and image
    const save = async (e:any) => {
        
        e.preventDefault();
        const form = new FormData();
        if (!user || !user.userData) {
            toast.error("error, try again.");
            return;
        }
        if (!isAvailable){
            toast.error("Chat Name is not available");
            return;
        }
        form.append("user", user?.userData?.login);
        form.append("name", name);
        form.append("bio", bio);
        if (file)
            form.append("file", file as any);
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + "/chat/update/"+props.data?.chatName,form,{
            headers : {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((res:any) => {
            setName(res.data.chatName);
            setBio(res.data.chatBio);
            props.setData(res.data);
            // const history = useHistory();
            // history.push("/chat/"+res.data.chatName, {shallow: true});
            socket.emit("Chat/Update", {chatName:res.data.chatName, chat_id: res.data.chat_id, chatBio: res.data.chatBio, chatImage: res.data.chatImage});
            
        }).catch((err:any) => {
            toast.error(`Error in Updating Chat : ${err.message}`)
        })
    }
    const changePassword = async (e:any) =>{
        e.preventDefault();
        const form = new FormData();
        if (!user || !user.userData) {
            toast.error("error, try again.");
            return;
        }
        if (state === "PROTECTED" && (password.trim().length === 0 || password_conf.trim().length === 0)){
            toast.error("Password and Confirm Password are required");
            return;
        }
        if (state==="PROTECTED" && password !== password_conf){
            toast.error("Password and Confirm Password are not same");
            return;
        }
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + "/chat/changePassword/"+props.data?.chatName,
        {
            user: user?.userData.login,
            password: password,
            password_conf: password_conf,
            state: state
        },{
            headers : {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((res:any) => {
            socket.emit("Chat/Update", {chat_id: res.data.chat_id, GroupState: res.data.GroupState});
            setPassword("");
            setPassword_conf("");
        }).catch((err:any) => {
            toast.error(`Error in Changing Password : ${err.message}`);
        })
    }

    const addToGroup = (user_id:number)=>{
        if (!user){
            toast.error("You are not logged in");
            return;
        }
        if (!isAdmin){
            toast.error("You are not an admin");
            return;
        }
        // just send a socket and handle the rest in the chat.gateway.ts
        // console.log("data : ", {chat_id: props.data?.chat_id, ToAdd: user_id, user: user.userData.login});
        socket.emit("AddToGroup", {chat_id: props.data?.chat_id, ToAdd: user_id, user: user.userData.login});
    }

    useEffect(()=>{
        if (name === props.data.chatName)
            setIsAvailable(true);
        else
            if (name.trim().length > 0)
                checkname();
            else
                setIsAvailable(false);
        return () => {}
    }, [name])
    
    return (
        <div className="flex flex-col overflow-auto !text-sm">
            
            <form className="flex flex-col shadow-2xl">
                <div className="flex flex-row flex-wrap p-5">
                    {/* image */}
                    <div className="relative">
                        <img src={
                            (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") 
                            + "/chat/image/"+props.data?.chat_id}
                         alt="avatar" className="!h-[200px] max-w-auto rounded-md w-[200px] object-cover object-center " id="image" />
                        <label htmlFor="file" className="absolute bottom-[-10px] right-0 ">
                            {
                                isAdmin? 
                                <FaPenAlt className=" text-black bg-white bg-opacity-35 rounded-full  p-1 cursor-pointer h-7 w-auto" />
                                :<></>
                            }
                        </label>
                        <input type="file" name="file" id="file" className="hidden" accept="image/*"
                         onChange={(e:any)=>{
                            const image = document.getElementById('image') as HTMLImageElement;
                            image.src = URL.createObjectURL(e.target.files[0]);
                            setFile(e.target.files[0]);
                        }} />
                    </div>
                    {/* name and bio section */}
                    <div className="flex flex-col">
                        {/* name */}
                        <div className="flex flex-row text-md items-center m-3">
                            {
                                isAdmin?
                                <input type="text" name="name" id="name" 
                                className={(!isAvailable? " nes-input is-error":"" ) + " bg-black bg-opacity-40 h-16 rounded-md max-md:max-w-[240px]"} autoComplete="off" placeholder="Name"
                                value={name} onChange={(e:any)=>setName(e.target.value)}  />
                                :
                                <span className="text-lg ">ChatName : <span className="shadow-2xl">{name}</span></span>
                            }
                        </div>
                        {/* bio */}
                        <div className="flex flex-row text-md items-center m-3">
                            {
                                isAdmin?
                                <textarea name="bio" id="bio" className={"bg-black bg-opacity-40 h-16 rounded-md resize-none max-md:max-w-[240px]"} placeholder="Bio"
                                 rows={30} cols={20} autoComplete="off" value={bio} onChange={(e:any)=>{setBio(e.target.value)}}/>
                                :
                                <span className="text-lg">Bio : <span className="shadow-2xl">{bio}</span></span>
                            }
                        </div>
                    </div>
                </div>
                {/* Creation Date */}
                <div className="flex flex-row justify-between flex-wrap">
                    <div className="flex flex-row p-5 text-sm text-gray-400">
                        <span className="mx-6">Creation date: </span>
                        <span className="text-sm">{
                            //  new Date(props.data?.createdAt).get
                            // Date.parse(props.data?.createdAt) // 
                            moment(props.data?.createdAt).format(" MMMM Do YYYY, h:mma") // using moment
                        }</span>
                    </div>
                    {
                        isAdmin?
                        <div className="flex flex-row justify-end items-end w-full">
                            <button type="button" className="nes-btn is-warning is-rounded rounded-md" onClick={reset} >Reset</button>
                            <button type="submit" className="nes-btn is-primary is-rounded rounded-md" onClick={save} >Save</button>
                        </div>
                        :
                        <></>
                    }
                </div>
            </form>
            {/* GroupState Section */}
            <form className="w-full border-t-1 shadow-2xl">
                <p className="items items-center text-[20px] text-gray-400 pt-10 ">GroupState</p>
                {/* states */}
                <div className="flex flex-col items-start !text-black">
                    <label className="m-6">
                        <input type="radio" className="nes-radio is-dark" onChange={(e:any)=>{return e.target.checked && isOwner? setState("PUBLIC"):0}} name="state" checked={state==="PUBLIC"} />
                        <span>Public</span>
                    </label>

                    <label className="m-6">
                        <input type="radio" className="nes-radio is-dark" onChange={(e:any)=>{return e.target.checked && isOwner? setState("PRIVATE"):0}} name="state" checked={state==="PRIVATE"} />
                        <span>Private</span>
                    </label>

                    <label className="m-6">
                        <input type="radio" className="nes-radio is-dark" onChange={(e:any)=>{return e.target.checked && isOwner? setState("PROTECTED"):0}} name="state" checked={state==="PROTECTED"} />
                        <span>Protected</span>
                    </label>
                </div>
                {/* password section */}
                {
                    isOwner && state==="PROTECTED"?
                        <div className="flex flex-col items-start ml-14 max-md:ml-4">
                                <div className="flex flex-row items items-center">
                                    <input type={showPassword? "text":"password"} name="password" id="password" placeholder="Password" value={password} onChange={(e:any)=>setPassword(e.target.value)}
                                    className="bg-black bg-opacity-40 h-30 p-3 m-3 rounded-md max-md:max-w-[200px]" autoComplete="off" />
                                    {showPassword ?
                                        <FaRegEyeSlash className="text-3xl p-0 m-0 text-blackbg-white outline-none" onClick={() => {setShowPassword(false)}} />
                                        : 
                                        <FaRegEye className="text-3xl p-0 m-0 text-blackbg-white outline-none" onClick={() => {setShowPassword(true)}} />
                                    }
                                </div>
                                <div className="flex flex-row items items-center">

                                    <input type={showConfirmPassword?"text":"password"} name="password_conf" id="password_conf" placeholder="Confirm Password" value={password_conf} onChange={(e:any)=>setPassword_conf(e.target.value)}
                                    className="bg-black bg-opacity-40 h-30 p-3 m-3 rounded-md max-md:max-w-[200px]" autoComplete="off" />
                                    {showConfirmPassword ?
                                    <FaRegEyeSlash className="text-3xl p-0 m-0 text-blackbg-white outline-none" onClick={() => {setShowConfirmPassword(false)}} />
                                    : 
                                    <FaRegEye className="text-3xl p-0 m-0 text-blackbg-white outline-none" onClick={() => {setShowConfirmPassword(true)}} />}
                                </div>
                        </div>
                    :<></>
                }
                {
                    isAdmin?
                        <div className="flex w-full justify-end">
                            <button type="submit" name="Save" className="nes-btn is-primary is-rounded rounded-md" onClick={changePassword} >save</button>
                        </div>
                    :<></>
                }
            </form>

            {/* Add Friends to group if i'm an admin */}
            {
                isAdmin?
                    <section className="w-full border-t-1">
                        <p className="items items-center text-[20px] text-gray-400 pt-10 ">Add Friends To Group</p>
                        <div className="flex flex-row items-center justify-center p-5 items w-full">
                            <input type="text" name="search" id="search" placeholder="Search" onChange={(e:any)=>{setFilter(e.target.value)}} value={filter} 
                            className="nes-input is-rounded bg-black bg-opacity-40 h-12 rounded-md max-w-full" autoComplete="off" />
                        </div>
                        <div className="flex flex-col items-center">
                            {
                                filterFriends?.map((friend:any)=>{
                                    console.log("friend : ", friend)
                                    return <div key={friend.user.username} 
                                        className="flex flex-row justify-between nes-container bg-gradient-to-br from-slate-300 to-transparent
                                                    rounded-md  w-4/6 min-w-[500px] text-black is-rounded items-center m-2 p-1">
                                            <div className="flex flex-row text-lg items-center h-[70px]">
                                                <img src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile-image/"+friend.user.username} alt="avatar" className="is-large object-cover nes-avatar rounded" />
                                                <div className="px-4 flex flex-col justify-between">{friend.user.username}</div>
                                            </div>
                                            <button className="nes-btn is-success" title="Add" onClick={()=>{
                                                addToGroup(friend.user.user_id)
                                                }}><BsPlus className="text-2xl scale-150 font-bold"/></button>
                                        </div>
                                })
                            }
                        </div>
                    </section>:
                    <></>
            }
        </div>
    )
}


export default ChatProfile_General;