const jwt = require('jsonwebtoken');
const md5 = require('md5');
const moment = require('moment');
const key = md5('rtk-landmos-love-3m');

const generateAccessToken = (username) => {
    const exp = moment().add(1, 'day').unix();
    // const exp = Math.floor(Date.now() / 1000) + (10 * 60);  //10 minutes
    console.log(exp);
    return { token: jwt.sign({ exp: exp, data: username }, key), exp: exp };
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, key, (err, decode) => {
        if (err) return res.sendStatus(403);
        next();
    })
}

module.exports = {
    generateAccessToken,
    authenticateToken
}