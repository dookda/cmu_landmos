const { default: axios } = require('axios');
const express = require('express');

const app = express.Router();
const db = require("./db").db;


app.get("/api/test", (req, res) => {
    res.status(200).json({ data: "ok" })
})

app.post("/api/selectdata", (req, res) => {
    const { stat_code, start_date, end_date } = req.body;
    //const stat_code='10'
    //const start_date='2022-05-18'
    //const end_date='2022-05-19'
    const sql = `SELECT stat_code, CONCAT('station',stat_code) as sta_code_t, de, dn, dh, ts7,TO_CHAR(ts7, 'YYYY/MM/DD HH24:MI') as ts7t, status FROM dataset 
    WHERE (stat_code='${stat_code}' ) AND ts7 BETWEEN '${start_date}' AND '${end_date} 24:00:00' `;
    // console.log(sql);
    //ORDER BY ts7

    //console.log(sql);
    db.query(sql).then((r) => {
        res.status(200).json({
            data: r.rows
        });
    });
})

app.post("/api/selectmultidata2", (req, res) => {
    const { stat_code, start_date, end_date } = req.body;

    const sql = `WITH dt(stat_code, sta_code_t, de, dn, dh,ts7, ts7t) as 
                    (SELECT stat_code, CONCAT('station',stat_code) as sta_code_t,de, dn, dh, ts7,TO_CHAR(ts7, 'YYYY/MM/DD') as ts7t, status
                    FROM dataset 
                    WHERE (stat_code='06' OR stat_code='10') AND ts7 BETWEEN '2022-12-01' AND '2022-12-25 24:00:00' 
                    ORDER BY ts7 )
                SELECT 
                    ts7, ts7t,
                    max(CASE WHEN stat_code='10' THEN de ELSE null end) AS de_st10,
                    max(CASE WHEN stat_code='10' THEN dn ELSE null end) AS dn_st10,
                    max(CASE WHEN stat_code='10' THEN dh ELSE null end) AS dh_st10,
                    max(CASE WHEN stat_code='06' THEN de ELSE null end) AS de_st04,
                    max(CASE WHEN stat_code='06' THEN dn ELSE null end) AS dn_st04,
                    max(CASE WHEN stat_code='06' THEN dh ELSE null end) AS dh_st04
                FROM dt 
                GROUP BY ts7, ts7t
                ORDER BY ts7`;

    db.query(sql).then((r) => {
        res.status(200).json({
            data: r.rows
        });
    });
})

app.post("/api/getbystation", (req, res) => {
    const { stat_code } = req.body;
    //const stat_code='10'
    //const start_date='2022-05-18'
    //const end_date='2022-05-19'
    const sql = `SELECT stat_code, CONCAT('station',stat_code) as sta_code_t, de, dn, dh, ts7,TO_CHAR(ts7, 'DD-MM-YYYY HH24:MI') as ts7t, status FROM dataset 
    WHERE stat_code='${stat_code}'`;

    //ORDER BY ts7

    //console.log(sql);
    db.query(sql).then((r) => {
        res.status(200).json({
            data: r.rows
        });
    });
})

app.get("/api/basestation", (req, res) => {
    const sql = `SELECT * FROM base_sta`;
    db.query(sql).then((r) => {
        res.status(200).json({
            data: r.rows
        });
    });
})

app.post("/api/lastposition", (req, res) => {
    const { stat_code } = req.body;
    // console.log(stat_code);
    const sql = `SELECT * FROM dataset WHERE stat_code = '${stat_code}' 
            AND ts7 = (SELECT MAX(ts7) FROM dataset WHERE stat_code = '${stat_code}')`;
    db.query(sql).then((r) => {
        res.status(200).json({
            data: r.rows
        });
    });
})

