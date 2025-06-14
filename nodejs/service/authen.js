const express = require('express');
const app = express.Router();
const md5 = require('md5');

var axios = require('axios');
var qs = require('qs');

const db = require("./db").db;

let { generateAccessToken, authenticateToken } = require("./jwt")

app.post('/api-auth/authen', authenticateToken, (req, res) => {
    res.status(200).json(true)
})

let insertData = async (data) => {
    let userid = md5(Date.now());
    await db.query(`INSERT INTO user_tb(userid, ts)VALUES('${userid}', now())`)
    let d;
    for (d in data) {
        if (data[d] !== '' && d !== 'geom') {
            let sql = `UPDATE user_tb SET ${d}='${data[d]}' WHERE userid='${userid}'`;
            // await eac3.query(sql);
            new Promise((resolve, reject) => resolve(eac3.query(sql)))
        }
    }
}

let checkUserLine = (sub, name, picture) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT gid FROM user_tb WHERE userid = '${sub}'`
        db.query(sql, (e, r) => {
            if (r.rows.length > 0) {
                resolve("exist");
            } else {
                insertData({
                    usrname: name,
                    img: picture,
                    line_usrid: sub,
                    auth: "editor",
                    approved: "false"
                });
                resolve("insert");
            }
        })
    })
}

app.post("/api-auth/linelogin", async (req, res) => {
    const { code } = req.body;
    var data = qs.stringify({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'http://localhost/login/index.html', // don't forget
        'client_id': '1656036916',
        'client_secret': '5e080351dfffd0d845d035cf92f6cc21'
    });

    var config = {
        method: 'post',
        url: 'https://api.line.me/oauth2/v2.1/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };

    axios(config).then((r) => {
        var verify = {
            method: 'post',
            url: `https://api.line.me/oauth2/v2.1/verify?id_token=${r.data.id_token}&client_id=1656036916`,
            headers: {}
        };

        axios(verify).then((resp) => {
            checkUserLine(resp.data.sub, resp.data.name, resp.data.picture).then((e) => {
                let sql = `SELECT gid,userid,username,approved,auth,dt FROM user_tb WHERE userid='${resp.data.sub}'`;
                setTimeout(() => {
                    db.query(sql).then(response => {
                        let userid = md5(Date.now());
                        const token = generateAccessToken(userid);
                        res.status(200).json({
                            data: response.rows,
                            token: token
                        })
                    })
                }, 600);
            })
        }).catch(function (error) {
            console.log(error);
        });
    }).catch(function (error) {
        console.log(error);
    });
});

app.post("/api-auth/insertuser", async (req, res) => {
    const { data } = req.body;
    await insertData(data)
    res.status(200).json({
        data: "success",
    })
})


app.post('/api-auth/gettoken', (req, res) => {
    const { userid } = req.body;
    const sql = `SELECT gid FROM user_tb WHERE userid = '${userid}'`;

    db.query(sql, (e, r) => {
        if (r.rows.length > 0) {
            let userid = md5(Date.now());
            const token = generateAccessToken(userid);
            res.status(200).json({
                data: token
            })
        } else {
            res.status(200).json({
                data: "invalid"
            })
        }
    })
})

app.post('/api-auth/getprofile', authenticateToken, (req, res) => {
    const { userid, pass } = req.body;
    const sql = `SELECT gid,userid,username,approved,auth,dt FROM user_tb WHERE userid = '${userid}'`;
    db.query(sql, (e, r) => {
        if (r.rows.length > 0) {
            res.status(200).json({
                data: r.rows
            })
        } else {
            res.status(200).json({
                data: "invalid"
            })
        }
    })
})

app.post("/api-auth/getalluser", authenticateToken, (req, res) => {
    let sql = `SELECT gid,userid,username,approved,auth,dt FROM user_tb order by dt desc;`

    db.query(sql, (e, r) => {
        res.status(200).json({
            data: r.rows
        })
    })
})

app.post("/api-auth/getiduser", authenticateToken, (req, res) => {
    const { gid } = req.body;
    let sql = `SELECT gid,userid,username,email,dt,auth,approved FROM user_tb 
               WHERE gid = '${gid}'`
    // console.log(sql);
    db.query(sql, (e, r) => {
        if (r.rows.length > 0) {
            res.status(200).json({
                data: r.rows
            })
        } else {
            res.status(200).json({
                data: "invalid"
            })
        }
    })
})

app.post("/api-auth/deleteuser", async (req, res) => {
    const { userid } = req.body;
    await db.query(`DELETE FROM user_tb WHERE userid='${userid}'`)

    res.status(200).json({
        data: "success"
    })
})

app.post("/api-auth/approved", async (req, res) => {
    const { userid, approve } = req.body;
    let sql = `UPDATE user_tb SET approved ='${approve}' WHERE userid='${userid}'`
    db.query(sql, (e, r) => {

        res.status(200).json({
            data: "success"
        })
    })
})

app.post("/api-auth/auth", async (req, res) => {
    const { userid, auth } = req.body;
    let sql = `UPDATE user_tb SET auth ='${auth}' WHERE userid='${userid}'`
    db.query(sql, (e, r) => {

        res.status(200).json({
            data: "success"
        })
    })
})

app.post("/api-auth/updateprofile", async (req, res) => {
    const { userid, data } = req.body;

    let sql = `UPDATE user_tb SET editdate=now() WHERE userid='${userid}'`;
    await db.query(sql)
    let d;
    for (d in data) {
        if (data[d] !== '') {
            let sql = `UPDATE user_tb SET ${d}='${data[d]}' WHERE userid='${userid}'`;
            // console.log(sql);
            await eac3.query(sql)
        }
    }
    res.status(200).json({
        data: "success"
    })
})

app.post("/api-auth/updateimgprofile", async (req, res) => {
    const { img, userid } = req.body;

    let sql = `UPDATE user_tb SET img='${img}' WHERE userid='${userid}'`;
    await db.query(sql, (e, r) => {
        res.status(200).json({
            data: "success"
        })
    })
})
app.post("/api-auth/repassword", async (req, res) => {
    const { username, email, pass } = req.body;
    let sql = `SELECT gid, userid FROM user_tb WHERE email ='${email}' and usrname ='${usrname}';`
    await db.query(sql, (e, r) => {
        if (r.rows.length > 0) {
            db.query(` UPDATE user_tb SET pass ='${pass}' where email ='${email}' and username ='${usrname}';`);
            res.status(200).json({
                data: "success"
            })
        } else {
            res.status(200).json({
                data: "false"
            })
        }
    })
})

module.exports = app;