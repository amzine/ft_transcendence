import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Main from './components/Main';
import User from './components/User';
import Play from './components/Play';
import Chat from './components/Chat';
import Home from './components/Home';
import Three from './components/Three';
import Start from './components/Start';
import Header from './components/Header';
import Footer from './components/Footer';
import Profile from './components/Profile';
import Friends from './components/friends/friends';
// import Leaderboard from './components/Leaderboard';
import Auth42Button from './components/Auth42Button';
import Game from './components/game/Game';
import LeaderBoard from './components/game/leaderBoard/leaderboad';
import { RootState } from './state/store';
import { setUser } from './state/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { Socket, io } from "socket.io-client"
import axios from 'axios';
import { Player } from './components/game/game.interface';
import { gameInvitation } from './components/game/types/game.type';

// const store = configureStore({
//   reducer: {
//     user: userSlice.reducer
//   }
// })

// store.subscribe(() => {
//   console.log(store.getState());
// })

// store.dispatch({
//   type: 'user/setUser',
//   payload: {
//       name: "test User"
//   }
// })

import { createBrowserRouter, RouterProvider, Outlet, useNavigate } from 'react-router-dom';
import socketSlice, { setPvSocket, setSocket } from './state/socket/socketSlice';
import { ToastContainer, toast } from 'react-toastify';
import { connect } from 'http2';
import { setConnectedUsers } from './state/connected/connectedSlice';
import Conversations from './components/Conversations';
import { setConversations } from './state/conversations/conversationSlice';
import { setChat } from './state/chat/chatSlice';
import { time } from 'console';
import { MdRemoveShoppingCart } from 'react-icons/md';
import { messagesState, setMessages } from './state/messages/messagesSlice';
import { get } from 'http';
import ChatProfile from './components/ChatProfile';
import UserProfile from './components/UserProfile';
import { Group } from 'three';
import TwoFactorVerification from './components/TwoFactorVerification';
import { setDms } from './state/dms/dmsSlice';
import { setDmRoom } from './state/dmRoom/dmRoomSlice';
import { setBlocked } from './state/Blocked/BlockedSlice';
import SetProfile from './components/setProfile';
import { setAwaiting, setFriends, setUsers } from './state/users/usersSlice';
import { setProfile } from './state/user/profileSlice';
import { GiGamepadCross } from 'react-icons/gi';
import { setIsMenuOpen } from './state/menu/menuSlice';

const Connect = () => {
  // const dispatch = useDispatch();
  // const socket = io("localhost:"+process.env?.CHAT_PORT, { transports: ['websocket'] });
  // socket.on("connect", () => {
  //   console.log("Connected");
  // });
  // socket.on("disconnect", () => {
  //   console.log("Disconnected");
  // });
  // socket.on("error", (err) => {
  //   console.log(err);
  // });
  // socket.auth = { token: localStorage.getItem("jwtToken") };
  // dispatch(setSocket(socket));
  return null;
};

const socketOptions = {
  transportOptions : {
    polling: {
      extraHeaders : {
        Token : localStorage.getItem("jwtToken")
      },
    },
  },
};
export const socket = io((process.env.REACT_APP_GAME_SERVER ? `ws://`+process.env.REACT_APP_GAME_SERVER : ("ws://localhost:" + process.env.REACT_APP_GAME_PORT || "4000")), socketOptions);

// export const NotifCxt = createContext<INotifCxt | undefined>(undefined);


