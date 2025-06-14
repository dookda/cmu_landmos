const express = require('express');

const app = express.Router();
const db = require("./db").db;
const ss = require("simple-statistics");
const qs = require("qs");
const axios = require("axios");
const fs = require('fs');
const request = require('request');
const authToken = require('./token').authToken;
const lineToken = require('./token').lineToken;
const moment = require('moment');
const { generateAccessToken, authenticateToken } = require('./jwt');
const https = require('https');

// const fs = require('fs');
const path = require('path');

// jwt
app.post('/apiv2/gettoken', (req, res) => {
    const { username } = req.body;
    const token = generateAccessToken(username);
    res.json(token);
});

const checkUsertype = (gid, page) => {
    const sql = `SELECT user_type FROM user_tb WHERE gid = ${gid}`;
    const auth = {
        "Administrator": ["_dashboard", "_detail", "_devices", "_inv", "_notify", "_profile", "_station", "_user", "_water"],
        "Super User": ["_dashboard", "_detail", "_devices", "_inv", "_notify", "_profile", "_water"],
        "User": ["_dashboard", "_detail", "_devices", "_inv", "_profile", "_water"]
    };

    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return reject(err);
            }

            if (!result.rows || result.rows.length === 0) {
                console.warn("No user found with gid:", gid);
                return resolve(false);
            }

            const user = result.rows[0];
            if (user.hasOwnProperty('user_type') && auth[user.user_type]?.includes(page)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
};

app.post('/apiv2/checktoken', authenticateToken, (req, res) => {
    const { username, page, gid } = req.body;
    // res.status(200).json({ status: "Already login " })
    checkUsertype(gid, page).then((r) => {
        console.log(r);
        res.status(200).json({ status: "Already login ", auth: r });
    }).catch((e) => {
        res.status(200).json({ status: "error" });
    });
});

// insert to db
const checkMember = (eno, type) => {
    const sql = `SELECT gid FROM user_tb WHERE username = '${eno}'`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
            if (type == "row") resolve({ val: result.rows[0] });
            if (type == "count") resolve({ val: result.rowCount })
        });
    });
};

const insertMember = async (eno) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO user_tb (username, user_type, dt) VALUES ('${eno}', 'User', NOW())`;
        db.query(sql, async (err, result) => {
            if (err) throw err;
            resolve({ status: "inserted" });
        });
    });
};

const updateLineID = (eno, userid) => {
    const sql = `UPDATE user_tb SET userid='${userid}', alert=true WHERE username = '${eno}'`;
    // console.log(sql);
    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log("updated line ID");
    });
};

//egat authen
const checkAuth = (eno, ahash) => {
    var options = {
        'method': 'POST',
        'url': 'https://edms.egat.co.th/itpservice/authapi/authapi.php',
        'headers': {
        },
        formData: {
            'action': 'CheckAuth',
            'akey': authToken.akey,
            'eno': eno,
            'ahash': ahash,
            'type': 'json'
        }
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response) {
            if (error) {
                reject(error);
            } else {
                resolve(response.body);
            }
        });
    })
}

const authen = (eno, pwd) => {
    var options = {
        'method': 'POST',
        'url': 'https://edms.egat.co.th/itpservice/authapi/authapi.php',
        'headers': {
        },
        formData: {
            'action': 'Login',
            'eno': eno,
            'pwd': pwd,
            'type': 'json',
            'ip': authToken.ip,
            'akey': authToken.akey
        }
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response) {
            if (error) {
                reject(error);
            } else {
                console.log(response.body);
                resolve(response.body);
            }
        });
    });
}

app.post("/apiv2/login", (req, res) => {
    const { eno, pwd } = req.body;
    authen(eno, pwd).then(res_hash => {
        let data = JSON.parse(res_hash);
        if (data.response.status_text == "OK") {
            checkAuth(eno, data.response.data.AuthenData.AUTH_HASH).then(async (r) => {
                let dat = JSON.parse(r);
                console.log(dat);
                if (dat.response.status_text == "Verified") {
                    const token = generateAccessToken(eno);
                    checkMember(eno, "count")
                        .then((res_count) => {
                            if (res_count.val == 0) {
                                insertMember(eno).then(() => {
                                    checkMember(eno, "row").then((res_row) => {
                                        res.status(200).json({
                                            eno: eno,
                                            status: "Verified",
                                            token: token.token,
                                            exp: token.exp,
                                            gid: res_row.val.gid
                                        });
                                    });
                                });
                            } else {
                                checkMember(eno, "row").then((res_row) => {
                                    res.status(200).json({
                                        eno: eno,
                                        status: "Verified",
                                        token: token.token,
                                        exp: token.exp,
                                        gid: res_row.val.gid
                                    });
                                });
                            };
                        });
                } else {
                    res.status(200).json({
                        status: "error"
                    });
                }
            });
        } else {
            res.status(200).json({
                status: "error"
            });
        }
    });
});

app.post("/apiv2/logout", (req, res) => {
    const { eno, pwd } = req.body;
    const url = `https://edms.egat.co.th/itpservice/authapi/authapi.php?action=Logout&akey=${akey}&eno=${eno}&ahash=${pwd}&type=<xml/json>`;
})

// line alert
app.post("/apiv2/getlinealert", (req, res) => {
    const { eno } = req.body;
    const sql = `SELECT alert FROM user_tb WHERE username = '${eno}'`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.status(200).json(result.rows[0]);
    });
});

app.post("/apiv2/removelinealert", (req, res) => {
    const { eno } = req.body;
    const sql = `UPDATE user_tb SET alert=false WHERE username = '${eno}'`;
    // console.log(sql);
    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log("removed line alert");
    });
})

// line login
app.post("/apiv2/linelogin", async (req, res) => {
    const { code, eno } = req.body;
    var data = qs.stringify({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'https://mmm-rtk-landmos.egat.co.th/_login/index.html', // don't forget
        'client_id': lineToken.ChannelID,
        'client_secret': lineToken.channelSecret
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
        const verify = {
            method: 'post',
            url: `https://api.line.me/oauth2/v2.1/verify?id_token=${r.data.id_token}&client_id=${lineToken.ChannelID}`,
            headers: {}
        };

        axios(verify).then((resp) => {
            res.status(200).json(resp.data)
            updateLineID(eno, resp.data.sub)

        }).catch(function (error) {
            console.log(error);
        });
    }).catch(function (error) {
        console.log(error);
    });
});

// get user // authenticateToken
app.post("/apiv2/getuser", authenticateToken, (req, res) => {
    const { eno } = req.body;
    const sql = `SELECT * FROM user_tb `;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.status(200).json({ data: result.rows });
    });
});

app.post("/apiv2/edituser", (req, res) => {
    const { gid, userid, username, email, user_type } = req.body;
    const sql = `UPDATE user_tb SET userid='${userid}',
                    username='${username}', email='${email}', 
                    user_type='${user_type}', editdate=now() 
                WHERE gid = '${gid}'`;
    console.log(sql);
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.status(200).json({ data: "inserted" });
    });
});

app.post("/apiv2/deleteuser", (req, res) => {
    const { gid, username } = req.body;
    const sql = `DELETE FROM user_tb WHERE username = '${username}' AND gid = '${gid}'`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.status(200).json({ data: "deleted" });
    });
});

app.post("/apiv2/selectprofile", (req, res) => {
    const { username } = req.body;
    const sql = `SELECT * FROM user_tb WHERE username = '${username}'`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.status(200).json(result.rows);
    });
});

app.post("/apiv2/updateprofile", (req, res) => {
    const { username, usernameth, division } = req.body;
    const sql = `UPDATE user_tb SET username='${username}', usernameth='${usernameth}', division='${division}' WHERE username = '${username}'`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.status(200).json({ data: "success" });
    });
});

// new api
app.post("/apiv2/selectdata", (req, res) => {
    const { stat_code, start_date, end_date } = req.body;
    const sql = `SELECT id, stat_code, CONCAT('station',stat_code) as sta_code_t, de, dn, dh, lat, lng, mine_e, mine_n, utm_e, utm_n, ts7,TO_CHAR(ts7, 'YYYY/MM/DD HH24:MI') as ts7t, status, sde, sdn, sdh, pdop, no_satellite 
                FROM dataset 
                WHERE (stat_code='${stat_code}' ) AND ts7 BETWEEN '${start_date}' AND '${end_date}' ORDER BY ts7`;
    // console.log(sql);
    db.query(sql).then((r) => {
        res.status(200).json({
            data: r.rows
        });
    });
})

