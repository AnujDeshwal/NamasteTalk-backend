  import express from "express"
  import { Server } from "socket.io";
 
  import  {createServer} from "http";
  import { connectDB } from "./utils/features.js";
  import dotenv from "dotenv";
  import {v4 as uuid} from 'uuid';
  import cookieParser  from "cookie-parser";
  import {v2 as cloudinary} from "cloudinary";
  import { corsOptions } from "./utils/config.js";
  import cors from "cors";
  import userRoute from "./routes/user.route.js";
  import chatRoute from "./routes/chat.route.js";
  import { errorMiddleware } from "./middleware/error.middleware.js";
  import { socketAuthenticator } from "./middleware/auth.middleware.js";
  import { NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "./utils/events.js";
  import { getSockets } from "./lib/helper.js";
  import { Message } from "./models/message.model.js";
 

  dotenv.config();
  const app = express();
  //Socket io 

  export const userSocketIDs = new Map();
  

  const server = createServer(app);
  const io =  new Server(server ,{
    cors:corsOptions
  });

  // app.set("io", io); sets a value associated with the key "io" to the io object in the Express application. This is useful for making the io object available throughout your application, including in your routes or middleware.
  app.set("io",io);
  // You can retrieve the io object later using app.get("io");. This can be done in your routes, middleware, or any other part of your application where you have access to the app instance.


  //variables from the env
  const MONGO_URL = process.env.MONGO_URL;
  const PORT = process.env.PORT;

  //connection with the mongodb 
  connectDB(MONGO_URL);

  //middleware 


 
 

  app.use(express.json())
  app.use(cors(corsOptions))
  app.use(cookieParser());


  //configure the cloudinary
  cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });




    
  //Definging Base Routes 
  app.use("/user" , userRoute );
  app.use("/chat" , chatRoute)

  //Socket.io 
  //  basically here io.use is like you are provding the middleware to the io , and always remember first i am using io.use then whole code of socket is writtne below of it it means first that this middleware will be applied to each io request like on , to , that why just fetch the user from the cookieParser

  //now very important since we need cookie to get the user or check if user is authenticated or have logged in or not , now you would wonder why not to access req.user , basically now io has its own server here we can not take user of http request or response here socket has its own request and response  , cookieParser can parse the cookie coming from the http request but to parse the cookie which reside inside the socket you need to explicitly tell the cookieparser to parse the cookie of socket.request , and remember socket has access of cookies of http requestt  , socket.request.res has no use you can put null also insted of it  , and the third arguement is a callback which will be triggered if cookie would be parsed completely it will contain err also if any  
  io.use((socket,next)=>{
    cookieParser()(
      socket.request,
      socket.request.res,
      async(err)=>await socketAuthenticator(err,socket,next)
    ) 
  })
  // In Socket.IO, socket refers to an individual connection between the server and a client. When a new client connects to the server, the server creates a new socket object representing that connection. You can think of the socket as a bi-directional communication channel between the client and the server.
  io.on("connection" , (socket)=>{
    // we get the socket.user from the socketAuthenticator function 
    const user = socket.user;

    // here very important that for good info of socket.io first go to notes in the same project then socket.io , now here i took a map named as userSocketIDs so basically whichever user will connect to this server will map its socket id with the user id in the userSocketIDs so in this way total online or active user will be gotten easily because they are online so all will come insde of userSocketIDs now , in particular event like NEW_MESSAGAE chatid and member will come so it would consisit of member belongs to one chat only so now then you would be seeing there is a functon getSocket which we are calling basically here we are getting the socketId of those who are online in this chat right now because we have right now all the friends who are online then we are getting the members array of partcular chatid so then we can see who are online from this chat only so right now me and priyanshu is online , means right now we both have opened the middle section where messages between you and group members are shown , so whoever friends are online who has opened the middle section or message section wher user can type of course a message should be shown to them in there , for them we have done emit a NEW_MESSAGE event so  , now very important   ,you would have noticed that NEW_MESSAGE event is also coming from the frontend so we are also listening it and we are also emitting a event named as NEW_MESSAGE event so we can do it that is okay , message alert is for those who has not opened the middle section so for them just a alert on the right section over the chat that 4 message has come or 5 messages have come , only this would be shown 
    
    userSocketIDs.set(user?._id.toString() , socket.id);

    socket.on(NEW_MESSAGE , async({chatId , members , message}) =>{
      // console.log("members : " , members)
      // console.log("message content :" , message)
      const messageForRealTime = {
        content:message,
        _id:uuid(),
        sender:{
          _id:user._id,
          name:user.name,
        },
        chat:chatId,
        createdAt:new Date().toISOString()
      };
      
      const messageForDB = {
        content: message,
        sender: user._id,
        chat: chatId, 
      };
      const memberSocket = getSockets(members);
      // console.log("emitting from the server:",memberSocket);
      io.to(memberSocket).emit(NEW_MESSAGE , {
        chatId ,
        message:messageForRealTime
      });
      
      io.to(memberSocket).emit(NEW_MESSAGE_ALERT, {chatId});
      
      try{
        await Message.create(messageForDB)
      }catch(error){
        throw new Error(error)
      }
    })
    socket.on(REFETCH_CHATS,({chatId="",members})=>{
      // remember that here member members is a collection of ids ,toString is being used because id is a object of ObjectId class  so toString change it to string which is a id 
      let memberSockets = []
      if(members[0]._id)
    { console.log("above")
      memberSockets = members.map((member) => userSocketIDs.get(member._id.toString()));}
    else  {console.log("below")
      memberSockets = members.map((member) => userSocketIDs.get(member.toString()));}


      // console.log("emitting from the server:",memberSocket);

      io.to(memberSockets).emit(REFETCH_CHATS,chatId); 
    })
  })




  // very important there is a middleware section abover where most of the middleware are declared because these middleware should be executed before execution of the route but errorMiddlware is defined at the end because it should be executed after execution of the route ,because after executin of the route error will come then errorMiddleware should come 
  app.use(errorMiddleware);
  //Listening to the port 
  // server.listen(PORT, (err) => {
  //   if (!err) console.log(`Listening to the port no.:${PORT}`);
  //   else console.log(err);
  // });
  export default app;
  export { server , io };
