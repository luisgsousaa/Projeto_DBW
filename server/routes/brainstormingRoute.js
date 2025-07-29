const express = require("express");
const router = express.Router();
const brainstormingController = require("../controllers/brainstormingController");

router.get("/brainstorming", brainstormingController.getBrainstorming);

module.exports = router;