const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  attachments: [
    {
      attachmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Attachment" },
      name: String,
      fileType: String,
      size: Number
    }
  ],
  tags: { type: [String], default: [] },
  isPinned: { type: Boolean, default: false },
  summary: { type: String, default: "" },
  isSummarizing: { type: Boolean, default: false },
  userId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);