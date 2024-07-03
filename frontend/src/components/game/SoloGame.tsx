import React, { Component } from "react";
import "./Game.css";
import {
  Coordinates,
  PaddleProps,
  StatePaddle,
  SettingsProps,
  SettingsState,
  StateSoloPong,
  MsgSolo,
  MsgSoloState,
  SoloButtonState,
  SoloButtonProps,
  PropsSoloPong,
} from "./game.interface";
import FocusTrap from "focus-trap-react";
import { RootState } from "../../state/store";
import { connect, useSelector } from "react-redux";
import { IoSettings } from "react-icons/io5";
// import { getAvatarQuery } from "../queries/avatarQueries";

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

class Message extends React.Component<MsgSolo, MsgSoloState> {
  constructor(props: MsgSolo) {
    super(props);
    this.state = { showMsg: false, type: 0, score: 0 };
  }

  static getDerivedStateFromProps(props: MsgSolo, state: MsgSoloState) {
    return {
      showMsg: props.showMsg,
      type: props.type,
      score: props.score,
    };
  }

  render() {
    const disp = this.state.showMsg ? "unset" : "none";
    var message: string;
    switch (this.state.type) {
      case 1:
        message = "Score: " + this.state.score?.toString();
        break;
      default:
        message = "error";
    }
    return (
      <div style={{ display: `${disp}` }} className="Message">
        {message}
      </div>
    );
  }
}

class SoloButton extends React.Component<SoloButtonProps, SoloButtonState> {
  constructor(props: SoloButtonProps) {
    super(props);
    this.state = { showButton: true, buttonText: "Play again" };
  }

  static getDerivedStateFromProps(
    props: SoloButtonProps,
    state: SoloButtonState
  ) {
    return {
      showButton: props.showButton,
      buttonText: props.buttonText,
    };
  }

  render() {
    const btt = this.state.showButton ? "unset" : "none";
    return (
      <button
        onClick={this.props.clickHandler}
        style={{ display: `${btt}` }}
        className="nes-btn is-primary"
      >
        {this.state.buttonText}
      </button>
    );
  }
}

class Ball extends React.Component<Coordinates, {}> {
  render() {
    const show = this.props.showBall ? "unset" : "none";
    return (
      <div
        style={{
          top: `calc(${this.props.y}% - 1vh)`,
          left: `calc(${this.props.x}% - 1vh)`,
          display: `${show}`,
        }}
        className={"Ball"}
      />
    );
  }
}

class Paddle extends React.Component<PaddleProps, StatePaddle> {
  constructor(props: PaddleProps) {
    super(props);
    this.state = { side: props.side, y: props.ystart, show: props.show };
  }

  componentWillReceiveProps(props: PaddleProps) {
    this.setState({ y: props.y });
  }

  render() {
    const show = this.props.show ? "unset" : "none";
    return (
      <div
        style={{
          display: `${show}`,
          top: `${this.state.y}%`,
        }}
        className="Pad-left"
      />
    );
  }
}

class SoloGame extends Component<
  PropsSoloPong ,
  StateSoloPong
