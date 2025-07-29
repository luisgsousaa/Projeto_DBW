const express = require("express");
const router = express.Router();
const statisticsController = require("../controllers/statisticsController");

router.get("/estatisticas", statisticsController.getStatistics);
router.get("/estatisticas/:id", statisticsController.getStatistics); //estatisticas de um jogador especifico id = username
router.get("/estatisticas/:id/JSON", statisticsController.getStatisticsJSON);

module.exports = router;
