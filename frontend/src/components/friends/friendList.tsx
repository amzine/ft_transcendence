import axios from "axios";
import { useEffect, useState } from "react";
import { FaCheck, FaPlus } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { setAwaiting, setFriends, setUsers } from "../../state/users/usersSlice";
import { Menu } from "@headlessui/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { LuMessageSquarePlus } from "react-icons/lu";
import { MdBlock } from "react-icons/md";
import { setDms } from "../../state/dms/dmsSlice";
import { RootState } from "../../state/store";
import { setDmRoom } from "../../state/dmRoom/dmRoomSlice";
import { setChat } from "../../state/chat/chatSlice";
import { Link, useNavigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";
import { GiGamepadCross } from "react-icons/gi";
import { setPvSocket } from "../../state/socket/socketSlice";

export default function FriendList() {
    const [username, setUsername] = useState("");
    const [check, setCheck] = useState(false);
    const [blocked, setBlocked] = useState([]);
    const user = useSelector((RootState:any) => RootState.user.user);
    const friends = useSelector((RootState:any) => RootState.users.friends);
    const awaiting = useSelector((RootState:any) => RootState.users.awaiting);
    const dms = useSelector((state:RootState) => state.dms.dms);
    const socket = useSelector((state:RootState)=>state.socket.socket) as Socket
    const connectedUsers = useSelector((state:RootState)=>state.connectedUsers.connectedUsers);
    const dispatch = useDispatch();

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
            setBlocked(res.data);
        }).catch((err:any)=>{
            console.log("getBlocked err : ", err.message);
        })
    
    }

    const [error, setError] = useState(false);
    const getFriends = async () => {
        await axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/friends", {
            headers: {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((response) => {
            dispatch(setFriends(response.data?.filter((userData:any) => {
                return !(userData.state === "pending" && userData.user_id === user.userData.login)
            })))
            dispatch(setAwaiting(response.data?.filter((userData:any) => {
                return (userData.state === "pending" && userData.user_id === user.userData.login)
            })))
            setCheck(true);
        }).catch((error) => {
            console.log(error)
            setCheck(false)
            // toast.error("Failed to fetch friends.");
        });
    }
    useEffect(() => {
        if (!check && user) {
            // console.log("user :" , user)
            // console.log("fetching friends")
            getFriends();
            getBlocked();
        }
    }, [user, check]);
    // const handleAdd = (event:any) => {
    //     event.preventDefault();
    //     if (username === "") {
    //         toast.error("Username is required.");
    //         return;
    //     }
    // }
    const acceptFriend = (username:string) => {
        if (!user)
            return;
        console.log("accepting friend", username)
        axios.put((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/friends", {
            login: username
        }, {
            headers: {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((response) => {
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            dispatch(setUsers(response.data.users))
            dispatch(setFriends(response.data.friends?.filter((userData:any) => {
                return !(userData.state === "pending" && userData.user_id === user.userData.login)
            })))
            dispatch(setAwaiting(response.data.friends?.filter((userData:any) => {
                return (userData.state === "pending" && userData.user_id === user.userData.login)
            })))
            toast.success(response.data.message);
        }).catch((error) => {
            toast.error("Failed to accept friend request.");
        })
    }
    const removeFriend = (username:string) => {
        if (!user)
            return;
        console.log("removing friend", username)
        axios.delete((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/friends/"+username, {
            headers: {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((response) => {
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            dispatch(setUsers(response.data.users))
            dispatch(setFriends(response.data.friends?.filter((userData:any) => {
                return !(userData.state === "pending" && userData.user_id === user.userData.login)
            })))
            dispatch(setAwaiting(response.data.friends?.filter((userData:any) => {
                return (userData.state === "pending" && userData.user_id === user.userData.login)
            })))
            toast.success(response.data.message);
            socket?.emit("deleteFriend", response.data)
        }).catch((error) => {
            console.log(error)
            toast.error("Failed to remove friend.");
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
            console.log("blocked : ", response.data)
            if (response.data?.DM)
            socket?.emit("deleteFriend", response.data);
            getBlocked();
        }).catch((error) => {
            toast.error("Failed to block friend.");
        })
    }

    const unblockUser = (username:string) => {
        axios.delete((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/users/blocked/"+username, {
            headers: {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((response) => {
            if (response.data.error) {
                toast.error(response.data.error);
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
            socket?.emit("Unblock", {toUnBlock: response.data.users[0]?.username, Unblocker: user.userData.login,data: response.data});
            toast.success(response.data.message);
            getBlocked();
        }).catch((error) => {
            toast.error(error.message);
        })
    }

    const navigate = useNavigate();
    const CreateDm = async (username:string, friend_id:number) => {
        if (!user) {
            toast.error("An error uncountrered, please try again later.");
            return;
        }
        console.log("creating dm with ", username)
        console.log("friend_id : ", friend_id)
        console.log("friends : ", friends)
        await axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/dm", {
            user: user.userData.login,
            userToDm: username,
        }, {
            headers: {
                Authorization: `Bearer ${user.jwt}`
            }
        }).then((res:any) => {
            console.log("created dm : ", res.data)
            if (res.data?.error) {
                toast.error(res.data.error);
                return;
            }
            if (!dms.find((dm:any) => dm.dm_id === res.data.dm_id)) {
                dispatch(setDms([res.data, ...dms]))
            }
            dispatch(setDmRoom(res.data));
            dispatch(setChat(null));
            socket?.emit("CreateDm", res.data);
            navigate("/chat", {replace: true});
        }).catch((error) => {
            console.log(error)
            toast.error("Failed to create dm.");
        })
    }

    const prevsSocket = useSelector((state:RootState)=>state.socket.pvsocket) as Socket;

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
    return (
        <div className="p-4 overflow-scroll">
            <h1>Your Friends</h1>
            <div className="flex flex-col">
                <div className="flex flex-col max-[1000px]:h-[250px]">
                    {friends?.map((user:any) => 
                        <div key={user.user.username} className="!flex flex-row justify-between nes-container with-title bg-white text-black is-rounded items-center !m-2 !p-1">
                            <div className="!flex flex-row text-lg items-center h-[70px]">
                                <img src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile-image/"+user.user.username} alt="avatar" className={"is-large object-cover nes-avatar rounded "+ (connectedUsers.find((u:any) => u === user.user.username) ? (user.state !== "pending" ? "border-4 border-solid border-green-600" : "") : (user.state !== "pending" ? " border-4 border-solid border-red-600" : ""))} />
                                <div className="px-4 flex flex-col justify-between">
                                    <Link className="text-black hover:text-slate-700 hover:no-underline" to={"/profile/"+user.user.username} >{user.user.username}</Link>
                                    {user.state === "pending" ? <span className="text-xs text-yellow-400 block">PENDING</span> : <></>}
                                </div>
                            </div>
                            <div className="flex flex-row items-center space-x-2 text-lg">
                                <Menu>
                                                                 {/* <button  className=""></button> */}
       <Menu.Button id="dropdownDefaultButton" className={"!outline-none nes-btn text-2xl text-white"}>
                                        <BsThreeDotsVertical/>
                                        {/* <BsThreeDotsVertical id="dropdownDefaultButton" className="text-3xl !outline-none !border-none" /> */}
                                    </Menu.Button>
                                    <Menu.Items className="z-50 nes-container is-rounded rounded-lg 
                                        bg-gray-400 bg-opacity-60 !absolute bg-gray min-h-full p-4 top-14 flex flex-col text-sm right-0">
                                        {
                                            user.state === "pending" ? (
                                                <Menu.Item>
                                                    <button className="nes-btn is-success text-white !flex !flex-row flex-nowrap items-center" title="Accept" onClick={()=>acceptFriend(user.user.username)}>
                                                        <FaCheck className="scale-[120%] font-bold mx-1 text-lg"/> Accept
                                                    </button>
                                                </Menu.Item>
                                            ) :
                                            <>
                                                <Menu.Item>
                                                    <button className="nes-btn is-primary text-white !flex !flex-row flex-nowrap items-center" 
                                                    title="Send Dm" onClick={()=>{CreateDm(user.user.username, user.user.friend_id)}}>
                                                        <LuMessageSquarePlus className="scale-[130%] font-bold mx-1 text-lg" /> Send Dm
                                                    </button>
                                                </Menu.Item>
                                                <Menu.Item>
                                                    <button className="nes-btn is-primary text-white !flex !flex-row flex-nowrap items-center" 
                                                    title="Send Game Invitation" onClick={()=>{SendGameInv(user.user.username)}}>
                                                        <GiGamepadCross className="scale-[130%] font-bold mx-1 text-lg"/> Game Invitation
                                                    </button>
                                                </Menu.Item>
                                                <Menu.Item>
                                                    <button className="nes-btn is-error text-white !flex !flex-row flex-nowrap items-center !mt-2" title="Block" onClick={()=>blockFriend(user.user.username)}>
                                                        <MdBlock className="scale-[120%] font-bold mx-1 text-lg" /> Block
                                                    </button>
                                                </Menu.Item>
                                            </>
                                        }
                                        <Menu.Item>
                                            <button className="nes-btn is-error text-white !flex !flex-row flex-nowrap items-center !mt-2" title="Remove" onClick={()=>removeFriend(user.user.username)}>
                                                <FaX className="scale-[120%] font-bold mx-1 text-lg" /> Remove
                                            </button>
                                        </Menu.Item>
                                    </Menu.Items>
                                </Menu>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                    {awaiting?.map((user:any) => 
                        <div key={user.user.username} className="!flex flex-row justify-between nes-container with-title bg-white text-black is-rounded items-center !m-2 !p-1">
                            <div className="!flex flex-row text-lg items-center h-[70px]">
                                <img src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile-image/"+user.user.username} alt="avatar" className="is-large object-cover nes-avatar rounded" />
                                <div className="px-4 flex flex-col justify-between items-start"><Link className="text-black hover:text-slate-700 hover:no-underline" to={"/profile/"+user.user.username} >{user.user.username}</Link>{user.state === "pending" ? <span className="text-xs text-yellow-400 block">PENDING ACCEPTATION</span> : <></>}</div>
                            </div>
                            <button className="nes-btn is-error text-white text-xl" title="Cancel" onClick={()=>removeFriend(user.user.username)}><FaX/></button>
                        </div>
                    )}
                </div>
                <div className="flex flex-col max-[1000px]:h-[200px]">
                    <div>Blocked Users</div>
                    {
                        blocked?.map((user:any) => 
                            <div key={user.username} className="!flex flex-row justify-between nes-container with-title bg-white text-black is-rounded items-center !m-2 !p-1">
                                <div className="!flex flex-row text-lg items-center h-[70px]">
                                    <img src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile-image/"+user.username} alt="avatar" className="is-large object-cover nes-avatar rounded" />
                                    <div className="px-4 flex flex-col justify-between items-start"><Link className="text-black hover:text-slate-700 hover:no-underline" to={"/profile/"+user.username} >{user.username}</Link></div>
                                </div>
                                <button className="nes-btn is-error text-white !flex !flex-row text-sm flex-nowrap items-center !mt-2" title="Block" onClick={()=>unblockUser(user.username)}>
                                    Unblock
                                </button>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}