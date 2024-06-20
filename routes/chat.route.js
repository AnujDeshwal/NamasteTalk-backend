import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { createGroup, groupLeave, myChats, myMessages, removeFriend, sendAttachment } from "../controllers/chat.controller.js";
import { attachmentsMulter } from "../middleware/multer.middleware.js";

const app = express.Router();

//middleware , after here user must be logged in to access all routes below of it 
app.use(isAuthenticated)

app.get('/mychats' ,myChats)
app.post('/mymessages' ,myMessages)
app.post('/remove' ,removeFriend)
app.post('/sendAttachment' ,attachmentsMulter,sendAttachment)
app.post('/createGroup' ,createGroup)
app.post('/leave' ,groupLeave) 
  
export default app;