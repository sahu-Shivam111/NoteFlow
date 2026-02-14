const { GoogleGenerativeAI } = require("@google/generative-ai");
const Note = require("../models/note.model");
const pdfParsePackage = require("pdf-parse");
const { convert } = require("html-to-text");
const Attachment = require("../models/attachment.model");

/**
 * Helper to extract text from a PDF buffer using either v1 or v2 of pdf-parse
 */
const extractPdfText = async (dataBuffer) => {
    // Version 2 API (Mehmet Kozan version)
    if (pdfParsePackage.PDFParse) {
        const parser = new pdfParsePackage.PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        await parser.destroy();
        return result.text;
    }
    // Version 1 API (Classic version)
    if (typeof pdfParsePackage === "function") {
        const result = await pdfParsePackage(dataBuffer);
        return result.text;
    }
    // ESM/CJS default fallback
    if (pdfParsePackage.default && typeof pdfParsePackage.default === "function") {
        const result = await pdfParsePackage.default(dataBuffer);
        return result.text;
    }
    throw new Error("Compatible PDF parser not found in pdf-parse package");
};

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Summarize a note using AI
 */
exports.summarizeNote = async (req, res) => {
    const { noteId } = req.params;
    const userId = req.user.user._id;

    try {
        // 1. Ownership & Existence Check
        const note = await Note.findOne({ _id: noteId, userId });
        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found or unauthorized" });
        }

        // 2. Double-Click / Concurrency / Stuck State Check
        const STUCK_TIMEOUT = 2 * 60 * 1000; // 2 minutes
        const isStuck = note.isSummarizing && (Date.now() - new Date(note.updatedAt).getTime() > STUCK_TIMEOUT);

        if (note.isSummarizing && !isStuck) {
            return res.status(409).json({ error: true, message: "Summarization is already in progress" });
        }

        // Update state to "summarizing" and trigger updatedAt update
        note.isSummarizing = true;
        note.updatedAt = Date.now(); // Update timestamp to prevent immediate re-triggering as "stuck"
        await note.save();

        // 3. Input Validation (Length Check)
        const plainTextContent = convert(note.content, { wordwrap: 130 });

        // Too Short Check
        if (plainTextContent.length < 50 && note.attachments.length === 0) {
            note.isSummarizing = false;
            await note.save();
            return res.status(400).json({ error: true, message: "Note content is too short to summarize (minimum 50 characters required)." });
        }

        // Too Long Check (Safety limit for free tier / performance)
        const MAX_CONTENT_LENGTH = 30000; // ~5,000 - 7,000 words
        if (plainTextContent.length > MAX_CONTENT_LENGTH) {
            note.isSummarizing = false;
            await note.save();
            return res.status(400).json({
                error: true,
                message: `Note is too long to summarize (limit: ${MAX_CONTENT_LENGTH} characters). Please shorten it and try again.`
            });
        }

        await note.save();

        // 4. PDF Extraction (if any)
        let attachmentsText = "";
        for (const meta of note.attachments) {
            if (meta.fileType === "application/pdf") {
                let dataBuffer = null;

                // Try Database first (New system)
                if (meta.attachmentId) {
                    const attachment = await Attachment.findById(meta.attachmentId);
                    if (attachment) dataBuffer = attachment.data;
                }

                // Fallback to Filesystem (Legacy system)
                if (!dataBuffer && meta.url) {
                    const filePath = path.join(__dirname, "..", meta.url);
                    if (fs.existsSync(filePath)) {
                        dataBuffer = fs.readFileSync(filePath);
                    }
                }

                if (dataBuffer) {
                    const text = await extractPdfText(dataBuffer);
                    attachmentsText += `\n[Content from Attachment: ${meta.name}]\n${text}`;
                }
            }
        }

        // 5. Build AI Prompt
        const prompt = `
      You are a professional note-taking assistant. I need a concise summary of the following note.
      
      TITLE: ${note.title}
      CONTENT: ${plainTextContent}
      ${attachmentsText ? `ATTACHED DOCUMENT CONTENT: ${attachmentsText}` : ""}
      
      INSTRUCTIONS:
      - Provide a summary in 3-5 bullet points.
      - Pull out any key actions or deadlines if they exist.
      - If there are attached documents, integrate their key information into the summary.
      - Use professional and clear language.
      - Formatting: Use Markdown bullet points.
    `;

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
            throw new Error("Invalid or missing GEMINI_API_KEY in .env");
        }

        // Use verified models discovered from test-ai.js
        const modelNames = [
            process.env.GEMINI_MODEL,
            "gemini-2.0-flash",
            "gemini-flash-latest",
            "gemini-pro-latest"
        ].filter(Boolean);

        let result;
        let lastError;

        for (const name of modelNames) {
            try {
                console.log(`Attempting to use verified model: ${name}`);
                const model = genAI.getGenerativeModel({ model: name });
                result = await Promise.race([
                    model.generateContent(prompt),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), 30000))
                ]);
                if (result) break;
            } catch (err) {
                console.warn(`Model ${name} failed:`, err.message);
                lastError = err;
            }
        }

        if (!result) throw lastError;

        const response = await result.response;
        const summary = response.text();

        // 7. Save and Return
        note.summary = summary;
        note.isSummarizing = false;
        await note.save();

        return res.json({
            error: false,
            summary,
            message: "Summary generated successfully"
        });

    } catch (error) {
        console.error("AI Summarization Error:", error);

        // Reset summarizing state on failure
        await Note.findByIdAndUpdate(noteId, { isSummarizing: false });

        if (error.message === "AI_TIMEOUT") {
            return res.status(504).json({ error: true, message: "AI response timed out. Please try again." });
        }

        // Handle Gemini Rate Limits specifically (429)
        if (error.status === 429 || error.message.includes("429") || error.message.includes("quota")) {
            let retryMsg = "AI limit reached. Please wait a minute before trying again.";

            // Try to extract retry delay if present in Gemini's specific error structure
            const retryDelay = error.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay;
            if (retryDelay) {
                retryMsg = `AI limit reached. Please wait ${retryDelay} before retrying.`;
            }

            return res.status(429).json({
                error: true,
                message: retryMsg,
                retryAfter: retryDelay
            });
        }

        return res.status(500).json({
            error: true,
            message: "An error occurred while generating the summary. Please try again later."
        });
    }
};
