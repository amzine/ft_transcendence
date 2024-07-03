import React from 'react';
import { useSelector } from 'react-redux';  
import { RootState } from '../state/store';


const Main = (props:any) => {
    return (
        <div className={props.className+" "}>
            {props.children}
        </div>
    )
}

export default Main;