app.post("/apiv2/selectmultidata", (req, res) => {
    const { stat_code, start_date, end_date, stat_status } = req.body;
    // console.log(stat_code, start_date, end_date, stat_status);
    let codes = JSON.parse(stat_code)
    let status = JSON.parse(stat_status)
    let where_code = `stat_code='${codes[0]}'`;
    let where_status = `status=${status[0]}`;
    if (stat_code.length > 1) {
        for (let i = 1; i < codes.length; i++) {
            where_code += ` OR stat_code='${codes[i]}'`
        };
    }

    if (status.length > 1) {
        for (let i = 1; i < status.length; i++) {
            where_status += ` OR status=${status[i]}`
        };
    } else if (status.length == 0) {
        where_status = ` status IS NULL`
    }

    const sql = `SELECT id, stat_code, CONCAT('station',stat_code) as sta_code_t, de, dn, dh, ts7,TO_CHAR(ts7, 'YYYY/MM/DD HH24:MI') as ts7t, status 
                FROM dataset 
                WHERE (${where_code}) AND (${where_status}) AND ts7 BETWEEN '${start_date}' AND '${end_date}' ORDER BY  stat_code,ts7`;
    db.query(sql).then((r) => {
        res.status(200).json({
            data: r.rows
        });
    });
})

app.post("/apiv2/updatedata", (req, res) => {
    const { id, de, dn, dh, status } = req.body;
    const sql = `UPDATE gnssdata SET de=${de},dn=${dn},dh=${dh},status=${status}  WHERE id = ${id}`;
    db.query(sql).then((r) => {
        res.status(200).json("update successful");
    });
})

app.post("/apiv2/basestation_delete", (req, res) => {
    const { stat_code } = req.body;
    const sql = `DELETE FROM gnssdata WHERE stat_code = '${stat_code}'`;
    console.log(sql);
    db.query(sql).then((r) => {
        res.status(200).json("delete successful");
    })
})

app.get("/apiv2/basestation", async (req, res) => {
    //  const sql = `SELECT *, right(stat_code, 2) as st_code FROM base_sta ORDER BY id DESC`;
    const active_sql = `SELECT stations FROM stations_active`;
    db.query(active_sql).then((ls) => {
        const statlist = JSON.parse(ls.rows[0].stations)

        const sql = `SELECT * FROM stations_all`;
        db.query(sql).then((r) => {
            // console.log(r.rows);
            const trim = r.rows.map((item) => {
                return {
                    id: item.id,
                    stat_code: item.stat_code !== null ? item.stat_code.trim() : "",
                    lat: item.lat,
                    lng: item.lng,
                    ts: item.ts,
                }
            }).map((item) => {
                return { ...item, active: statlist.includes(item.stat_code) }
            });

            res.status(200).json({
                data: trim
            });
        });
    });
});

const fillterDatset = (st) => {
    const stations = JSON.parse(st);

    let sql = `DROP VIEW IF EXISTS dataset`;
    db.query(sql).then((r) => {

        if (stations.length == 0) {
            let sql = `CREATE VIEW dataset as SELECT * FROM gnssdata`;

            db.query(sql).then((r) => {
                console.log("success");
            });
        } else if (stations.length == 1) {
            let sql = `CREATE VIEW dataset as SELECT * FROM gnssdata WHERE stat_code = '${stations[0]}'`;

            db.query(sql).then((r) => {
                console.log("success");
            });
        } else {
            let st = `stat_code = '${stations[0]}' `;

            stations.forEach((e) => {
                st += `OR stat_code = '${e}' `
            });

            let sql = `CREATE VIEW dataset as SELECT * FROM gnssdata WHERE ${st}`;

            db.query(sql).then((r) => {
                console.log("success");
            });
        }
    });
}

const fillterBaseStation = (st) => {
    const stations = JSON.parse(st);
    const sql_drop = `DROP VIEW IF EXISTS stations_fillter`;
    db.query(sql_drop).then((r) => {
        if (stations.length == 0) {
            const sql = `CREATE OR REPLACE VIEW stations_fillter AS
                        SELECT ROW_NUMBER() OVER(ORDER BY stat_code) AS id, 
                            stat_code, 
                            lat, lng, de, dn, dh, ts 
                        FROM (
                            SELECT DISTINCT ON (stat_code) 
                                stat_code, 
                                lat, lng, de, dn, dh, ts
                            FROM gnssdata
                            ORDER BY stat_code, ts DESC
                        ) sub_query`;

            db.query(sql).then((r) => {
                console.log("success");
            });
        } else if (stations.length == 1) {
            const sql = `CREATE OR REPLACE VIEW stations_fillter AS
                        SELECT ROW_NUMBER() OVER(ORDER BY stat_code) AS id, 
                            stat_code, 
                            lat, lng, de, dn, dh, ts 
                        FROM (
                            SELECT DISTINCT ON (stat_code) 
                                stat_code, 
                                lat, lng, de, dn, dh, ts
                            FROM gnssdata
                            WHERE stat_code = '${stations[0]}'
                            ORDER BY stat_code, ts DESC
                        ) sub_query`;

            db.query(sql).then((r) => {
                console.log("success");
            });
        } else {
            let st = `stat_code = '${stations[0]}' `;

            stations.forEach((e) => {
                st += `OR stat_code = '${e}' `
            });

            const sql = `CREATE OR REPLACE VIEW stations_fillter AS
                        SELECT ROW_NUMBER() OVER(ORDER BY stat_code) AS id, 
                            stat_code, 
                            lat, lng, de, dn, dh, sta_light, ts 
                        FROM (
                            SELECT DISTINCT ON (stat_code) 
                                stat_code, 
                                lat, lng, de, dn, dh, sta_light, ts
                            FROM gnssdata
                            WHERE ${st}
                            ORDER BY stat_code, ts DESC
                        ) sub_query`;

            db.query(sql).then((r) => {
                console.log("success");
            });
        }
    });
}

const fillterInit = async (st) => {
    const stations = JSON.parse(st);
    stations.forEach(async (e) => {
        let sql = `SELECT  stat_code, lat, lng, utm_e, utm_n, mine_e, mine_n, ortho_h, de, dn, dh
                    FROM gnssdata 
                    WHERE stat_code = '${e}'
                    ORDER BY ts DESC LIMIT 1`;
        db.query(sql).then(async (res) => {
            const data = res.rows[0];

            let gid = Date.now()
            const sql_sta = `INSERT INTO landmos_sta(gid,init_date)VALUES('${gid}', now())`;
            db.query(sql_sta).then(async (r) => {
                for (d in data) {
                    if (data[d] !== null) {
                        let sql = `UPDATE landmos_sta SET ${d}='${data[d]}' WHERE gid='${gid}'`;
                        await db.query(sql)
                        // console.log(sql);
                    }
                }
            })
        });
    });
}

app.post("/apiv2/get_init_position", (req, res) => {
    const sql = `WITH LatestTimes AS (
                    SELECT stat_code, MAX(init_date) as latest_timestamp
                    FROM landmos_sta
                    GROUP BY stat_code
                )
                SELECT lt.stat_code, lt.latest_timestamp, ls.de, ls.dn, ls.dh
                FROM LatestTimes lt
                JOIN landmos_sta ls 
                ON lt.stat_code = ls.stat_code AND lt.latest_timestamp = ls.init_date`;
    // console.log(sql);
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    });
})

app.post("/apiv2/basestation_update_list", async (req, res) => {
    const { stations } = req.body;
    fillterDatset(stations);
    fillterBaseStation(stations);
    fillterInit(stations);
    const sql = `UPDATE stations_active SET stations='${stations}' WHERE id = 1`;
    db.query(sql).then((r) => {
        res.status(200).json("update successful");
    });
});

app.get("/apiv2/basestation_fillter", (req, res) => {
    const sql = `SELECT *, stat_code as st_code, lat as y_coor, lng as x_coor FROM stations_fillter`;
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    });
})

app.post("/apiv2/basestation_history", (req, res) => {
    const { stat_code } = req.body;
    const sql = `SELECT *, stat_code as st_code, lat as y_coor, lng as x_coor 
                FROM landmos_sta 
                WHERE stat_code = '${stat_code}' AND init_date NOTNULL AND lat NOTNULL AND lng NOTNULL
                ORDER BY init_date ASC`;
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    });
})

