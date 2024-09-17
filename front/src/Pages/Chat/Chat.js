import React, { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';  
import { jwtDecode } from 'jwt-decode';
import VideoChat from "../../Components/FaceCall";
import call from "../../Assets/video_call.svg";
import send from "../../Assets/send2.svg";
import { useNavigate } from 'react-router-dom';
import './Chat.css';

function Chat() {
    // State for the currently selected user
    const [selectedUser, setSelectedUser] = useState(null); 
    // State for the list of all users
    const [users, setUsers] = useState([]); 
    // State for the current input message
    const [message, setMessage] = useState(''); 
    // State to store the conversation history between the current user and the selected user
    const [chatHistory, setChatHistory] = useState([]); 
    // State for the current logged-in user's ID and email
    const [currentUserId, setCurrentUserId] = useState(null); 
    const [currentUserName, setCurrentUserName] = useState(null); 
    // State to store the receiver's name (email)
    const [receiverName, setReceiverName] = useState(null);
    // State for managing the Socket.IO connection
    const [socket, setSocket] = useState();
    // State to toggle the video chat interface
    const [showVideoChat, setShowVideoChat] = useState(false);
    // State for the selected receiver's ID during a video call
    const [receiverId, setReceiverId] = useState(null); 
    // Ref to scroll chat history automatically to the bottom
    const chatHistoryRef = useRef(null);
    const navigate = useNavigate();

    // State for unread messages, tracking the number of unseen messages per user
    const [unreadMessages, setUnreadMessages] = useState([]);

    // States for managing an incoming video call
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerSignal, setCallerSignal] = useState();
    const [name, setName] = useState("");

    // Automatically scroll to the latest message when chat history updates or video chat toggles
    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory, showVideoChat]);

    // On component mount, decode the token to set the current user's ID and email, then initialize the socket connection
    useEffect(() => {
        const token = sessionStorage.getItem('accessToken');
        if (token) {
            const decodedToken = jwtDecode(token);
            setCurrentUserId(decodedToken.user._id);
            setCurrentUserName(decodedToken.user.email);
    
            const socketInstance = io('http://localhost:5000', {
                auth: { token: token }
            });
    
            socketInstance.on('connect', () => {
                // Register the current user with their ID
                socketInstance.emit('registerUser', decodedToken.user._id);
            });
    
            setSocket(socketInstance);
        }
    }, []);

    // Fetch the list of users and unseen messages when the component is first rendered
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = sessionStorage.getItem('accessToken');
                const response = await fetch("http://localhost:5000/chat", { 
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${token}`,
                    }
                });
                const responseData = await response.json();
                if (response.ok) {
                    setUsers(responseData.data);
                } else {
                    navigate(response.status === 500 ? "/Error500" : "/Error");
                }
            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        };
        fetchUsers();
        
        // Fetch unseen messages
        const fetchUnseen = async () => {
            try {
                const token = sessionStorage.getItem('accessToken');
                const response = await fetch("http://localhost:5000/chat/unseen", { 
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${token}`,
                    }
                });
                const responseData = await response.json();
                if (response.ok) {
                    setUnreadMessages(responseData);
                } else {
                    navigate(response.status === 500 ? "/Error500" : "/Error");
                }
            } catch (error) {
                console.error("Error fetching unseen messages: ", error);
            }
        };
        fetchUnseen();
    }, []);

    // Listen for incoming calls and display the video chat interface when a call is received
    useEffect(() => {
        if (socket) {
            socket.on("callUser", (data) => {
                console.log("Incoming call from: ", data.from, data.name);
                setReceivingCall(true);
                setCaller(data.from);
                setName(data.name);
                setCallerSignal(data.signal);
    
                // Display the video chat interface
                setShowVideoChat(true); 
            });

            // Clean up the event listener when the component unmounts
            return () => {
                socket.off("callUser");
            };
        }
    }, [socket]);

    // Handle receiving a new message and update the chat history or mark it as unread
    useEffect(() => {
        if (selectedUser) {
            socket.on('receiveMessage', (newMessage) => {
                
                if (newMessage.senderId === selectedUser || newMessage.receiverId === selectedUser) {
                    // If the message is from or to the selected user, update the chat history
                    setChatHistory((prevHistory) => [...prevHistory, newMessage]);
                } else {
                    // Otherwise, update unread messages count for the sender
                    setUnreadMessages((prevMessages) => {
                        const existingSenderIndex = prevMessages.findIndex(
                          (message) => message.senderId === newMessage.senderId
                        );
                      
                        if (existingSenderIndex !== -1) {
                            // Increment unread count if sender exists
                            return prevMessages.map((message, index) =>
                                index === existingSenderIndex
                                  ? { ...message, nbrMessagesUnseen: message.nbrMessagesUnseen + 1 }
                                  : message
                            );
                        } else {
                            // Add new sender with unread count if it doesn't exist
                            return [...prevMessages, { senderId: newMessage.senderId, nbrMessagesUnseen: 1 }];
                        }
                    });
                }
            });

            return () => {
                socket.off('receiveMessage');
            };
        }
    }, [selectedUser, chatHistory, unreadMessages]);

    // Handle user selection from the user list and fetch their chat history
    const handleUserClick = async (user) => {
        setSelectedUser(user._id); 
        setReceiverName(user.email);

        // Reset the unread message count for the selected user
        setUnreadMessages((prevMessages) =>
            prevMessages.map((message) =>
                message.senderId === user._id
                    ? { ...message, nbrMessagesUnseen: 0 }
                    : message
            )
        );

        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await fetch("http://localhost:5000/chat/messages", { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`,
                },
                body: JSON.stringify({ "id": user._id }),
            });
            const data = await response.json();
            if (response.ok) {
                setChatHistory(data.data);
            } else {
                navigate(response.status === 500 ? "/Error500" : "/Error");
            }
        } catch (error) {
            console.error("Error fetching chat messages: ", error);
        }

        try {
            const token = sessionStorage.getItem('accessToken');
            const response = await fetch("http://localhost:5000/chat/unseen", { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`,
                },
                body: JSON.stringify({ "id": selectedUser }),
            });
            const data = await response.json();
            if (!response.ok) {
                navigate(response.status === 500 ? "/Error500" : "/Error");
            }
        } catch (error) {
            console.error("Error fetching unseen messages: ", error);
        }
    };

    // Handle initiating a video call by setting the receiver's ID and showing the video chat component
    const handleCall = () => {
        setReceiverId(selectedUser);  
        setShowVideoChat(true);  
    };

    // Handle sending a message to the selected user via Socket.IO
    const handleSendMessage = () => {
        if (message.trim() && selectedUser) {
            const newMessage = {
                receiverId: selectedUser,
                message: message,
            };
            socket.emit('sendMessage', newMessage);
            setMessage('');
        }
    };

    return (
        <div className='chatDiv'>
            {showVideoChat && (
                <VideoChat 
                socket={socket} callerId={currentUserId} receiverId={receiverId} callerName={currentUserName} receiverName={receiverName} 
                onEndCall={() => {setShowVideoChat(false);     window.location.reload();}}
                onAddMsg={(msg) => setChatHistory((prevHistory) => [...prevHistory, msg])}
                receivingCall={receivingCall} caller={caller} name={name} callerSignal={callerSignal}
                setReceivingCall={setReceivingCall} setCaller={setCaller} setName={setName} setCallerSignal={setCallerSignal}
                />
            )}
            {!showVideoChat && (
                <>
                    <div className='left'>
                        <h2 className="titre1">Utilisateurs</h2>
                        <div className="friends">
                        {users && users.length > 0 ? (
                            users.map((user, index) => {
                                // Trouver le nombre de messages non lus pour l'utilisateur actuel
                                const unreadCount = unreadMessages.find(msg => msg.senderId === user._id)?.nbrMessagesUnseen || 0;

                                return (
                                <button 
                                    className={`buttonUser-${selectedUser === user._id ? 'selected' : 'notSelected'}`} 
                                    key={index} 
                                    onClick={() => handleUserClick(user)}
                                >
                                    <p className={`contenuCommentaire ${unreadCount > 0 ? 'bold' : ''}`}>
                                    {user.email}
                                    {unreadCount > 0 && (
                                        <span className="notificationBadge">
                                        {unreadCount}
                                        </span>
                                    )}
                                    </p>
                                </button>
                                );
                            })
                            ) : (
                            <div className="text1">Il n'y a aucun autre utilisateur actuellement</div>
                            )}

                        </div>

                    </div>
                    <div className='right'>
                        <div className="header">
                            <h2 className="titre2">Messages</h2>
                            {selectedUser ? (
                                    <button onClick={handleCall} className="envoyer">
                                        <img alt="call" src={call} className="call"></img>
                                    </button>
                                ) : (   
                                        <div></div>
                                )}
                        </div>
                        <div className="chatHistory" ref={chatHistoryRef}>
                            {selectedUser ? (
                                chatHistory.length > 0 ? (
                                    chatHistory.map((msg, index) => (<>
                                        <div key={index} className={`chat-bubble-${msg.senderId === currentUserId ? 'sent' : 'received'}  ${msg.type === "call" ? 'face-call' : ''}`}>
                                            <p className="message">{msg.message}</p>
                                        </div>
                                            
                                        <div className={`timestamp-${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
                                            {new Date(msg.timestamp).toLocaleDateString()}
                                            {' '}
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        </>
                                    ))
                                ) : (
                                    <div className="text1">La conversation est vide</div>
                                )
                            ) : (
                                <div className="text1">Sélectionnez un utilisateur pour voir la conversation</div>
                            )}
                        </div>
                        <div className="messageInput">
                            <input 
                                type="text"
                                className="placeholder"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tapez votre message..."
                            />
                            <button className="envoyer" onClick={handleSendMessage}>
                                <img className="send" alt="send" src={send}></img>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Chat;
