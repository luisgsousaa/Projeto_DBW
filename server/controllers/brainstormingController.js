const getBrainstorming = function(req, res) {
    res.render("brainstorming", { user: req.user });
};

module.exports = { getBrainstorming };