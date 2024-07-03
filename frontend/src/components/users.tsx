import { RootState } from "../state/store";
import axios from "axios";
import React, { useRef } from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";

const Users = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [data, setData] = useState<any>(null);
    let user : any = useSelector((state: RootState) => state.user.user);
    let results : any = [];
    useEffect(() => {
        
        if (user === null)
            user = { jwt: localStorage.getItem("jwtToken") as string };
        axios.get((process.env.REACT_APP_BACKEND_SERVER ? process.env.REACT_APP_BACKEND_SERVER : "http://localhost:5000")+"/users/all", { headers: { Authorization: `Bearer ${user.jwt}` } })
        .then((response) => {
            console.log("Data : ", response.data);
            response.data.forEach((element:any) => {
                results.push(<p><h2>Name : </h2>{element.name}   |   <h2>Age : </h2> {element.age}</p>)
                console.log("Element : ", element);
            })
            // console.log("Results : ", results);
        }
        ).catch((error) => {
            console.log("ERROR in Users.tsx");
        });
        setData(results);
    }, []); 
    if (data !== null)
        setIsLoaded(true);
    console.log("Results : ", data);
    return <>
        {/* (!isLoaded) ? <p>Loading users ...</p> : <p>Loaded</p> */}
        <div className="flex flex-col justify-center items-center">
            { (!isLoaded) ? (<p>Loading users ...</p>) : <>{data}</>} 
        </div>
    </>
};

export default Users;