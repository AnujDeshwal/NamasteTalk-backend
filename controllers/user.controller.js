import {
  ErrorHandler,
  cookieOptions,
  emitEvent,
  sendToken,
  uploadFilesToCloudinary,
} from "../utils/features.js";
import { User } from "../models/user.model.js";
import { TryCatch } from "../middleware/error.middleware.js";
import { compare } from "bcrypt";
import { Chat } from "../models/chat.model.js";
import { Request } from "../models/request.model.js";
import { NEW_REQUEST } from "../utils/events.js";

export const newUser = TryCatch(async (req, res) => {
  const { name, bio, username, password } = req.body;
  const file = req.file;
  const result = await uploadFilesToCloudinary([file]);

  const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };
  const user = await User.create({
    name,
    bio,
    username,
    password,
    avatar,
  })
  sendToken(res, user, 201, "User created");
});

export const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid Username or Password", 404));
  const isMatch = await compare(password, user.password);
  if (!isMatch)
    return next(new ErrorHandler("Invalid Username or Password", 404));
  sendToken(res, user, 200, `Welcome Back , ${user.name}`);
});

export const getMyProfile = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.user);
  if (!user) return next(new ErrorHandler("User not found", 404));
  res.status(200).json({
    success: true,
    user,
  });
});
export const logout = TryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie("namaste-token", "", { ...cookieOptions, maxAge: 0 })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

export const friendRequest = TryCatch(async (req, res, next) => {
  // console.log("reached")

  const { receiver } = req.body;
  // console.log("reached1")

  const sender = req.user;
  // console.log("reached2")

  const isExist = await Request.findOne({
    $or: [
      { sender: sender, receiver: receiver },
      { sender: receiver, receiver: sender },
    ],
  });
  // console.log("reached3")

  if (isExist) return next(new ErrorHandler("Request already sent", 400));
  // console.log("reached4")
  await Request.create({ sender, receiver });
  // console.log("reached5")
  // emitEvent(req, NEW_REQUEST, [receiver]);
  // console.log("reached6")
  res.status(200).json({ success: true });
  // console.log("reached7")
});

export const searchUser = TryCatch(async (req, res, next) => {
  const { name = "" } = req.query;
  //finding all my Chats , i can get it by finding the chats where i am the member
  const allMyChats = await Chat.find({ members: req.user });

  //  basically flatMap is like that lets say it is iterating a array of objects so it will go through each element of the object as well where map will go to each array element which is object but flatmap goes inside of the object as well will iterate each element
  const allUsersFromMyChats = allMyChats.flatMap((chat) => chat.members);

  // here regex is like whatever pattern like "an" you will give to it it will find name having substring as that pattern , here pattern is the name and "i" is basically that he will search for the pattern by being case insensitive
  // you will be wondering that in the _id  part there there will be my _id as well in the allUsersFromMyChats so why using this  $ne:req.user because if you are newly logged in so there will be no chat means there will be no id of yours so for that reason
  const allUsersExceptMeAndFriends = await User.find({
    _id: { $nin: allUsersFromMyChats, $ne: req.user },
    name: { $regex: name, $options: "i" },
  });

  //Modifying the response
  const users = allUsersExceptMeAndFriends.map(({ name, _id, avatar }) => ({
    name,
    _id,
    avatar: avatar.url,
  }));

  res.status(200).json({
    success: true,
    users,
  });
});

export const allRequests = TryCatch(async (req, res, next) => {
  const requests = await Request.find({ receiver: req.user }).populate(
    "sender"
  );
  const allUsers = requests.map(({ sender }) => sender);
  res.status(200).json({ allUsers });
});

export const handleRequest = TryCatch(async (req, res, next) => {
  // here userId is the id of whom i accepted or reject the request and req.user is my id
  const { request, userId } = req.body;
  if (!userId) return next(new ErrorHandler("please provide userid", 400));
  await Request.deleteOne({ sender: userId });
  const requests = await Request.find({ receiver: req.user }).populate(
    "sender"
  );
  const allUsers = requests.map(({ sender }) => sender);

  if (request === true) {
    const friend = await User.findOne({ _id: userId });
     await Chat.create({  members: [req.user, userId] }).then(
      (chat) =>res.status(200).json({ success: true, friendName: friend.name,chat, allUsers })
    );

     
  } else res.status(200).json({ success: true, allUsers });
});
export const myFriends = TryCatch(async (req, res, next) => {
  const myChats = await Chat.find({ members: req.user }).populate("members");
  let friends = [];
  myChats.map(({ members }) => {
    members.map((data) => {
      // console.log(data._id , req.user)
      // since data._id is in the objectId form so convert it in string is important 
      // here the data which has only two members are needed only because they will be my friends only because if it is group chat so then they will be freind of the creator not necessarily mine 
      if (data._id.toString() !== req.user && members.length==2) friends.push(data);
      else console.log("hello")
    });
  });
  // console.log(friends)
  res.status(200).json({status:true ,friends })
});