app.post("/apiv2/get_last_initial", (req, res) => {
    const { stat_code } = req.body;
    const sql = `SELECT * FROM landmos_sta WHERE stat_code = '${stat_code}' ORDER BY init_date DESC LIMIT 1`;
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    });
})

app.post("/apiv2/get_last_gnssdata", (req, res) => {
    const { stat_code } = req.body;
    const sql = `SELECT * FROM gnssdata WHERE stat_code = '${stat_code}' ORDER BY ts DESC LIMIT 1`;
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    });
})

app.post("/apiv2/basestation_by_id", (req, res) => {
    const { stat_code } = req.body;
    const sql = `SELECT *, stat_code as st_code, lat as y_coor, lng as x_coor FROM stations_fillter WHERE stat_code='${stat_code}'`;
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    });
})

app.post("/apiv2/update_sta_web_notify", (req, res) => {
    const { gid, mkgroup } = req.body;
    const sql = `UPDATE  user_tb SET sta_web_notify='${mkgroup}' WHERE gid = ${gid}`;
    db.query(sql).then((r) => {
        res.status(200).json("update successful");
    });
})

app.post("/apiv2/select_sta_web_notify", (req, res) => {
    const { gid } = req.body;
    const sql = `SELECT userid, sta_web_notify FROM user_tb WHERE gid = ${gid}`;
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    });
})


const checkLineNotify = (gid, stat_code, obj) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT sta_line_notify FROM user_tb WHERE gid = ${gid}`;
        db.query(sql).then((r) => {
            let list = JSON.parse(r.rows[0].sta_line_notify);
            if (list !== null) {
                let data = list.map(item => item.stat_code == stat_code ? obj : item);
                if (!data.some(item => item.stat_code === stat_code)) {
                    data.push(obj);
                }
                console.log(obj);
                let sql = `UPDATE user_tb SET sta_line_notify='${JSON.stringify(data)}' WHERE gid = ${gid}`;

                console.log(sql);
                db.query(sql).then(() => {
                    resolve("update successful");
                });
            } else {
                let sql = `UPDATE user_tb SET sta_line_notify='[${JSON.stringify(obj)}]' WHERE gid = ${gid}`;
                db.query(sql).then(() => {
                    console.log("update successful");
                    resolve("update successful");
                });
            }
        })
    })
}
app.post("/apiv2/update_sta_line_notify", (req, res) => {
    const { gid, stat_code } = req.body;
    console.log(gid, stat_code, req.body);
    checkLineNotify(gid, stat_code, req.body).then((r) => {
        console.log(r);
        res.status(200).json(r);
    }).catch((e) => {
        res.status(200).json("error");
    });
})

const deleteLineNotify = (gid, stat_code) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT sta_line_notify FROM user_tb WHERE gid = ${gid}`;
        db.query(sql).then((r) => {
            console.log(r);
            let list = JSON.parse(r.rows[0].sta_line_notify);
            if (list !== null) {
                let data = list.filter(item => item.stat_code !== stat_code);
                console.log(data);
                let sql = `UPDATE  user_tb SET sta_line_notify='${JSON.stringify(data)}' WHERE gid = ${gid}`;
                db.query(sql).then(() => {
                    console.log("update successful");
                    resolve("delete successful");
                });
            } else {
                resolve("delete successful");
            }
        })
    })
}

app.post("/apiv2/delete_sta_line_notify", (req, res) => {
    const { gid, stat_code } = req.body;
    deleteLineNotify(gid, stat_code).then((r) => {
        res.status(200).json(r);
    }).catch((e) => {
        res.status(200).json("error");
    });
})

app.post("/apiv2/select_sta_line_notify", (req, res) => {
    const { gid } = req.body;
    console.log(gid);
    const sql = `SELECT userid, sta_line_notify FROM user_tb WHERE gid = ${gid}`;
    db.query(sql).then((r) => {
        let data = JSON.parse(r.rows[0].sta_line_notify)
        res.status(200).json({ data: data });
    });
});

app.post("/apiv2/update_acceleration_gauge", (req, res) => {
    const { gid, gauges } = req.body;
    // console.log(gid, gauges);
    const sql = `UPDATE user_tb SET acc_gauge='${gauges}' WHERE gid = ${gid}`;

    db.query(sql).then((r) => {
        res.status(200).json("update successful");
    });
})

app.post("/apiv2/select_acceleration_gauge", (req, res) => {
    const { gid } = req.body;
    const sql = `SELECT userid, acc_gauge FROM user_tb WHERE gid = ${gid}`;
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    });
})

const getValueBySingleDate = (stat_code, date, type) => {
    let sql;
    if (type == "start") {
        sql = `SELECT ts,de,dn,dh FROM dataset WHERE stat_code='${stat_code}' 
                AND ts BETWEEN '${date}'::TIMESTAMP - INTERVAL '1 day'
                AND '${date}' ORDER BY ts ASC LIMIT 1`;
    }

    if (type == "end") {
        sql = `SELECT ts,de,dn,dh FROM dataset WHERE stat_code='${stat_code}' 
                AND ts BETWEEN '${date}'::TIMESTAMP - INTERVAL '1 day'
                AND '${date}' ORDER BY ts DESC LIMIT 1`;
    }

    return new Promise((resolve, reject) => {
        db.query(sql).then((r) => {
            resolve(r.rows[0]);
        });
    });
};

const calAccelerationValue = (stat_code) => {
    const sql = `SELECT  stat_code, de, dn, dh, ts, ts7, status FROM public.dataset  
                    WHERE stat_code='${stat_code}' 
                        AND ts BETWEEN now()::TIMESTAMP - INTERVAL '1 day'
                        AND now() ORDER BY ts ASC`;
    console.log(sql);
    return new Promise((resolve, reject) => {
        db.query(sql).then((rawArr) => {
            prepareData(rawArr.rows).then((preData) => {
                calculateVln(preData).then((vlnData) => {
                    doMovingLeastSqure(vlnData).then((dat) => {
                        resolve(dat);
                    })
                })
            }).catch((error) => {
                console.error(error);
                reject(error);
            });
        })
    })
}

// app.post("/apiv2/get_value_for_acceleration_gauge", async (req, res) => {
//     const { stat_code, datestart, dateend } = req.body;
//     let start = await getValueBySingleDate(stat_code, datestart, "start");
//     let end = await getValueBySingleDate(stat_code, datestart, "end");
//     if (start !== undefined || end !== undefined) {
//         let result = await calAccelerationValue(stat_code);
//         res.status(200).json(result);
//     } else {
//         res.status(200).json("no data");
//     }
// })

app.post("/apiv2/lastposition", (req, res) => {
    const { stat_code } = req.body;
    const sql = `SELECT * FROM dataset WHERE stat_code='${stat_code}' ORDER BY ts DESC LIMIT 1`;
    // console.log(sql);
    db.query(sql).then((r) => {
        console.log(r.rows);
        res.status(200).json(r.rows[0]);
    });
});

app.post("/apiv2/initstation", async (req, res) => {
    const { data } = req.body;
    let gid = Date.now()
    db.query(`INSERT INTO landmos_sta(gid, init_date)VALUES('${gid}', now())`)
    for (d in data) {
        if (data[d]) {
            let sql = `UPDATE landmos_sta SET ${d}='${data[d]}' WHERE gid='${gid}'`
            console.log(sql);
            await db.query(sql)
        }
    }
    res.status(200).json("updated");
})

app.post("/apiv2/insertthreshold", (req, res) => {
    const { stat_code, threshold, alert } = req.body;
    const sql = `UPDATE base_sta SET threshold=${threshold}, alert=${alert} WHERE sta_code='${stat_code}'`;
    db.query(sql).then((r) => {
        res.status(200).json("threshold inserted");
    });
})

