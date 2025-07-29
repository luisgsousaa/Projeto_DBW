const getWaitingRoom = function (req, res) {
  res.render("waiting-room", { user: req.user });
};

module.exports = { getWaitingRoom };