app.post("/api/last20position", (req, res) => {
    const { stat_code } = req.body;
    // console.log(stat_code);
    const sql = `select a.* from (SELECT stat_code, de, dn, dh, status,
        TO_CHAR(ts7,'DDMM:HH24MI') as t, TO_CHAR(ts7, 'DD-MM-YYYY') as d
    FROM dataset WHERE stat_code='${stat_code}' ORDER BY ts7 DESC limit 30) a
    ORDER BY a.t ASC`;
    db.query(sql).then((r) => {
        res.status(200).json({
            data: r.rows
        });
    });
})

app.post("/api/reset", (req, res) => {
    const { stat_code, id } = req.body;
    // console.log(stat_code);
    const sql = `UPDATE dataset SET status=0 WHERE id=${id}`;
    db.query(sql).then((r) => {
        res.status(200).json({
            status: 'ok'
        });
    });
});

app.post("/api/status_turnoff", (req, res) => {
    const { stat_code } = req.body;
    console.log(stat_code);
    axios.get(`http://rtk${stat_code}${stat_code}.dyndns.org/rpidata/setRelay/?cha=5&onoff=0`).then(x => {
        console.log(x.data);
    })
});

app.post("/api/register", (req, res) => {
    const { userid, username, email } = req.body;
    const sql = `INSERT INTO user_tb(userid,username,email,dt)VALUES('${userid}','${username}','${email}',now())`;
    db.query(sql).then(() => {
        console.log(sql);
        res.status(200).json({
            status: "ลงทะเบียนสำเร็จ"
        });
    });
});


app.post("/api/getalluser", (req, res) => {
    const { userid } = req.body;
    const sql = `SELECT * FROM user_tb ORDER BY username ASC`;
    db.query(sql).then(r => {
        res.status(200).json({
            data: r.rows
        })
    })
})

app.post("/api/getuser", (req, res) => {
    const { userid } = req.body;
    const sql = `SELECT * FROM user_tb WHERE userid='${userid}'`;
    db.query(sql).then(r => {
        res.status(200).json({
            data: r.rows
        })
    })
})

app.post("/api/chkadmin", (req, res) => {
    const { userid } = req.body;
    const sql = `SELECT * FROM user_tb WHERE userid='${userid}'`;
    db.query(sql).then(r => {
        res.status(200).json({
            data: r.rows
        })
    })
})

app.post("/api/updateuser", (req, res) => {
    const { userid, data } = req.body;
    // console.log(userid, data);
    const sql = `SELECT * FROM user_tb WHERE userid='${userid}'`;
    let d;
    db.query(sql).then(r => {
        if (r.rows.length > 0) {
            for (d in data) {
                if (data[d] !== '') {
                    let sql = `UPDATE user_tb SET ${d}='${data[d]}', dt=now() WHERE userid='${userid}'`;
                    db.query(sql)
                }
            }
        } else {
            db.query(`INSERT INTO user_tb(userid, dt)VALUES('${userid}', now())`).then(() => {
                for (d in data) {
                    if (data[d] !== '') {
                        let sql = `UPDATE user_tb SET ${d}='${data[d]}', dt=now() WHERE userid='${userid}'`;
                        db.query(sql)
                    }
                }
            })
        }
        res.status(200).json({ data: "success" })
    })
})

app.post("/api/deleteuser", (req, res) => {
    const { userid } = req.body;
    const sql = `DELETE FROM user_tb WHERE userid='${userid}'`;
    db.query(sql).then(r => {
        res.status(200).json({
            data: r.rows
        })
    })
})

app.post("/api/update_db", (req, res) => {
    const { sql, ts7 } = req.body;
    console.log(sql, ts7);
    // db.query(sql).then(r => {
    //     db.query(ts7)
    //     res.status(200).json({
    //         data: "success"
    //     })
    // })
})

app.post("/api/updateauth", (req, res) => {
    const { userid, user_type } = req.body;
    const sql = `UPDATE user_tb SET user_type='${user_type}' WHERE userid='${userid}'`;
    db.query(sql).then(r => {
        res.status(200).json({
            data: r.rows
        })
    })
})

