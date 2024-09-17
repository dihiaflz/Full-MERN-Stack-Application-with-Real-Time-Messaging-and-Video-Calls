const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  // Retrieve the authorization header from the request
  const authHeader = req.headers.authorization;
  
  // Log the received token for debugging purposes
  console.log("Received token:");
  console.log(authHeader);
  
  try {
    // Check if the authorization header is missing
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized - Missing Token' });
    }
    
    // If the token exists, proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle token-related errors
    if (error.name === 'TokenExpiredError') {
      // If the token is expired, return a 401 Unauthorized response
      return res.status(401).json({ error: 'Unauthorized - Token Expired' });
    }
    
    // Log other errors for debugging and return a 500 Internal Server Error response
    console.error('Error during token verification:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
