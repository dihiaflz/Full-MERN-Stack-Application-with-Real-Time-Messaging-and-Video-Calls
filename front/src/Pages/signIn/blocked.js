import React from "react";
import "./blocked.css"
import deco from "../../Assets/deco.svg"
import logo from "../../Assets/logo.svg"


const Blocked = () => {
    return(
    <div className="Blocked">
        <img className="deco" alt="deco" src={deco}></img>
        <div className="contenu">
            <img className="logo" alt="logo" src={logo}></img>
            <h1 className="text">Votre compte n’a pas encore été activé car votre paiement des frais d’inscription n’a pas encore été confirmé, nous vous enverrons un mail dés l’activation de votre compte</h1>
        </div>
    </div>
    )
}


export default Blocked;


