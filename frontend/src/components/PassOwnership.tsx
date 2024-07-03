import React, { useEffect, useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import Modal from "react-responsive-modal";
import Button from "./Button";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../state/store";


const PassOwnership = (props:any) => {

    const [disabled, setDisabled] = useState<boolean>(true);
    const [selectedAdmin, setSelectedAdmin] = useState<Number>(0)
    const {chat, user, socket} = useSelector((state:RootState)=>{return {
        chat : state.chat.chat,
        user : state.user.user,
        socket : state.socket.socket
    }
    });
    const [admins, setAdmins] = useState<any>([])
    const getAdmins = async () => {
        // console.log("chat : ", user.userData)
    await axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + "/chat/admins/" + chat.id, {
        headers:{Authorization: `Bearer ${user.jwt}`}
    }).then((res:any)=>res.data.filter((admin:any)=>admin.FK_user.username != user.userData.login))
    .then((data:any)=>{
        if (data.status != undefined && data.status === 500 ) {
            toast.error("Server Error: refresh page and try again");
            return;
        }
        console.log("admins : ", data);
        setAdmins(data);
    }).catch((err:any)=>{
        console.log("err : ", err.message);
        toast.error("Server Error: refresh page and try again");
    })
    }
    useEffect(()=>{
        if (chat.id != undefined && chat.id != null)
            getAdmins();
    }, [props.OwnerModuleOpen])
    const giveOwnership = async () => {
        if (admins.find((admin:any)=>admin.chatAdmin_id === selectedAdmin)) {
            socket.emit("giveOwnership", {chat_id:chat.id, newOwner:selectedAdmin, user:user?.userData?.login});
        }else
            toast.error("You can't give ownership to a member who is not an admin");
    }
    useEffect(()=>{
        console.log("selectedAdmin : ", selectedAdmin);
        if (selectedAdmin)
            setDisabled(false);
        else
            setDisabled(true);
    }, [selectedAdmin])
    return <>
            <Modal
            open={props.OwnerModuleOpen}
            onClose={() => props.setOwnerModuleOpen(false)}
            center
            closeIcon={<IoMdCloseCircle className="text-3xl text-white bg-transparent outline-none border-0" />}
            classNames={{
                overlayAnimationIn: 'customEnterOverlayAnimation',
                overlayAnimationOut: 'customLeaveOverlayAnimation',
                modalAnimationIn: 'customEnterModalAnimation',
                modalAnimationOut: 'customLeaveModalAnimation',
            }}
            // styles={="nes-container is-rounded is-dark"}
            animationDuration={400}
                >
                  <div className="nes-container is-rounded rounded-md is-dark min-w-[500px] with-title is-centered" >
                    <p className="title">Chose next owner</p>
                    <div className="flex flex-col justify-center items items-center is-rounded">
                        {/* for listing the members and admins */}
                        <section className="nes-container w-[350px] min-h-[200px] max-h-[300px] tansition ease-in-out m-[6px] is-rounded bg-yellow-50 p-[5px] overflow-y-auto">
                            {/* here we should be mapping through all admins */}
                            {
                                admins?.map((admin:any, index:number)=>{
                                    return <div key={index}>
                                        <button
                                            key={admin?.FK_user.user_id}
                                            onClick={()=>{setSelectedAdmin(admin?.chatAdmin_id)}}
                                            disabled={selectedAdmin === admin.chatAdmin_id}
                                            className={' nes-btn nes-container !my-[6px] is-rounded is-black flex flex-row items-center  !bg-slate-500 !bg-opacity-45 justify-between h-[70px] w-full ' + (selectedAdmin === admin.chatAdmin_id? "is-disabled":"")}>
                                                <div className='flex flex-row items-center h-full'>
                                                    <img src={
                                                        admin?.FK_user.image
                                                    } alt="avatar" className="nes-avatar is-large object-cover rounded-xl pr-3 !min-h-[64px] !min-w-[64px] mr-4" />
                                                    <p className='text-l overflow-auto text-ellipsis w-full '>{admin.FK_user.username}</p>
                                                    {/* <span className='flex flex-col flex-nowrap border-l-2 border-gray-600 absolute right-0 p-1'>
                                                        <p className='text-xs text-gray-600 border-b-2 border-gray-600 mb-0 pb-1'></p>
                                                    </span> */}
                                                </div>
                                            </button>
                                    </div>
                                })
                            }
                        </section>
                        <Button className={"text-sm !bg-slate-800 !text-white is-rounded" + (disabled? " is-disabled":"")} onClick={giveOwnership} disabled={disabled}>Give ownership</Button>
                        
                    </div>

                  </div>
            </Modal>
    </>

};

export default  PassOwnership;