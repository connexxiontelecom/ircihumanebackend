const jwt = require("jsonwebtoken");

module.exports = auth()


//     (req, res, next) => {
//     try {
//         const token = req.header("x-auth-token");
//         if (!token) return res.status(403).send("Access denied.");
//
//         req.user = jwt.verify(token, process.env.TOKEN_SECRET);
//         next();
//     } catch (error) {
//         res.status(403).send("Invalid token");
//     }
// };


function auth(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }
    try {
        return [
            (req, res, next) => {
                const token = req.header("x-auth-token");
                if (!token) return res.status(403).send("Access denied.");
                req.user = jwt.verify(token, process.env.TOKEN_SECRET);
                if (roles.length && !roles.includes(req.user.role)) {
                    return res.status(401).json({message: 'Unauthorized'});
                }
                next();
            }
        ]

    } catch (error) {
        return [
            (req, res, next) => {
                res.status(403).send("Invalid token");
            }
        ]
    }

}
