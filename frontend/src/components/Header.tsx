import React from 'react';
import {Link} from 'react-router-dom';
import Button from './Button';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';

import { TbLogout2 } from 'react-icons/tb';
import { CgProfile } from "react-icons/cg";
import { HiMiniHome } from "react-icons/hi2";
import { BiSolidGroup } from "react-icons/bi";
import { FaRankingStar } from "react-icons/fa6";
import { IoMdChatbubbles } from "react-icons/io";
import { MdOutlineVideogameAsset } from "react-icons/md";
import { FaUserFriends } from 'react-icons/fa';
import { RxHamburgerMenu } from "react-icons/rx";

const LogoutButton = (props:any) => {
    const user = useSelector((state: RootState) => state.user.user);
    // const dispatch = useDispatch();
    if (user !== null)
        return (
        <Button href="/logout" className="nes-btn text-l is-error !text-black text-lg p-0" onClick={(event:any)=>{
            const audio = document.getElementById('clickSoundV2') as HTMLAudioElement;
            if (audio) {
                audio.volume = 0.4;
                audio.play().catch((error) => {});
            }
        }}>
            <TbLogout2 className="text-4xl max-[1000px]:!text-xl text-white" />
        </Button>)
        else
            return (<></>)
}

const Header = (props:any) => {
    const user = useSelector((state: RootState) => state.user.user);
    const [burgerMenu, setBurgerMenu] = React.useState(true);
    return (
        // <div className={props.className+" static bg-slate-500 bg-opacity-40 border-none "}>
        <div className={props.className+" static bg-gradient-to-b transition ease-in-out duration-50 from-slate-700 to-transparent border-none backdrop-blur-md "+(burgerMenu ? "" : "!w-[20px] overflow-hidden")}>
            <ul className="flex flex-col justify-between items-center w-full h-full p-5 !m-0">
                <div className=" relative flex flex-col p-0 m-0 w-fit h-fit">
                    <Link className="hover:!no-underline absolute logo text-xl max-[1000px]:!text-sm !text-white italic" to="/" onClick={(event:any)=>{
                        const audio = document.getElementById('clickSound') as HTMLAudioElement;
                        if (audio) {
                            audio.volume = 0.4;
                            audio.play().catch((error) => {});
                        }
                    }}>Ping<br/>Pong</Link>
                    <Link to="/" className="hover:!no-underline logo text-xl max-[1000px]:!text-sm !text-white italic motion-safe:animate-mping" onClick={(event:any)=>{
                        const audio = document.getElementById('clickSound') as HTMLAudioElement;
                        if (audio) {
                            audio.volume = 0.4;
                            audio.play().catch((error) => {});
                        }
                    }}>Ping<br/>Pong</Link>
                </div>
                <div className="flex flex-col">
                    {
                        user ? (
                            <>
                                <li><Button  href="/leaderboard" className="nes-btn !bg-transparent" onClick={(event:any)=>{
                                    const audio = document.getElementById('clickSound') as HTMLAudioElement;
                                    if (audio) {
                                        audio.volume = 0.4;
                                        audio.play().catch((error) => {});
                                    }
                                }}><FaRankingStar className="text-4xl max-[1000px]:!text-xl text-white"/></Button></li>
                                <li><Button  href="/play" className="nes-btn !bg-transparent" onClick={(event:any)=>{
                                    const audio = document.getElementById('clickSound') as HTMLAudioElement;
                                    if (audio) {
                                        audio.volume = 0.4;
                                        audio.play().catch((error) => {});
                                    }
                                }}><MdOutlineVideogameAsset className="text-4xl max-[1000px]:!text-xl text-white" /></Button></li>
                                <li><Button  href="/chat" className="nes-btn !bg-transparent" onClick={(event:any)=>{
                                    const audio = document.getElementById('clickSound') as HTMLAudioElement;
                                    if (audio) {
                                        audio.volume = 0.4;
                                        audio.play().catch((error) => {});
                                    }
                                }}><IoMdChatbubbles className="text-4xl max-[1000px]:!text-xl text-white"/></Button></li>
                                <li><Button  href="/friends" className="nes-btn !bg-transparent" onClick={(event:any)=>{
                                    const audio = document.getElementById('clickSound') as HTMLAudioElement;
                                    if (audio) {
                                        audio.volume = 0.4;
                                        audio.play().catch((error) => {});
                                    }
                                }}><FaUserFriends className="text-4xl max-[1000px]:!text-xl text-white"/></Button></li>
                                <li><Button  href="/profile" className="nes-btn !bg-transparent" onClick={(event:any)=>{
                                    const audio = document.getElementById('clickSound') as HTMLAudioElement;
                                    if (audio) {
                                        audio.volume = 0.4;
                                        audio.play().catch((error) => {});
                                    }
                                }}><CgProfile className="text-4xl max-[1000px]:!text-xl text-white"/></Button></li>
                                <li><LogoutButton className="nes-btn !bg-transparent" onClick={(event:any)=>{
                                    const audio = document.getElementById('clickSound') as HTMLAudioElement;
                                    if (audio) {
                                        audio.volume = 0.4;
                                        audio.play().catch((error) => {});
                                    }
                                }}/></li>
                            </>
                        ) : (<></>)
                    }
                </div>
                <div className=" opacity-0">
                    <Link className="hover:!no-underline absolute logo text-xl !text-white italic" to="/" onClick={(event:any)=>{
                        const audio = document.getElementById('clickSound') as HTMLAudioElement;
                        if (audio) {
                            audio.volume = 0.4;
                            audio.play().catch((error) => {});
                        }
                    }}>Ping<br/>Pong</Link>
                    <Link to="/" className="hover:!no-underline logo text-xl !text-white italic motion-safe:animate-mping" onClick={(event:any)=>{
                        const audio = document.getElementById('clickSound') as HTMLAudioElement;
                        if (audio) {
                            audio.volume = 0.4;
                            audio.play().catch((error) => {});
                        }
                    }}>Ping<br/>Pong</Link>
                
                </div>
            </ul>
        </div>
    )
}

export default Header;