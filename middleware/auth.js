const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const token = req.header("x-auth-token");
        if (!token) return res.status(403).send("Access denied.");

        req.user = jwt.verify(token, process.env.TOKEN_SECRET);
        next();
    } catch (error) {
        res.status(403).send("Invalid token");
    }
};
