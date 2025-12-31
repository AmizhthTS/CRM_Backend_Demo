import { createUploadthing } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// File size and type configurations
const MAX_FILE_SIZE = "16MB";

// Define FileRouter with all upload routes
export const uploadRouter = {
  // Product image uploader
  productImageUploader: f({
    image: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileCount: 10,
    },
  })
    .middleware(async (req, res) => {
      // Add authentication check here if needed
      // const user = await auth(req);
      // if (!user) throw new UploadThingError("Unauthorized");

      return {
        userId: req.user?.userId || "anonymous",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Product image uploaded:", file.name, file.url);
      return { uploadedBy: metadata.userId };
    }),

  // Blog image uploader
  blogImageUploader: f({
    image: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileCount: 5,
    },
  })
    .middleware(async (req, res) => {
      return {
        userId: req.user?.userId || "anonymous",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Blog image uploaded:", file.name, file.url);
      return { uploadedBy: metadata.userId };
    }),

  // General file uploader (documents, etc.)
  documentUploader: f({
    pdf: { maxFileSize: MAX_FILE_SIZE },
    "application/msword": { maxFileSize: MAX_FILE_SIZE },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: MAX_FILE_SIZE,
    },
  })
    .middleware(async (req, res) => {
      return {
        userId: req.user?.userId || "anonymous",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document uploaded:", file.name, file.url);
      return { uploadedBy: metadata.userId };
    }),
};
