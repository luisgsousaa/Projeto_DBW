const getComoJogar = function (req, res) {
  res.render("how-to-play", { user: req.user });
};

module.exports = { getComoJogar };
