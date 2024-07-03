import { useNavigate } from "react-router-dom";
import { gameInvitation } from "./types/game.type";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { socket } from "../../App";
import { Player } from "./game.interface";
import { getUserimageQuery } from "../../queries/avatar";
import './card.css';



export function GameRequestCard({game, gameRequest, onGameRequest}
    :{game : gameInvitation | undefined,
        gameRequest : boolean,
        onGameRequest: () => void}){
    
        const navigate = useNavigate();
        const [AvatarURL, setavatarURL] = useState("");
        
        useEffect(()=> {
            if (game) {
                const getavatar = async () =>{
                    const res : undefined | string | Blob | MediaSource = 
                        await getUserimageQuery(game!.inviterId);
                
                        if (res !== undefined && res instanceof Blob) {
                        setavatarURL(URL.createObjectURL(res));
                    }
                }
                getavatar();
            }
        }, [game]);

        const joinGame = () =>{
            socket.emit("join_private", {roomID: game!.gameInfo.roomId}, (player: Player) => {
                if (player.roomId !== undefined && player.playerNb !== undefined) {
                    localStorage.setItem("roomid", player.roomId?.toString());
                    localStorage.setItem("playernb", player.playerNb?.toString());
                    onGameRequest();
                    navigate("privateGame");
                }
                else{
                    socket.disconnect();
                    socket.connect();
                    onGameRequest();
                }
            });
        }

        const declineGame = () =>{
            socket.disconnect();
            socket.connect();
            socket.emit("decline game", (game));
            onGameRequest();
        }

        return(
            <>
               <div className="card-chat">
                <div className="card-chat-title">GAME INVITATION</div>
                <div className="flex-block"/>
                <div style={{flex: "6"}}>
                    <div className="challenger-avatar"
                            style={{backgroundImage: `url("${AvatarURL}")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center"}}/>
                    <div className="text">{game?.invitername}</div>
                    <div className="text">invited you to a game</div>
                </div>
                <div style={{display: "flex", flex: "3"}}>
                    <div className="join-button"
                        onClick={joinGame}>
                        JOIN</div>
                    <div className="decline-button"
                        onClick={declineGame}>
                        DECLINE</div>
                </div>
            </div>
            </>
        )
        
    }   