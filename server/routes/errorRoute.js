const express = require("express");
const router = express.Router();
const errorController = require("../controllers/errorController.js");

router.get("/error", errorController.getError);

module.exports = router;