const viCal = (datArr) => {
    let vi = [];
    datArr.map((i, k) => {
        let vi_n3_2d = k >= 4 ? (datArr[k].acc_disp2d - datArr[k - 3].acc_disp2d) / (datArr[k].time - datArr[k - 3].time) : 0;
        let vi_n7_2d = k >= 7 ? (datArr[k].acc_disp2d - datArr[k - 6].acc_disp2d) / (datArr[k].time - datArr[k - 6].time) : 0;

        let vi_n3_3d = k >= 4 ? (datArr[k].acc_disp3d - datArr[k - 3].acc_disp3d) / (datArr[k].time - datArr[k - 3].time) : 0;
        let vi_n7_3d = k >= 7 ? (datArr[k].acc_disp3d - datArr[k - 6].acc_disp3d) / (datArr[k].time - datArr[k - 6].time) : 0;

        vi.push({ ...i, vi_n3_2d: vi_n3_2d, vi_n7_2d: vi_n7_2d, vi_n3_3d: vi_n3_3d, vi_n7_3d: vi_n7_3d })
    })
    let all = []
    vi.map(async (i, k) => {
        let v6hr = k >= 23 ? vi.filter((_, index) => index >= k - 23 && index <= k)
            .reduce((acc, val) => acc + val.vi_n3_3d, 0) / 24 : 0;
        let v12hr = k >= 47 ? vi.filter((_, index) => index >= k - 47 && index <= k)
            .reduce((acc, val) => acc + val.vi_n3_3d, 0) / 48 : 0;
        let v24hr = k >= 95 ? vi.filter((_, index) => index >= k - 95 && index <= k)
            .reduce((acc, val) => acc + val.vi_n3_3d, 0) / 96 : 0;
        let v48hr = k >= 191 ? vi.filter((_, index) => index >= k - 191 && index <= k)
            .reduce((acc, val) => acc + val.vi_n3_3d, 0) / 192 : 0;
        let inv6hr = 1 / v6hr;
        let inv12hr = 1 / v12hr;
        let inv24hr = 1 / v24hr;
        let inv48hr = 1 / v48hr;

        all.push({ ...i, v6hr: v6hr, v12hr: v12hr, v24hr: v24hr, v48hr: v48hr, inv6hr: inv6hr, inv12hr: inv12hr, inv24hr: inv24hr, inv48hr: inv48hr })
    })
    return all;
}

const formatData = (arr) => {
    var pde = 0;
    var pdn = 0;
    var pdh = 0;
    // var pdisp2d = 0;
    var pacc_disp2d = 0;
    // var pdisp3d = 0;
    var pacc_disp3d = 0;

    let datArr = arr.map((i, k) => {
        const disp2d = k == 0 ? 0 : Math.sqrt(Math.pow(((i.de) - (pde)), 2) + Math.pow(((i.dn) - (pdn)), 2));
        const disp3d = k == 0 ? 0 : Math.sqrt(Math.pow(((i.de) - (pde)), 2) + Math.pow(((i.dn) - (pdn)), 2) + Math.pow(((i.dh) - (pdh)), 2));
        pacc_disp2d += disp2d;
        pacc_disp3d += disp3d;
        let a = {
            id: k + 1, de: i.de, dn: i.dn, dh: i.dh, ts: i.ts, time: k * 0.25, disp2d: disp2d, acc_disp2d: pacc_disp2d, disp3d: disp3d, acc_disp3d: pacc_disp3d
        }

        pde = i.de;
        pdn = i.dn;
        pdh = i.dh;
        // pdisp2d = disp2d;
        // pdisp3d = disp3d;
        return a
    })
    return datArr;
}

app.post("/apiv2/select_ivndata", (req, res) => {
    const { stat_code, start_date, end_date } = req.body;
    const sql = `SELECT  de, dn, dh, ts FROM public.dataset  WHERE stat_code='${stat_code}' and ts7 BETWEEN '${start_date}' AND '${end_date}' ORDER BY ts ASC`;

    db.query(sql).then(async (re) => {
        let datArr = await formatData(re.rows)
        let all = await viCal(datArr);
        setTimeout(() => {
            res.status(200).json(all);
        }, 300);
    })
})

const prepareData = (rawArr) => {
    return new Promise((resolve, reject) => {
        let data = rawArr.map((i, k) => ({
            de: i.de,
            dn: i.dn,
            dh: i.dh,
            d2d: Math.sqrt(Math.pow(i.de, 2) + Math.pow(i.dn, 2)),
            d3d: Math.sqrt(Math.pow(i.de, 2) + Math.pow(i.dn, 2) + Math.pow(i.dh, 2)),
            ts: i.ts,
            ts7: i.ts7,
            time: k * 0.25,
            stat_code: i.stat_code,
        }));
        resolve(data);
    });
};

const calculateVln = (datArr) => {
    return new Promise((resolve, reject) => {
        let vln = datArr.map((i, k) => {
            return {
                ...i,
                vln3hr: k >= 12 ? ss.linearRegression(datArr.filter((_, index) => index >= k - 11 && index <= k).map((i) => [i.time, i.d2d])).m : 0,
                vln6hr: k >= 24 ? ss.linearRegression(datArr.filter((_, index) => index >= k - 23 && index <= k).map((i) => [i.time, i.d2d])).m : 0,
                vln12hr: k >= 48 ? ss.linearRegression(datArr.filter((_, index) => index >= k - 47 && index <= k).map((i) => [i.time, i.d2d])).m : 0,
                vln24hr: k >= 96 ? ss.linearRegression(datArr.filter((_, index) => index >= k - 95 && index <= k).map((i) => [i.time, i.d2d])).m : 0,
            }
        });
        resolve(vln);
    });
}

const doMovingLeastSqure = (viArr) => {
    return new Promise((resolve, reject) => {
        let vi = viArr.map((i, k) => ({
            ...i,
            vln3hr: i.vln3hr / 3,
            vln6hr: i.vln6hr / 6,
            vln12hr: i.vln12hr / 12,
            vln24hr: i.vln24hr / 24
        }))
        resolve(vi);
    })
}

const doDiscreteLeastSqure = (viArr) => {
    return new Promise((resolve, reject) => {
        // let datArr = viArr.filter((_, k) => k % (4 * 3) == 0)
        let vi = viArr.map((i, k) => ({
            ...i,
            vln3hr: k % (4 * 3) == 0 ? i.vln3hr / 3 : null,
            vln6hr: k % (4 * 6) == 0 ? i.vln3hr / 6 : null,
            vln12hr: k % (4 * 12) == 0 ? i.vln3hr / 2 : null,
            vln24hr: k % (4 * 24) == 0 ? i.vln3hr / 24 : null,
        }))
        resolve(vi);
    })
}

const invTypeB = (datArr) => {
    return new Promise((resolve, reject) => {
        // let arr = datArr.filter((_, index) => (index + 9) % 12 === 0).map((i) => i)
        let inv = datArr.map((i, k) => {
            return {
                ...i,
                inv3hr_3n: k % (4 * 3) == 0 ? k >= 16 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 2 && index <= k).map((i) => i.vln3hr)) : 0 : null,
                inv3hr_7n: k % (4 * 3) == 0 ? k >= 20 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 6 && index <= k).map((i) => i.vln3hr)) : 0 : null,
                inv6hr_3n: k % (4 * 6) == 0 ? k >= 28 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 2 && index <= k).map((i) => i.vln6hr)) : 0 : null,
                inv6hr_7n: k % (4 * 6) == 0 ? k >= 32 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 6 && index <= k).map((i) => i.vln6hr)) : 0 : null,
                inv6hr_3n: k % (4 * 12) == 0 ? k >= 52 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 2 && index <= k).map((i) => i.vln12hr)) : 0 : null,
                inv6hr_7n: k % (4 * 12) == 0 ? k >= 56 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 6 && index <= k).map((i) => i.vln12hr)) : 0 : null,
            }
        })
        resolve(inv)
    })
}

const invTypeA = (datArr) => {
    return new Promise((resolve, reject) => {
        let inv = datArr.map((i, k) => {
            return {
                ...i,
                inv3hr_3n: k >= 16 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 2 && index <= k).map((i) => i.vln3hr)) : 0,
                inv3hr_7n: k >= 20 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 6 && index <= k).map((i) => i.vln3hr)) : 0,
                inv6hr_3n: k >= 28 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 2 && index <= k).map((i) => i.vln6hr)) : 0,
                inv6hr_7n: k >= 32 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 6 && index <= k).map((i) => i.vln6hr)) : 0,
                inv12hr_3n: k >= 52 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 2 && index <= k).map((i) => i.vln12hr)) : 0,
                inv12hr_7n: k >= 56 ? 1 / ss.mean(datArr.filter((_, index) => index >= k - 6 && index <= k).map((i) => i.vln12hr)) : 0,
            }
        })
        resolve(inv)
    })
}

