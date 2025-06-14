import datetime
import time
import os
import subprocess
import requests


def insertDb(dat):
    # conn.autocommit = True
    # cursor = conn.cursor()
    ts = f"{dat[1][4:8]}-{dat[1][2:4]}-{dat[1][0:2]}"
    sql = """INSERT INTO dataset(stat_code, dd, hh, mm, ts, de, dn, dh, status)VALUES(
        '{station}','{dd}','{hh}','{mm}','{ddmmyy} {hh}:{mm}',{de},{dn},{dz},{status})""".format(
        station=dat[0],
        dd=dat[1],
        hh=dat[2],
        mm=dat[3],
        ddmmyy=ts,
        de=dat[4],
        dn=dat[5],
        dz=dat[6],
        status=dat[7].rstrip("\n"),
    )
    # cursor.execute(sql)
    ts7 = "update dataset set ts7 = ts + interval '7 hour' where ts7 IS NULL"
    # cursor.execute(ts7)
    print(sql)

    url = 'https://rtk-landmos.com:3000/api/update_db'
    myobj = {'sql': sql, 'ts7': ts7}
    x = requests.post(url, data=myobj)
    print(x.content)


def readFile():
    # files = open("output.asc", "r+")
    files = open(
        "/Users/sakdahomhuan/Dev/rtk-landmos/nodejs/pythonCMU/output.dat", "r+")
    for f in files:
        f.strip()
        arr = f.split(" ")
        arr = list(filter(None, arr))

        insertDb(arr)


readFile()
