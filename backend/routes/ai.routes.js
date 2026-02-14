const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { authenticationToken } = require("../utilities");

router.post("/summarize/:noteId", authenticationToken, aiController.summarizeNote);

module.exports = router;
