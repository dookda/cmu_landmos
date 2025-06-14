const fs = require('fs')
const https = require('https')
//const http = require('http')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors');

const serveIndex = require('serve-index');

app.use(express.json({ limit: '100mb' }));

const webhook = require("./service/webhook");
app.use(webhook);

app.use(cors());
app.options('*', cors());

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const api = require('./service/api');
app.use(api);

const api2 = require('./service/api_v2');
app.use(api2);

app.use('/', express.static('www'))

// app.use('/nmea', express.static('nmea'), serveIndex('nmea', { 'icons': true }))

// var https_options = {
//     ca: fs.readFileSync('C:/webmap/RTKGNSS/keys/www.rtk-landmos.com(ICA).txt'),
//     key: fs.readFileSync("C:/webmap/RTKGNSS/keys/private.key"),
//     cert: fs.readFileSync("C:/webmap/RTKGNSS/keys/www.rtk-landmos.com(PEM).txt")
// };

// var server = https.createServer(https_options, app);
// var port = process.env.PORT || 3000;
// server.listen(port, function () {
//     console.log('listening on port ' + server.address().port);
// });

const port = 3000;
app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})
