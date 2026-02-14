const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Separate collection for file data to avoid 16MB Document Limit
 * and keep Note queries fast.
 */
const attachmentSchema = new Schema({
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    data: {
        type: Buffer,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Attachment", attachmentSchema);
