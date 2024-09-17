import React from "react";
import { useState } from "react";
import "./ForgotPassword3.css";
import { useNavigate } from 'react-router-dom';
import deco from "../../Assets/deco.svg";
import logo from "../../Assets/logo.svg";
import next from "../../Assets/Next.svg";

const ForgotPassword3 = () => {
    // State for error message display
    const [errorMessage, setErrorMessage] = useState("");
    const [showError, setShowError] = useState(false);

    // State to manage form data (new password and confirm password)
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
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

    // Function to handle form submission for setting a new password
    const handleFormSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        try {
            console.log(formData); // Log form data for debugging

            // Check if the new password and confirm password match
            if (formData.password === formData.confirmPassword) {
                // Get the access token from local storage
                const token = localStorage.getItem('accessToken');

                // Make a POST request to update the password
                const response = await fetch("http://localhost:5000/signIn/forgotPassword/new", { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${token}`,
                    },
                    body: JSON.stringify(formData), // Send form data as JSON
                });

                const data = await response.json(); // Parse the response from the server

                if (response.ok) {
                    // Remove the access token and redirect to sign-in page upon successful update
                    localStorage.removeItem("accessToken");
                    navigate("/signIn");
                } else if (response.status === 401) {
                    // Handle unauthorized error, navigate to forgot password page
                    setErrorMessage(data.error);
                    setShowError(true);
                    setTimeout(() => {
                        navigate("/forgotPassword");
                        localStorage.removeItem("accessToken");
                    }, 3000);
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
            } else {
                // Handle case where passwords do not match
                setErrorMessage("Passwords do not match.");
                setShowError(true);
            }
        } catch (error) {
            // Log any error that occurs during the fetch request
            console.error("Error during fetch: ", error);
        }
    };

    return(
    <div className="ForgotPassword3Div">
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
                <p className="title">Créez un nouveau mot de passe</p>
                <form className="form" type= 'POST' encType="multipart/form-data" onSubmit={handleFormSubmit}>
                <div className="item">
                    <label className="label" for = "password">Nouveau mot de passe *</label>
                    <input onChange={handleInputChange} className="input" id="password" name="password" placeholder="mot de passe" type="password" required></input>
                </div>
                <div className="item">
                    <label className="label" for = "confirmPassword">Confirmer mot de passe *</label>
                    <input onChange={handleInputChange} className="input" id="confirmPassword" name="confirmPassword" placeholder="confirmer mot de passe" type="password" required></input>
                </div>
                    <div className="buttonContainer">
                        <button className="button" type="submit">
                        <img className="icon" alt="icon" src={next} />
                        </button>
                    </div>
                </form>
           </div> 
        </div>
    </div>
    )
}


export default ForgotPassword3;





