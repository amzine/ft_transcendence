import { useContext, useRef, useState, useEffect } from "react";
import { Pong } from "./Pong";
import { useNavigate } from "react-router-dom";
import { useSetupContext } from "./hooks/usecontext";
import {StyledGame} from './Game.styles';
import { useGameContext } from "../../context/context";
import { ClientGameEvents, ServerGameEvents } from "../../events/game.events";
import SocketContext from "../../context/socketContext";
import Score from "./components/Score";
import { useUpdateGameState } from "./hooks/updateGameState";

export interface Lobby{
    id : string;
    createdAt : string;
    createdBy : string;
    clients : string[];
}
function  Game() {
    const {socket} = useContext(SocketContext).SocketState;
    const PongRef = useRef<Pong>();
    const [showvictory, setVictory] = useState(false);
    const [showDefeat, setShowDefeat] = useState(false);
    const [showDraw, setShowDraw] = useState(false);
    const [showIntro, setShowIntro] = useState(false);
    const container = document.getElementById('container');
    const canvas = document.getElementById('playground') as HTMLCanvasElement;
    const [score, setScore] = useState({left: 0,right : 0});
    // const username = useUseInfos().username.username;

    const navigate = useNavigate();
    useSetupContext(canvas);
    const {lobby, leftPlayer, rightPlayer} = useGameContext().GameState;
    useUpdateGameState(PongRef, setScore);
    useEffect(() => {
        // if (!lobby.id || !leftPlayer || !rightPlayer) {
        //     return;
        // }
        setTimeout(()=>{
            setShowIntro(false);
        }, 2_300);
        setTimeout(() => {
            socket?.emit(ClientGameEvents.Ready , {lobbyId : lobby.id});
        }, 8_000);
        PongRef.current = new Pong(socket!, lobby.id, {isSpec: false});
        socket?.emit(ClientGameEvents.FetchSetup, {lobbyId : lobby.id});
        socket?.on(ServerGameEvents.Setup , (data) => {
            PongRef.current?.moveBall(data.ball.position,data.ball.velocity);
            PongRef.current?.movePaddle('left',data.leftPadlle.position);
            PongRef.current?.movePaddle('left', data.rightPaddle.position);
            // data.timer? PongRef.current?.updateTimer(data.timer) : 0;
            PongRef.current?.start();
        });
        return () =>{
            socket?.off(ServerGameEvents.Setup);
            socket?.emit(ClientGameEvents.LeaveGame, {lobbId: lobby.id});
        };
    }, [lobby.id]);

    // useEffect(()=> {
    //     socket?.on(ServerGameEvents.ClientLeft, ()=>{
    //         if (!showDraw && !showvictory && !showDefeat) {
    //             navigate('/');
    //         }
    //     });
    //     socket?.on(ServerGameEvents.GameResult, (data) => {
    //         PongRef.current?.stop();
    //         switch(data.winner){
    //             // case 'draw':
    //             //     setShowDraw(true);
    //             //     break;
    //             // case ''    
    //         }
    //     })
    // })
    // if (!lobby.id || !leftPlayer || !rightPlayer) return null;
    return (
        <div>
            <p>messsi</p>
        {/* <Score score={score} leftPlayer={leftPlayer} rightPlayer={rightPlayer} /> */}
        <StyledGame id="container">
            <canvas
                id="playground"
                width={container ? container.clientWidth : 1280}
                height={container ? container.clientHeight : 720}
                style={{width: '100%', height: '100%'}}
            />
        </StyledGame>
        </div> 
    );
}
export default Game;