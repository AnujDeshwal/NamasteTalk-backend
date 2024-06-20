import mongoose, { Schema, model } from "mongoose";
import { hash } from "bcrypt";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      // here select false means whenever you will be retreiving the data from the database so this field will not come with the data , it will come only if we specifically give some command to come with the data
      select: false,
    },
    // public_id: This property likely refers to an identifier or key associated with the image file in a cloud storage service, such as Cloudinary or Amazon S3. The public_id uniquely identifies the image within the storage system and is often used to retrieve or manipulate the image programmatically. It might be used, for example, to construct the URL for accessing the image.
    // url: This property contains the URL or web address where the image file can be accessed over the internet. It is typically used to display the image in web pages or applications. The URL points to the location of the image file in the cloud storage service or wherever it is hosted.
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// below thing should be performed beforing saving the data in the database 
schema.pre("save", async function (next) {
  // here if we would be updating the user so then it will again hash the password so this way it is not efficient so yes put a check that if passsword is modified then only hash it otherwise not 
  if (!this.isModified("password")) return next();

  this.password = await hash(this.password, 10);
});

export const User = model("User", schema);
