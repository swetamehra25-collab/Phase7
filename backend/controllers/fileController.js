import mongoose from "mongoose";
import path from "path";

import cloudinary from "../config/cloudinary.js";
import Project from "../models/Project.js";
import File from "../models/File.js";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";

export const uploadFile = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const userId = req.user.userId;
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project"
      });
    }

    const uploadedAsset = await uploadToCloudinary(req.file, projectId);

    const savedFile = await File.create({
      originalName: req.file.originalname,
      fileUrl: uploadedAsset.secure_url,
      publicId: uploadedAsset.public_id,
      resourceType: uploadedAsset.resource_type,
      mimeType: req.file.mimetype,
      size: req.file.size,
      project: project._id,
      uploadedBy: userId
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully!",
      file: {
        id: savedFile._id,
        originalName: savedFile.originalName,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        project: savedFile.project,
        uploadedBy: savedFile.uploadedBy,
        createdAt: savedFile.createdAt
      }
    });
  } catch (error) {
    console.error("File upload error:", error.message);

    res.status(500).json({
      success: false,
      message: "File upload failed. Check the backend terminal."
    });
  }
};

export const getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const userId = req.user.userId;
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project"
      });
    }

    const files = await File.find({ project: projectId })
      .select("originalName mimeType size resourceType uploadedBy createdAt")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    console.error("Get files error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not fetch project files"
    });
  }
};

export const previewFile = async (req, res) => {
  try {
    const { projectId, fileId } = req.params;

    if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID or file ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const userId = req.user.userId;
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project"
      });
    }

    const file = await File.findOne({
      _id: fileId,
      project: projectId
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    const format = path.extname(file.originalName).slice(1).toLowerCase();

    if (!format) {
      return res.status(400).json({
        success: false,
        message: "Could not determine file format"
      });
    }

    const previewUrl = cloudinary.utils.private_download_url(file.publicId, format, {
      resource_type: file.resourceType,
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 300,
      attachment: false
    });

    res.status(200).json({
      success: true,
      message: "Preview link generated successfully!",
      previewUrl,
      expiresInSeconds: 300
    });
  } catch (error) {
    console.error("File preview error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not generate file preview"
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { projectId, fileId } = req.params;

    if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(fileId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID or file ID"
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const userId = req.user.userId;
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(
      (memberId) => memberId.toString() === userId
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project"
      });
    }

    const file = await File.findOne({
      _id: fileId,
      project: projectId
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    const isUploader = file.uploadedBy.toString() === userId;

    if (!isOwner && !isUploader) {
      return res.status(403).json({
        success: false,
        message: "Only the uploader or project owner can delete this file"
      });
    }

    await cloudinary.uploader.destroy(file.publicId, {
      resource_type: file.resourceType,
      type: "authenticated",
      invalidate: true
    });

    await File.findByIdAndDelete(fileId);

    res.status(200).json({
      success: true,
      message: "File deleted successfully!"
    });
  } catch (error) {
    console.error("Delete file error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not delete file"
    });
  }
};

export default {
  uploadFile,
  getProjectFiles,
  previewFile,
  deleteFile
};
