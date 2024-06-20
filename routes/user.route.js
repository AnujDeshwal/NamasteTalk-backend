import express from "express";
import {  allRequests, friendRequest, getMyProfile, handleRequest, login, logout, myFriends, newUser, searchUser } from "../controllers/user.controller.js";
import { singleAvatar } from "../middleware/multer.middleware.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const app = express.Router();

app.post("/newUser" , singleAvatar ,newUser );
app.post("/login",login)

//middleware , after here user must be logged in to access all routes below of it 
app.use(isAuthenticated)
app.get('/me' , getMyProfile);
app.get('/logout' , logout);
app.post('/request',friendRequest)
app.get('/allrequests',allRequests)
app.get('/allUsers' ,searchUser)
app.get('/myfriends' ,myFriends)
app.post('/handlerequest' ,handleRequest)

export default app;