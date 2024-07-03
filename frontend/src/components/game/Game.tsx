import React, { useEffect } from "react";
import {createContext} from "react";
import FocusTrap from 'focus-trap-react'
import { Button, ButtonState, Coordinates, Game_data, INotifCxt, Msg, MsgState, PaddleProps, Player, PropsPong, SettingsProps, SettingsState, StatePaddle, StatePong } from "./game.interface";
import { Socket, io } from "socket.io-client";
// import {NotifCxt} from '../../App';
import { info } from "console";
import SoloGame from "./SoloGame";
import './Game.css';
import { IoSettings } from "react-icons/io5";
import { RootState } from "../../state/store";
import { connect } from "react-redux";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

class Settings extends React.Component <SettingsProps, SettingsState> {
  constructor(props:SettingsProps){
      super(props);
      this.state = {message : this.props.message};
  }
  static getDerivedStateFromProps(props : SettingsProps, state : SettingsState){
      return {message: props.message};
  }

  render(){
      return(
          <FocusTrap className="z-40 h-screen w-screen bg-gray-700 opacity-35">
              <aside
                  role="dialog"
                  tabIndex={-1}
                  aria-modal="true"
                  className="nes-container absolute top-[50%] right-0 translate-x-[50%] translate-y-[50%] min-w-[300px] w-[40%] z-40 bg-gradient-to-br from-slate-900 to-slate-600"
                  onKeyDown={(event) => {this.props.onKeyDown(event)}}
              >
                  <div className="text-lg max-[700px]:text-md">
                    Press key for moving {this.state.message}
                  </div>
                  <button onClick={() => {this.props.onClickClose()}} className="outline-none border-none text-xl absolute top-1 right-1">X</button>
              </aside>
          </FocusTrap>
      )
  }
}

class StartButton extends React.Component<Button, ButtonState>{
    constructor(props: Button){
        super(props);
        this.state = {showButton: true,
        buttonText : "Start",
    };
    }
    static getDerivedStateFromProps(props: Button, state : ButtonState){
        return{
            showButton: props.showButton,
            buttonText: props.buttonText
        };
    }
    render(){
        const btt = this.state.showButton ? 'unset' : 'none';
        return(
            <button onClick={this.props.clickHandler} style={{display: `${btt}`}} className="nes-btn is-primary max-[700px]:text-sm">{this.state.buttonText}</button>
        )
    }
}

class Ball extends React.Component< Coordinates, {} >
{
  render() {
    const show = this.props.showBall ? 'unset': 'none';
    if(window.innerHeight <= window.innerWidth){
      return (
         <div
            style={{
               top: `calc(${this.props.y}% - 1vh)`,
               left: `calc(${this.props.x}% - 1vh)`,
               display: `${show}`

            }}
            className={ 'Ball' }
         />
      );
    }
    if(window.innerHeight > window.innerWidth){
      return (
         <div
            style={{
               top: `calc(${this.props.y}% - 1/45*90vw/177*100)`,
               left: `calc(${this.props.x}% - 1/45*90vw/177*100)`,
               display: `${show}`

            }}
            className={ 'Ball' }
         />
      );
    }
  }
}

class Message extends React.Component< Msg, MsgState > {

    constructor(props: Msg){
        super(props);
        this.state = {showMsg: false,
                      type: 0,};
        }
      
        static getDerivedStateFromProps(props: Msg, state: MsgState){
          return {
            showMsg: props.showMsg,
            type: props.type
          };
        }
      

        render() {
          const disp = this.state.showMsg ? 'unset': 'none';
          var message: string;
          switch(this.state.type) {
            case 1:
                message = "Please wait for another player";
                break;
            case 2:
                message = "You win";
                break;
            case 3:
                message = "You lose";
                break;
            case 4:
                message = "Waiting for your opponent to accept the invitation";
                break;
            case 5:
                message = "Please finish your game before starting a new one";
                break; 
             default:
                 message = "error";
          }
       return (
             <div style={{display: `${disp}`,}} className="Message">{message}</div>
         )
     }
}
class Paddle extends React.Component< PaddleProps, StatePaddle > {
    constructor(props: PaddleProps){
      super(props);
      this.state = {side: props.side, 
                    y: props.ystart,
                    show: props.show,
                };
    };