app.post("/apiv2/select_displacement", (req, res) => {
    const { stat_code, start_date, end_date, stat_status } = req.body;

    let station = JSON.parse(stat_code)
    let where_station = `stat_code='${station[0]}'`;
    if (stat_code.length > 1) {
        for (let i = 1; i < station.length; i++) {
            where_station += ` OR stat_code='${station[i]}'`
        };
    }

    let status = JSON.parse(stat_status);

    let where_status = `status=${status[0]}`;
    if (status.length > 1) {
        for (let i = 1; i < status.length; i++) {
            where_status += ` OR status=${status[i]}`
        };
    } else if (status.length == 0) {
        where_status = ` status IS NULL`
    }

    const sql = `SELECT  stat_code, de, dn, dh, ts, ts7, status FROM public.dataset  
                WHERE (${where_station}) AND (${where_status}) AND ts7 BETWEEN '${start_date}' AND '${end_date}' 
                ORDER BY ts ASC`;

    db.query(sql).then((rawArr) => {
        prepareData(rawArr.rows).then((preData) => {
            calculateVln(preData).then((vlnData) => {
                doMovingLeastSqure(vlnData).then((dat) => {
                    res.status(200).json(dat);
                })
            })
        }).catch((error) => {
            console.error(error);
        });
    })
});

app.post("/apiv2/select_vindata_type_a", (req, res) => {
    const { stat_code, start_date, end_date, stat_status } = req.body;
    let status = JSON.parse(stat_status)
    let where_status = `status=${status[0]}`;

    if (status.length > 1) {
        for (let i = 1; i < status.length; i++) {
            where_status += ` OR status=${status[i]}`
        };
    } else if (status.length == 0) {
        where_status = ` status IS NULL`
    }

    const sql = `SELECT  stat_code, de, dn, dh, ts, ts7, status FROM public.dataset  
                WHERE stat_code='${stat_code}' AND (${where_status}) AND ts7 BETWEEN '${start_date}' AND '${end_date}' 
                ORDER BY ts ASC`;

    db.query(sql).then((rawArr) => {
        prepareData(rawArr.rows).then((preData) => {
            calculateVln(preData).then((vlnData) => {
                doMovingLeastSqure(vlnData).then((dat) => {
                    res.status(200).json(dat);
                })
            })
        }).catch((error) => {
            console.error(error);
        });
    })
})

app.post("/apiv2/select_vindata_type_b", (req, res) => {
    const { stat_code, start_date, end_date, stat_status } = req.body;
    let status = JSON.parse(stat_status)
    let where_status = `status=${status[0]}`;

    if (status.length > 1) {
        for (let i = 1; i < status.length; i++) {
            where_status += ` OR status=${status[i]}`
        };
    } else if (status.length == 0) {
        where_status = ` status IS NULL`
    }

    const sql = `SELECT  stat_code, de, dn, dh, ts, ts7, status FROM public.dataset  
                WHERE stat_code='${stat_code}' AND (${where_status}) AND ts7 BETWEEN '${start_date}' AND '${end_date}' 
                ORDER BY ts ASC`;
    db.query(sql).then((rawArr) => {
        prepareData(rawArr.rows).then((preData) => {
            calculateVln(preData).then((vlnData) => {
                doDiscreteLeastSqure(vlnData).then((dat) => {
                    res.status(200).json(dat);
                })
            })
        }).catch((error) => {
            console.error(error);
        });
    })
})

app.post("/apiv2/select_ivndata_type_a", (req, res) => {
    const { stat_code, start_date, end_date, stat_status } = req.body;
    let status = JSON.parse(stat_status)
    let where_status = `status=${status[0]}`;

    if (status.length > 1) {
        for (let i = 1; i < status.length; i++) {
            where_status += ` OR status=${status[i]}`
        };
    } else if (status.length == 0) {
        where_status = ` status IS NULL`
    }

    const sql = `SELECT  stat_code, de, dn, dh, ts, ts7, status FROM public.dataset  
                WHERE stat_code='${stat_code}' AND (${where_status}) AND ts7 BETWEEN '${start_date}' AND '${end_date}' 
                ORDER BY ts ASC`;

    db.query(sql).then((rawArr) => {
        prepareData(rawArr.rows).then((preData) => {
            calculateVln(preData).then((viData) => {
                invTypeA(viData).then((invData) => {
                    res.status(200).json(invData);
                })
            })
        }).catch((error) => {
            console.error(error);
        });
    })
})

app.post("/apiv2/select_ivndata_type_b", (req, res) => {
    const { stat_code, start_date, end_date, stat_status } = req.body;
    let status = JSON.parse(stat_status)
    let where_status = `status=${status[0]}`;

    if (status.length > 1) {
        for (let i = 1; i < status.length; i++) {
            where_status += ` OR status=${status[i]}`
        };
    } else if (status.length == 0) {
        where_status = ` status IS NULL`
    }

    const sql = `SELECT  stat_code, de, dn, dh, ts, ts7, status FROM public.dataset  
                WHERE stat_code='${stat_code}' AND (${where_status}) AND ts7 BETWEEN '${start_date}' AND '${end_date}' 
                ORDER BY ts ASC`;

    db.query(sql).then((rawArr) => {
        prepareData(rawArr.rows).then((preData) => {
            calculateVln(preData).then((viData) => {
                invTypeB(viData).then((invData) => {
                    res.status(200).json(invData);
                })
            })
        }).catch((error) => {
            console.error(error);
        });
    })
})

app.post("/apiv2/select_station", (req, res) => {
    const sql = `SELECT * FROM stations_active`;
    console.log(sql);
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    })
});

app.post("/apiv2/select_device", (req, res) => {
    const { stat_code, start_date, end_date } = req.body;

    const sql = `SELECT  stat_code, solar_volt, solar_amp, batt_volt, batt_amp,sta_light, sta_temp, sta_hum, ts, ts7 
                    FROM public.dataset  
                    WHERE stat_code='${stat_code}' AND ts7 BETWEEN '${start_date}' AND '${end_date}' 
                    ORDER BY ts ASC`;

    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    })
});

app.post("/apiv2/select_device_info", (req, res) => {
    const { stat_code } = req.body;
    console.log(stat_code);
    const sql = `SELECT  stat_code, solar_volt, solar_amp, batt_volt, batt_amp,sta_light, sta_temp, sta_hum, ts, ts7 
                    FROM public.dataset  
                    WHERE stat_code='${stat_code}' 
                    ORDER BY ts DESC
                    LIMIT 1`;

    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    })
});

const mergeFile = (station, dt) => {
    // const ts = new Date();
    // const dt = moment(ts).format("YYYYMMDDHHmm");
    const f = `rtk${station}_${dt}.ubx`;
    const fn1 = `./nmea/rtk${station}_${dt}_01.ubx`;
    const fn2 = `./nmea/rtk${station}_${dt}_02.ubx`;
    const fn3 = `./nmea/rtk${station}_${dt}_03.ubx`;

    if (fs.existsSync(fn1) && fs.existsSync(fn2) && fs.existsSync(fn3)) {
        fs.readFile(fn1, 'utf8', (err, file1Data) => {
            fs.readFile(fn2, 'utf8', (err, file2Data) => {
                fs.readFile(fn2, 'utf8', (err, file3Data) => {
                    const mergedData = file1Data + file2Data + file3Data;
                    fs.writeFile(`./DATA/${f}`, mergedData, (err) => {
                        if (err) throw err;
                        console.log('The file has been saved!');
                    })
                })
            })
        })
    }
}

// mergeFile('002', '202307181430')
app.post("/apiv2/nmea", (req, res) => {
    const { dt, station, pv_volt, pv_amp, batt_volt, batt_amp, sta_light, sta_temp, sta_hum, nmea, image } = req.body;
    // rtk011_202305050300_xx.ubx  rtk011_202305102300.ubx  (สถานี3,_,ปีค.ศ.4,เดือน2,วัน2,ชม2,นาที2.ubx)
    const dtsp = dt.split("_");
    console.log(dt, dtsp);
    if (dtsp[1] == "01") {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${station}, ${pv_volt}, ${pv_amp}, ${batt_volt}, ${batt_amp}, ${sta_light}, ${sta_temp}, ${sta_hum}, ${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
            });
        });
    } else {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
                if (dtsp[1] == "03") {
                    mergeFile(station, dtsp[0])
                }
            })
        });
    }
});

app.post("/apiv2/nmea/xbee", (req, res) => {
    const nmea = req.body.data;
    const buffer = Buffer.from(nmea, 'base64');
    const decodedString = buffer.toString('utf-8');
    let arr = decodedString.split(', ')
    let data = decodedString.replace(`${arr[0]}, `, '');

    console.log(arr);
    const f = `rtk${arr[1]}_${arr[0]}.ubx`;
    fs.writeFile(`./DATA/${f}`, data, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
        res.send('Data written to file');
    })
})

