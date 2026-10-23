
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
  ,
  preferences: {
    theme: {
      type: String,
      enum: ["default", "dark", "light"],
      default: "default"
    },
    defaultVisibility: {
      type: String,
      enum: ["private", "public"],
      default: "private"
    },
    notifications: {
      type: String,
      enum: ["all", "mentions", "none"],
      default: "all"
    }
  }
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;
