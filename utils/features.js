import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";
export const connectDB = (url) => {
  mongoose
    .connect(url, { dbName: "NamasteTalk" })
    .then((data) => console.log(`Connected to DB: ${data.connection.host}`))
    .catch((err) => {
      throw err;
    });
};
export const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};
export const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromises);

    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
    return formattedResults;
  } catch (err) {
    throw new Error("Error uploading files to cloudinary", err);
  }
};
export const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  return res.status(code).cookie("namaste-token", token, cookieOptions).json({
    success: true,
    user,
    message,
  });
};

// This is same as doing new Error("invalid soomething ") main thng is when you pass the err in the next then after that he will look for the middlware with the err arguement so there just do the error thing and send the error in the res.json({message:err.message})
export class ErrorHandler extends Error {
  constructor(message, statusCode) {
    // console.log(statusCode)
    super(message);
    this.statusCode = statusCode;
  }
}

export const emitEvent = (req, event, users, data) => {
  // here basically we did the app.set("io") in the app.js backend so we can get the io any where just do app.get("io")
  // Request Object (req): In Express, each request handler receives a req object that represents the HTTP request.
  // req.app: This property provides a reference to the Express application instance that is handling the request. It allows you to access the app instance within a request handler or middleware.
  const io = req.app.get("io");
  // The users coming from the arguement are the one whom message should be sent because they would be the member of the chat so of course but we can not send them message since few of them would be online here i am getting the actual users who are online from getSockets
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event , data);
};
