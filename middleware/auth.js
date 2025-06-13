import jwt from 'jsonwebtoken';

export default function (req, res, next) {
    const token = req.headers["authorization"];
    if(!token) return res.status(401).send({message: "No token, access denied"});

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({msg: "Invalid token"});
    }
}