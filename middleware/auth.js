function requireNotLoggedIn(req, res, next) {
    if (req.session.userId) {
        return res.redirect("/petition");
    }
    next();
}

function requireLoggedIn(req, res, next) {
    if (!req.session.id) {
        return res.redirect("/register");
    }
    next();
}

module.exports = {
    requireLoggedIn,
    requireNotLoggedIn,
};
