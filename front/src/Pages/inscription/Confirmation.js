import React from "react";
import { useState } from "react";
import "./Confirmation.css";
import { useNavigate } from 'react-router-dom';
import deco from "../../Assets/deco.svg";
import logo from "../../Assets/logo.svg";
import next from "../../Assets/Next.svg";

const Confirmation = () => {
    // State for error message display
    const [errorMessage, setErrorMessage] = useState("");
    const [showError, setShowError] = useState(false);

    // State to manage form data (code for confirmation)
    const [formData, setFormData] = useState({
        code: ''
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

    // Function to handle resend of confirmation code
    const handleRenvoyer = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        try {
            console.log(formData); // Log form data for debugging

            // Get the access token from localStorage
            const token = localStorage.getItem('accessToken');

            // Make a POST request to resend the confirmation code
            const response = await fetch("http://localhost:5000/signUp/repeat", { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`,
                },
                body: '', // No body content for this request
            });

            const data = await response.json(); // Parse the response from the server

            if (response.ok) {
                // Reload the page if the request is successful
                window.location.reload();
            } else if (response.status === 401) {
                // Handle unauthorized error (e.g., token invalid or expired)
                setErrorMessage(data.error);
                setShowError(true); // Show error message
                setTimeout(() => {
                    // Navigate to forgot password page after 3 seconds and remove token
                    navigate("/forgotPassword");
                    localStorage.removeItem("accessToken");
                }, 3000);
            } else if (response.status === 500) {
                // Navigate to custom error page if server has an issue
                navigate("/Error500");
            }
        } catch (error) {
            // Log any error that occurs during the fetch request
            console.error("Error during fetch: ", error);
        }
    };

    // Function to handle form submission with confirmation code
    const handleFormSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        try {
            console.log(formData); // Log form data for debugging

            // Get the access token from localStorage
            const token = localStorage.getItem('accessToken');

            // Make a POST request to verify the confirmation code
            const response = await fetch("http://localhost:5000/signUp/code", { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`,
                },
                body: JSON.stringify(formData), // Send form data as JSON
            });

            const data = await response.json(); // Parse the response from the server

            if (response.ok) {
                // Navigate to the sign-in page if confirmation is successful
                navigate("/signIn");
            } else if (response.status === 400 || response.status === 401) {
                // Handle bad request or unauthorized errors
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
    <div className="confirmationDiv">
        {showError && (
            <div className={`errorMessage showErrorMessage`}>
                {errorMessage}
            </div>
        )}
        <img className="deco" alt="deco" src={deco}></img>
        <div className="content">
           <div className="titlesPart">
                <h1 className="title">Bienvenue</h1>
                <h4 className="title">Inscrivez vous à notre site</h4>
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


export default Confirmation;


