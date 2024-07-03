import { useSelector } from "react-redux";
import RootState, { setUser } from "../state/user/userSlice";
import { IoSettingsSharp } from "react-icons/io5";
import { Modal } from "react-responsive-modal";
import { useEffect, useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import { useDispatch } from "react-redux";
import { TbTrashOff } from "react-icons/tb";

const ProfileHeader = (props:any) => {
    const user = useSelector((RootState:any) => RootState.user.user);
    const [firstName, setFirstName] = useState(user.userData.first_name);
    const [lastName, setLastName] = useState(user.userData.last_name);
    const [bio, setBio] = useState(user.userData.bio);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [image, setImage] = useState((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+user.userData.login);
    const dispatch = useDispatch();
    const [twoFactor, setTwoFactor] = useState(user.userData.twoFactor);
    const [editProfile, setEditProfile] = useState(false);

    useEffect(() => {
        if (twoFactor && !user.userData.twoFactor)
            axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/twoAuthQr", { headers: { Authorization: `Bearer ${user.jwt}` } }).then((response) => {
                if (response.data) {
                    document.getElementById('twoFactorImage')?.setAttribute('src', response.data.url);
                }
            }).catch((error) => {
                console.log(error);
            })
    }, [twoFactor])

    const saveChanges = () => {
        const data = {
            image: "",
            login: user.userData.login,
            first_name: firstName,
            last_name: lastName,
            bio: bio
        }
        const formData = new FormData();
        if (file)
        {
            formData.append('file', file);
            formData.append('login', user.userData.login);
            formData.append('first_name', firstName);
            formData.append('last_name', lastName);
            formData.append('bio', bio);
        }
        axios.put((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/profile", (file ? formData : {...data}),
            { headers: file ? {Authorization: `Bearer ${user.jwt}`, "Content-Type":'multipart/form-data'} : {Authorization: `Bearer ${user.jwt}`} }).then((response) => {
                console.log(response.data);
                toast.success(`${response.data.message}`);
                if (response.data.user)
                    dispatch(setUser({
                        jwt: user.jwt,
                        userData: response.data.user
                    }));
                setEditProfile(false);
                setFile(null);
                if (file)
                {
                    const imageObject = document.getElementById('userImage') as HTMLImageElement;
                    imageObject.src = imageObject.src + '?' + new Date().getTime();
                }
            }).catch((error) => {
                console.log(error);
                toast.error(`Error: ${error.response?.data?.message}`);
                setEditProfile(false);
            })
    }
    const removeTwoFactor = () => {
        axios.delete((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/twoAuth", { headers: { Authorization: `Bearer ${user.jwt}` } }).then((response) => {
            if (response.data) {
                toast.success('2Auth Removed Successfully');
                if (response.data.user)
                    dispatch(setUser({
                        jwt: user.jwt,
                        userData: response.data.user
                    }));
                setTwoFactor(false);
            }
        }).catch((error) => {
            console.log(error);
            toast.error(error.response?.data?.message);
        })
    }
    const handleTwoAuth = (event:any) => {
        const authCode = document.getElementById('authCode') as HTMLInputElement;
        if (authCode.value.length !== 6) {
            toast.error('Please enter a valid code');
            return;
        }
        axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/twoAuth", { token: authCode.value }, { headers: { Authorization: `Bearer ${user.jwt}` } }).then((response) => {
            if (response.data) {
                toast.success('2Auth Enabled Successfully');
                if (response.data.user)
                    dispatch(setUser({
                        jwt: user.jwt,
                        userData: response.data.user
                    }));
                setTwoFactor(false);
            }
        }).catch((error) => {
            console.log(error);
            toast.error(error.response?.data?.message);
        })
    }
    return (
        <div className={props.className}>
            <div className="flex flex-row max-[1000px]:!flex-col max-[1000px]:!items-start max-[1000px]:!max-w-full max-[1000px]:!p-0 justify-between items-center w-full">
                <div className="flex flex-row items-center justify-between m-4">
                    <img id="userImage" src={(process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000") + '/profile-image/'+user.userData.login + '?' + new Date().getTime()}
                     className="w-[100px] h-[100px] object-cover rounded-xl max-[1000px]:!w-[75px] max-[1000px]:!h-[75px]" alt="avatar" />
                    <h2 className="mx-4 text-xl max-[1000px]:!text-sm break-all">{user.userData.login}</h2>
                </div>
                <div className="max-[1000px]:!w-full">
                    <button onClick={(event:any)=>{
                        const audio = document.getElementById('clickSound') as HTMLAudioElement;
                        if (audio) {
                            audio.volume = 0.4;
                            audio.play().catch((error) => {});
                        }
                        setEditProfile(true);
                    }} className="nes-btn is-rounded max-[1000px]:!text-sm my-2 text-lg !flex !flex-row max-[1000px]:!w-full flex-wrap items-center justify-between">
                        <IoSettingsSharp className="text-3xl max-[1000px]:!text-sm max-[1000px]:!w-full" />
                    </button>
                </div>
            </div>
            {/* <div>Right Side</div> */}
            <div className="nes-container is-dark with-title text-lg max-[1000px]:!text-sm">
                <p className="title rounded-sm max-[1000px]:!text-sm break-all">Profile Data</p>
                <div className=" text-left">
                    {
                        user.userData.first_name || user.userData.last_name ? 
                            <p className="text-white max-[1000px]:!text-sm break-all">Name: {(user.userData.first_name || "") + ' ' + (user.userData.last_name || "")}</p>
                            :<></>
                    }
                    <p className="text-white max-[1000px]:!text-sm break-all">Email: {user.userData.email}</p>
                    <p className="text-white max-[1000px]:!text-sm break-all">Bio: <span>{user.userData.bio}</span></p>
                    <p className="text-white max-[1000px]:!text-sm break-all">2 Factor Auth: {user.userData.twoFactor ? <span className="text-green-600">ON</span> : <span className="text-red-600">OFF</span>}</p>
                </div>
            </div>
            {/* Profile Settings modal */}
            <Modal
                open={editProfile}
                onClose={() => setEditProfile(false)}
                center
                closeIcon={<IoMdCloseCircle className="text-3xl max-[1000px]:!text-sm text-white bg-transparent outline-none border-0" />}
                classNames={{
                overlayAnimationIn: 'customEnterOverlayAnimation',
                overlayAnimationOut: 'customLeaveOverlayAnimation',
                modalAnimationIn: 'customEnterModalAnimation',
                modalAnimationOut: 'customLeaveModalAnimation',
                }}
                // styles={="nes-container is-rounded is-dark"}
                animationDuration={400}
                >
                    <div className="nes-container is-rounded max-[1000px]:!text-sm rounded-md is-dark with-title is-centered">
                        <p className="title">Edit Profile</p>
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
                        <div className='flex flex-col mt-2'>
                            {
                                user.userData.twoFactor ? 
                                <div className="w-full self-center flex flex-col flex-nowrap items-center justify-center">
                                    <button className='nes-btn is-error w-full' onClick={removeTwoFactor}>Remove 2Factor Auth</button>
                                </div>
                                : 
                                <>
                                    <div>
                                        <p>Two Factor Authentication ?*</p>
                                    </div>

                                    <div className='w-full flex justify-around px-5 '>
                                        <label>
                                            <input type="radio" className="nes-radio is-dark p-1" name="is_public" value='1' onClick={()=> { setTwoFactor(true) }}/>
                                            <span>Yes</span>
                                        </label>

                                        <label>
                                            <input type="radio" className="nes-radio is-dark" name="is_public" value='0' defaultChecked onClick={()=> { setTwoFactor(false) }}/>
                                            <span>No</span>
                                        </label>                    
                                    </div>
                                    <div id='twoFactor' className={twoFactor ? "w-5/6 self-center flex flex-col flex-nowrap items-center justify-center" : "hidden"}>
                                        <img id="twoFactorImage" className="w-[200px]" src="" alt="qrCode" />
                                        <div className='flex flex-row items items-center'>
                                            <input type="text" name="authCode" id='authCode' className="nes-input w-3/6 text-sm text-black" placeholder="Auth Code ..." />
                                        </div>
                                        <button className='nes-btn is-success' onClick={handleTwoAuth}>Set 2Auth</button>
                                    </div>
                                </>
                            }
                            
                        </div>
                        <button className='nes-btn w-full' onClick={saveChanges}>Save Changes</button>
                    </div>
            </Modal>
        </div>
    )
}

export default ProfileHeader;