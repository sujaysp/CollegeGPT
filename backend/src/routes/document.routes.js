const express = require("express");
const multer = require("multer");

const {
  uploadDocument,
  getDocuments,
  getDocument,
  openDocument,
  deleteDocument,
} = require("../controllers/document.controller");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return cb(new Error("Only PDF files are supported"));
    }

    cb(null, true);
  },
});

/*
|--------------------------------------------------------------------------
| DOCUMENT ROUTES
|--------------------------------------------------------------------------
*/

/*
GET /api/documents
Load all documents for logged-in user
*/
router.get("/", getDocuments);

/*
POST /api/documents/upload
Upload PDF
*/
router.post(
  "/upload",
  upload.single("file"),
  uploadDocument
);

/*
|--------------------------------------------------------------------------
| OPEN PDF
|--------------------------------------------------------------------------
*/

/*
Main endpoint
GET /api/documents/:id/open
*/
router.get("/:id/open", openDocument);

/*
Alternative endpoint
GET /api/documents/:id/file
*/
router.get("/:id/file", openDocument);

/*
Alternative endpoint
GET /api/documents/:id/view
*/
router.get("/:id/view", openDocument);

/*
Alternative endpoint
GET /api/documents/open/:id
*/
router.get("/open/:id", openDocument);

/*
Alternative endpoint
GET /api/documents/file/:id
*/
router.get("/file/:id", openDocument);

/*
|--------------------------------------------------------------------------
| GET SINGLE DOCUMENT
|--------------------------------------------------------------------------
*/

router.get("/:id", getDocument);

/*
|--------------------------------------------------------------------------
| DELETE DOCUMENT
|--------------------------------------------------------------------------
*/

router.delete("/:id", deleteDocument);

module.exports = router;