>
{
  interval: NodeJS.Timer;
  refreshRate = 8;
  ballSpeed = 0.25;
  paddleSpeed = 1;
  lock = 0;
  speedX = this.ballSpeed;
  speedY = 1;
  xBall = 50;
  yBall = 50;
  yPaddle = 50;
  paddleDir = 0;

  MOVE_UP = "ArrowUp";
  MOVE_DOWN = "ArrowDown";
  MOVE_LEFT = "ArrowLeft";
  MOVE_RIGHT = "ArrowRight";

  constructor(props: PropsSoloPong) {
    super(props);
    this.state = {
      paddleLeftY: 50,
      ballX: 50,
      ballY: 50,
      gameStarted: true,
      player1Score: 0,
      player1Name: "",
      isSettingsShown: false,
      settingsState: window.innerWidth >700? "up":"right",
      avatarP1URL: "",
    };

    this.initBall();
    this.getAvatars();
    this.interval = setInterval(() => {
      this.gameLoop();
    }, this.refreshRate);
  }
  componentDidMount() {
    this.onSettingsKeyDown = this.onSettingsKeyDown.bind(this);
    this.onSettingsClickClose = this.onSettingsClickClose.bind(this);
    this.startGame = this.startGame.bind(this);
    document.onkeydown = this.keyDownInput;
    document.onkeyup = this.keyUpInput;
  }
  keyDownInput = (e: KeyboardEvent) => {
    if (((window.innerWidth > 700 && e.key === this.MOVE_UP) || (window.innerWidth <= 700 && e.key === this.MOVE_LEFT)) && this.state.gameStarted) {
      e.preventDefault();
      this.paddleDir = 1;
    }
    if (((window.innerWidth > 700 && e.key === this.MOVE_DOWN) || (window.innerWidth <= 700 && e.key === this.MOVE_RIGHT))) {
      e.preventDefault();
      this.paddleDir = 2;
    }
  };

  keyUpInput = (e: KeyboardEvent) => {
    if (
      (e.key === this.MOVE_UP || e.key === this.MOVE_DOWN || e.key === this.MOVE_LEFT || e.key === this.MOVE_RIGHT) &&
      this.state.gameStarted
    ) {
      e.preventDefault();
      this.paddleDir = 0;
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

  getAvatars = async () => {
      this.setState({
        avatarP1URL:
          "https://img.myloview.fr/stickers/default-avatar-profile-in-trendy-style-for-social-media-user-icon-400-228654852.jpg",
      });
  };

  async startGame() {
    this.initBall();
    this.yPaddle = 50;
    this.paddleDir = 0;
    this.setState({ gameStarted: true, player1Score: 0 });
    this.interval = setInterval(() => {
      this.gameLoop();
    }, this.refreshRate); // create game loop
  }

  initBall() {
    this.setState({ ballX: 50 });
    this.setState({ ballY: 50 });
    this.ballSpeed = 0.25;
    this.xBall = 50;
    this.yBall = 50;
    this.speedX = this.ballSpeed * -1;
    this.speedY = 0.15 + Math.random() * this.ballSpeed;
    let direction = Math.round(Math.random());
    if (direction) this.speedY = this.speedY * -1;
  }

  async gameLoop() {
    if (this.lock === 0) {
      this.lock = 1;
      this.updateBall();
      this.updatePaddle();
      if (this.state.gameStarted === false) clearInterval(this.interval);
      this.setState(
        { ballX: this.xBall, ballY: this.yBall, paddleLeftY: this.yPaddle },
        () => (this.lock = 0)
      );
    }
    return;
  }

  updateBall() {
    this.xBall += this.speedX;
    this.yBall += this.speedY;

    // game windows is 16/9 format - so 1.77, ball radius is 1vh

    // ball collision with floor or ceilling
    if (this.yBall > 98) {
      this.yBall = 98;
      this.speedY *= -1;
    }
    if (this.yBall < 2) {
      this.yBall = 2;
      this.speedY *= -1;
    }

    // ball collision with left paddle (paddle position is 3% from the border, paddle height is 10% of the game windows)
    // ball radius is 1vh
    if (
      this.xBall <= 3 + 2 / 1.77 &&
      this.yBall >= this.yPaddle - 1 &&
      this.yBall <= this.yPaddle + 11
    ) {
      this.speedX *= -1;
      this.speedY = ((this.yBall - this.yPaddle - 5) / 6) * this.ballSpeed;
      this.xBall = 3 + 2 / 1.77;
    }
    if (this.xBall >= 98) {
      this.ballSpeed = this.ballSpeed * 1.1;
      this.speedX *= -1.1;
      this.speedY *= 1.1;

      this.setState({ player1Score: this.state.player1Score + 1 });
    }
    if (this.xBall <= 0 - 2 / 1.77) {
      this.setState({ gameStarted: false });
    }
  }

  updatePaddle() {
    if (this.paddleDir === 1) {
      this.yPaddle -= this.paddleSpeed;
      if (this.yPaddle < 0) this.yPaddle = 0;
    } else if (this.paddleDir === 2) {
      this.yPaddle += this.paddleSpeed;
      if (this.yPaddle > 90) this.yPaddle = 90;
    }
  }

  render() {
    const shoWInfo = this.state.gameStarted ? "flex" : "none";
    const showBorder = this.state.gameStarted
      ? "2px solid rgb(255, 255, 255)"
      : "0px solid rgb(255, 255, 255)";
    const showShadow = "0";
    console.log("props : " , this.props)
    // @ts-ignore comment
    var leftName = this.props.user?.userData?.login;
    // const {user} = this.props;
    return (
      <div className="Radial-background relative">
        <div className="Page-top flex-row items-center">
          <div style={{ display: `${shoWInfo}` }} className="Info-card flex-row items-center">
            <div className="Player-left flex-row items-center justify-between">
              <div className="Info items-center">
                  {/* <div
                    className="Photo"
                    style={{
                      backgroundImage: `url("https://img.myloview.fr/stickers/default-avatar-profile-in-trendy-style-for-social-media-user-icon-400-228654852.jpg")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div> */}
                <img src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + "/profile-image/" + leftName}
                  className="w-[70px] h-[70px] object-cover rounded-full" alt="avatar"
                />
                <div className="text-xl ml-2" style={{ textAlign: "left" }}>
                    {leftName}
                </div>
              </div>
              <div className="Score">{this.state.player1Score}</div>
            </div>
          </div>
        </div>
        <div className="Page-mid">
          <div
              style={{ border: `${showBorder}`, boxShadow: `${showShadow}` }}
              className="Field max-[700px]:-rotate-90 max-[700px]:-translate-y-[-50%] max-[700px]:scale-[120%]"
            >
            <Paddle
              show={this.state.gameStarted}
              side={"left"}
              y={this.state.paddleLeftY}
              ystart={this.state.paddleLeftY}
            />

            <div className="Center-zone" style={{ display: `${shoWInfo}` }}>
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
        <div className="Button-msg-zone flex flex-col w-1/2 min-w-[400px] self-center">
          <Message
            showMsg={!this.state.gameStarted}
            type={1}
            score={this.state.player1Score}
          />
          <SoloButton
            showButton={!this.state.gameStarted}
            clickHandler={this.startGame}
            buttonText="Play again"
          />
          <SoloButton
            showButton={!this.state.gameStarted}
            clickHandler={this.props.clickHandler}
            buttonText="Quit"
          />
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
        <div className="Page-foot absolute top-1 right-[50%] translate-x-[50%] !text-sm">
          <div className="bar w-full h-full flex justify-center items-center self-center">
            <IoSettings 
              className="text-3xl"
            />
          </div>
          <div className="innerFoot">
            <div className="Button" onClick={() => this.showSettings()}>
              Mouvement
            </div>
            <div className="Button" onClick={() => this.props.clickHandler()}>
              Quit
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    user: state.user.user,
  };
}

export default connect(mapStateToProps)(SoloGame);
