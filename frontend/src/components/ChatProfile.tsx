import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from 'react-router-dom';
import { RootState } from "../state/store";
import axios from "axios";
import Button from "./Button";
import ChatProfile_General from "./ChatProfile_General";
import ChatProfile_Members from "./ChatProfile_Members";
import User from "./User";


const ChatProfile = (props:any)=> {
    const user= useSelector((state:RootState)=>state.user.user);
    const Conversations = useSelector((state:RootState)=>state.conversations.conversations);
    const {id} = useParams()
    const [loading, setLoading] = useState<boolean>(true);
    const [isGeneral, setIsGeneral] = useState<boolean>(true);
    const [data, setData] = useState<any>({});
    const getChatProfile = async () => {
        // get the chat profile
        if (!user) return console.log("user not found");
        console.log("chat profile id : ", id);
        if (!id) return console.log("chat id not found");
        await axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/chat/profile/"+id,
        {
            headers:{ Authorization: `Bearer ${user.jwt}`
        }}).then((res:any)=>{
            console.log("chat profile : ", res.data);
            setLoading(false);
            setData(res.data);
        }).catch((err:any)=>{
            console.log("err : ", err);
            setLoading(false);
        })
    }
    useEffect(()=>{
        getChatProfile();
        return () => {}
    },[Conversations])
    if (loading) {
        return <div>Loading ...</div>
    }else if(!data)
        return <div className="text-sm">Chat Not Found</div>
    else if (!user || !user?.userData)
        return <div className="text-sm">Unauthorized : try refreshing or Login again</div>
    return <>
        {/* <div className="z-10 absoltute back"></div> */}
        <div className="flex flex-col items h-full w-full bg-gradient-to-b from-slate-800  to-transparent backdrop-blur-2xl">
            <div className="relative flex flex-row w-full" >
                <button className={"w-1/2 p-5 mb-[10px] !outline-none !border-0 max-md:text-sm"
                + (isGeneral? " disabled  bg-transparent underline"
                :" bg-gradient-to-b from-slate-800 to-slate-700")}
                 disabled={isGeneral} onClick={()=>{setIsGeneral(true)}}>
                    General
                </button>
                <button className={"w-1/2 p-5 mb-[10px] !outline-none !border-0 max-md:text-sm"
                + (!isGeneral? " disabled bg-transparent underline"
                :" bg-gradient-to-b from-slate-800 to-slate-700")} disabled={!isGeneral} onClick={()=>{setIsGeneral(false)}}>
                    Members
                </button>
            </div>
            <div className="max-h-[90%] overflow-y-auto overflow-x-hidden no-scroll">
                {
                    isGeneral?
                    <ChatProfile_General data={data} setData={setData} />
                    :
                    <ChatProfile_Members data={data} setData={setData} deleteChat={props.deleteChat}/>
                }
            </div>
        </div>
    </>
}




export default ChatProfile;