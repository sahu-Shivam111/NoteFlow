const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 5, // Hard limit of 5 files per request
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".txt"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Allowed: JPG, PNG, PDF, DOC, TXT"));
        }
    }
});

module.exports = upload;
