import React from "react";
import "./404Error.css"
import logo from "../../Assets/logo.svg"
import illu from "../../Assets/404-error.svg"


const Error = () => {
    return(
    <div className="error">
        <img className="logo" alt="logo" src={logo}></img>
        <img className="illu" alt="illu" src={illu}></img>
    </div>
    )
}


export default Error;


