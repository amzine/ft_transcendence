import axios from "axios";
import { useEffect, useState } from "react";
import { IoSettingsSharp } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setUser } from "../state/user/userSlice";
import { TbTrashOff } from "react-icons/tb";
import { setSocket } from "../state/socket/socketSlice";
import { io } from "socket.io-client";

const SetProfile = () => {
    const user = useSelector((RootState:any) => RootState.user.user);
    const socket = useSelector((RootState:any) => RootState.socket.socket);
    const [Available, setAvailable] = useState(true);
    const [login, setLogin] = useState(user.userData.login);
    const [firstName, setFirstName] = useState(user.userData.first_name);
    const [lastName, setLastName] = useState(user.userData.last_name);
    const [bio, setBio] = useState(user.userData.bio);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [image, setImage] = useState((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+user.userData.login);
    const dispatch = useDispatch();
    const [twoFactor, setTwoFactor] = useState(user.userData.twoFactor);
    const [editProfile, setEditProfile] = useState(false);
    const saveChanges = () => {
        const data = {
            image: "",
            login: login,
            first_name: firstName,
            last_name: lastName,
            bio: bio
        }
        if (login.length === 0 || firstName.length === 0 || lastName.length === 0 || bio.length === 0)
        {
            toast.error("All fields are required");
            return;
        }
        if (!Available)
        {
            toast.error("Login already taken");
            return;
        }
        const formData = new FormData();
        if (file)
        {
            formData.append('file', file);
            formData.append('login', login);
            formData.append('first_name', firstName);
            formData.append('last_name', lastName);
            formData.append('bio', bio);
        }
        axios.put((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/user/new", (file ? formData : {...data}),
            { headers: file ? {Authorization: `Bearer ${user.jwt}`, "Content-Type":'multipart/form-data'} : {Authorization: `Bearer ${user.jwt}`} }).then((response) => {
                console.log(response.data);
                if (response.data.user)
                {
                    console.log("USER RETURNED",{
                        jwt: response.data.jwt,
                        userData: response.data.user
                    })
                    dispatch(setUser({
                        jwt: response.data.jwt,
                        userData: response.data.user
                    }));
                }
                localStorage.setItem("jwtToken", response.data.jwt);
                // disconnect socket and reconnect with new jwt
                if (socket)
                {
                    socket.disconnect();
                    const newSocket = io(
                        (process.env.REACT_APP_CHAT_SERVER ? process.env.REACT_APP_CHAT_SERVER : ("localhost:"+process.env.REACT_APP_CHAT_PORT||"8080"))
                        , {
                        transports: ['websocket'],
                        query: {
                          "user": response.data.user.login,
                          "jwt": `${user.jwt}`
                        },
                      });
                    dispatch(setSocket(newSocket));
                }
                setEditProfile(false);
                toast.success(`${response.data.message}`);
                localStorage.removeItem('firstTime');
                setFile(null);
                if (file)
                {
                    const imageObject = document.getElementById('userImage') as HTMLImageElement;
                    imageObject.src = imageObject.src + '?' + new Date().getTime();
                }
            }).catch((error) => {
                console.log(error);
                setEditProfile(false);
            })
    }
    const availableLogin = () => {
        axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/username/available/"+login, {
            headers: {Authorization: `Bearer ${user.jwt}`}
        }).then((response) => {
            setAvailable(response.data);
        }).catch((error) => {
            console.log(error);
            toast.error(`Error: ${error.response?.data?.message}`);
        })
    }

    useEffect(() => {
        if (login.length > 0)
        {
            if (login !== user.userData.login)
                availableLogin();
            else
                setAvailable(true);
        }
        else
            setAvailable(false);
    }, [login]);

    return (
        <div className="absolute w-full h-full bg-slate-400 bg-opacity-30 flex flex-col justify-center items-center">
            <div className="nes-container is-rounded rounded-md is-dark min-w-[500px] with-title is-centered">
                <p className="title">Welcome to PingPong</p>
                <section className="message-list">
                    <section className="message -left !m-0 !mb-5 text-sm text-left">
                        <i className="nes-bcrikko"></i>
                        <div className="nes-balloon from-left text-black">
                            <p>Hello and Welcome to ft_transcendence, Before continuing, setup your profile data</p>
                        </div>
                    </section>
                </section>
                <div className="flex flex-row w-full items items-center p-2">
                    <div className='flex flex-row FOR_IMAGE'>
                        <img 
                            src={image}
                                alt="img" 
                                className="nes-avatar is-large object-cover rounded-xl"
                                id='srcImg'
                        />
                        <label id='img' htmlFor="file" className='nes-input w-full text-sm max-w-[350px] text-gray-300 overflow-hidden whitespace-nowrap text-ellipsis'>{file ? fileName : "New Profile Image..."}</label>
                        <input type="file" name="file" id='file' accept="image/*"  className="hidden" onChange={(e: any) => {
                            setFileName(e.target.files[0].name);
                            setImage(URL.createObjectURL(e.target.files[0]));
                            setFile(e.target.files[0])
                        }} />
                        {file ? <button onClick={() => {
                            setImage(user.userData.image);
                            setFile(null);
                            const fileInput = document.getElementById('file') as HTMLInputElement;
                            fileInput.value = '';
                            }} className="nes-btn is-error text-2xl"><TbTrashOff/></button> : <></>}
                    </div>
                </div>
                <div className='flex flex-row items items-center'>
                    <label htmlFor="login" className='w-3/6'>Login *:</label>
                    <input type="text" id='login' onChange={(e)=>setLogin(e.target.value)} className={(Available? "is-success":"is-error") + " nes-input w-3/6 text-sm text-black"} placeholder="Login ..." defaultValue={login} />
                </div>
                <div className='flex flex-row items items-center'>
                    <label htmlFor="f_name" className='w-3/6'>First Name *:</label>
                    <input type="text" id='f_name' onChange={(e)=>{setFirstName(e.target.value)}} className="nes-input w-3/6 text-sm text-black" placeholder="First Name ..." defaultValue={firstName} />
                </div>
                <div className='flex flex-row items items-center'>
                    <label htmlFor="l_name" className='w-3/6'>Last Name *:</label>
                    <input type="text" id='l_name' onChange={(e)=>{setLastName(e.target.value)}} className="nes-input w-3/6 text-sm text-black" placeholder="Last Name ..." defaultValue={lastName} />
                </div>
                <div className='flex flex-row items items-center'>
                    <label htmlFor="textarea_field" className='w-3/6'>Bio *:</label>
                    <textarea id="textarea_field" onChange={(e)=>{setBio(e.target.value)}} className="nes-textarea  w-3/6 text-sm text-black" placeholder="Bio ..." defaultValue={bio} />
                </div>
                <button className='nes-btn w-full' onClick={saveChanges}>Save Changes</button>
            </div>
        </div>
    )
}

export default SetProfile;