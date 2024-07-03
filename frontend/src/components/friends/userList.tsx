import axios from "axios";
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setAwaiting, setFriends, setUsers } from "../../state/users/usersSlice";
import { Link } from "react-router-dom";

export default function UserList() {
    const users = useSelector((RootState:any) => RootState.users.users);
    const [username, setUsername] = useState("");
    const [check, setCheck] = useState(false);
    const dispatch = useDispatch();
    const user = useSelector((RootState:any) => RootState.user.user);
    useEffect(() => {
        if (!check && user) {
            console.log("fetching users")
            axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/users", {
                headers: {
                    Authorization: `Bearer ${user.jwt}`
                }
            }).then((response) => {
                dispatch(setUsers(response.data))
            }).catch((error) => {
                toast.error("Failed to fetch users.");
            });
            setCheck(true);
        }
    }, [users]);
    const addFriend = (username:string) => {
        if (!user)
            return;
        console.log("adding friend", username)
        axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/friends", {
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
            dispatch(setFriends(response.data.friends.filter((userData:any) => {
                return !(userData.state === "pending" && userData.user_id === user.userData.login)
            })))
            dispatch(setAwaiting(response.data.friends.filter((userData:any) => {
                return (userData.state === "pending" && userData.user_id === user.userData.login)
            })))
            toast.success(response.data.message);
        }).catch((error) => {
            toast.error("Failed to add friend.");
        })
    }
    const handleAdd = (event:any) => {
        event.preventDefault();
        if (username === "") {
            toast.error("Username is required.");
            return;
        }
        addFriend(username);
    }
    return (
        <div className="p-4 max-h-full overflow-scroll">
            <h1>Add Friends</h1>
            <div className="flex flex-col">
                <div className="flex flex-col text-lg">
                    <div className="text-lg">
                        <form onSubmit={handleAdd}><input type="text" onChange={(e)=>setUsername(e.target.value)} placeholder="username" id="username" className="nes-input text-black" /></form>
                    </div>
                    <button className="nes-btn is-success" onClick={handleAdd}>Add</button>
                </div>
                <div className="flex flex-col">
                    {users?.map((user:any) => 
                        <div key={user.username} className="!flex flex-row justify-between nes-container with-title bg-white text-black is-rounded items-center !m-2 !p-1">
                            <div className="!flex flex-row text-lg items-center h-[70px]">
                                <img src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile-image/"+user.username} alt="avatar" className="is-large object-cover nes-avatar rounded" />
                                <div className="px-4"><Link className="text-black hover:text-slate-700 hover:no-underline" to={"/profile/"+user.username} >{user.username}</Link></div>
                            </div>
                            <button className="nes-btn is-success text-lg" onClick={()=> addFriend(user.username)}><FaPlus/></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}