app.post("/apiv2/nmea/104", (req, res) => {
    const { dt, station, pv_volt, pv_amp, batt_volt, batt_amp, sta_light, sta_temp, sta_hum, nmea, image } = req.body;
    // rtk011_202305050300_xx.ubx  rtk011_202305102300.ubx  (สถานี3,_,ปีค.ศ.4,เดือน2,วัน2,ชม2,นาที2.ubx)
    const dtsp = dt.split("_");
    console.log(dt, dtsp);
    if (dtsp[1] == "01") {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${station}, ${pv_volt}, ${pv_amp}, ${batt_volt}, ${batt_amp}, ${sta_light}, ${sta_temp}, ${sta_hum}, ${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
            });
        });
    } else {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
                if (dtsp[1] == "03") {
                    mergeFile(station, dtsp[0])
                }
            })
        });
    }
})

app.post("/apiv2/nmea/011", (req, res) => {
    const { dt, station, pv_volt, pv_amp, batt_volt, batt_amp, sta_light, sta_temp, sta_hum, nmea, image } = req.body;
    // rtk011_202305050300_xx.ubx  rtk011_202305102300.ubx  (สถานี3,_,ปีค.ศ.4,เดือน2,วัน2,ชม2,นาที2.ubx)
    const dtsp = dt.split("_");
    console.log(dt, dtsp);
    if (dtsp[1] == "01") {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${station}, ${pv_volt}, ${pv_amp}, ${batt_volt}, ${batt_amp}, ${sta_light}, ${sta_temp}, ${sta_hum}, ${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
            });
        });
    } else {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
                if (dtsp[1] == "03") {
                    mergeFile(station, dtsp[0])
                }
            })
        });
    }
})

app.post("/apiv2/nmea/012", (req, res) => {
    const { dt, station, pv_volt, pv_amp, batt_volt, batt_amp, sta_light, sta_temp, sta_hum, nmea, image } = req.body;
    // rtk011_202305050300_xx.ubx  rtk011_202305102300.ubx  (สถานี3,_,ปีค.ศ.4,เดือน2,วัน2,ชม2,นาที2.ubx)
    const dtsp = dt.split("_");
    console.log(dt, dtsp);
    if (dtsp[1] == "01") {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${station}, ${pv_volt}, ${pv_amp}, ${batt_volt}, ${batt_amp}, ${sta_light}, ${sta_temp}, ${sta_hum}, ${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
            });
        });
    } else {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
                if (dtsp[1] == "03") {
                    mergeFile(station, dtsp[0])
                }
            })
        });
    }
})

app.post("/apiv2/nmea/013", (req, res) => {
    const { dt, station, pv_volt, pv_amp, batt_volt, batt_amp, sta_light, sta_temp, sta_hum, nmea, image } = req.body;
    // rtk011_202305050300_xx.ubx  rtk011_202305102300.ubx  (สถานี3,_,ปีค.ศ.4,เดือน2,วัน2,ชม2,นาที2.ubx)
    const dtsp = dt.split("_");
    console.log(dt, dtsp);
    if (dtsp[1] == "01") {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${station}, ${pv_volt}, ${pv_amp}, ${batt_volt}, ${batt_amp}, ${sta_light}, ${sta_temp}, ${sta_hum}, ${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
            });
        });
    } else {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
                if (dtsp[1] == "03") {
                    mergeFile(station, dtsp[0])
                }
            })
        });
    }
})

app.post("/apiv2/nmea/014", (req, res) => {
    const { dt, station, pv_volt, pv_amp, batt_volt, batt_amp, sta_light, sta_temp, sta_hum, nmea, image } = req.body;
    // rtk011_202305050300_xx.ubx  rtk011_202305102300.ubx  (สถานี3,_,ปีค.ศ.4,เดือน2,วัน2,ชม2,นาที2.ubx)
    const dtsp = dt.split("_");
    console.log(dt, dtsp);
    if (dtsp[1] == "01") {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${station}, ${pv_volt}, ${pv_amp}, ${batt_volt}, ${batt_amp}, ${sta_light}, ${sta_temp}, ${sta_hum}, ${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
            });
        });
    } else {
        fs.writeFile(`./nmea/rtk${station}_${dt}.ubx`, `${nmea}`, (err) => {
            if (err) throw err;
            fs.writeFile(`./nmea/rtk${station}_${dt}_img.ubx`, `${station}, ${image}`, (err) => {
                if (err) throw err;
                res.send('Data written to file');
                if (dtsp[1] == "03") {
                    mergeFile(station, dtsp[0])
                }
            })
        });
    }
})

const getStationGraphql = (query) => {
    return new Promise((resolve, reject) => {
        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        let data = JSON.stringify({
            query: query,
            variables: {}
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://mmm-bigdata.egat.co.th/dataapi/v1/graphql',
            headers: {
                'x-hasura-admin-secret': 'BigData!2022',
                'Content-Type': 'application/json'
            },
            data: data
        };

        instance.request(config)
            .then((response) => {
                resolve(response.data);
            })
            .catch((error) => {
                resolve(error);
            });
    })
}

app.post("/apiv2/get_water_station", async (req, res) => {
    const { stat_type } = req.body;
    let query;
    if (stat_type == "rain") {
        query = `query rain_station {
            wtele_rain_station {
              station_id
              rtu_id
              name_th
              name_eng
              longitude
              latitude
              code
            }
          }`
    } else if (stat_type == "upliftForce") {
        query = `query MyQuery2 {
            geo_piezometer_master_2 {
              borehole_id
              piezo_id
              latitude
              longitude
              measurement_type
              mine_e
              mine_n
              observed
            }
          }`
    } else {
        res.status(200).json({ data: "error" });
    }
    getStationGraphql(query).then((r) => {
        res.status(200).json(r);
    }).catch((error) => {
        res.status(200).json({ data: "error" });
    });
})

const getDataGraphql = (query, stat_code, stationKey, timestemp, valueKey, yAxisIndex, unit) => {
    return new Promise((resolve, reject) => {
        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        let data = JSON.stringify({
            query: query,
            variables: {}
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://mmm-bigdata.egat.co.th/dataapi/v1/graphql',
            headers: {
                'x-hasura-admin-secret': 'BigData!2022',
                'Content-Type': 'application/json'
            },
            data: data
        };

        instance.request(config)
            .then((response) => {
                var series = [];
                var legend = [];
                try {
                    legend = stat_code.map((st, i) => String(st))
                    series = stat_code.map((st, i) => {
                        let result;
                        if (stationKey == "piezo_id") {
                            // console.log(response.data);
                            result = response.data.data.iot64_piezometer_data.filter(i => i[stationKey] == st)
                                .sort((a, b) => new Date(a[timestemp]).getTime() - new Date(b[timestemp]).getTime())
                                .map(i => [i[timestemp], (i[valueKey]).toFixed(3)]).filter((item, index, self) =>
                                    index === self.findIndex(t => (
                                        t[0] === item[0] && t[1] === item[1]
                                    ))
                                );
                        } else {
                            result = response.data.data.wtele_rain_15min.filter(i => i[stationKey] == st)
                                .sort((a, b) => new Date(a[timestemp]).getTime() - new Date(b[timestemp]).getTime())
                                .map(i => [i[timestemp], (i[valueKey]).toFixed(3)]).filter((item, index, self) =>
                                    index === self.findIndex(t => (
                                        t[0] === item[0] && t[1] === item[1]
                                    ))
                                );
                        }
                        // console.log(unit);
                        return {
                            name: st,
                            yAxisIndex: yAxisIndex,
                            tooltip: { valueFormatter: value => value + " " + unit },
                            type: 'line',
                            smooth: true,
                            data: result,
                        }
                    });
                    resolve({ series, legend });
                } catch (error) {
                    reject(error);
                }
                resolve(response.data);
            })
            .catch((error) => {
                resolve(error);
            });
    })
}

app.post("/apiv2/get_water_data", async (req, res) => {
    let { stat_code, stat_type, datestart, dateend } = req.body;
    let query;
    if (stat_type == "rain") {
        query = `query rain_15_min {
            wtele_rain_15min(
                limit: 1000, 
                where: { 
                    _and:[
                        {timestamp: {_gte:"${datestart}"}}, 
                        {timestamp: {_lt:"${dateend}"}},
                        {station_id: {_in: ${stat_code} }}
                    ] 
                }
            ) {
                timestamp
                rain_data
                station_id
            }
          }`
        // console.log(query);
        getDataGraphql(query, JSON.parse(stat_code), "station_id", "timestamp", "rain_data", 1, "mm").then((r) => {
            // console.log(r.series);
            res.status(200).json({ type: "rain", series: r.series, legend: r.legend });
        })
    } else if (stat_type == "upliftForce") {
        query = `query piezo_iot_data {
            iot64_piezometer_data(
                limit: 1000, 
                where: {
                    _and: [
                        {timestamp: {_gte:"${datestart}"}}, 
                        {timestamp: {_lt:"${dateend}"}},
                        {piezo_id: {_in: ${stat_code}}} 
                    ]
                }
            ) {
                timestamp
                device_id
                kpa
                msl
                piezo_id
            }
        }`
        // console.log(query);
        getDataGraphql(query, JSON.parse(stat_code), "piezo_id", "timestamp", "kpa", 1, "kpa").then((r) => {
            // console.log(r.series);
            res.status(200).json({ type: "upliftForce", series: r.series, legend: r.legend });
        })
    } else {
        res.status(200).json({ data: "error" });
    }
})

app.post("/apiv2/get_summary_station", async (req, res) => {
    const { start_date, end_date } = req.body;
    const sql = `WITH summary AS (
        SELECT 
            ROW_NUMBER() OVER(ORDER BY stat_code) as id,
            stat_code, 
            COUNT(stat_code) as count_dat,  
            MAX(ts) AS last_dat
        FROM gnssdata
        WHERE ts BETWEEN '${start_date}' AND '${end_date}' 
        GROUP BY stat_code
    )
    SELECT * FROM summary`;
    // console.log(sql);
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    })
})

