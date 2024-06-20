import { TryCatch } from "../middleware/error.middleware.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "../utils/events.js";
import {
  ErrorHandler,
  cookieOptions,
  emitEvent,
  sendToken,
  uploadFilesToCloudinary,
} from "../utils/features.js";
export const myChats = TryCatch(async (req, res, next) => {
  const chats = await Chat.find({ members: req.user }).populate("members");
  // console.log(chats)
  res.status(200).json({ success: true, chats });
});
export const myMessages = TryCatch(async (req, res, next) => {
  const { chatId } = req.body;
  const { page } = req.query;
  // console.log("page",page)
  const messages = await Message.find({ chat: chatId })
    .populate("sender")
    .sort({ createdAt: -1 })
    .skip((page - 1) * 10)
    .limit(10);
  // will have to reverse because message are in descending order right now
  res.status(200).json({ success: true, messages: messages.reverse() });
});
export const removeFriend = TryCatch(async (req, res, next) => {
  const { chatId } = req.body;
  console.log("chaitId", chatId);
  await Chat.deleteOne({ _id: chatId });
  await Message.deleteMany({ chat: chatId });
  res.status(200).json({ success: true });
});

export const sendAttachment = TryCatch(async (req, res, next) => {
  // console.log("reached")
  const { chatId } = req.body;
  console.log(chatId);
  // we added this [] because if there would be not file so atleast we would be able to apply length property
  const files = req.files || [];
  if (files.length < 1)
    return next(new ErrorHandler("Please provide attachments", 400));
  if (files.length > 5)
    return next(new ErrorHandler("Files can't be more than 5", 400));

  const [chat, me] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user),
  ]);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));
  //Upload files here
  const attachments = await uploadFilesToCloudinary(files);
  const messageForDB = {
    content: "",
    attachments,
    sender: me._id,
    chat: chatId,
  };
  const messageForRealTime = {
    ...messageForDB,
    sender: {
      _id: me._id,
      name: me.name,
    },
  };
  const message = await Message.create(messageForDB);

  emitEvent(req, NEW_MESSAGE, chat.members, {
    message: messageForRealTime,
    chatId,
  });

  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });

  return res.status(200).json({
    success: true,
    message,
  });
});

export const createGroup = TryCatch(async (req, res, next) => {
  const { selectedUsers, groupName } = req.body;
  // console.log("reached")
  if (groupName === "")
    return next(new ErrorHandler("Please provide group name"), 400);
  // console.log("reached1")
  // Listen here we just need two members because one is me so total we will get three 
  if (selectedUsers.length <= 1)
    return next(new ErrorHandler("Selected Members should be at least two  "), 400);
  // console.log("reached2")
  const group = await Chat.create({members:[...selectedUsers,req.user] , groupChat:true,name:groupName,creator:req.user})
  // console.log("reached3") 
  res.status(200).json( {groupId:group._id,members:[...selectedUsers,req.user]})
});

export const groupLeave = TryCatch(async (req, res, next) => {
  const { chatId } = req.body;
  // console.log("chaitId", chatId);
  const chat = await Chat.findById(chatId);

  if(!chat)return next(new ErrorHandler("Chat was not found",400))
    // because if one leaev so group will become of two members which will bbe not a group so just delete it 
  if(chat?.members.length ===3){await Chat.deleteOne({ _id: chatId });await Message.deleteMany({ chat: chatId });}
  else{
    chat.members =   chat?.members.filter((data)=>data.toString()!==req.user)
    // basically through this line of .save() method that document would be update in the database 
    await chat.save();

  }
  res.status(200).json({ success: true });
});