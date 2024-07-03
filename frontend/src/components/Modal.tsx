import React, { useEffect, useState } from "react";
import { MdAddCircle } from "react-icons/md";
import { IoEnter } from "react-icons/io5";
import 'react-responsive-modal/styles.css';
import { Modal as Mod } from 'react-responsive-modal';

import { IoMdCloseCircle } from "react-icons/io";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { RootState } from "../state/store";
import { setSocket } from "../state/socket/socketSlice";
import Button from "./Button";

export const Modal = (props : any) => {
    const user = useSelector((state: RootState) => state.user.user);
    const [Friends, setFriends] = useState([
        {id:"01", name: "Jack Reacher", isChecked: false},
        {id:"02", name: "Jon Reacher", isChecked: false},
        {id:"03", name: "Toji Zennen", isChecked: false},
        {id:"04", name: "Jing wo", isChecked: false},
    ])
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const element = document.getElementById('password') as HTMLInputElement;
        if (element === null) return;
        element.type = showPassword ? "text" : "password";
    },[showPassword]);

    useEffect(() => {
        const element = document.getElementById('password_conf') as HTMLInputElement;
        if (element === null) return;
        element.type = showConfirmPassword ? "text" : "password";
    },[showConfirmPassword]);
    const handleCheck = (e: any)=>{
        const isChecked: boolean = e.target.checked;

        const element = document.getElementById('password_setion')  as HTMLElement;
        element.style.display = isChecked && e.target.value == 1 ? 'none' : 'block';
        console.log(isChecked);
        return ;
    };
    return <>
                <Mod
                        open={props.open}
                        onClose={() => props.setOpen(false)}
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
                        <form action={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/createChat"} 
                        method="post">
                            <div className="nes-container is-rounded rounded-md is-dark min-w-[500px] with-title is-centered">
                                <p className="title">Add Room</p>
                                <div className='flex flex-row FOR_IMAGE'>
                                    <img 
                                        src='
                                                data:image/png;base64,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
                                            '
                                        alt="img" 
                                        className="nes-avatar is-large object-cover rounded-xl"
                                        id='srcImg'
                                    />
                                    <label id='img' htmlFor="groupImg" className='nes-input w-full text-sm max-w-[350px] text-gray-300 overflow-hidden whitespace-nowrap text-ellipsis'>ChatRoom image...</label>
                                    <input type="file" id='groupImg' accept="image/*" className="hidden" onChange={(e: any) => {
                                        console.log("image", e.target.files[0].name)
                                        const element = document.getElementById('img') as HTMLInputElement;
                                        element.textContent = e.target.files[0].name;
                                        const image = document.getElementById('srcImg') as HTMLImageElement;
                                        image.src = URL.createObjectURL(e.target.files[0]);
                                    }} />
                                </div>
                                <div className='flex flex-row items items-center'>
                                    <label htmlFor="chatName" className='w-3/6'>Name *:</label>
                                    <input type="text" id='chatName' className="nes-input w-3/6 text-sm text-black" placeholder="Chat Name ..." />
                                </div>
                                {/* is Public */}
                                <div className='flex flex-col mt-2'>
                                    <div>
                                        <p>is Public ?*</p>
                                    </div>

                                    <div className='w-full flex justify-around px-5 '>
                                        <label>
                                            <input type="radio" className="nes-radio is-dark p-1" name="is_public" value='1' onClick={handleCheck}/>
                                            <span>Yes</span>
                                        </label>

                                        <label>
                                            <input type="radio" className="nes-radio is-dark" name="is_public" value='0' checked onClick={handleCheck}/>
                                            <span>No</span>
                                        </label>                    
                                    </div>
                                    <div id='password_setion'>
                                        <div className='flex flex-row items-center'>
                                            <input type="password" name='password' id='password' className="nes-input is-rounded w-5/6 text-sm text-black" placeholder="Password* ..." />
                                            {showPassword ? 
                                            <FaRegEyeSlash className="text-3xl p-0 m-0 text-blackbg-white outline-none" 
                                            onClick={() => {setShowPassword(false)}} />
                                            : 
                                            <FaRegEye className="text-3xl p-0 m-0 text-blackbg-white outline-none" 
                                            onClick={() => {setShowPassword(true)}} />}

                                        </div>
                                        <div className='flex flex-row items-center'>
                                            <input type="password" name='password' id='password_conf' className="nes-input is-rounded w-5/6 text-sm text-black" placeholder="Confirm Password* ..." />
                                            {showConfirmPassword ?
                                            <FaRegEyeSlash className="text-3xl p-0 m-0 text-blackbg-white outline-none" onClick={() => {setShowConfirmPassword(false)}} />
                                            : 
                                            <FaRegEye className="text-3xl p-0 m-0 text-blackbg-white outline-none" onClick={() => {setShowConfirmPassword(true)}} />}                                    
                                        </div>
                                    </div>
                                    {/* friends list */}
                                    <div className="flex flex-col w-[500px] min-w-[500px] h-[450px] border border-white rounded-lg max-h-[450px] overflow-y-auto mt-4">
                                            {Friends.map((friend : any) => {
                                                return <>
                                                    <div className="flex flex-row items-center mb-1 p-2 nes-container">
                                                        <img className="nes-avatar is-large object-cover rounded-xl" src={
                                                             (process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+user.userData.login + '?' + new Date().getTime()
                                                             }  alt="" />
                                                        <p className="text-md text-white">
                                                            {friend.name}
                                                        </p>
                                                        <input type="checkbox" className="" id={friend.id} checked={friend.isChecked} onChange={()=> {console.log(friend.isChecked);friend.isChecked = !friend.isChecked}} />
                                                    </div>
                                                </>
                                            })}
                                    </div>
                                        
                                    <Button type="submit" name="create ChatRoom"/>
                                </div>
                            </div>
                        </form>
                    </Mod>
                    </>
}