app.post("/apiv2/get_summary_sta_light", async (req, res) => {
    const { start_date, end_date } = req.body;
    const sql = `WITH summary AS (
        SELECT 
            ROW_NUMBER() OVER(ORDER BY stat_code) as id,
            stat_code, 
            SUM(CASE WHEN sta_light = 0 THEN 1 ELSE 0 END) AS case0,
            SUM(CASE WHEN sta_light = 1 THEN 1 ELSE 0 END) AS case1,
            MAX(ts) AS last_dat
        FROM gnssdata
        WHERE ts BETWEEN '${start_date}' AND '${end_date}' 
        GROUP BY stat_code
    )
    
    SELECT * FROM summary`;
    // console.log(sql);
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    })
})

app.post("/apiv2/get_summary_alert", async (req, res) => {
    const { start_date, end_date } = req.body;
    const sql = `SELECT stat_code, count(stat_code) as alert_count
                FROM alert_history
                WHERE ts_alert BETWEEN '${start_date}' AND '${end_date}' 
                GROUP BY stat_code`;
    // console.log(sql);
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    })
})

const insertAlertHistory = async (data) => {
    const sql = `INSERT INTO alert_history(stat_code, vi_attention, vi_warning, vi_alarm, alert, userid, usergid, rtk_ts, rtk_v, rtk_a, ts_alert, alert_type) VALUES(
                        '${data.stat_code}', '${data.vi_attention}', '${data.vi_warning}', ${data.vi_alarm}, ${data.alert}, '${data.userid}', ${data.usergid}, '${data.rtk_ts}', ${data.rtk_v}, ${data.rtk_a}, now(), '${data.alert_type}')`;
    db.query(sql);
}


const insertLineToken = async (data) => {
    // console.log(data);
    const sql = `UPDATE user_tb SET userid = '${data.access_token}' WHERE gid = ${data.gid}`;
    db.query(sql);
}

app.post("/apiv2/getLineToken", async (req, res) => {
    const { code, gid } = req.body;
    let data = qs.stringify({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'https://mmm-rtk-landmos.egat.co.th/_profile/index.html', // แก้ใน line ด้วย
        'client_id': 'j5ByMj7zLPdgZr44EsTv2T',
        'client_secret': '354kbRspbrt0AfqZ6QW5UXqbTxZ0RCHGUMS8vx44cSm'
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://notify-bot.line.me/oauth/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            if (response.data && gid) {
                let access_token = response.data.access_token
                insertLineToken({ access_token, gid });
                res.status(200).json({ message: "success" });
            } else {
                res.status(200).json({ message: "existing" });
            }
        })
        .catch((error) => {
            res.status(200).json({ message: "error" });
        });
});

const revokeLineToken = async (gid) => {
    let sql = `UPDATE user_tb SET userid = null WHERE gid = ${gid}`;
    db.query(sql);
}
app.post("/apiv2/revokeLineToken", async (req, res) => {
    const { gid } = req.body;
    let sql = "SELECT userid FROM user_tb WHERE gid = " + gid;
    db.query(sql).then((r) => {
        if (r.rows[0].userid) {
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://notify-api.line.me/api/revoke',
                headers: {
                    'Authorization': 'Bearer ' + r.rows[0].userid,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };

            axios.request(config)
                .then((response) => {
                    revokeLineToken(gid);
                    res.status(200).json({ message: "deleted token" });
                })
                .catch((error) => {
                    console.log(error);
                });

        } else {
            res.status(200).json({ message: "empty token" });
        }
    });
})

