import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import PhoneIcon from "@material-ui/icons/Phone"
import React, { useEffect, useRef, useState } from "react"
import Peer from "simple-peer"
import "./FaceCall.css"
import { exit } from "process"

// This is the FaceCall component responsible for handling video calls
function FaceCall({socket, callerId, receiverId, callerName, receiverName, onEndCall, onAddMsg, caller, name, callerSignal, receivingCall, setCaller, setName, setCallerSignal, setReceivingCall}) {
    // State for managing video stream, call status, and socket IDs
	const [stream, setStream] = useState() // stores the user's video and audio stream
	const [callAccepted, setCallAccepted] = useState(false) // indicates whether the call has been accepted
	const [callEnded, setCallEnded] = useState(false) // indicates whether the call has ended
    const [callerSocketId, setCallerSocketId] = useState("") // socket ID of the caller
    const [receiverSocketId, setReceiverSocketId] = useState("") // socket ID of the receiver
    const [callEmit, setCallEmit] = useState(false) // indicates whether the call has been initiated
    const [message, setMessage] = useState("") // message in case the receiver call in not connected
	const myVideo = useRef() // reference to the user's video element
	const userVideo = useRef() // reference to the other user's video element
	const connectionRef = useRef() // reference to the WebRTC peer connection

    // useEffect hook to request access to user's media and listen for incoming calls
	useEffect(() => {
        console.log("Parameters: ", socket, callerId, receiverId, callerName, receiverName)

		// Request user's video and audio stream
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => { 
			setStream(stream) // Save the stream in state
			myVideo.current.srcObject = stream // Display the stream in the user's video element
		})

		// Listen for "callUser" event to handle incoming calls
		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from) // Set caller's ID
			setName(data.name) // Set caller's name
			setCallerSignal(data.signal) // Set the caller's signal for WebRTC connection
		})

	}, [])

    // useEffect to handle call cancellation or rejection
    useEffect(() => {
        const handleCallEnd = () => {
            console.log("Call canceled or rejected");
            if (connectionRef.current) {
                connectionRef.current.destroy(); // Destroy WebRTC connection if exists
            }
            setCallEnded(true); // Set call ended to true
            onEndCall(); // Execute the callback to end the call
        };

        // Listen for callCancelled and callRejected events from the socket
        socket.on("callCancelled", handleCallEnd);
        socket.on("callRejected", handleCallEnd);

        // Cleanup listeners when component unmounts
        return () => {
            socket.off("callCancelled", handleCallEnd);
            socket.off("callRejected", handleCallEnd);
        };
    }, [socket, onEndCall]);

    // Function to handle call cancellation by the user
    const handleCallCancel = () => {
        if (!callEmit){
            onEndCall() // End the call locally if it hasn't been initiated
        } else {
            socket.emit("callCancelled", { from: callerId, to: receiverId }); // Emit cancel event to the server
            onEndCall(); // End the call locally
        }
    }

    // Function to handle rejection of the call
    const handleCallRejected = async () => {
        const callerIdReel = await new Promise((resolve, reject) => {
            socket.emit('getUserId', caller, (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.userId); // Get the real user ID of the caller
                }
            });
        });
        socket.emit("callRejected", { from: callerIdReel, to: callerId }); // Emit rejection event
        onEndCall(); // End the call locally
    }

    // Function to initiate a call to the receiver
	const callUser = async () => {
        try {
            setCallEmit(true) // Indicate the call is being emitted

            // Get the caller's socket ID from the server
            const callerResponse = await new Promise((resolve, reject) => {
                socket.emit('getSocketId', callerId, (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response.socketId); // Save caller's socket ID
                    }
                });
            });

            // Get the receiver's socket ID from the server
            const receiverResponse = await new Promise((resolve, reject) => {
                socket.emit('getSocketId', receiverId, (response) => {
                    if (response.error) {
                        setMessage("(not connected)")
                        socket.emit("callUserNotConnected", {from: callerId, userToCall: receiverId})
                        return;
                    } else {
                        resolve(response.socketId); // Save receiver's socket ID
                    }
                });
            });

            setCallerSocketId(callerResponse); // Store caller's socket ID
            setReceiverSocketId(receiverResponse); // Store receiver's socket ID

            // Initialize a new Peer (WebRTC connection)
            const peer = new Peer({
                initiator: true, // Caller initiates the connection
                trickle: false,
                stream: stream // Pass the user's stream
            });
            connectionRef.current = peer; // Save peer connection reference

            // When the peer generates a signal, send it to the receiver via the socket
            peer.on("signal", (data) => {
                socket.emit("callUser", {
                    userToCall: receiverResponse, // Receiver's socket ID
                    signalData: data, // WebRTC signal data
                    from: callerResponse, // Caller's socket ID
                    name: callerName // Caller's name
                });
            });

            // Set the other user's video stream when received
            peer.on("stream", (stream) => {
                userVideo.current.srcObject = stream; // Display receiver's stream
            });

            // Listen for call acceptance and connect the peers
            socket.on("callAccepted", (signal) => {
                setCallAccepted(true); // Mark the call as accepted
                peer.signal(signal); // Complete the WebRTC connection
            });

        } catch (error) {
            console.error("Error during the call: ", error);
        }
    };

    // Function to answer an incoming call
	const answerCall = () => {
		setCallAccepted(true) // Accept the call
		const peer = new Peer({
			initiator: false, // The callee is not the initiator
			trickle: false,
			stream: stream // Pass the user's stream
		})
		
		// Send signal to the caller once answered
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller }) // Send signal to the caller
		})

		// Display the caller's stream
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream // Display caller's stream
		})

		// Signal the connection using the caller's signal
		peer.signal(callerSignal)
		connectionRef.current = peer // Save the peer connection reference
	}

    // Function to leave the call
	const leaveCall = () => {
        console.log("Leaving the call");
        console.log("Connection Ref:", connectionRef.current);
        setCallEnded(true); // Mark the call as ended
        connectionRef.current.destroy(); // Destroy the WebRTC connection
        onEndCall(); // End the call locally
    }

    // JSX for rendering the video call interface  

	return (
		<div className="faceCallContainer">
            <div className="video-container">
                <div className="video">
                    <video
                        playsInline
                        muted
                        ref={myVideo}
                        autoPlay
                    />
                </div>
                <div className="video">
                    {callAccepted && !callEnded && (
                        <video
                            playsInline
                            ref={userVideo}
                            autoPlay
                        />
                    )}
                </div>
            </div>

		
            <div className="call-button">
                {callAccepted && !callEnded ? (
                    <Button variant="contained" color="secondary" onClick={leaveCall}>
                    End Call
                    </Button>
                ) : null}
                
                    {!callAccepted && !callEmit && !receivingCall ? (<IconButton color="primary" aria-label="call" onClick={() => callUser()}>
                        <PhoneIcon fontSize="large" />
                    </IconButton>) : null }
                    {!receivingCall && !callAccepted ?  (<Button variant="outlined" color="primary" onClick={() => handleCallCancel()}>Cancel</Button>) : null}
                    
                    {callEmit && !callAccepted ? (<h1>Calling {receiverName} ... {message}</h1>) : null}
                
            </div>
			
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
                            <h1 >{receiverName} is calling...</h1>
                            <div className="call-button2">
                                <Button variant="contained" color="primary" onClick={answerCall}>
                                    Answer
                                </Button>
                                <Button variant="outlined" color="primary" onClick={() => handleCallRejected()}>Cancel</Button>
                            </div>
					</div>
				) : null}
			</div>
		</div>
		
	)
}

export default FaceCall;