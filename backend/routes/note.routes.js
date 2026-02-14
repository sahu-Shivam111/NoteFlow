const express = require("express");
const {
    addNote,
    editNote,
    getAllNotes,
    deleteNote,
    updateNotePinned,
    searchNotes,
    getAttachment,
} = require("../controllers/note.controller");
const { authenticationToken } = require("../utilities");
const { validate, schemas } = require("../middleware/validation");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/add-note", authenticationToken, upload.any(), validate(schemas.createNote), addNote);
router.put("/edit-note/:noteId", authenticationToken, upload.any(), validate(schemas.editNote), editNote); // Using specialized editNote schema
router.get("/get-all-notes", authenticationToken, getAllNotes);
router.delete("/delete-note/:noteId", authenticationToken, deleteNote);
router.put("/update-note-pinned/:noteId", authenticationToken, updateNotePinned);
router.get("/search-notes", authenticationToken, searchNotes);
router.get("/get-attachment/:noteId/:attachmentId", authenticationToken, getAttachment);

module.exports = router;
