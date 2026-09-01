const jwt = require("jsonwebtoken");
const { PDFParse } = require("pdf-parse");
const Document = require("../models/document.model");

const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const getUserId = (decoded) => {
  return decoded?.id || decoded?.userId || decoded?._id || decoded?.user;
};

const uploadDocument = async (req, res) => {
  let parser = null;

  try {
    const decoded = getUserFromToken(req);

    if (!decoded) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userId = getUserId(decoded);

    if (!userId) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required",
      });
    }

    const file = req.file;

    console.log("PDF upload received");
    console.log("File name:", file.originalname);
    console.log("File size:", file.size);
    console.log("MIME type:", file.mimetype);

    if (
      file.mimetype !== "application/pdf" &&
      !file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      return res.status(400).json({
        message: "Only PDF files are supported",
      });
    }

    if (!file.buffer || file.buffer.length === 0) {
      return res.status(400).json({
        message: "Uploaded PDF is empty",
      });
    }

    parser = new PDFParse({
      data: file.buffer,
    });

    const result = await parser.getText();

    const extractedText =
      typeof result?.text === "string"
        ? result.text.trim()
        : "";

    console.log("PDF text extracted successfully");
    console.log("Extracted characters:", extractedText.length);

    if (!extractedText) {
      return res.status(400).json({
        message:
          "The PDF was processed, but no readable text was found. Scanned/image-only PDFs are not supported yet.",
      });
    }

    const document = await Document.create({
      user: userId,
      originalName: file.originalname,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      fileData: file.buffer,
      extractedText: extractedText,
    });

    console.log(
      "Document saved successfully:",
      document._id.toString()
    );

    return res.status(201).json({
      message: "PDF uploaded successfully",
      document: {
        id: document._id,
        _id: document._id,
        fileName: document.fileName,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        textLength: extractedText.length,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("Document upload error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Document validation failed",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong while processing the PDF",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (destroyError) {
        console.error(
          "PDF parser cleanup error:",
          destroyError
        );
      }
    }
  }
};

const getDocuments = async (req, res) => {
  try {
    const decoded = getUserFromToken(req);

    if (!decoded) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userId = getUserId(decoded);

    if (!userId) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    const documents = await Document.find({
      user: userId,
    })
      .select("-fileData")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      documents,
    });
  } catch (error) {
    console.error("Get documents error:", error);

    return res.status(500).json({
      message: "Unable to load documents",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

const getDocument = async (req, res) => {
  try {
    const decoded = getUserFromToken(req);

    if (!decoded) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userId = getUserId(decoded);

    if (!userId) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      user: userId,
    }).select("-fileData");

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    return res.status(200).json({
      document,
    });
  } catch (error) {
    console.error("Get document error:", error);

    return res.status(500).json({
      message: "Unable to load document",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

const openDocument = async (req, res) => {
  try {
    const decoded = getUserFromToken(req);

    if (!decoded) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userId = getUserId(decoded);

    if (!userId) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      user: userId,
    }).select("+fileData");

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (!document.fileData) {
      return res.status(404).json({
        message: "PDF file data is not available",
      });
    }

    res.setHeader(
      "Content-Type",
      document.mimeType || "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${document.originalName}"`
    );

    res.setHeader(
      "Content-Length",
      document.fileData.length
    );

    return res.send(document.fileData);
  } catch (error) {
    console.error("Open document error:", error);

    return res.status(500).json({
      message: "Unable to open PDF",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const decoded = getUserFromToken(req);

    if (!decoded) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const userId = getUserId(decoded);

    if (!userId) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    return res.status(200).json({
      message: "Document deleted successfully",
      documentId: document._id,
    });
  } catch (error) {
    console.error("Delete document error:", error);

    return res.status(500).json({
      message: "Unable to delete document",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  openDocument,
  deleteDocument,
};