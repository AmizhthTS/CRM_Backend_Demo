import multer from "multer";

// Use memory storage to keep files in buffer for UploadThing
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
  },

  fileFilter: (req, file, cb) => {
    console.log("file uploaded successfully", file.mimetype);
    // Accept images only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else if (file.mimetype === "application/pdf") {
      // Accept PDF files
      cb(null, true);
    } else {
      cb(new Error("Only image and file files are allowed"), false);
    }
  },
});

export default upload;