let selectLastdata = (station) => {
    // const sql = `SELECT stat_code, status FROM dataset d
    //             WHERE ts = (SELECT MAX(ts) FROM dataset e 
    //                         WHERE e.stat_code = '${station}')  
    //             AND d.stat_code = '${station}'`;
    const sql = `select * from dataset where stat_code = '${station}' order by ts desc limit 2`
    db.query(sql).then((r) => {
        // if (r.rows.length > 0) {
        //     if (r.rows[0].status != r.rows[1].status) {
        //         let station = r.rows[0].stat_code;
        //         let status_text = r.rows[0].status;
        //         let ngurl = 'https://rtk-landmos.com:3000'

        //         if (status_text == 1) {
        //             console.log("เปิด เหลือง")
        //             var status_txt = "Movement is low (10-20 cm)"
        //             var url = `http://rtk${station}.dyndns.org/rpidata/setRelay/?cha=3&onoff=1`
        //             axios.get(url).then(x => {
        //                 console.log(x.data);
        //             })
        //             axios.get(`${ngurl}/api/alert/${station}/${status_text}`)
        //         } else if (status_text == 2) {
        //             console.log("เปิด แดง")
        //             var status_txt = "Movement is medium (20-30 cm)"
        //             var url = `http://rtk${station}.dyndns.org/rpidata/setRelay/?cha=4&onoff=1`
        //             axios.get(url).then(x => {
        //                 console.log(x.data);
        //             })
        //             axios.get(`${ngurl}/api/alert/${station}/${status_text}`)
        //         } else if (status_text == 3) {
        //             console.log("เปิด เหลือง / แดง")
        //             var status_txt = "Movement is high (>30 cm)"
        //             var url1 = `http://rtk${station}.dyndns.org/rpidata/setRelay/?cha=5&onoff=1`
        //             //var url2 = `http://rtk${station}.dyndns.org/rpidata/setRelay/?cha=4&onoff=1`
        //             axios.get(url1).then(x => {
        //                 console.log(x.data);
        //             })
        //             // axios.get(url2).then(x => {
        //             // console.log(x.data);
        //             // })
        //             axios.get(`${ngurl}/api/alert/${station}/${status_text}`)
        //         } else {
        //             console.log(`RTKGNSS สถานีที่ ${station} สถานะการเคลื่อนตัวรหัส ${status_text}`);
        //         }
        //     }
        // }
    });
}

app.get('/api/status_reset/:station', (req, res) => {
    var station = req.params.station;
    console.log(station);

    axios.get(`http://rtk${station}.dyndns.org/rpidata/setRelay/?cha=5&onoff=0`).then(x => {
        console.log(x);
    })
    res.status(200).json({ data: `RTK${station} turn-off Successfull` })

})

app.get('/api/status_turnon/:station/:status', (req, res) => {
    var station = req.params.station;
    var status = req.params.status;
    console.log(station);
    if (status == 1) {
        axios.get(`http://rtk${station}${station}.dyndns.org/rpidata/setRelay/?cha=3&onoff=1`)
    } else if (status == 2) {
        axios.get(`http://rtk${station}${station}.dyndns.org/rpidata/setRelay/?cha=4&onoff=1`)
    } else if (status == 3) {
        axios.get(`http://rtk${station}${station}.dyndns.org/rpidata/setRelay/?cha=5&onoff=1`)
    }
    res.status(200).json({ data: `RTK${station}${station} turn-on Successfull` })
})


setInterval(() => {
    selectLastdata("01");
    selectLastdata("02");
    selectLastdata("03");
    selectLastdata("04");
    selectLastdata("05");
    selectLastdata("06");
    selectLastdata("07");
    selectLastdata("08");
    selectLastdata("09");
    selectLastdata("10");
}, 900000)




module.exports = app;