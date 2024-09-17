import React from "react";
import { useState } from "react";
import "./ForgotPassword1.css"; // Importing CSS for styling
import { useNavigate } from 'react-router-dom'; // For navigation
import deco from "../../Assets/deco.svg"; // Importing assets
import logo from "../../Assets/logo.svg";
import next from "../../Assets/Next.svg";

const ForgotPassword1 = () => {
    // State for managing error messages and showing/hiding error
    const [errorMessage, setErrorMessage] = useState("");
    const [showError, setShowError] = useState(false);

    // State to manage form input for email
    const [formData, setFormData] = useState({
        email: '' // Initial value for email
    });

    // Hook to navigate programmatically
    const navigate = useNavigate();

    // Function to handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target; // Destructure name and value from event target
        setFormData({
            ...formData, // Spread the existing formData
            [name]: value, // Update the specific field that changed (email)
        });
    };

    // Function to handle form submission
    const handleFormSubmit = async (e) => {
        e.preventDefault(); // Prevent default form behavior (page reload)
        try {
            console.log(formData); // Log form data for debugging

            // Send POST request to the server with the email input
            const response = await fetch("http://localhost:5000/signIn/forgotPassword", { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Set headers to indicate JSON payload
                },
                body: JSON.stringify(formData), // Send the formData as JSON
            });

            const data = await response.json(); // Parse the JSON response

            if (response.ok) {
                // Store the access token in localStorage (for future requests)
                localStorage.setItem('accessToken', data[1]);

                // Navigate to the confirmation code page if successful
                navigate("/CodeDeConfirmation");
            } else if (response.status === 400) {
                // Display an error message if the request is invalid
                setErrorMessage(data.response);
                setShowError(true);
            } else if (response.status === 500) {
                // Navigate to a custom 500 error page if the server fails
                navigate("/Error500");
            } else if (response.status === 404) {
                // Navigate to a custom 404 error page if the endpoint is not found
                navigate("/Error");
            }
        } catch (error) {
            // Log any errors that occur during the request
            console.error("Erreur lors du fetch: ", error);
        }
    };

    return(
    <div className="ForgotPassword1Div">
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
                <p className="title">Veillez saisir l’adresse email relié à votre compte</p>
                <form className="form" type= 'POST' encType="multipart/form-data" onSubmit={handleFormSubmit}>
                    <div className="item">
                        <label className="label" for = "email">Votre email *</label>
                        <input onChange={handleInputChange} className="input" id="email" name="email" placeholder="email" type="email" required></input>
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


export default ForgotPassword1;


