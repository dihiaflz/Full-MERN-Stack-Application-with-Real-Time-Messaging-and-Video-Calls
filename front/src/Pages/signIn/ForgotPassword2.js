import React from "react";
import { useState } from "react";
import "./ForgotPassword2.css";
import { useNavigate } from 'react-router-dom';
import deco from "../../Assets/deco.svg";
import logo from "../../Assets/logo.svg";
import next from "../../Assets/Next.svg";

const ForgotPassword2 = () => {
    // State for storing error messages and controlling error display
    const [errorMessage, setErrorMessage] = useState("");
    const [showError, setShowError] = useState(false);

    // State for form data (confirmation code)
    const [formData, setFormData] = useState({
        code: '' // Field for the code entered by the user
    });

    // useNavigate hook to programmatically navigate the user
    const navigate = useNavigate();

    // Handle changes in the input fields and update the formData state
    const handleInputChange = (e) => {
        const { name, value } = e.target; // Destructure name and value from event target
        setFormData({
            ...formData, // Spread the existing formData state
            [name]: value, // Update only the field that has changed
        });
    };

    // Function to handle resending the confirmation code
    const handleRenvoyer = async (e) => {
        e.preventDefault(); // Prevent the form's default submit behavior
        try {
            console.log(formData); // Log form data for debugging
            const token = localStorage.getItem('accessToken'); // Retrieve the token from local storage

            // Make a POST request to resend the confirmation code
            const response = await fetch("http://localhost:5000/signIn/forgotPassword/repeat", { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`, // Include the token in the headers
                },
                body: '', // Empty body since we are only resending the code
            });

            const data = await response.json(); // Parse the response as JSON

            if (response.ok) {
                window.location.reload(); // Reload the page upon success
            } else if (response.status === 401) {
                // Handle unauthorized access, clear token and redirect
                setErrorMessage(data.error);
                setShowError(true);
                setTimeout(() => {
                    navigate("/forgotPassword");
                    localStorage.removeItem("accessToken");
                }, 3000); // Wait for 3 seconds before redirecting
            } else if (response.status === 500) {
                // Redirect to 500 error page if the server responds with a server error
                navigate("/Error500");
            }
        } catch (error) {
            // Log any errors that occur during the request
            console.error("Error during fetch: ", error);
        }
    };

    // Function to handle form submission when the user submits the confirmation code
    const handleFormSubmit = async (e) => {
        e.preventDefault(); // Prevent the default form submission
        try {
            console.log(formData); // Log form data for debugging
            const token = localStorage.getItem('accessToken'); // Get token from local storage

            // Make a POST request to validate the confirmation code
            const response = await fetch("http://localhost:5000/signIn/forgotPassword/code", { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`, // Include the token in the headers
                },
                body: JSON.stringify(formData), // Send the form data as a JSON object
            });

            const data = await response.json(); // Parse the response from the server

            if (response.ok) {
                // If successful, navigate to the password reset page
                navigate("/resetPassword");
            } else if (response.status === 400) {
                // Show error if the code is invalid or there's a bad request
                setErrorMessage(data.response);
                setShowError(true);
            } else if (response.status === 500) {
                // Navigate to custom error page if server has an issue
                navigate("/Error500");
            } else if (response.status === 404) {
                // Navigate to 404 page if the endpoint is not found
                navigate("/Error");
            }
        } catch (error) {
            // Log any errors that occur during the request
            console.error("Error during fetch: ", error);
        }
    };

    return(
    <div className="ForgotPassword2Div">
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
                <p className="title">Un code de confirmation a été envoyé à votre boite mail.<br/>Veillez le saisir</p>
                <form className="form" type= 'POST' encType="multipart/form-data" onSubmit={handleFormSubmit}>
                    <div className="item">
                        <label className="label" for = "code">Code de confirmation *</label>
                        <input onChange={handleInputChange} className="input" id="code" name="code" placeholder="code de confirmation" required></input>
                    </div>
                    <div className="renvoyerContainer">
                        <button className="renvoyer" onClick={handleRenvoyer}>Renvoyer</button>
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


export default ForgotPassword2;


