const Pool = require('pg').Pool

const db_dk = new Pool({
    user: 'postgres',
    host: 'postgis',
    database: 'gnssv2',
    password: '1234',
    port: 5432,
});

const db_v1 = new Pool({
    user: 'postgres',
    host: '150.95.91.243',
    database: 'GNSS',
    password: 'RTKLANDMOS1234',
    port: 5432,
});

const db_v2 = new Pool({
    user: 'postgres',
    host: '10.249.161.170',
    database: 'gnssv2',
    password: '1234',
    port: 5432,
});

const iot = new Pool({
    user: 'mmuser',
    host: 'dbs-ag-tele.egat.local',
    database: 'Maemoh',
    password: 'MMUser',
    port: 1433,
});

exports.db = db_dk;
exports.iot = iot;