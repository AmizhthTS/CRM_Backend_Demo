/**
 * Image Uploader Utility
 * Handles image uploads to UploadThing with error handling
 * Takes image as input and outputs link
 */

import { UTApi } from "uploadthing/server";

// Initialize UploadThing API client
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

/**
 * Upload an image to UploadThing and return the URL
 * @param {Buffer} imageData - The image buffer to upload
 * @param {string} fileName - Optional custom file name
 * @returns {Promise<{success: boolean, url?: string, fileKey?: string, fileName?: string, error?: string}>}
 */
export async function uploadImage(imageData, fileName = null) {
  try {
    if (!process.env.UPLOADTHING_TOKEN) {
      throw new Error(
        "UPLOADTHING_TOKEN not configured in environment variables"
      );
    }

    if (!imageData) {
      throw new Error("No image data provided");
    }

    if (!Buffer.isBuffer(imageData)) {
      throw new Error("Invalid image data format. Expected Buffer object");
    }

    console.log("Starting image upload, size:", imageData.length, "bytes");

    const finalFileName = fileName || `image-${Date.now()}.jpg`;

    // Create a File object from Buffer
    const file = new File([imageData], finalFileName, { type: "image/jpeg" });

    // Upload using UTApi
    const response = await utapi.uploadFiles(file);

    if (response.error) {
      throw new Error(response.error.message || "Upload failed");
    }

    if (!response.data) {
      throw new Error("Upload successful but no data returned");
    }

    console.log("Image uploaded successfully:", response.data.ufsUrl);
    return {
      success: true,
      url: response.data.ufsUrl,
      fileKey: response.data.key,
      fileName: response.data.name,
    };
  } catch (error) {
    console.error("Image upload error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete an image from UploadThing by file key
 * @param {string} fileKey - The file key returned from upload
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteImage(fileKey) {
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

    console.log("Image deleted successfully:", fileKey);
    return { success: true };
  } catch (error) {
    console.error("Image deletion error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
