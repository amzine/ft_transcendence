import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { useSelector } from "react-redux";
import { GiPingPongBat } from "react-icons/gi";
import { IoPersonSharp, IoTime } from "react-icons/io5";
import { setAwaiting, setUsers, setFriends as setFr } from "../state/users/usersSlice";
import { useDispatch } from "react-redux";
import { FaCheck, FaPlus } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { setProfile } from "../state/user/profileSlice";



const UserProfile = ()=> {
    const {name} = useParams<{name:string}>();
    const [friends, setFriends] = useState<any>(null);
    const currentUser = useSelector((state:any) => state.user.user);
    const connectedUsers = useSelector((state:any) => state.connectedUsers.connectedUsers);
    const user = useSelector((state:any) => state.profile.user);
    const dispatch = useDispatch();
    const [error, setError] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [check, setCheck] = useState(false);
    const [check2, setCheck2] = useState(false);
    const [games, setGames] = useState([] as any);

    
    useEffect(() => {
        if (!user || user.username !== name || !check)
            axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + `/profile/${name}`, {headers:{ Authorization: `Bearer ${currentUser.jwt}`}})
            .then(response => {
                const data = response.data
                if (!data || data.error)
                {
                    if (data.error && data.error === "User not found")
                    {
                        setError(true);
                        setNotFound(true);
                    }
                }
                else
                    dispatch(setProfile(data.user));
                axios.get((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000") + `/matchHistory/` + user.username, {headers:{ Authorization: `Bearer ${currentUser.jwt}`}})
                .then(response => {
                    const data = response.data
                    if (!data || data.error)
                        console.error(data.error);
                    else
                        setGames(data);
                    setCheck2(true);
                }).catch(err => {
                    console.error(err);
                })
                axios.get((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000") + `/friends/${name}`, {headers:{ Authorization: `Bearer ${currentUser.jwt}`}})
                    .then(response => {
                        const data = response.data
                        if (!data || data.error)
                        {
                            // setError(true);
                            // toast.error(data.error);
                        }
                        else
                            setFriends(data.friends);
                    }).catch(err => {
                        console.log(err);
                        // setError(true);
                        // toast.error("Error fetching user friends");
                    })
                setCheck(true);
            }).catch(err => {
                console.log(err);
                setError(true);
                // toast.error("Error fetching user profile");
            })
        if (!check2 && user)
        {
            if (!check2)
                axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + `/matchHistory/` + user.username, {headers:{ Authorization: `Bearer ${currentUser.jwt}`}})
                .then(response => {
                    const data = response.data
                    if (!data || data.error)
                        console.error(data.error);
                    else
                        setGames(data);
                    setCheck2(true);
                }).catch(err => {
                    console.error(err);
                })
        }
        if (!friends)
            axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + `/friends/${name}`, {headers:{ Authorization: `Bearer ${currentUser.jwt}`}})
                .then(response => {
                    const data = response.data
                    if (!data || data.error)
                    {
                        // setError(true);
                        // toast.error(data.error);
                    }
                    else
                        setFriends(data.friends);
                }).catch(err => {
                    console.log(err);
                    // setError(true);
                    // toast.error("Error fetching user friends");
                })
    }, [user, friends, games]);

    const addFriend = (username:string) => {
        if (!user)
            return;
        console.log("adding friend", username)
        axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/friends", {
            login: username
        }, {
            headers: {
                Authorization: `Bearer ${currentUser.jwt}`
            }
        }).then((response) => {
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            toast.success(response.data.message);
            axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + `/profile/${name}`, {headers:{ Authorization: `Bearer ${currentUser.jwt}`}})
            .then(response => {
                const data = response.data
                if (!data || data.error)
                    toast.error(data.error);
                else
                    dispatch(setProfile(data.user));
            }).catch(err => {
                console.log(err);
                toast.error("Error fetching user profile");
            })
        }).catch((error) => {
            toast.error(error.message);
        })
    }

    const acceptFriend = (username:string) => {
        if (!user)
            return;
        console.log("accepting friend", username)
        axios.put((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/friends", {
            login: username
        }, {
            headers: {
                Authorization: `Bearer ${currentUser.jwt}`
            }
        }).then((response) => {
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            toast.success(response.data.message);
            axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + `/profile/${name}`, {headers:{ Authorization: `Bearer ${currentUser.jwt}`}})
            .then(response => {
                const data = response.data
                if (!data || data.error)
                    toast.error(data.error);
                else
                    dispatch(setProfile(data.user));
            }).catch(err => {
                console.log(err);
                toast.error("Error fetching user profile");
            })
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
                Authorization: `Bearer ${currentUser.jwt}`
            }
        }).then((response) => {
            if (response.data.error) {
                toast.error(response.data.error);
                return;
            }
            toast.success(response.data.message);
            axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + `/profile/${name}`, {headers:{ Authorization: `Bearer ${currentUser.jwt}`}})
            .then(response => {
                const data = response.data
                if (!data || data.error)
                    toast.error(data.error);
                else
                    dispatch(setProfile(data.user));
            }).catch(err => {
                console.log(err);
                toast.error("Error fetching user profile");
            })
        }).catch((error) => {
            console.log(error)
            toast.error("Failed to remove friend.");
        })
    }

    return <>
            {
                user ? 
                <div className='h-full w-full grid grid-cols-profile max-[1000px]:flex max-[1000px]:flex-col max-[1000px]:!items-center max-[1000px]:!text-sm max-[1000px]:!max-w-full overflow-scroll'>
                    <div className="self-center h-fit flex flex-col justify-between items-center p-4">
                        <div className="flex flex-col justify-between items-center w-full">
                            <div className="flex flex-row max-[1000px]:!flex-col max-[1000px]:!items-start max-[1000px]:!max-w-full max-[1000px]:!p-0 justify-between items-center w-full">
                                <div className="flex flex-row justify-between items-center w-full px-2">
                                    <div className="flex flex-row items-center w-full m-4">
                                        <img id="userImage" src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+user.username + '?' + new Date().getTime()} className="w-[100px] h-[100px] object-cover rounded-xl max-[1000px]:!w-[75px] max-[1000px]:!h-[75px]" alt="avatar" />
                                        <h2 className="mx-4 text-xl break-all">{user.username}</h2>
                                    </div>
                                </div>
                                {
                                    user.blocked ?
                                    <></>
                                    :
                                    user.state ?
                                        user.state === "pending" ?
                                            <button className="nes-btn is-warning text-2xl max-[1000px]:!text-lg max-[1000px]:!w-full flex flex-col justify-center items-center" title="pending" onClick={()=> removeFriend(user.username)}><IoTime/></button>
                                        :
                                            user.state === "accepted" ?
                                                <button className="nes-btn is-error text-2xl max-[1000px]:!text-lg max-[1000px]:!w-full flex flex-col justify-center items-center" title="remove" onClick={()=> removeFriend(user.username)}><FaX/></button>
                                            :
                                                <button className="nes-btn is-success text-2xl max-[1000px]:!text-lg max-[1000px]:!w-full flex flex-col justify-center items-center" title="Accept" onClick={()=> acceptFriend(user.username)}><FaCheck/></button>
                                    :
                                        user.username !== currentUser.userData?.login ?
                                        <button className="nes-btn is-success text-2xl max-[1000px]:!text-lg max-[1000px]:!w-full flex flex-col justify-center items-center" title="add" onClick={()=> addFriend(user.username)}><FaPlus/></button>
                                        :
                                        <></>
                                }
                            </div>
                            {
                                user.blocked ?
                                    <div className="nes-container is-dark with-title w-full text-lg">
                                        <p className="text-red-600 rounded-sm">Blocked</p>
                                    </div>
                                :
                                    <div className="nes-container is-dark with-title text-lg">
                                        <p className="title rounded-sm">Profile Data</p>
                                        <div className=" text-left">
                                            {
                                                user.first_name || user.last_name ? 
                                                <p className="text-white">Name: {(user.first_name || "") + ' ' + (user.last_name || "")}</p>
                                                :<></>
                                            }
                                            <p className="text-white">Bio: <span>{user.bio}</span></p>
                                        </div>
                                    </div>
                            }
                        </div>
                    </div>
                    <div className="w-full h-full flex flex-col max-h-full overflow-scroll items-center p-4 border-white">
                        <div className="flex flex-row w-full justify-evenly text-lg max-[1000px]:!text-sm max-[1000px]:!flex-col">
                            <div className="h-full flex flex-col justify-evenly max-[1000px]:!w-full">
                                Status
                                {
                                    connectedUsers.find((u:any) => u === user.username) ? 
                                    <div className="text-green-400">Online</div>
                                    : <div className="text-red-400">Offline</div>
                                }
                            </div>
                            <div className="h-full flex flex-col justify-evenly max-[1000px]:!w-full">
                                Number of games
                                <div className="flex flex-row justify-center items-center">{user.games}&nbsp;<GiPingPongBat className="text-2xl"/></div>
                            </div>
                            <div className="h-full flex flex-col justify-evenly max-[1000px]:!w-full">
                                Win Rate
                                <div>{parseInt(String(parseInt(user.wins) / parseInt(user.games) * 100))} %</div>
                            </div>
                            <div className="h-full flex flex-col justify-evenly max-[1000px]:!w-full">
                                Number of friends
                                <div className="flex flex-row justify-center items-center">{friends?.length}&nbsp;<IoPersonSharp className="text-2xl" /></div>
                            </div>
                        </div>
                        <div className="w-full h-full relative overflow-scroll max-w-full border max-[1000px]:!h-[400px]">
                            <div className="p-4 w-full h-full overflow-scroll max-w-full z-0">
                                MATCH HISTORY
                                <div className="flex flex-col !items-center p-2">
                                    {games?.map((game:any, index:number) => {
                                        return (
                                            <div key={index} className="flex m-2 rounded-lg bg-gradient-to-t from-teal-400 via-cyan-500 to-sky-600 bg-opacity-30 flex-row text-lg shadow-md shadow-slate-800 items-center justify-between w-full p-2 max-[1000px]:flex-col">
                                                <img className="w-[75px] border-2 border-solid border-white h-[75px] object-cover rounded-full max-[1000px]:!w-[75px] max-[1000px]:!h-[75px]" src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+game.FK_player1.username} alt="avatar1" />
                                                <div>{game.FK_player1.username}</div>
                                                <div>{game.score1} - {game.score2}</div>
                                                <div>{game.FK_player2.username}</div>
                                                <img className="w-[75px] border-2 border-solid border-white h-[75px] object-cover rounded-full max-[1000px]:!w-[75px] max-[1000px]:!h-[75px]" src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+game.FK_player2.username} alt="avatar2" />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                :
                error ?
                    notFound ?
                    <div className="h-screen w-full flex flex-col justify-center items-center">
                        <p className="text-white">User not found</p>
                    </div>
                    :
                    <div className="h-screen w-full flex flex-col justify-center items-center">
                        <p className="text-white">Error fetching user profile</p>
                    </div>
                :
                <div className="h-screen w-full flex flex-col justify-center items-center">
                    <p className="text-white">Loading...</p>
                </div>
            }
        </>
}

export default UserProfile;