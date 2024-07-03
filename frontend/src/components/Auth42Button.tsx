import React from 'react';
import Button from './Button';
// import { Link } from 'react-router-dom';
const Auth42Button = (props:any) => {
    let popup: Window | null = null;
    return (
        <div className={props.className+" "}>
            {/* <Link to="http://localhost:8080/auth/42" className="nes-btn text-base font-semibold">Authenticate Using Your 42 Account</Link> */}
            <Button href={process.env.REACT_APP_FORTYTWO_CALLBACK_URL} className="nes-btn text-base is-warning font-semibold" name="Authenticate Using Your 42 Account" onClick={(event:any)=>{
                // delay the event so that the sound can play
                event.preventDefault();
                const audio = document.getElementById('clickSound') as HTMLAudioElement;
                if (audio) {
                    audio.volume = 0.4;
                    audio.play().catch((error) => {});
                }
                if (popup && !popup.closed) {
                    popup.focus();
                    return;
                }
                // setTimeout(() => {
                //     window.location.href = event.target.href;
                // }, 700);
                // center the popup window
                popup = window.open(event.target.href, '42 Auth Window', 'width=600,height=600');
                if (popup) {
                    const w = window.screen.width / 2 - 300;
                    const h = window.screen.height / 2 - 300;
                    popup.moveTo(w, h);
                }
                const interval = setInterval(() => {
                    if (!popup)
                    {
                        clearInterval(interval);
                        window.location.reload();
                        return
                    }
                    if (popup && popup.closed) {
                        clearInterval(interval);
                        window.location.reload();
                    }

                    try {
                        const params = new URLSearchParams(popup.window.location.search)
                        if (params.has('fa2')) {
                            console.log("Pass 1")
                            const jwt = params.get('jwt');
                            if (jwt)
                                localStorage.setItem('jwt', jwt);
                            popup.window.location.href = (process.env.REACT_APP_FRONTEND_SERVER ? process.env.REACT_APP_FRONTEND_SERVER : "http://localhost:3000") + "/verify";
                            return
                        }
                        else if (params.has('jwt')) {
                            if (params.has('firstTime'))
                            {
                                localStorage.setItem('firstTime', 'true');
                            }
                            console.log("Pass 2")
                            clearInterval(interval);
                            localStorage.setItem('jwtToken', params.get('jwt') as string);
                            popup.close();
                            window.location.href = "/";
                        }
                        if (popup && popup.window.location.href.includes('authError')) {
                            console.log("Pass 3")
                            clearInterval(interval);
                            popup.close();
                            window.location.href = "/authError";
                        }
                    }
                    catch (error) {
                        //pass
                    }
                }, 500);
            }}>
            </Button>
        </div>
    )
}

export default Auth42Button;