const sendLineNotify = async (token, data) => {
    let message = qs.stringify({
        'message': data,
        'stickerPackageId': '11537',
        'stickerId': '52002739'
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://notify-api.line.me/api/notify',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: message
    };

    axios.request(config)
        .then((response) => {
            console.log(response.data);
        })
        .catch((error) => {
            console.log(error);
        });
}

app.get("/apiv2/getelev", (req, res) => {
    const sql = `select sample_1 as elev, ST_asGeoJSON(geom) as geojson from public.dempoint100`;
    db.query(sql).then((r) => {
        res.status(200).json(r.rows);
    })
})

app.post("/apiv2/post_data_csv", async (req, res) => {
    const { stat_code, start_date, end_date } = req.body;
    console.log(stat_code, start_date, end_date);
    const sql = `SELECT  to_char(ts7, 'YYYY/MM/DD HH24:MI') as time,  
                        stat_code as device_id, 
                        'LANDMOS' as type, 
                        mine_n,  
                        mine_e,
                        utm_n,
                        utm_e,
                        lat,
                        lng,  
                        ortho_h, 
                        status  
                FROM dataset
                WHERE stat_code='${stat_code}' AND ts7 BETWEEN '${start_date}' AND '${end_date}' `;

    db.query(sql).then(r => {
        const filePath = 'www/_output/output.csv';
        const headerRow = ['Time', 'Device_ID', 'Type', 'Mine_N', 'Mine_E', 'UTM47_N', 'UTM47_E', 'Latitude', 'Longitude', 'Altitude', 'Status'];
        const contentRows = r.rows.map(row => Object.values(row).join(','));
        const csvContent = [headerRow.join(','), ...contentRows].join('\n');
        fs.writeFile(filePath, csvContent, 'utf8', (err) => {
            if (err) {
                console.error('Error writing CSV file:', err);
            } else {
                res.download(filePath);
                console.log('CSV file written successfully.');
            }
        });
    });
})

app.get("/apiv2/get_data_csv", async (req, res) => {
    const ts = new Date();
    const end_date = moment(ts).format("YYYY-MM-DD HH:mm:ss");
    const start_date = moment().subtract(14, 'days').format("YYYY-MM-DD HH:mm:ss");
    // const { stat_code, start_date, end_date } = req.params;
    console.log(start_date, end_date);
    const sql = `SELECT  to_char(ts7, 'YYYY/MM/DD HH24:MI') as time,  
                        stat_code as device_id, 
                        'LANDMOS' as type, 
                        dn,  
                        de,  
                        dh, 
                        mine_n,  
                        mine_e,
                        utm_n,
                        utm_e,
                        lat,
                        lng, 
                        status  
                FROM dataset
                WHERE ts7 BETWEEN '${start_date}' AND '${end_date}' `;
    // console.log(sql);
    db.query(sql).then(r => {
        const filePath = 'www/_output/output.csv';
        const headerRow = [
            'Time',
            'Device_ID',
            'Type',
            'dn',
            'de',
            'dh',
            'mine_n',
            'mine_e',
            'utm47_n',
            'utm47_e',
            'lat',
            'lng',
            'Status'];
        const contentRows = r.rows.map(row => Object.values(row).join(','));
        const csvContent = [headerRow.join(','), ...contentRows].join('\n');
        fs.writeFile(filePath, csvContent, 'utf8', (err) => {
            if (err) {
                console.error('Error writing CSV file:', err);
            } else {
                res.download(filePath);
                console.log('CSV file written successfully.');
            }
        });
    });
})

app.post("/apiv2/getisoline", (req, res) => {
    const { fld, interval } = req.body
    console.log(fld, interval);
    const flaskUrl = "/pyapi/getisoline";
    axios.post(flaskUrl, { fld, interval })
        .then(r => {
            console.log(r.data);
            res.json(r.data);
        })
})

app.post("/apiv2/cctv_insert", (req, res) => {
    const { stat_code, image } = req.body
    try {
        const sql = `INSERT INTO cctv(stat_code, image, ts)VALUES('${stat_code}', '${image}', now())`;
        db.query(sql).then(r => {
            res.json({ message: "success" });
        }).catch((error) => {
            console.error(error);
            res.json([]);
        });
    } catch (error) {
        console.log(error);
        res.json([]);
    }
})

app.post("/apiv2/cctv_select", (req, res) => {
    const { stat_code, start_date, end_date } = req.body
    try {
        const sql = `SELECT * FROM cctv WHERE stat_code = '${stat_code}' AND ts BETWEEN '${start_date}' AND '${end_date}' `;
        db.query(sql).then(r => {
            res.json(r.rows);
        }).catch((error) => {
            console.error(error);
            res.json([]);
        });
    } catch (error) {
        console.log(error);
        res.json([]);
    }
})

function checkType(value) {
    return value !== undefined && value !== null && value !== '';
}

app.post('/apiv2/insert_portable_gnssdata', async (req, res) => {
    const dataArrayJson = req.body;
    console.log(dataArrayJson);

    try {
        // Generate a unique rowid using the current time in seconds
        const intTime = Date.now().toString();
        const insertRowIdQuery = `INSERT INTO gnssdata(rowid) VALUES('${intTime}')`;
        console.log(insertRowIdQuery);  // for debugging

        await db.query(insertRowIdQuery);

        // Set timestamp
        let dd = dataArrayJson['dd'];
        if (typeof dd !== 'string') {
            dd = String(dd); // Convert dd to string if it's not
        }

        const day = parseInt(dd.slice(0, 2), 10);
        const month = parseInt(dd.slice(2, 4), 10);
        const year = parseInt(dd.slice(4), 10);
        const hour = parseInt(dataArrayJson['hh'], 10);
        const minute = parseInt(dataArrayJson['mm'], 10);
        const ts = new Date(Date.UTC(year, month - 1, day, hour, minute));
        const ts7 = new Date(ts.getTime() + 7 * 60 * 60 * 1000);

        const updateTimestampQuery = `
            UPDATE gnssdata 
            SET ts = '${ts.toISOString()}', 
                ts7 = '${ts7.toISOString()}'
            WHERE rowid = '${intTime}'`;
        await db.query(updateTimestampQuery);

        // Update other fields
        for (const [key, val] of Object.entries(dataArrayJson)) {
            if (checkType(val)) {
                const updateQuery = `UPDATE gnssdata SET ${key} = '${val}' WHERE rowid = '${intTime}'`;
                console.log(updateQuery);  // for debugging
                await db.query(updateQuery);
            }
        }

        let csvData = `${intTime},${ts.toISOString()},${ts7.toISOString()}`;
        for (const [key, val] of Object.entries(dataArrayJson)) {
            csvData += `,${val}`;
        }
        csvData += '\n';  // Add a new line at the end

        // Define the path for the CSV file
        const csvFilePath = path.join('Results3', 'gnssdata.csv');

        // Append the data to the CSV file
        fs.appendFile(csvFilePath, csvData, (err) => {
            if (err) {
                console.error('Error writing to CSV file', err);
                return res.status(500).send('Error processing data');
            }
            console.log('Data saved to CSV file');
        });

        res.status(200).send('Data processed and saved successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing data');
    }
});

const checkForAlert = (stat_code, vi) => {
    const sql = `SELECT * FROM user_tb`;
    db.query(sql).then(dat => {
        dat.rows.map(i => {
            const json = JSON.parse(i.sta_line_notify)
            if (json !== null) {
                let res = json.map(r => ({
                    ...r,
                    userid: i.userid,
                    usergid: i.gid,
                    rtk_ts: moment(vi.ts7).format("YYYY-MM-DD HH:mm:ss"),
                    rtk_v: vi.v,
                    rtk_a: vi.vln3hr
                })).filter(k => k.stat_code == stat_code && (vi.vln3hr >= Number(k.vi_attention) || vi.vln3hr >= Number(k.vi_warning) || vi.vln3hr >= Number(k.vi_alert)))

                if (res.length > 0 && res[0].alert == true) {
                    let data = res[0];
                    if (res[0].rtk_a >= res[0].vi_alert) {
                        data.alert_type = "alert";
                        const message = `แจ้งเตือนประเภท ${data.alert_type} สถานี ${stat_code} มีค่าการเคลื่อนตัวของมวลดิน (${(res[0].rtk_a).toFixed(4)} cm/hr) สูงกว่าที่กำหนดไว้ กรุณาตรวจสอบครับ`;
                        sendLineNotify(i.userid, message);
                        // console.log(message);
                    } else if (res[0].rtk_a >= res[0].vi_warning) {
                        data.alert_type = "warning";
                        const message = `แจ้งเตือนประเภท ${data.alert_type} สถานี ${stat_code} มีค่าการเคลื่อนตัวของมวลดิน (${(res[0].rtk_a).toFixed(4)} cm/hr) สูงกว่าที่กำหนดไว้ กรุณาตรวจสอบครับ`;
                        sendLineNotify(i.userid, message);
                        // console.log(message);
                    } else if (res[0].rtk_a >= res[0].vi_attention) {
                        data.alert_type = "attention";
                        const message = `แจ้งเตือนประเภท ${data.alert_type} สถานี ${stat_code} มีค่าการเคลื่อนตัวของมวลดิน (${(res[0].rtk_a).toFixed(4)} cm/hr) สูงกว่าที่กำหนดไว้ กรุณาตรวจสอบครับ`;
                        sendLineNotify(i.userid, message);
                        // console.log(message);
                    }
                    insertAlertHistory(data);
                }
            }
        })
    })
}

setInterval(async () => {
    const sql = `SELECT *, stat_code as st_code, lat as y_coor, lng as x_coor FROM stations_fillter`;
    db.query(sql).then(r => {
        r.rows.forEach(async (i) => {
            // console.log(i.stat_code);

            let stat_code = JSON.stringify([i.stat_code]);
            let start_date = moment(new Date()).subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');
            let end_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            let stat_status = JSON.stringify([0, 1, 2, 3]);

            // const { stat_code, start_date, end_date, stat_status } = req.body;

            let station = [i.stat_code] //JSON.parse(stat_code)
            let where_station = `stat_code='${station[0]}'`;
            if (stat_code.length > 1) {
                for (let i = 1; i < station.length; i++) {
                    where_station += ` OR stat_code='${station[i]}'`
                };
            }

            let status = JSON.parse(stat_status);

            let where_status = `status=${status[0]}`;
            if (status.length > 1) {
                for (let i = 1; i < status.length; i++) {
                    where_status += ` OR status=${status[i]}`
                };
            } else if (status.length == 0) {
                where_status = ` status IS NULL`
            }

            const sql = `SELECT  stat_code, de, dn, dh, ts, ts7, status FROM public.dataset  
                WHERE (${where_station}) AND (${where_status}) AND ts7 BETWEEN '${start_date}' AND '${end_date}' 
                ORDER BY ts ASC`;

            db.query(sql).then((rawArr) => {
                prepareData(rawArr.rows).then((preData) => {
                    calculateVln(preData).then((vlnData) => {
                        doMovingLeastSqure(vlnData).then((dat) => {
                            let lastDat = dat[dat.length - 1]
                            checkForAlert(i.stat_code, { vi: lastDat });
                        })
                    })
                }).catch((error) => {
                    console.error(error);
                });
            });
        });
    });
}, 800000)

app.get("/apiv2/version", (reg, res) => {
    res.status(200).json({ version: 0.2 });
})



module.exports = app;