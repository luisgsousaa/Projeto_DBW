const express = require("express");
const router = express.Router();
const AIChatController = require("../controllers/AIChatController");

router.get("/ai-chat", AIChatController.getAIChat);
router.post("/ai-chat", AIChatController.handleChatCompletion);

module.exports = router;