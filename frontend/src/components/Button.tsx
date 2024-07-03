import React from 'react';
import {Link} from 'react-router-dom';

const Button = (props : any) => {
    return (
        <div>
            <Link to={props.href} className={props.className+" nes-btn !m-2 text-2xl"} onMouseOver={() => {
                if (props.onMouseOver)
                    props.onMouseOver();
            }}
            onMouseOut={() => {
                if (props.onMouseOut)
                    props.onMouseOut();
            }}
            onClick={(event) => {
                if (props.onClick)
                    props.onClick(event);
            }}>
                {props.name}{props.children}
            </Link>
        </div>
    )
}

export default Button;