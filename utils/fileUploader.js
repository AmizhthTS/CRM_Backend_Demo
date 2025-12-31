// File Uploader Utility
// Handles file uploads to UploadThing with error handling
// Takes file as input and outputs link

import { UTApi } from "uploadthing/server";

// Initialize UploadThing API client
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

/**
 * Upload a file to UploadThing and return the URL
 * @param {File} file - The file to upload
 * @returns {Promise<{success: boolean, url?: string, fileKey?: string, fileName?: string, error?: string}>}
 */
export async function uploadFile({ buffer, originalname }) {
  try {
    if (!process.env.UPLOADTHING_TOKEN) {
      throw new Error(
        "UPLOADTHING_TOKEN not configured in environment variables"
      );
    }

    if (!buffer || !originalname) {
      throw new Error("No file provided");
    }

    console.log("Starting file upload, size:", buffer.length, "bytes");

    // Upload using UTApi
    const response = await utapi.uploadFiles(buffer, {
      name: originalname,
    });

    if (response.error) {
      throw new Error(response.error.message || "Upload failed");
    }

    if (!response.data) {
      throw new Error("Upload successful but no data returned");
    }

    console.log("File uploaded successfully:", response.data.ufsUrl);
    return {
      success: true,
      url: response.data.ufsUrl,
      fileKey: response.data.key,
      fileName: response.data.name,
    };
  } catch (error) {
    console.error("File upload error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a file from UploadThing by file key
 * @param {string} fileKey - The file key returned from upload
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFile(fileKey) {
  try {
    if (!fileKey) {
      throw new Error("No file key provided");
    }

    if (!process.env.UPLOADTHING_TOKEN) {
      throw new Error("UPLOADTHING_TOKEN not configured");
    }

    // Delete using UTApi
    const response = await utapi.deleteFiles(fileKey);

    if (!response.success) {
      throw new Error(response.error || "Delete failed");
    }

    console.log("File deleted successfully:", fileKey);
    return { success: true };
  } catch (error) {
    console.error("File deletion error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
