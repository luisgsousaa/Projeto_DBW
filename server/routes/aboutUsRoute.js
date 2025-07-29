const express = require("express");
const router = express.Router();
const aboutUsController = require("../controllers/aboutUsController");

router.get("/about-us", aboutUsController.getAboutUs);



module.exports = router;