

const getAboutUs = function (req, res) {

  res.render("about-us", { user: req.user });
};

module.exports = { getAboutUs };