const Template = (props : any) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, connectedUsers, conversations ,sock, dms, dmRoom, Blocked, profile, chat} = useSelector((state: RootState) => {
    return {
      user: state.user.user,
      connectedUsers: state.connectedUsers.connectedUsers,
      conversations: state.conversations.conversations,
      sock: state.socket.socket as Socket,
      dms: state.dms.dms,
      dmRoom: state.dmRoom.dmRoom,
      Blocked: state.Blocked.Blocked,
      profile: state.profile.user,
      chat: state.chat.chat
    }
  });
  let ssocket = useSelector((state: RootState) => state.socket.pvsocket);
  if (!user && window.location.pathname != '/')
    navigate("/", { replace: true }); // Properly redirect using React Router

  // const dispatch = useDispatch();


    /** Moved From the App Function to Template Function for navigate to work */
    useEffect(()=>{
      sock?.on("message", (data : any) => {
        if (data == undefined)
        return;
        data = JSON.parse(data);      
        const conversation = conversations.find((elem:any)=> elem.id == data?.recepient);
        if (conversation != undefined) {
            dispatch(setConversations([
              {...conversation, conversation: [...conversation.conversation, data]},
                ...conversations.filter((elem: any) => elem.id != data.recepient)
            ]))
            if (chat && chat?.id == data.recepient){
              dispatch(setChat({...conversation, conversation: [...conversation.conversation, data]}))
              if (window.location.pathname !== "/Chat" && data.FK_sender?.username != user.userData.login)
                  toast.info(`New Message From ${data.FK_sender?.username}`,{
                    onClick:()=>{
                      dispatch(setChat(conversation));
                      dispatch(setIsMenuOpen(true))
                      dispatch(setDmRoom(null))
                      navigate("/Chat", {replace: true});
                    }
                  });
            } else if (data.FK_sender?.username != user.userData.login) {
                if (chat?.id == data.recepient)
                    return;
                toast.info(`New Message From ${conversations.find((elem:any)=> elem.id == data.recepient)?.name} : ${data.FK_sender?.username}`,{
                  onClick:()=>{
                    dispatch(setChat(conversation));
                    dispatch(setIsMenuOpen(true))
                    dispatch(setDmRoom(null))
                    navigate("/Chat", {replace: true});
                  }
                });
                return ;
            }
            return ;
          }
        });
        // messageDM
        sock?.on("messageDM", (data : any) => {
          
          console.log("messageDM : ", data);
          if (data == undefined) return; 
          data = JSON.parse(data);
          const {recepient, ...message} = data;
          const dm = dms.find((elem:any)=> elem.dm_id == data?.recepient);
          if (dm) {
              dispatch(setDms([
                {...dm, messages: [...dm.messages, message]},
                  ...dms.filter((elem: any) => elem.dm_id != data.recepient)
              ]))
              console.log("dm : ", dm);
              if (dmRoom && dmRoom?.dm_id == data.recepient){
                dispatch(setDmRoom({...dm, messages: [...dm.messages, message]}))
                if (window.location.pathname !== "/Chat" && data.FK_sender?.username != user.userData.login)
                    toast.info(`New Message From ${data.FK_sender?.username}`, {
                      onClick:()=>{
                        dispatch(setDmRoom({...dm, messages: [...dm.messages, message]}));
                        dispatch(setIsMenuOpen(true))
                        dispatch(setChat(null))
                        navigate("/Chat", {replace: true});
                      }
                    });
              } else if (data.FK_sender?.username != user.userData.login) {
                  if (dmRoom?.dm_id == data.recepient)
                      return;
                  toast.info(`New Message From ${data.FK_sender?.username}`, {
                    onClick:()=>{
                      dispatch(setDmRoom({...dm, messages: [...dm.messages, message]}));
                      dispatch(setIsMenuOpen(true))
                      dispatch(setChat(null))
                      navigate("/Chat", {replace: true});
                    }
                  });
                  return ;
              }
              return ;
            }
          });
      // this for amin to complete 
      sock?.on("AcceptGameInv", (data:any) => {

        // alert("AcceptGameInv : " + data);
        
        data = JSON.parse(data);
        if (user.userData.login === data.recipient)
        {
          localStorage.removeItem("roomid");
          localStorage.removeItem("playernb");
        }
        let game : gameInvitation = {
          gameInfo: data.gameData,
          inviterId: data.sender,
          targetId: data.recipient,
          invitername: data.sender,
        };
        // alert(JSON.stringify(game));
        if (data === undefined) return;
        // console.log("AcceptGameInv : ", data);
        // alert(JSON.stringify(data));
        if (!ssocket)
        {
          ssocket = io(
            "ws://"+(process.env.REACT_APP_GAME_SERVER ? process.env.REACT_APP_GAME_SERVER : ("localhost:" + process.env.REACT_APP_GAME_PORT || "4000")),
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
          {
            // alert("connected to game server");
            dispatch(setPvSocket(ssocket))
          }
          else
            toast.error("Failed to connect to game server");
        }
        else
        {
          if (ssocket.connected && user.userData.login === data.recipient)
          {
            ssocket.disconnect();
            ssocket = io(
              "ws://"+(process.env.REACT_APP_GAME_SERVER ? process.env.REACT_APP_GAME_SERVER : ("localhost:" + process.env.REACT_APP_GAME_PORT || "4000")),
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
            {
              // alert("connected to game server");
              dispatch(setPvSocket(ssocket))
            }
            else
              toast.error("Failed to connect to game server");
          }
        }
        toast.dismiss();
        
        if (user.userData.login === data.recipient){
          // alert(game?.gameInfo?.roomId)
          ssocket.emit("join_private", {roomId: game?.gameInfo?.roomId}, (player: Player) =>{
          // alert("############" + JSON.stringify(player))
          if (player.roomId !== undefined && player.playerNb !== undefined) {
              localStorage.setItem("roomid", player.roomId?.toString());
              localStorage.setItem("playernb", "2");
              // onGameRequest();
              navigate("/leaderboard");
              setTimeout(()=> {navigate("/privateGame")}, 100);
          }
          else 
            {
                socket.disconnect();
                socket.connect();
                // onGameRequest();
            }
        // alert('accepted');
          });
          toast.info(`You have accepted ${data.sender}'s game invitation`);
        }
        else {
          // alert(game?.gameInfo?.roomId)
        //   ssocket.emit("join_private", {roomId: game?.gameInfo?.roomId}, (player: Player) =>{
        //   // alert("############" + JSON.stringify(player))
        //   if (player.roomId !== undefined && player.playerNb !== undefined) {
        //       localStorage.setItem("roomid", player.roomId.toString());
        //       localStorage.setItem("playernb", "1");
        //       // onGameRequest();
        //     navigate("/privateGame");
        //   }
        //   else 
        //     {
        //         socket.disconnect();
        //         socket.connect();
        //         // onGameRequest();
        //     }
        // // alert('accepted');
        //   });
        localStorage.setItem("roomid", game?.gameInfo?.roomId?.toString());
        localStorage.setItem("playernb", "1");
        toast.info(`${data.recipient} has accepted your game invitation`);
        navigate("/privateGame");
        }
        
      })
      return ()=>{
        sock?.off("AcceptGameInv");
        sock?.off("message");
        sock?.off("messageDM");
      }
    })
  // setInterval(() => {
  // }, 1000);
  return user ? (
    <div className='h-full m-0 p-0'>
    <div className="flex flex-row justify-center items-center !p-0">
      {/******************  modified from grid to flex ******************/}
      <div className="absolute top-0 left-0 w-full h-full !m-0 bg-gray-400 bg-opacity-0 flex flex-row grid-cols-app max-w-full overflow-hidden">
        <Header className="max-[1000px]:!w-[70px] transition ease-in-out duration-50" />
        <div className="text-3xl text-white w-full h-screen relative max-h-screen flex flex-nowrap justify-center items-center">
          <Outlet />
        </div>
        {/* <Footer className="border" /> */}
      </div>
    </div>
    {
    localStorage.getItem('firstTime') === 'true' && user && user.userData ?
        <SetProfile />
        :
        <></>
    }
    </div>
  )
   : 
  (<div className="flex flex-row justify-center items-center">
    <div className="absolute top-0 left-0 w-full h-full bg-gray-400 bg-opacity-20">
      {
        window.location.pathname === "/authError" ?
          <div className="flex flex-col justify-center items-center h-full w-full">
            <p className="text-xl drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] text-red-800">Authentication Error</p>
            <Auth42Button />
          </div>
           : 
          window.location.pathname === "/verify" ?
            <div className="flex flex-col justify-center items-center h-full w-full">
              <TwoFactorVerification />
            </div>
             : 
            <Auth42Button className="flex align-middle justify-center flex-col w-full h-full" />
      }
    </div>
  </div>)
}


function Logout() {
  const socket = useSelector((state: RootState) => state.socket.socket);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  navigate("/", { replace: true }); // Properly redirect using React Router
  dispatch(setUser(null));
  localStorage.removeItem('jwtToken');
  
  socket?.disconnect();
  return null; // or a spinner/loading indicator while the side effects are completing
}

// const [isMenuOpen, setIsMenuOpen] = useState(true);
const router = createBrowserRouter([
  {
    
    element: <Template />,
    children: [
      {
        path: "/",
        element: (
          <Start />
        )
      },
      {
        path: "login",
        element: (
          <Auth42Button />
        )
      },
      {
        path: "logout",
        element: (
          <Logout />
        ),
      },
      {
        path: "play",
        element: (
          <Game />
        )
      },
      {
        path: "leaderboard",
        element: (
          <LeaderBoard />
        )
      },
      {
        path: "play",
        element: (
          <Game />
        )
      },
      {
        path: "chat",
        element: (
          <Chat />
        )
      },
      {
        path: "profile",
        element: (
          <Profile />
        )
      },
      {
        path: "friends",
        element: (
          <Friends />
        )
      },
      {
        path : "privateGame",
        element :(
          <Game pvtGame ={true}/>
        )
      },
      {
        path: "success",
        element: (
          <p>Success</p>
        )
      },
      {
        path: "Chat",
        element: (
          <Chat />
        )
      },
      {
        path: "Chat/Profile/:id",
        element:(
          <ChatProfile/>
        )
      },
      {
        path: "/Profile/:name",
        element:(
          <UserProfile/>
        )
      },
      {
        path: "*",
        element: (
          <p>404</p>
        )
      },
    ]
  }
]);

const Confirm = (props: any) => {
  const socket = useSelector((state: RootState) => state.socket.socket);
  const refuse = () =>{
    socket?.emit("RefuseGameInv", {sender: props.data.sender, recipient: props.data.recipient, status: "refused"});
    props.closeToast();
  }
  const accept = () =>{
    socket?.emit("AcceptGameInv", {sender: props.data.sender, recipient: props.data.recipient, status: "accepted", gameData: props.data.gameData?JSON.parse(props.data.gameData):{}});
    props.closeToast();
  }
  setTimeout(() => {
    refuse();
  },10000)
  return (
    <>
      <p className='flex flex-row flex-nowrap'>
      <GiGamepadCross className="scale-[200%] font-bold mx-1 text-lg"/> 
        You Have a new game invitation from {props.data?.sender}
      </p>
      <button className="nes-btn is-success" onClick={accept}>Accept</button>
      <button className="nes-btn is-error" onClick={refuse}>Refuse</button>
    </>
  );
}
function App() {
  interface IUserStatus {
    key: number;
    userModel: { id: number; status: number };
  }
  let userstatusTab: IUserStatus[] = [];

  const [usersStatus, setUsersStatus] = useState<IUserStatus[] | undefined>(
    undefined
  );

  // const navigate = useNavigate();

  useEffect(() => {
    socket.on("update-status", (data, str: string) => {
      userstatusTab = [];
      for (let i = 0; i <= data.length - 1; i++) {socket
        let newUser: IUserStatus = {
          key: data[i][0],
          userModel: { id: 0, status: -1 },
        };
        newUser.userModel.id = data[i][0];
        newUser.userModel.status = data[i][1];
        userstatusTab.push(newUser);
      }
      // console.log(userstatusTab);
      // console.log(userstatusTab);

      setUsersStatus(userstatusTab);
    });
    // return () => {
    //   socket.off('update-status')
    // }
  }, [usersStatus]);
  const dispatch = useDispatch();
  const { user, connectedUsers, conversations ,sock, dms, dmRoom, Blocked, profile} = useSelector((state: RootState) => {
    return {
      user: state.user.user,
      connectedUsers: state.connectedUsers.connectedUsers,
      conversations: state.conversations.conversations,
      sock: state.socket.socket as Socket,
      dms: state.dms.dms,
      dmRoom: state.dmRoom.dmRoom,
      Blocked: state.Blocked.Blocked,
      profile: state.profile.user,
    }
  });

    const getConversations = async () => {
      await axios.get((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/chat/get",
      {
          headers:{ Authorization: `Bearer ${user.jwt}`}
      }
      ).then((res:any)=> {
          const arr:any[] = res.data as any[];
          const arr2:any[] = [];
          arr?.map((elem:any)=>{
              arr2?.push({
                  id:elem.chat_id,
                  image: ((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/chat/image/" + elem.chat_id) + "?"+new Date().getTime(),
                  type:elem.chatType,
                  name:elem.chatName,
                  chatAdmins: elem.chatAdmins,
                  conversation: elem?.messages? elem?.messages:[],
                  chatMembers: elem.chatMembers,
                  admins: elem.admins,
                  owner_username: elem.FK_chatOwner?.username,
                  GroupState: elem.GroupState,
              })

          })
          dispatch(setConversations(arr2));
      }).catch((err:any)=> {
          console.log("Conv err : ", err.message)
      })
    }
    const getDms = async () => {
      await axios.get((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/dms/",{
        headers:{ Authorization: `Bearer ${user?.jwt}`}
      }).then((res:any)=>{
        if (res.data?.status === 5000) {
          toast.error("internal server error");
          return ;
        }
        console.log("getDms res : ", res.data);
        dispatch(setDms(res.data));
      })
      .catch((err:any)=>{
        console.log("getDms err : ", err.message);
      })
    }

    const getBlocked = async () => {
      await axios.get((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/block/",{
        headers:{ Authorization: `Bearer ${user?.jwt}`}
      }).then((res:any)=>{
        if (res.data?.status === 500) {
          toast.error("internal server error");
          return ;
        }
        console.log("getBlocked res : ", res.data);
        dispatch(setBlocked(res.data));
      }).catch((err:any)=>{
        console.log("getBlocked err : ", err.message);
      })
    }
    useEffect(() => {
      if (user?.userData?.login != undefined && conversations.length == 0)
        getConversations();
      if (user?.userData?.login != undefined && dms.length == 0)
        getDms();
      if (user?.userData?.login != undefined && Blocked.length == 0)
        getBlocked();
      return () => {}
    }, [user]);
    const { chat } = useSelector((state: RootState) => {
      return {
        chat: state.chat.chat
      }
    });


    useEffect(() => {
    if (user?.userData?.login != undefined && !sock) {
      try
      {
        const socket = io("ws://localhost:8080", {
          transports: ['websocket'],
          query: {
            "user": user?.userData?.login,
            "jwt": `${user.jwt}`
          },
        });
        dispatch(setSocket(socket));
        console.info("socket initiated !");

      }catch(err:any) {
        console.log("error : ", err.message);
      }
    }
    return () => {}
  });

  useEffect(()=>{
    sock?.on("connection", (data: any) => {
      data = JSON.parse(data);
      if (data.status == 500) {
        toast.error(data.message);
        return;
      }
      dispatch(setConnectedUsers(data.Connected))
      console.log("connected Users : ", connectedUsers);
    });
          
    sock?.on("error", (err:any) => {
      console.log("err");
    });
    sock?.on("disconnection", (data:any) => {
      data = JSON.parse(data);
      dispatch(setConnectedUsers(data.Connected));
    });
      sock?.on("CreateDm", (data : any) => {
        if (data == undefined) return;
        data = JSON.parse(data);
        console.log("CreateDm : ", data);
        if (!dms.find((elem:any)=> elem.dm_id == data.dm_id)) {
          dispatch(setDms([
            data,
            ...dms
          ]))
        }
        // if ()
        // dispatch(setDmRoom(data));
        // dispatch(setChat(null));
      })
      //deleteChat  event listener
      sock?.on("chatDel", (data : any) => {
        if (data == undefined) return;
        data = JSON.parse(data)
        toast.info(`Chat deleted by owner: ${conversations.find((elem:any)=> elem.id == data.chat)?.name}`)
        dispatch(setConversations(
          conversations.filter((elem:any)=>elem.id != data.chat)
        ))
        if (chat?.id == data.chat) {
          dispatch(setChat(null));
          dispatch(setIsMenuOpen(true))
        }
      });
      //left chat event listener
      sock?.on("leftChat", (data : any) => {
        if (data===undefined) return;
        data = JSON.parse(data);
        toast.info(`User ${data?.FK_user?.username} left chat: ${conversations.find((elem:any)=> elem.id == data?.chat_id)?.name}`)
        if (data?.FK_user?.username === user?.userData.login) {
          dispatch(setConversations(conversations.filter((elem:any)=>elem.id != data?.chat_id)))
          if (chat?.id === data?.chat_id ){
            dispatch(setChat(null));
            dispatch(setIsMenuOpen(true))
          }
        }
        else{
          dispatch(setConversations([
            {
              ...conversations.find((elem:any)=>elem.id == data?.chat_id),
              chatMembers: 
              conversations.find((elem:any)=>elem.id == data?.chat_id)?.chatMembers.filter((elem:any)=>elem.chatMember_id != data?.chatMember_id),
              chatAdmins: conversations.find((elem:any)=>elem.id == data?.chat_id)?.chatAdmins.filter((elem:any)=>elem.chatAdmin_id != data?.chatAdmin_id) ||
              conversations.find((elem:any)=>elem.id == data?.chat_id)?.chatAdmins,
            },
              ...conversations.filter((elem:any)=>elem.id != data?.chat_id)
          ]))
        }

      })
      sock?.on("unauthorized", (data : any) => {
        if (data == undefined) return;
        data = JSON.parse(data)
        toast.error(data.message);
      });

      sock?.on("joinChat", (data:any)=>{
        if(data==undefined) return;
        data = JSON.parse(data);
        console.log("joinChat : ", data);
        dispatch(setConversations([
          {...conversations.find((elem:any)=>elem.id == data.id), chatMembers: data.chatMembers},
            ...conversations.filter((elem:any)=>elem.id != data.id)
        ]))
        if (chat?.id === data.id){
          dispatch(setChat({...chat, chatMembers: data.chatMembers}))
        }
        toast.info(`A new user (${data.user}) Joined ${data.name} chatGroup .`)
      })
      sock?.on("kicked", (data:any)=>{
        if(data==undefined) return;
        data = JSON.parse(data);
        if (data.FK_user?.username === user?.userData.login) {
          toast.info(`You have been kicked from ${data.FK_chat.chatName} chatGroup .`)
          dispatch(setConversations(conversations.filter((elem:any)=>elem.id != data.chat_id)))
          if (chat?.id === data.chat_id ){
            dispatch(setChat(null));
            dispatch(setIsMenuOpen(true))
          }
        }else{
          toast.info(`User ${data.FK_user?.username} has been kicked from ${data.FK_chat.chatName} chatGroup .`)
          dispatch(setConversations(
            conversations.map((elem:any)=>{
              if (elem.id == data.chat_id){
                return {...elem, chatMembers: elem.chatMembers.filter((member:any)=>member.FK_user.username != data.FK_user.username)}
              }
              return elem;
            })
          ))
          if (chat?.id === data.chat_id){
            dispatch(setChat({...chat, chatMembers: chat.chatMembers.filter((member:any)=>member.FK_user.username != data.FK_user.username)}))
          }
        }
      })

      sock?.on("chatUpdated", (data:any)=>{
        if(data==undefined) return;
        data = JSON.parse(data);
        console.log("chatUpdated : ", conversations.find((elem:any)=>elem.id == data.chat_id))
        toast.info(`Chat ${conversations.find((elem:any)=>elem.id == data.chat_id)?.name} has been updated .`)
        dispatch(setConversations([
          {...conversations.find((elem:any)=>elem.id == data.chat_id),
            name: data?.chatName || conversations.find((elem:any)=>elem.id == data.chat_id)?.name,
            GroupState: data?.GroupState || conversations.find((elem:any)=>elem.id == data.chat_id)?.GroupState,
            image:(process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/chat/image/" + data.chat_id + "?"+new Date().getTime(),
            chatBio: data?.chatBio || conversations.find((elem:any)=>elem.id == data.chat_id)?.chatBio,
          },
          ...conversations.filter((elem:any)=>elem.id != data.chat_id)
        ]))
        if (chat?.id === data.chat_id){
          dispatch(setChat(
            {
              ...chat,
              name: data?.chatName? data?.chatName : chat?.name,
              GroupState: data?.GroupState? data?.GroupState : chat?.GroupState,
              image:(process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/chat/image/" + data.chat_id + "?"+new Date().getTime(),
              chatBio: data?.chatBio? data?.chatBio : chat?.chatBio,
          }))
        }

      })

      sock?.on("promoteMember", (data:any)=>{
        if(data==undefined) return;
        data = JSON.parse(data);
        console.log("promoteMember : ", data);
        const conversation = conversations.find((elem:any)=>elem.id == data.chat_id);
        dispatch(setConversations([{...conversation, chatAdmins:[...conversation.chatAdmins || [], data]},
          ...conversations.filter((elem:any)=>elem.id != data.chat_id)
        ]));
        if (chat?.id === data.chat_id){
          dispatch(setChat({...chat, chatAdmins:[...chat.chatAdmins || [], data]}));
        }
        toast.info(`User ${data?.FK_user?.username} has been promoted to admin in ${conversations.find((elem:any)=>elem.id == data.chat_id)?.name} chatGroup .`)
      })
      sock?.on("demoteAdmin", (data:any)=>{
        if(data==undefined) return;
        data = JSON.parse(data);
        console.log("demoteAdmin : ", data);
        const conversation = conversations.find((elem:any)=>elem.id == data.chat_id);
        dispatch(setConversations(
          [
            {...conversation, chatAdmins:conversation.chatAdmins?.filter((elem:any)=>elem.FK_user.username != data.FK_user.username) || []},
          ...conversations.filter((elem:any)=>elem.id != data.chat_id)]));
        if (chat?.id === data.chat_id){
          dispatch(setChat({...chat, chatAdmins:chat.chatAdmins?.filter((elem:any)=>elem.FK_user.username != data.FK_user.username) || []}));
        }
        toast.info(`User ${data?.FK_user?.username} has been demoted from admin in ${conversations.find((elem:any)=>elem.id == data.chat_id)?.name} chatGroup .`)
      });
      // when the friends system is implemented need to add you been added/removed/(you are now an group admin)/(not a group admin anymore)
      // to a chat event listener
      sock?.on("giveOwnership", (data:any)=>{
        if(data==undefined) return;
        data = JSON.parse(data);
        console.log("giveOwnership : ", data);
        const conversation = conversations.find((elem:any)=>elem.id == data.chat_id);
        dispatch(setConversations([{...conversation, owner_username:data.FK_chatOwner.username},
          ...conversations.filter((elem:any)=>elem.id != data.chat_id)
        ]));
        if (chat?.id === data.chat_id){
          dispatch(setChat({...chat, owner_username:data.FK_chatOwner.username}));
        }
        toast.info(`User ${data?.FK_chatOwner?.username} has been given ownership of ${conversations.find((elem:any)=>elem.id == data.chat_id)?.name} chatGroup .`)
      })
      sock?.on("AddToGroup", (data:any)=>{
        if (data === undefined) return;
        data = JSON.parse(data);
        console.log("AddToGroup : ", data);
        const conversation = conversations.find((elem:any)=>elem.id === data.chat_id);
        if (conversation)
        {
          dispatch(
            setConversations([
              {...conversation, chatMembers: data.chatMembers},
              ...conversations.filter((elem:any)=>elem.id != data.chat_id)]
            )
          )
          if (chat?.id === data.chat_id){
            dispatch(setChat({...chat, chatMembers: data.chatMembers}));
          }
          toast.info(`An admin added a new member to (${conversations.find((elem:any)=>elem.id == data.chat_id)?.name}) chatGroup .`)
        }else {
          dispatch(
            setConversations([
              {
                id: data.chat_id,
                image: ((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/chat/image/" + data.chat_id) + "?"+new Date().getTime(),
                type: data.chatType,
                name: data.chatName,
                chatAdmins: data.chatAdmins,
                conversation: data?.messages? data?.messages:[],
                chatMembers: data.chatMembers,
                owner_username: data.FK_chatOwner?.username,
                GroupState: data.GroupState,
              },
              ...conversations
            ])
            )
            toast.info(`You have been added to ${data?.chatName} chatGroup .`)
          }
      });

      sock?.on("blocked", (data:any)=>{
        if (data === undefined) return;
        data = JSON.parse(data).data;
        console.log("blocked : ", data);
        dispatch(setBlocked([...Blocked, data]));
        if (user.userData.login === data.Blocker_Username)
          toast.info(`You have blocked ${data.Blocked_Username}`);
      });
      sock?.on("unblocked", (data:any)=>{
        if (data === undefined)return;
        console.log("unblocked : ", data);
        data = JSON.parse(data).data;
        dispatch(setBlocked(Blocked.filter((elem:any)=>elem.Unblocker != data.Unblocker)));
        // if (user.userData.login === data.Unblocker)
        //   toast.info(`You have unblocked ${data.Blocked_Username}`);
      })
      sock?.on("banned", (data:any)=>{
        if (data === undefined)return;
        data = JSON.parse(data);
        if (user.userData.login === data.Banned_user) {
          toast.info(`You have been banned from ${conversations.find((elem:any)=>elem.id == data.chat_id)?.name} chatGroup By ${data.BannedBy_user} .`);
            dispatch(setConversations(conversations.filter((elem:any)=>elem.id != data.chat_id)));
            if (chat?.id === data.chat_id){
              dispatch(setChat(null));
              dispatch(setIsMenuOpen(true))
            }
        }
        else {
          if (user.userData.login === data.BannedBy_user)
            toast.info(`You have banned ${data.Banned_user} from ${conversations.find((elem:any)=>elem.id == data.chat_id)?.name} chatGroup .`);
          dispatch(setConversations(
            conversations.map((elem:any)=>{
              if (elem.id == data.chat_id){
                return {...elem, chatMembers: elem.chatMembers.filter((member:any)=>member.FK_user.username != data.Banned_user)}
              }
              return elem;
            })
          ))
          if (chat?.id === data.chat_id){
            dispatch(setChat({...chat, chatMembers: chat.chatMembers.filter((member:any)=>member.FK_user.username != data.Banned_user)}))
          }
        }
      })
      sock?.on("friendDeleted", (data:any) => {
          if (data === undefined) return;
          data = JSON.parse(data);
          console.log("friendDeleted : ", data);
          dispatch(
            setDms(dms.filter((elem:any)=>elem.dm_id != data.DM.dm_id))
          )
          if (dmRoom?.dm_id === data.DM.dm_id){
            dispatch(setDmRoom(null));
            dispatch(setIsMenuOpen(true))
          }
      })
      sock?.on("updateData", async (dt:any) => {
        const data = await axios.get((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/resume/", {
          headers: { Authorization: `Bearer ${user.jwt}` }
        }).then((response) => response.data);
        if (!data)
          return;
        console.log("updateData : ", data);
        dispatch(setUser({jwt: user.jwt, userData: data.userData}));
        dispatch(setFriends(data.Friends.filter((userData:any) => {
          return !(userData.state === "pending" && userData.user_id === user.userData.login)
        })));
        dispatch(setAwaiting(data.Friends.filter((userData:any) => {
          return (userData.state === "pending" && userData.user_id === user.userData.login)
        })));
        dispatch(setUsers(data.Users));
        const getProfile = await axios.get((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/profile/"+profile?.username, {
          headers: { Authorization: `Bearer ${user.jwt}` }
        });
        if (getProfile?.data)
          dispatch(setProfile(getProfile.data));
      })

      sock?.on('friendRequest', (data:any) => {
        toast.info(`You have a new friend request from ${data}`);
      })
      sock?.on("gameInvitation", (data:any) => {
        if (data === undefined) return;
        data = JSON.parse(data);
        // alert(JSON.stringify(data))
        // console.log("gameInvitation : ", data);
        // console.log("user : ", user.userData.login);
        console.log(`############# ${user.userData.login} - ${data.recipient} #############`)
        if (user.userData.login === data.recipient){
          // console.log("here ??");
          // toast.info(`You have a new game invitation from ${data.sender}`,{
          //   autoClose: false,
          // });
          toast(<Confirm />,{
            autoClose: false,
            style:{
              background: "linear-gradient(90deg, rgba(57,81,154,1) 22%, rgba(7,61,71,1) 100%)",
              color: "white",
              borderRadius: "10px",
            },
            draggable: false,
            closeOnClick: false,
            closeButton: false,
            data: data,
          });
        }
        else {
          toast.info(`Your game invitation to ${data.recipient} has been sent`);
        }
      })

      
      // this for amin to complete 
      // sock?.on("AcceptGameInv", (data:any) => {
      //   if (data === undefined) return;
      //   data = JSON.parse(data);
      //   console.log("AcceptGameInv : ", data);
      //   toast.dismiss();
      //   // alert(JSON.stringify(data));
      //   // socket.emit("join_private", {roomId: game!.gameInfo.roomId}, (player: Player) =>{
      //   //   if (player.roomId !== undefined && player.playerNb !== undefined) { 
      //   //       localStorage.setItem("roomid", player.roomId.toString());
      //   //       localStorage.setItem("playernb", player.playerNb.toString());
      //   //       // onGameRequest();
      //   //       navigate("/privateGame");
      //   //   }

      //   if (user.userData.login === data.recipient){
      //     toast.info(`You have accepted ${data.sender}'s game invitation`);
      //   }
      //   else {
      //     toast.info(`${data.sender} has accepted your game invitation`);
      //   }
      // })
      return () => {
        sock?.off("connection");
        sock?.off("disconnection");
        sock?.off("error");
        sock?.off("message");
        sock?.off("messageDM");
        sock?.off("chatDel");
        sock?.off("unauthorized");
        sock?.off("leftChat");
        sock?.off("joinChat");
        sock?.off("kicked");
        sock?.off("chatUpdated");
        sock?.off("promoteMember");
        sock?.off("demoteAdmin");
        sock?.off("giveOwnership");
        sock?.off("AddToGroup");
        sock?.off("blocked");
        sock?.off("unblocked");
        sock?.off("banned");
        sock?.off("friendDeleted");
        sock?.off("CreateDm");
        sock?.off("updateData");
        sock?.off("friendRequest");
        sock?.off("gameInvitation");
    }

  })

  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("jwtToken") !== null)
    {
      if (user === null)
        dispatch(setUser({jwt: localStorage.getItem("jwtToken") as string}));
    }
    if (user !== null && !isLoaded)
    {
      axios.get((process.env.BACKEND_SERVER ? process.env.BACKEND_SERVER : "http://localhost:5000")+"/profile", 
      { headers: { Authorization: `Bearer ${user.jwt}` } })
      .then((response) => {
        // if (response.data.status === 401)
        // {
        //   dispatch(setUser(null));
        //   localStorage.removeItem('jwtToken');
        //   setIsLoaded(true);
        //   return;
        // }
        // conso
        // console.log("")
        dispatch(setUser({jwt: user.jwt, userData: response.data.userData}));
        setIsLoaded(true);
      })
      .catch((error) => {
        console.log("App.tsx func App() ");
        dispatch(setUser(null));
        localStorage.removeItem('jwtToken');
        setIsLoaded(true);
      });
    }
    return () => {}
  })
  if (window.location.pathname === "/success") {
    console.log(window.location.search);
    const params = new URLSearchParams(window.location.search);
    if (!params.has('jwt'))
      window.location.href = "/authError";
    // else {
    //   // localStorage.setItem('jwtToken', params.get('jwt') as string);
    //   // window.location.href = "/";
    // }
  }

  return (
    <div className="App">
      <canvas id="Bg3D"></canvas>
      <Three />
      <Main>
        <div className="absolute top-0 left-0 w-full h-full bg-gray-400 bg-opacity-40 grid grid-flow-row grid-rows-app !overflow-scroll max-w-full">
          <RouterProvider router={router} />
        </div>
      </Main>
      {/* The App Wrapper */}

      <audio id="clickSound" src="/assets/sounds/click.mp3" />
      <audio id="clickSoundV2" src="/assets/sounds/clickv2.mp3" />
      <audio id="hoverSound" src="/assets/sounds/hover.wav" />
      <ToastContainer className="text-sm" />
    </div>
  );
}

export default App;
