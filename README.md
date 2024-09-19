# Full MERN Stack Application with Real Time Messaging and Video Calls
A comprehensive MERN stack application featuring a real-time messaging system with notifications, full authentication (sign-in, sign-up, and password recovery), and video calling functionality. Utilizes JWT for secure authentication, socket.io for real-time communication, and WebRTC for video calls. The project is organized with separate folders for front-end and back-end development.

# HOW TO USE :
1. Clone the repository to your local machine.
2. Run the command **npm install** in both folders to install all the project's dependencies
3. Create in the backend's root folder a .env file
4. Create a new database in mongodb and find the link to connect your db ( sign in in mongodb website => database => connect => mongodb for vs code )
5. Fill out the **.env** file with the following informations : DATABASE_URI= the link to use your db, SECRET= the secret for your jwt token, SECRET_PROVISOIR= another secret for the jwt token given for changing password . The secrets can be any word you want but you should keep it a secret
6. Run the code using the command **npm start** in both folders and everything will work properly .

**PS :** In this project, you'll find three distinct authentication middleware files, each serving a specific purpose:

            a/ authMiddleware.js: This is the general authentication middleware used for standard API requests. It ensures that only authenticated users can access the API endpoints.

            b/ authMiddlewareSocket.js: This middleware is specifically designed for socket connections. It handles authentication for WebSocket requests to ensure secure communication between the client and server.

            c/ authMiddlewareProv.js: This middleware is used for handling temporary tokens during password change requests. It manages authentication and validation for the process of updating user passwords.
  **Additional Note:** The front-end is responsive and designed to work on devices with a width of 300 pixels and above.
  
GOOD LUCK !
