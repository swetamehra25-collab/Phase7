import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true
    },

    fileUrl: {
      type: String,
      required: true
    },

    publicId: {
      type: String,
      required: true
    },
    
    resourceType: {
  type: String,
  required: true
},

    mimeType: {
      type: String,
      required: true
    },

    size: {
      type: Number,
      required: true
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

const File = mongoose.model("File", fileSchema);

export default File;