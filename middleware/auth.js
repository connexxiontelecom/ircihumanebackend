const jwt = require("jsonwebtoken");

//module.exports = auth

module.exports = ( roles = [])=>{
    try{
        if (typeof roles === 'string') {
            roles = [roles];
        }
        return [
            (req, res, next) => {
                const token = req.header("x-auth-token");
                if (!token) return res.status(403).json("Access denied.");
                req.user = jwt.verify(token, process.env.TOKEN_SECRET);
                let userRoles = req.user.username.permission
                if (roles.length && !containsAny(userRoles,roles)) {
                    return res.status(401).json('Unauthorised');
                }
                next();
            }
        ]
    }catch(error){
        return [
            (req, res, next) => {
                res.status(403).json("Invalid token");
            }
        ]
    }
}


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


// function auth(roles = []) {
//     if (typeof roles === 'string') {
//         roles = [roles];
//     }
//     try {
//         return [
//             (req, res, next) => {
//                 const token = req.header("x-auth-token");
//                 if (!token) return res.status(403).json("Access denied.");
//                 req.user = jwt.verify(token, process.env.TOKEN_SECRET);
//                 let userRoles = req.user.username.permission
//                 if (roles.length && !containsAny(userRoles,roles)) {
//                     return res.status(401).json('Unauthorised');
//                 }
//                 next();
//             }
//         ]
//
//     } catch (error) {
//         return [
//             (req, res, next) => {
//                 res.status(403).send("Invalid token");
//             }
//         ]
//     }
//
// }

function containsAny(source,target)
{
    let result = source.filter(function(item){ return target.indexOf(item) > -1});
    return (result.length > 0);
}


