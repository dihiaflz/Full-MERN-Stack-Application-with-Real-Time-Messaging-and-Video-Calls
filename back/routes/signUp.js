require("dotenv").config();
const express = require("express");
const signUpRouter = express.Router();
const bcrypt = require("bcrypt");
const Users = require("../models/Users");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const _ = require('lodash');
const jwt = require("jsonwebtoken");
const authMiddlewareProv = require("../authMiddlewareProv");

let randomNumber;  // Stores the verification code
let newUser;  // Temporarily stores the new user

// Route for user sign-up
signUpRouter.post("/", async (req, res) => {
    try {
        // Check if passwords match
        if (req.body.password !== req.body.confirmPassword) {
            console.log("Passwords do not match");
            return res.status(400).send({ "response": "Passwords do not match" });
        }

        // Check if email is already registered
        const users = await Users.find({ email: req.body.email });
        if (users.length !== 0) {
            console.log("User already exists with this email: ", users);
            return res.status(400).send({ "response": "User already exists with this email" });
        }

        // Hash the user's password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        console.log(hashedPassword);

        // Create new user object
        newUser = new Users({
            email: req.body.email,
            password: hashedPassword
        });

        // Generate temporary token
        const temporaryToken = jwt.sign({ newUser }, process.env.SECRET_PROVISOIR, { expiresIn: "10m" });

        // Generate random verification code
        const randomBytes = crypto.randomBytes(2);
        randomNumber = (randomBytes.readUInt16BE(0) % 90000) + 10000;  // 5-digit number
        console.log(randomNumber);

        // Configure email transporter for sending the verification code
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'dihiadahdah@gmail.com',
                pass: 'deyexszhixwjwigq'  // Use environment variables in production
            }
        });

        // Email options
        const mailOptions = {
            from: 'dihiadahdah@gmail.com',
            to: req.body.email,
            subject: `Reset Code`,
            text: "Your confirmation code is " + randomNumber
        };

        // Send the verification code via email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(500).send("Error sending confirmation code");
            } else {
                console.log('Email sent: ' + info.response);
                res.status(200).json([{ "message": "success" }, temporaryToken]);
                console.log("Temporary token: ", temporaryToken);
                console.log("Code sent");
            }
        });
    } catch (err) {
        console.log("Error sending code");
        res.status(500).send("Error sending code");
    }
});

// Route to verify the code sent to the user
signUpRouter.post("/code", authMiddlewareProv, async (req, res) => {
    try {
        console.log(randomNumber);
        if (req.body.code === randomNumber) {
            console.log("Correct code");
            await newUser.save();
            res.status(200).send({ "response": "Code correct" });
        } else {
            console.log("Incorrect code");
            res.status(400).send({ "response": "Incorrect code" });
        }
    } catch (err) {
        console.log("Error verifying code");
        res.status(500).send("Error verifying code");
    }
});

// Route to generate and display a hashed password (for testing)
signUpRouter.post("/generateCrypt", async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    console.log(hashedPassword);
    res.status(200);
});

// Route to resend the verification code
signUpRouter.post("/repeat", authMiddlewareProv, async (req, res) => {
    try {
        // Generate a new random verification code
        const randomBytes = crypto.randomBytes(2);
        randomNumber = (randomBytes.readUInt16BE(0) % 90000) + 10000;
        console.log(randomNumber);

        // Resend the code via email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'dihiadahdah@gmail.com',
                pass: 'deyexszhixwjwigq'  // Use environment variables in production
            }
        });

        const mailOptions = {
            from: 'dihiadahdah@gmail.com',
            to: newUser.email,
            subject: `Reset Code`,
            text: "Your confirmation code is " + randomNumber
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(500).send("Error sending confirmation code");
            } else {
                console.log('Email sent: ' + info.response);
                res.status(200).json({ "message": "success" });
            }
        });
    } catch (err) {
        console.log("Error resending code");
        res.status(500).send("Error resending code");
    }
});

module.exports = signUpRouter;
