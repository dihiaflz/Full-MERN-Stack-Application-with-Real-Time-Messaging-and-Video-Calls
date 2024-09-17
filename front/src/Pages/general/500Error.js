import React from "react";
import "./500Error.css"
import logo from "../../Assets/logo.svg"
import illu from "../../Assets/500-error.svg"


const Error500 = () => {
    return(
    <div className="error500">
        <img className="logo" alt="logo" src={logo}></img>
        <img className="illu" alt="illu" src={illu}></img>
    </div>
    )
}


export default Error500;







