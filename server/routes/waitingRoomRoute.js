const express = require("express");
const router = express.Router();
const waitingRoomController = require("../controllers/waitingRoomController");

router.get("/waiting-room", waitingRoomController.getWaitingRoom);

module.exports = router;
