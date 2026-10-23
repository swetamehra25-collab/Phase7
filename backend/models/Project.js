
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private"
    }
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
