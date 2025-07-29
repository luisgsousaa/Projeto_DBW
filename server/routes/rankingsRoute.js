const express = require("express");
const router = express.Router();
const rankingsController = require("../controllers/rankingsController");

router.get("/rankings", rankingsController.getRankings);
router.get("/rankings/rankingsJSON", rankingsController.getRankingsJSON);
router.get("/rankings/globalJSON", rankingsController.getGlobalStatsJSON);


module.exports = router;