import React from 'react';
import Button from './Button';

const Start = () => {
    return (
        <div className="flex align-middle justify-center flex-col w-full h-full">
        {
          (localStorage.getItem("jwtToken") === null) ? (<Button href="/login" className="!top-20 is-warning" name="INITIATE LINK!" onClick={(event:any)=>{
            const audio = document.getElementById('clickSound') as HTMLAudioElement;
            if (audio) {
                audio.volume = 0.4;
                audio.play().catch((error) => {});
            }
          }}
          onMouseOut={()=>{
            const audio = document.getElementById('hoverSound') as HTMLAudioElement;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
          }}
          onMouseOver={()=>{
            const audio = document.getElementById('hoverSound') as HTMLAudioElement;
            if (audio) {
                audio.volume = 0.4;
                audio.play().catch((error) => {});
            }
          }} />) : (<Button href="/leaderboard" className="!top-20 is-warning" name="INITIATE APP!" onClick={(event:any)=>{
            const audio = document.getElementById('clickSoundV2') as HTMLAudioElement;
            if (audio) {
                audio.volume = 0.4;
                audio.play().catch((error) => {});
            }
          }}
          onMouseOut={()=>{
            const audio = document.getElementById('hoverSound') as HTMLAudioElement;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
          }}
          onMouseOver={()=>{
            const audio = document.getElementById('hoverSound') as HTMLAudioElement;
            if (audio) {
                audio.volume = 0.4;
                audio.play().catch((error) => {});
            }
          }} />)
        }
        {/* <Button className="!top-20" name="INITIATE V2!" onClick={(event:any)=>{
          const audio = document.getElementById('clickSoundV2') as HTMLAudioElement;
          if (audio) {
              audio.volume = 0.4;
              audio.play().catch((error) => {});
          }
        }}
        onMouseOut={()=>{
          const audio = document.getElementById('hoverSound') as HTMLAudioElement;
          if (audio) {
              audio.pause();
              audio.currentTime = 0;
          }
        }}
        onMouseOver={()=>{
          const audio = document.getElementById('hoverSound') as HTMLAudioElement;
          if (audio) {
              audio.volume = 0.4;
              audio.play().catch((error) => {});
          }
        }} /> */}
      </div>
    )
}

export default Start;