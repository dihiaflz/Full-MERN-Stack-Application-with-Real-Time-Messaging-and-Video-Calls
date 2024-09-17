import React from "react";
import { useState } from "react";
import "./SignIn.css";
import { useNavigate } from 'react-router-dom';
import deco from "../../Assets/deco.svg";
import logo from "../../Assets/logo.svg";

const SignIn = () => {
    // State for error message display
    const [errorMessage, setErrorMessage] = useState("");
    const [showError, setShowError] = useState(false);

    // State to manage form data (email and password)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // useNavigate hook to redirect users after form submission
    const navigate = useNavigate();

    // Function to handle changes in form inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Update formData with the new values from input fields
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Function to handle form submission for sign-in
    const handleFormSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        try {
            console.log(formData); // Log form data for debugging

            // Make a POST request to sign in the user
            const response = await fetch("http://localhost:5000/signIn", { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData), // Send form data as JSON
            });

            const data = await response.json(); // Parse the response from the server

            if (response.ok) {
                // Store the access token in sessionStorage
                sessionStorage.setItem('accessToken', data.token);
                // Redirect to the chat page upon successful sign-in
                navigate("/chat");
            } else if (response.status === 400) {
                // Handle bad request error
                setErrorMessage(data.response);
                setShowError(true); // Show error message
            } else if (response.status === 500) {
                // Navigate to custom error page if server has an issue
                navigate("/Error500");
            } else if (response.status === 404) {
                // Navigate to 404 page if the endpoint is not found
                navigate("/Error");
            }
        } catch (error) {
            // Log any error that occurs during the fetch request
            console.error("Error during fetch: ", error);
        }
    };

    return(
    <div className="signInDiv">
        {showError && (
            <div className={`errorMessage showErrorMessage`}>
                {errorMessage}
            </div>
        )}
        <img className="deco" alt="deco" src={deco}></img>
        <div className="content">
           <div className="titlesPart">
                <h1 className="title">Bienvenue</h1>
                <h4 className="title">Connectez vous à votre compte </h4>
           </div>
           <div className="formPart">
                <img className="logo" alt="logo" src={logo}></img>
                <div className="afterLogo">
                    <form className="form" type= 'POST' encType="multipart/form-data" onSubmit={handleFormSubmit}>
                        <div className="item">
                            <label className="label" for = "email">Votre email *</label>
                            <input onChange={handleInputChange} className="input" id="email" name="email" placeholder="email" type="email" required></input>
                        </div>
                        <div className="item">
                            <label className="label" for = "password">Votre mot de passe *</label>
                            <input onChange={handleInputChange} className="input" id="password" name="password" placeholder="mot de passe" type="password" required></input>
                        </div>
                        <div className="butonPlus">
                            <a className="title" href="./ForgotPassword">Mot de passe oublié ?</a>
                            <button className="buton" type="submit">
                                Se connecter
                            </button>
                        </div>
                    </form>
                    <p className="title">Vous n'avez pas de compte?<a className="lienInsc" href="./Inscription">Inscrivez vous</a></p>
                </div>
           </div> 
        </div>
    </div>
    )
}


export default SignIn;


