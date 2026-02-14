const mongoose = require("mongoose");
const Note = require("../models/note.model");
const Attachment = require("../models/attachment.model");

exports.addNote = async (req, res) => {
    const { title, content } = req.body;
    const { user } = req.user;

    console.log("Add Note Body:", req.body);
    console.log("Add Note Files:", req.files);

    // Handle both 'tags' and 'tags[]' keys from different form-data implementations
    let tags = req.body.tags || req.body['tags[]'];
    if (typeof tags === 'string') {
        try {
            tags = JSON.parse(tags);
        } catch (e) {
            tags = tags.split(',').map(t => t.trim());
        }
    }

    // Process multiple attachments (in-memory for now, saved after note creation)
    const filesToUpload = req.files ? req.files : [];

    if (!title) {
        return res.status(400).json({ error: true, message: "Title is required." });
    }

    if (!content) {
        return res
            .status(400)
            .json({ error: true, message: "Content is required." });
    }

    try {
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id,
        });

        // Save the note first to get the noteId
        await note.save();

        // Now save attachments and link them to the note
        const attachmentsMetadata = [];
        for (const file of filesToUpload) {
            const attachment = new Attachment({
                noteId: note._id,
                name: file.originalname,
                fileType: file.mimetype,
                size: file.size,
                data: file.buffer,
            });
            await attachment.save();
            attachmentsMetadata.push({
                attachmentId: attachment._id,
                name: file.originalname,
                fileType: file.mimetype,
                size: file.size,
            });
        }

        // Update note with attachment metadata
        note.attachments = attachmentsMetadata;
        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note added successfully.",
        });
    } catch (error) {
        console.error("Add Note Error:", error);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error.",
        });
    }
};

exports.editNote = async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, isPinned } = req.body;
    const { user } = req.user;

    console.log("Edit Note Body:", req.body);
    console.log("Edit Note Files:", req.files);

    // Handle both 'tags' and 'tags[]' keys
    let tags = req.body.tags || req.body['tags[]'];
    if (typeof tags === 'string') {
        try {
            tags = JSON.parse(tags);
        } catch (e) {
            tags = tags.split(',').map(t => t.trim());
        }
    }

    // Process deletions
    let deleteAttachmentIds = req.body.deleteAttachmentId || [];
    if (!Array.isArray(deleteAttachmentIds)) {
        deleteAttachmentIds = [deleteAttachmentIds];
    }
    deleteAttachmentIds = deleteAttachmentIds.filter(Boolean); // Remove empty strings or nulls

    // Process new attachments
    const filesToUpload = req.files ? req.files : [];

    if (!title && !content && !tags && filesToUpload.length === 0 && deleteAttachmentIds.length === 0) {
        return res
            .status(400)
            .json({ error: true, message: "No changes provided." });
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found." });
        }

        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned !== undefined) note.isPinned = isPinned;

        // Handle attachment deletions
        for (const id of deleteAttachmentIds) {
            await Attachment.deleteOne({ _id: id, noteId: note._id });
            note.attachments = note.attachments.filter(att => att.attachmentId.toString() !== id);
        }

        // Handle new attachments: save and append metadata
        for (const file of filesToUpload) {
            const attachment = new Attachment({
                noteId: note._id,
                name: file.originalname,
                fileType: file.mimetype,
                size: file.size,
                data: file.buffer,
            });
            await attachment.save();
            note.attachments.push({
                attachmentId: attachment._id,
                name: file.originalname,
                fileType: file.mimetype,
                size: file.size,
            });
        }

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note updated successfully.",
        });
    } catch (error) {
        console.error("Edit Note Error:", error);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error.",
        });
    }
};

exports.getAllNotes = async (req, res) => {
    const { user } = req.user;

    try {
        const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });

        return res.json({
            error: false,
            notes,
            message: "All notes retrieved successfully.",
        });
    } catch (error) {
        console.error("Get All Notes Error:", error);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error.",
        });
    }
};

exports.deleteNote = async (req, res) => {
    const noteId = req.params.noteId;
    const { user } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found." });
        }

        await Attachment.deleteMany({ noteId: noteId });
        await Note.deleteOne({ _id: noteId, userId: user._id });

        return res.json({
            error: false,
            message: "Note deleted successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error.",
        });
    }
};

exports.updateNotePinned = async (req, res) => {
    const noteId = req.params.noteId;
    const { isPinned } = req.body;
    const { user } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found." });
        }

        note.isPinned = isPinned; // || note.isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note updated successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error.",
        });
    }
};

exports.searchNotes = async (req, res) => {
    const { user } = req.user;
    const { query } = req.query;

    if (!query) {
        return res
            .status(400)
            .json({ error: true, message: "Search query is required." });
    }

    try {
        const matchingNotes = await Note.find({
            userId: user._id,
            $or: [
                { title: { $regex: new RegExp(query, "i") } }, // Case-insensitive title search
                { content: { $regex: new RegExp(query, "i") } }, // Case-insensitive content search
            ],
        });

        return res.json({
            error: false,
            notes: matchingNotes,
            message: "Notes matching the search query retrieved successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error.",
        });
    }
};

exports.getAttachment = async (req, res) => {
    const { noteId, attachmentId } = req.params;
    const { user } = req.user;

    // Validate ObjectIds to prevent CastError
    if (!mongoose.Types.ObjectId.isValid(noteId) || !mongoose.Types.ObjectId.isValid(attachmentId)) {
        return res.status(400).json({ error: true, message: "Invalid note or attachment ID." });
    }

    try {
        // Verify note ownership first
        const note = await Note.findOne({ _id: noteId, userId: user._id });
        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found." });
        }

        // Fetch attachment data
        const attachment = await Attachment.findOne({ _id: attachmentId, noteId });
        if (!attachment) {
            return res.status(404).json({ error: true, message: "Attachment not found." });
        }

        // Serve file with correct headers
        res.set({
            "Content-Type": attachment.fileType,
            "Content-Disposition": `inline; filename="${attachment.name}"`,
            "Content-Length": attachment.data.length,
        });

        return res.send(attachment.data);
    } catch (error) {
        console.error("Get Attachment Error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error." });
    }
};
