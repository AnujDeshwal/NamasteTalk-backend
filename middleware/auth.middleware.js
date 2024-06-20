import { User } from "../models/user.model.js";
import { ErrorHandler } from "../utils/features.js";
import jwt from "jsonwebtoken";
import { TryCatch } from "./error.middleware.js";
export const isAuthenticated =TryCatch( async(req,res , next)=>{
    const token =  req.cookies["namaste-token"];
    if(!token)return next(new ErrorHandler("Please login to access this route " , 401));
    const decodedData = await jwt.verify(token,process.env.JWT_SECRET);
    // token is a object with one key:value pair that is user id 
    req.user = decodedData._id;
    
    next();
})
// this authenticator is baically to authenticate that like somone trying to establish connection which is not authenticated so this is a problem , and you know we used isAuthenticated  middleware that was for http request not server has changed to io ,  so here also need authentication  and also we need user in the socket.user
export const socketAuthenticator = async(err , socket , next)   =>{
    try{
        if(err)return next(err)

        const authToken = socket.request.cookies["namaste-token"];
        if(!authToken)return next(new ErrorHandler("Please login to access this route",401));

        const decodedData = jwt.verify(authToken , process.env.JWT_SECRET);
        const user = await User.findById(decodedData._id);

        if(!User)return next(new ErrorHandler("Please login to access this route",401));

        socket.user = user;
        return next();
    }
    catch(err){
        console.log(err);
    return next(new ErrorHandler("Please login to access this route",401));
    }
}