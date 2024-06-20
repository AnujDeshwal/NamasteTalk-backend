import {Schema , Types,model} from "mongoose";

const schema = new Schema({
    name:{
        type:String,
    },
    groupChat:{
        type:Boolean,
        default:false
    },
    creator:{
        type:Types.ObjectId,
        ref:"User"
    },
    members:[
        {
        type:Types.ObjectId,
        ref:"User"
    }],
},  
    {
        timestamps:true
    }
)
export const Chat = model("Chat",schema)