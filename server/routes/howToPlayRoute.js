const express = require("express");
const router = express.Router();
const howToPlayController = require("../controllers/howToPlayController");

router.get("/how-to-play", howToPlayController.getComoJogar);

module.exports = router;
