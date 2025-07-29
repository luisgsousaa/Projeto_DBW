const express = require("express");
const router = express.Router();
const footerQuoteController = require("../controllers/footerQuoteController");

router.get("/footer-quote", footerQuoteController.getQuote);

module.exports = router;