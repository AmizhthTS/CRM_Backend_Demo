import { response, Router } from "express";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "../config/uploadThing.js";
import upload from "../middleware/multerConfig.js";
import { uploadImage } from "../utils/imageUploader.js";
import { adminOnly } from "../middleware/authMiddleware.js";
import { uploadFile } from "../utils/fileUploader.js";

const router = Router();

// Public image upload endpoint (for authenticated users)
router.post("/file", upload.single("file"), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        response: {
          responseStatus: 400,
          responseMessage: "No file provided",
        },
      });
    }

    // Upload to UploadThing
    const uploadResult = await uploadFile({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        response: {
          responseStatus: 500,
          responseMessage: "File upload failed",
          error: uploadResult.error,
        },
      });
    }

    return res.status(200).json({
      response: {
        responseStatus: 200,
        responseMessage: "File uploaded successfully",
      },
      data: {
        url: uploadResult.url,
        fileKey: uploadResult.fileKey,
        fileName: uploadResult.fileName,
      },
    });
  } catch (error) {
    console.error("Upload endpoint error:", error);
    return res.status(500).json({
      response: {
        responseStatus: 500,
        responseMessage: "File upload failed",
        error: error.message,
      },
    });
  }
});

// Admin-only image upload endpoint
router.post(
  "/image",
  // ...adminOnly,
  upload.single("image"),
  async (req, res) => {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          response: {
            responseStatus: 400,
            responseMessage: "No image file provided",
          },
        });
      }

      // Upload to UploadThing
      const uploadResult = await uploadImage(
        req.file.buffer,
        req.file.originalname
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          response: {
            responseStatus: 500,
            responseMessage: "Image upload failed",
            error: uploadResult.error,
          },
        });
      }

      return res.status(200).json({
        response: {
          responseStatus: 200,
          responseMessage: "Image uploaded successfully",
        },
        data: {
          url: uploadResult.url,
          fileKey: uploadResult.fileKey,
          fileName: uploadResult.fileName,
        },
      });
    } catch (error) {
      console.error("Upload endpoint error:", error);
      return res.status(500).json({
        response: {
          responseStatus: 500,
          responseMessage: "Image upload failed",
          error: error.message,
        },
      });
    }
  }
);

export { router as uploadRoutes };

export const uploadThingRoutes = createRouteHandler({
  router: uploadRouter,
  config: {
    // Optional: Configure CORS and other settings
    // uploadthingId: process.env.UPLOADTHING_APP_ID,
    // uploadthingSecret: process.env.UPLOADTHING_TOKEN,
  },
});