    componentWillReceiveProps(props: PaddleProps) {
    this.setState({y: props.y});
      }
      
    render() {
        const show = this.props.show ? 'unset': 'none';
        var side: string;
        if (this.props.side === 'left')
            side = "Pad-left";
        else
            side = "Pad-right";
        return (
            <div
              style={{
                display: `${show}`,
                top: `${this.state.y}%`,
              }} 
              className={`${side}`}
           />
        );
       }
    }
// const NotifCxt = createContext<INotifCxt | undefined>(undefined);

const NavigationComponent = () => {
  const navigate = useNavigate();
  useEffect(() => {navigate('/leaderboard')}, []);
  return (<></>);
}

class Game extends React.Component<PropsPong , StatePong>{

    // static contextType = NotifCxt
    // context! : React.ContextType<typeof NotifCxt>

    // use redux here
    
    socketOptions = {
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
      };


    // const pvSocket = useSelector((state:RootState)=>state.socket.pvsocket) as Socket;
    socket : Socket = null as unknown as Socket;
    MOVE_UP = "ArrowUp";
    MOVE_DOWN = "ArrowDown";
    MOVE_LEFT = "ArrowLeft";
    MOVE_RIGHT = "ArrowRight";
    avatarsFetched = false;
    constructor(props : PropsPong){
        super(props);
        this.state = {
            paddleLeftY: 50,
            paddleRightY: 50,
            ballX: 50,
            ballY: 50,
            gameStarted: false,
            showStartButton: true,
            roomId: 0,
            playerNumber: 0,
            player1Score: 0,
            player2Score: 0,
            msgType: 0,
            player1Name: "player1",
            player2Name: "player2",
            game_list: [],
            isSettingsShown: false,
            settingsState: window.innerWidth >700? "up":"right",
            gameMode:"default",
            buttonState: "Start",
            avatarP1URL: "",
            avatarP2URL: "",
            soloGame: false,
        };
        //     this.socket = io(`ws://localhost:5000`, this.socketOptions);
        // }
        // @ts-ignore
        if (this.props.pvSocket !== undefined && this.props.pvSocket && this.props.pvtGame)
        {
          // alert("pvtGame");
          // @ts-ignore
          this.socket = this.props.pvSocket as Socket;
        }
        else
          this.socket = io(
            (process.env.REACT_APP_GAME_SERVER ? `ws://`+process.env.REACT_APP_GAME_SERVER : ("ws://localhost:" + process.env.REACT_APP_GAME_PORT || "4000")),
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
        // alert(JSON.stringify(this.socketOptions))
        this.onSettingsKeyDown = this.onSettingsKeyDown.bind(this);
        this.onSettingsClickClose = this.onSettingsClickClose.bind(this);
        this.quitSoloMode = this.quitSoloMode.bind(this);
    }
    
    componentDidMount(): void {
        document.onkeydown = this.KeyDownInput;
        document.onkeyup = this.keyUpInput;
        this.socket.on('game_started', ()=> {
            this.setState({gameStarted: true, showStartButton : false});
            this.socket.off('rejected');
        });
        this.socket.on("update", (info: Game_data) => {
            this.setState({
                ballX: info.xBall,
                ballY: info.yBall,
                paddleLeftY: info.paddleLeft,
                paddleRightY: info.paddleRight,
                player1Score: info.player1Score,
                player2Score: info.player2Score,
                player1Name: info.player1Name,
                player2Name: info.player2Name,
            });
            
        });
        this.socket.on("end_game", (winner : number)=>
             {
              setTimeout(() => {
                // insert the NavigationComponent component
                document.getElementById("gameContainer")?.appendChild(document.createElement("NavigationComponent"));
              }, 1000);
              return winner === this.state.playerNumber
              ? this.setState({
                  msgType: 2,
                  showStartButton: true,
                  buttonState: "New Game",
                  avatarP1URL: "",
                  avatarP2URL: "",
                  gameStarted: false,
              })
              : this.setState({
                  msgType: 3,
                  showStartButton: true,
                  buttonState: "New Game",
                  avatarP1URL: "",
                  avatarP2URL: "",
                  gameStarted: false,
              })
             }
        );
        if (this.props.pvtGame && localStorage.getItem("playernb") == "1") {
          let RoomId = Number(localStorage.getItem("roomid"));
          this.setState({roomId: RoomId});
          this.setState({playerNumber : 1, msgType : 4, buttonState: "Cancel"});
          this.socket.on("rejected", (targetName: string)=>{
              this.setState({roomId: 0, playerNumber: 0, msgType: 0, buttonState: "Start"})
              this.setState({redirectChat: true})
              console.log(targetName + ' rejected');
          });
        }
        if (this.props.pvtGame && localStorage.getItem("playernb") == "2") {
            let RoomId = Number(localStorage.getItem("roomid"));
            this.setState({roomId : RoomId, playerNumber : 2, msgType : 0, gameStarted :true, showStartButton : false});
        }
    }          
    componentWillUnmount(): void {
        this.socket.disconnect();
        this.socket.connect();
        this.socket.off("game_started");
        this.socket.off("update");
        this.socket.off("end_game");
    }

    startButtonHander = (e: React.MouseEvent<HTMLButtonElement>)=>{
        if (!this.state.showStartButton) return;
        if (this.state.buttonState === "Cancel") {
          this.socket.disconnect();
          this.socket.connect();
          this.setState({
            gameStarted: false,
            showStartButton: true,
            buttonState: "Start",
          });
          return;
        }
        this.setState({ buttonState: "Cancel" });
        // @ts-ignore comment
        const user = this.props?.user?.userData?.login;
        this.socket.emit("start", {}, (player: Player) =>
        {  
          if (player.playerNb === 3)
          {
            this.setState({
              msgType: 5,});
              return;
          }  
          this.setState({
            roomId: player.roomId,
            playerNumber: player.playerNb,
            msgType: 1,
          })
        });
    }
    
    solobuttonHandler = () => this.setState({soloGame : true});


    KeyDownInput = (e: KeyboardEvent) => {
        if (((window.innerWidth > 700 && e.key === this.MOVE_UP) || (window.innerWidth <= 700 && e.key === this.MOVE_LEFT))  && this.state.gameStarted) {
          e.preventDefault();
          // alert(JSON.stringify(this.state))
          // alert(JSON.stringify({
          //   dir: 1,
          //   room: this.state.roomId,
          //   player: this.state.playerNumber,
          // }))
          this.socket.emit("move", {
            dir: 1,
            room: this.state.roomId,
            player: this.state.playerNumber,
          });
        }
    
        if (((window.innerWidth > 700 && e.key === this.MOVE_DOWN) || (window.innerWidth <= 700 && e.key === this.MOVE_RIGHT)) && this.state.gameStarted) {
          e.preventDefault();
          this.socket.emit("move", {
            dir: 2,
            room: this.state.roomId,
            player: this.state.playerNumber,
          });
        }
      };
      keyUpInput = (e: KeyboardEvent) => {
        if (
          (e.key === this.MOVE_UP || e.key === this.MOVE_DOWN || e.key === this.MOVE_LEFT || e.key === this.MOVE_RIGHT) && this.state.gameStarted
        ) {
          e.preventDefault();
          this.socket.emit("move", {
            dir: 0,
            room: this.state.roomId,
            player: this.state.playerNumber,
          });
        }
      };
    onSettingsKeyDown = (e: KeyboardEvent) => {
        if (this.state.settingsState === "up") {
          this.setState({ settingsState: "down" });
          this.MOVE_UP = e.key;
        } else if (this.state.settingsState === "down") {
          this.setState({ isSettingsShown: window.innerWidth <= 700 , settingsState: window.innerWidth > 700? "up":"right" });
          this.MOVE_DOWN = e.key;
        } else if (this.state.settingsState === "right") {
          this.setState({ settingsState: "left" });
          this.MOVE_RIGHT = e.key;
        }
        else if (this.state.settingsState === "left") {
          this.setState({ isSettingsShown: false, settingsState: "right" });
          this.MOVE_LEFT = e.key;
        }
      };
      onSettingsClickClose() {
        this.setState({ isSettingsShown: false, settingsState: "up" });
      }
      showSettings() {
        this.setState({ isSettingsShown: true });
      }
      quitSoloMode() {
        this.setState({ soloGame: false });
      }
      render() {
        const shoWInfo = this.state.gameStarted ? "flex" : "none";
        /*const showBorder = this.state.gameStarted ? '2px solid rgb(0, 255, 255)' : '0px solid rgb(0, 255, 255)';*/
        const showBorder = this.state.gameStarted
          ? "2px solid rgb(255, 255, 255)"
          : "0px solid rgb(255, 255, 255)";
        /*const showShadow = this.state.gameStarted ? '0px 0px 5px 5px rgb(80, 200, 255), inset 0px 0px 5px 5px rgb(0, 190, 255)' : '0';*/
        const showShadow = "0";
    
        var leftName = String(this.state.player1Name);
        var rightName = String(this.state.player2Name);
        // @ts-ignore comment
        var user = this.props?.user?.userData?.login;
        return (
          <div className="w-full h-full !font-[Clip] bg-gradient-to-b from-slate-800 via-[90%] to-transparent !backdrop-blur-sm">
            {this.state.soloGame? (
                <SoloGame clickHandler={this.quitSoloMode}></SoloGame>
            ):
            (
              <div id="gameContainer" className="Radial-background relative !h-full">
                <div className="Page-top flex-row items-center">
                  <div style={{ display: `${shoWInfo}` }} className="Info-card flex-row items-center">
                    <div className="Player-left flex-row items-center justify-between">
                      <div className="Info">
                          {/* <div
                            className="Photo"
                            style={{
                              backgroundImage:`(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile-image/"+leftName`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          ></div> */}
                          <img src={
                            (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile-image/"+leftName
                          } 
                          className="w-[70px] h-[70px] object-cover rounded-full" alt="avatar"
                          />
                        <div className="Login" style={{ textAlign: "left" }}>
                          {leftName}
                        </div>
                      </div>
                      <div className="Score">{this.state.player1Score}</div>
                    </div>
                    <div className="Player-right flex-row items-center">
                      <div className="Score">{this.state.player2Score}</div>
                      <div className="Info">
                        <div className="Login" style={{ textAlign: "right" }}>
                          {rightName}
                        </div>
                          {/* <div
                            className="Photo"
                            style={{
                              backgroundImage: `(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile-image/"+rightName`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          ></div> */}
                          <img src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile-image/"+rightName} 
                            className="w-[70px] h-[70px] object-cover rounded-full" alt="avatar"
                          />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={"Page-mid w-full relative z-30 !overflow-hidden flex justify-center " + (this.state.gameStarted? " ":" !h-0 " ) +
                  +
                      (this.state.player1Name === user && this.state.gameMode === "hard"?
                      // if player on the left or down
                      " max-[700px]:!translate-y-[50%] min-[700px]:!translate-x-[-100%]":
                      // if player on the right or up
                      this.state.player2Name === user && this.state.gameMode === "hard"?
                      " max-[700px]:!self-end max-[700px]:!h-1/2 max-[700px]:justify-start min-[700px]:!!h-full min-[700px]:!translate-x-[100%]":"")
                  }>
                  <div
                    style={{ border: `${showBorder}`, boxShadow: `${showShadow}` }}
                    className={"min-[700px]:!h-full !w-full object-cover !mt-0 Field max-[700px]:-rotate-90 max-[700px]:-translate-y-[-51%] max-[700px]:scale-[120%] max-[700px]:mx-auto min-[700px]:my-auto min-[700px]:!w-full " +
                    // if player on the left or down
                     (this.state.player1Name === user && this.state.gameMode === "hard"? 
                      " max-[700px]:translate-y-[-50%] min-[700px]:!translate-x-[50%]":
                      // if player on the right or up
                      this.state.player2Name === user && this.state.gameMode === "hard"?
                      " max-[700px]:!self-end min-[700px]:!translate-x-[-50%]":""
                      )}
                  >
                    <Paddle
                      show={this.state.gameStarted}
                      side={"left"}
                      y={this.state.paddleLeftY}
                      ystart={this.state.paddleLeftY}
                    />
                    <Paddle
                      show={this.state.gameStarted}
                      side={"right"}
                      y={this.state.paddleRightY}
                      ystart={this.state.paddleRightY}
                    />
    
                    <div className={this.state.gameMode !== "hard"? "Center-zone ":"Center-zone-hard"}
                     style={{ display: `${shoWInfo}` }}>
                      <div className="Middle-line-top"></div>
                      <div className="Center-circle"></div>
                      <div className="Middle-line-bottom"></div>
                    </div>
    
                    <div className="Pad-right"></div>
    
                    <Ball
                      showBall={this.state.gameStarted}
                      x={this.state.ballX}
                      y={this.state.ballY}
                    />
                  </div>
                </div>
                  {/* : null
                } */}
    
                <div className={"w-full  relative  grid grid-flow-row-dense items-center" + (!this.state.gameStarted || this.state.soloGame? " h-full":" !h-0")}>
                  <Message
                    showMsg={
                      this.state.buttonState !== "Start" && !this.state.gameStarted
                    }
                    type={this.state.msgType}
                  />
                  {
                    !this.state.gameStarted ?
                    <div className="h-[100px] flex justify-center mb-3">
                      <div className="max-w-[700px]">
                        <label htmlFor="gameMode">GameMode 
                        <br/>
                          <span className="text-xs text-gray-300">(This doesn't effect your opponent!)</span></label>
                          <select id="gameMode"
                          className=" border text-sm rounded-lg w-[300px] !p-2 bg-gray-700 border-gray-600
                            placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 h-16" defaultValue={this.state.gameMode} onChange={(e:any)=>{
                            this.setState({gameMode: e.target.value});
                            }}>
                            <option value="default" title="Default GameMode" className="text-xl" >Default</option>
                            <option value="hard" title="Showing just Your Half of the table" className="text-xl">Challenging</option>
                          </select>
                      </div>
                    </div>
                    :
                    null
                  }
                  <div className="w-full flex justify-center">
                    <div className="relative flex flex-col w-[300px]">
                      <StartButton
                        showButton={this.state.showStartButton}
                        clickHandler={this.startButtonHander}
                        buttonText={this.state.buttonState}
                      />
                      <StartButton
                        showButton={this.state.showStartButton && this.state.buttonState !== "Cancel"}
                        clickHandler={this.solobuttonHandler}
                        buttonText="Solo mode"
                      />
                    </div>
                  </div>
                </div>
                  {this.state.isSettingsShown ? (
                    <div className="!absolute z-40 w-full h-full">
                        <Settings
                          message={this.state.settingsState!}
                          onKeyDown={this.onSettingsKeyDown}
                          onClickClose={this.onSettingsClickClose}
                        />
                    </div>
                  ) : null}
                {
                  this.state.gameStarted ?
                  <div className="Page-foot absolute top-1 right-[50%] z-50 translate-x-[50%] !text-sm">
                    <div className="bar w-full h-full flex justify-center items-center self-center">
                      <IoSettings 
                        className="text-4xl"
                      />
                    </div>
                    <div className="innerFoot">
                      <div className="Button" onClick={() => this.showSettings()}>
                        Mouvement
                      </div>
                      <div className="Button" onClick={()=>{
                        this.socket.disconnect();
                        this.socket.connect();
                        this.setState({
                          gameStarted: false,
                          showStartButton: true,
                          buttonState: "Start",
                        });
                      }} >
                        Quit
                      </div>
                    </div>
                  </div>: null

                }
              </div>
            )}
          </div>
        );
      }
}




const mapStateToProps = (state: RootState) => {
  return {
    user: state.user.user,
    pvSocket: state.socket.pvsocket,
  };
}

export default connect(mapStateToProps)(Game);
