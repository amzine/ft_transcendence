import React from 'react';
import { IoEnter } from 'react-icons/io5';
import { MdAddCircle } from 'react-icons/md';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function TwoFactorVerification() {
    const jwtToken = localStorage.getItem('jwt');
    if (!jwtToken) {
        window.location.href = '/';
    }
    const [twoFactorCode, setTwoFactorCode] = React.useState('');
    async function verifyTwoFactorCode() {
        if (!twoFactorCode) {
            toast.error('Please enter the 2 Factor Code');
        }
        axios.post((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/verifyTwoFactorCode", {
            token: twoFactorCode
        }, {
            headers: {
                Authorization: `Bearer ${jwtToken}`
            }
        }).then((response) => {
            if (response.data.jwt)
                window.location.href = `/success?jwt=${response.data.jwt}`;
            else
                toast.error('Invalid 2 Factor Code');
        }).catch((error) => {
            toast.error('Invalid 2 Factor Code');
        })
    }
    return (
        <div>
            <div className='text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] m-2'>Enter the 2 Factor Code</div>
            <div className='flex flex-col'>
                <input type="text" className="nes-input w-full text-sm text-black !my-4" placeholder="Two Factor Code ..." onChange={(e : React.FormEvent<HTMLInputElement>)=>{
                    setTwoFactorCode(e.currentTarget.value)
                }} />
                <button onClick={verifyTwoFactorCode} className="nes-btn text-sm is-rounded my-2 !flex !flex-row flex-wrap  justify-center items-center is-warning">
                    Verify
                </button>
            </div>
        </div>
    )
}