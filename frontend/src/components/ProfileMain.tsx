import { IoPersonSharp } from "react-icons/io5"
import { GiPingPongBat } from "react-icons/gi";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import axios from "axios";

const ProfileMain = (props:any) => {
    const connectedUsers = useSelector((state:any) => state.connectedUsers.connectedUsers);
    const user = useSelector((state:any) => state.user.user);
    const [friends, setFriends] = useState([] as any)
    const [check, setCheck] = useState(false);
    const [check2, setCheck2] = useState(false);
    const [games, setGames] = useState([] as any);
    useEffect(() => {
        if (user)
        {
            if (!check)
                axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + `/friends/${user.userData.login}`, {headers:{ Authorization: `Bearer ${user.jwt}`}})
                .then(response => {
                    const data = response.data
                    if (!data || data.error)
                        console.log(data.error);
                    else
                        setFriends(data.friends);
                    setCheck(true);
                }).catch(err => {
                    console.log(err);
                })
            if (!check2)
                axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + `/matchHistory/`, {headers:{ Authorization: `Bearer ${user.jwt}`}})
                .then(response => {
                    const data = response.data
                    if (!data || data.error)
                        console.log(data.error);
                    else
                        setGames(data);
                    setCheck2(true);
                }).catch(err => {
                    console.log(err);
                })
        }
    }, [friends, games]);
    return (
        <div className={props.className}>
            <div className="flex flex-row w-full justify-evenly text-lg max-[1000px]:!text-sm max-[1000px]:!flex-col">
                <div className="h-full flex flex-col justify-evenly max-[1000px]:!w-full">
                    Status
                    {
                        connectedUsers.find((u:any) => u === user.userData.login) ? 
                        <div className="text-green-400">Online</div>
                        : <div className="text-red-400">Offline</div>
                    }
                </div>
                <div className="h-full flex flex-col justify-evenly max-[1000px]:!w-full">
                    Number of games
                    <div className="flex flex-row justify-center items-center">{user.userData.games}&nbsp;<GiPingPongBat className="text-2xl"/></div>
                </div>
                <div className="h-full flex flex-col justify-evenly max-[1000px]:!w-full">
                    Win Rate
                    <div>{parseInt(String(parseInt(user.userData.wins) / parseInt(user.userData.games) * 100))} %</div>
                </div>
                <div className="h-full flex flex-col justify-evenly max-[1000px]:!w-full">
                    Number of friends
                    <div className="flex flex-row justify-center items-center">{friends.length}&nbsp;<IoPersonSharp className="text-2xl" /></div>
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
    )
}

export default ProfileMain