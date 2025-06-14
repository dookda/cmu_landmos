
var usrname;
var rtktoken;
var gid;

// map area
var map = L.map('map').setView(
    [18.359549715002537, 99.69806926182481], 12);
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
})

const grod = L.tileLayer('https://{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    lyr: 'basemap'
});
const ghyb = L.tileLayer('https://{s}.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    lyr: 'basemap'
});

// const station = L.layerGroup();

var baseMaps = {
    "แผนที่ OSM": osm,
    "แผนที่ถนน": grod.addTo(map),
    "แผนที่ภาพถ่าย": ghyb
    // "Mapbox Streets": streets
};

var overlayMaps = {
    // "Cities": station.addTo(map)
};

var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

// get station
var redMarker = L.ExtraMarkers.icon({
    icon: 'fa fa-podcast',
    markerColor: 'red',
    shape: 'circle',
    prefix: 'fa'
});

var yellowMarker = L.ExtraMarkers.icon({
    icon: 'fa fa-podcast',
    markerColor: 'yellow',
    shape: 'circle',
    prefix: 'fa'
});

var greenMarker = L.ExtraMarkers.icon({
    icon: 'fa fa-podcast',
    markerColor: 'green',
    shape: 'circle',
    prefix: 'fa'
});

let removeLayer = () => {
    map.eachLayer(i => {
        if (i.options.name == "mk") {
            map.removeLayer(i)
        }
    })
}


let loadMarker = (stations) => {
    axios.get('/apiv2/basestation_fillter').then((r) => {
        let markers = r.data.map(i => i.lat != null ? i : { ...i, lat: 0, lng: 0, x_coor: 0, y_coor: 0, sta_light: "0" });
        // console.log(markers);
        markers.forEach(i => {
            L.marker([Number(i.lat), Number(i.lng)], {
                icon: i.sta_light == "1" ? greenMarker : redMarker,
                name: "mk"
            }).addTo(map).bindPopup(`<b>RTK-LANDMOS ${i.stat_code}</b>`);
        });
    })
}

let createDiv = (stat_code) => {
    return new Promise((resolve, reject) => {
        document.getElementById("solarcell_div").innerHTML +=
            ` <div class="card mt-0" >
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            RTK-LANDMOS ${stat_code}
                        </div>
                        <div id="sta_light_solar${stat_code}"></div>
                    </div>
                    <div class="row row-chart">
                        <div class="col-sm-6 row-chart border">
                            <div class="chart-eq" id="solar_volt${stat_code}"></div>
                        </div>
                        <div class="col-sm-6 row-chart border">
                            <div class="chart-eq" id="solar_amp${stat_code}"></div>
                        </div>
                    </div>
                </div>
            </div>`

        document.getElementById("battery_div")
            .innerHTML += ` <div class="card mt-0" >
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            RTK-LANDMOS ${stat_code}
                        </div>
                        <div id="sta_light_batt${stat_code}"></div>
                    </div>
                    <div class="row row-chart">
                        <div class="col-sm-6 row-chart border">
                            <div class="chart-eq" id="batt_volt${stat_code}"></div>
                        </div>
                        <div class="col-sm-6 row-chart border">
                            <div class="chart-eq" id="batt_amp${stat_code}"></div>
                        </div>
                    </div>
                </div>
            </div>`

        document.getElementById("temp_div")
            .innerHTML += ` <div class="card mt-0" >
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            RTK-LANDMOS ${stat_code}
                        </div>
                        <div id="sta_light_temp${stat_code}"></div>
                    </div>
                    <div class="row row-chart">
                        <div class="col-sm-12 row-chart border">
                            <div class="chart-eq" id="sta_temp${stat_code}"></div>
                        </div>
                    </div>
                </div>
            </div>`

        document.getElementById("humid_div")
            .innerHTML += ` <div class="card mt-0" >
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            RTK-LANDMOS ${stat_code}
                        </div>
                        <div id="sta_light_hum${stat_code}"></div>
                    </div>
                    <div class="row row-chart">
                        <div class="col-sm-12 row-chart border">
                            <div class="chart-eq" id="sta_hum${stat_code}"></div>
                        </div>
                    </div>
                </div>
            </div>`
    })
}

let showChart = (dtype, dtype_th, unit, stat_code, xData, yData, yData_st) => {
    const chart = echarts.init(document.getElementById(dtype + stat_code));
    const containerWidth = document.getElementById(dtype + stat_code).clientWidth;
    const standard = "มาตรฐาน";
    let fontSize;

    if (containerWidth <= 400) {
        fontSize = 8;
    } else if (containerWidth <= 800) {
        fontSize = 10;
    } else {
        fontSize = 12;
    }

    let option = {
        // title: {
        //     text: 'Rainfall vs Evaporation',
        //     left: 'center'
        // },
        legend: {
            data: [standard, dtype_th],
            left: 10
        },
        xAxis: {
            type: 'category',
            data: xData,
            axisLabel: {
                rotate: 75,
                // interval: interval,
                textStyle: {
                    fontSize: fontSize
                }
            }
        },
        yAxis: {
            name: unit,
            type: 'value'
        },
        grid: [
            { bottom: '40%' },
            { top: '0%' }
        ],
        series: [{
            name: dtype_th,
            data: yData,
            type: 'line',
            smooth: true
        }, {
            name: standard,
            data: yData_st,
            type: 'line',
            smooth: true,
            color: '#f20000'
        }],
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: [0],
                start: 0,
                end: 100
            }
        ]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => {
        chart.resize();
    });
}

const createChartDiv = () => {
    axios.post('/apiv2/select_station', { gid }).then(response => {
        if (response.status === 200) {
            let station = JSON.parse(response.data[0].stations);
            station.forEach(stat_code => {
                createDiv(stat_code);
            });
        }
    }).catch(error => {
        console.error("Error fetching station data:", error);
    });
}

let getData = (deviceType) => {
    axios.post('/apiv2/select_station', { gid }).then(response => {
        if (response.status === 200) {
            let station = JSON.parse(response.data[0].stations);
            let start_date = moment($('#datetimes').data('daterangepicker').startDate).format('YYYY-MM-DD HH:mm:ss');
            let end_date = moment($('#datetimes').data('daterangepicker').endDate).format('YYYY-MM-DD HH:mm:ss');

            station.forEach(stat_code => {
                axios.post('/apiv2/select_device', { stat_code, start_date, end_date }).then(response => {
                    if (response.status === 200) {
                        let deviceData = response.data;
                        // console.log(deviceData.length - 1);
                        let sta_light = deviceData.length - 1 >= 0 ? deviceData[deviceData.length - 1].sta_light == "1" ? "green" : "red" : "red";

                        const xData = deviceData.map(i => {
                            let date = new Date(i.ts7);
                            return `${date.toLocaleDateString()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                        });
                        if (deviceType == "solarcell") {
                            const yData_solar_volt = deviceData.map(i => Number(i.solar_volt));
                            const yData_solar_volt_st = deviceData.map(i => Number(12.7));
                            showChart("solar_volt", "แรงดันแผงโซล่าเซลล์", "หน่วย: V", stat_code, xData, yData_solar_volt, yData_solar_volt_st);
                            const yData_solar_amp = deviceData.map(i => Number(i.solar_amp));
                            const yData_solar_amp_st = deviceData.map(i => Number(0.74));
                            showChart("solar_amp", "กระแสแผงโซล่าเซลล์", "หน่วย: mA", stat_code, xData, yData_solar_amp, yData_solar_amp_st);
                            document.getElementById("sta_light_solar" + stat_code).innerHTML = `<i class="fa fa-circle" style="color: ${sta_light};"></i>`;

                        } else if (deviceType == "battery") {
                            const yData_batt_volt = deviceData.map(i => Number(i.batt_volt));
                            const yData_batt_volt_st = deviceData.map(i => Number(5));
                            showChart("batt_volt", "แรงดันแบตเตอรี่", "หน่วย: V", stat_code, xData, yData_batt_volt, yData_batt_volt_st);
                            const yData_batt_amp = deviceData.map(i => Number(i.batt_amp));
                            const yData_batt_amp_st = deviceData.map(i => Number(300));
                            showChart("batt_amp", "กระแสแบตเตอรี่", "หน่วย: mA", stat_code, xData, yData_batt_amp, yData_batt_amp_st);
                            document.getElementById("sta_light_batt" + stat_code).innerHTML = `<i class="fa fa-circle" style="color: ${sta_light};"></i>`;
                        } else if (deviceType == "temp") {
                            const yData_sta_temp = deviceData.map(i => Number(i.sta_temp));
                            const yData_sta_temp_st = deviceData.map(i => Number(50));
                            showChart("sta_temp", "อุณหภูมิ", "หน่วย: °C", stat_code, xData, yData_sta_temp, yData_sta_temp_st);
                            document.getElementById("sta_light_temp" + stat_code).innerHTML = `<i class="fa fa-circle" style="color: ${sta_light};"></i>`;
                        } else if (deviceType == "humid") {
                            const yData_sta_hum = deviceData.map(i => Number(i.sta_hum));
                            const yData_sta_hum_st = deviceData.map(i => Number(50));
                            showChart("sta_hum", "ความชื้น", "หน่วย: %", stat_code, xData, yData_sta_hum, yData_sta_hum_st);
                            document.getElementById("sta_light_hum" + stat_code).innerHTML = `<i class="fa fa-circle" style="color: ${sta_light};"></i>`;
                        }
                    }
                }).catch(error => {
                    console.error("Error fetching device data:", error);
                });
            });
        }
    }).catch(error => {
        console.error("Error fetching station data:", error);
    });
}

// console.log(deviceData);
const toggleBtn = (buttonNumber) => {
    const btn = document.getElementById(`btn${buttonNumber}`);
    let btns = document.getElementsByClassName('btn');
    for (let i = 0; i < btns.length; i++) {
        if (btns[i].classList[1] === 'btn-info') {
            btns[i].classList.replace('btn-info', 'btn-outline-info');
        }
    }
    btn.classList.replace('btn-outline-info', 'btn-info');
}

const clearToggleBtn = () => {
    let btns = document.getElementsByClassName('btn');
    for (let i = 0; i < btns.length; i++) {
        if (btns[i].classList[1] === 'btn-info') {
            btns[i].classList.replace('btn-info', 'btn-outline-info');
        }
    }
}

let selectDate = (val) => {
    let dd;
    if (val < 1) {
        dd = moment().subtract(val * 1000, 'minutes')
    } else {
        dd = moment().subtract(val, 'days')
    }

    $('#datetimes').data('daterangepicker').setStartDate(dd);
    $('#datetimes').data('daterangepicker').setEndDate(moment());

    const activeValue = $('.nav-link.active').val();
    getData(activeValue);
    // console.log(activeValue);
}

$('#datetimes').daterangepicker({
    autoApply: true,
    timePicker: true,
    startDate: moment().subtract(7, 'days').startOf('hour'),
    endDate: moment().startOf('hour'),
    locale: {
        format: 'M/DD hh:mm'
    }
});

$('#datetimes').on('apply.daterangepicker', function (ev, picker) {
    getData();
    clearToggleBtn();
});



$("#nav-solarcell-tab").on("click", () => {
    getData("solarcell")
    $("#solarcell").show();
    $("#battery").hide();
    $("#temp").hide();
    $("#humid").hide();
});

$("#nav-battery-tab").on("click", () => {
    getData("battery")
    $("#solarcell").hide();
    $("#battery").show();
    $("#temp").hide();
    $("#humid").hide();
});

$("#nav-temp-tab").on("click", () => {
    getData("temp")
    $("#solarcell").hide();
    $("#battery").hide();
    $("#temp").show();
    $("#humid").hide();
});

$("#nav-humid-tab").on("click", () => {
    getData("humid")
    $("#solarcell").hide();
    $("#battery").hide();
    $("#temp").hide();
    $("#humid").show();
});

// login
let getCookie = (cname) => {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

const displayLogin = () => {
    gid = getCookie("rtkgid");
    usrname = getCookie("rtkname");
    document.getElementById("profile").innerHTML = `<a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown" id="profileDropdown">
                        <span><i class="bi bi-person-circle"></i>${usrname}</span>
                    </a>
                    <div class="dropdown-menu dropdown-menu-right navbar-dropdown" aria-labelledby="profileDropdown">
                        <a class="dropdown-item" href="./../_profile/index.html">
                            <i class="ti-settings text-primary"></i>Settings
                        </a>
                        <a class="dropdown-item" onclick="logout()">
                            <i class="ti-power-off text-primary"></i>Logout
                        </a>
                    </div>`
    // showList(r);;
}

const displayLogout = () => {
    document.getElementById("profile").innerHTML = `<a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown" id="profileDropdown" onclick="login()">
                                                        <span><i class="bi bi-person-circle"></i>เข้าสู่ระบบ</span>
                                                    </a>`;
}

let gotoDashboard = () => {
    location.href = "./../_dashboard/index.html";
}

const showLogin = (txt1, text2) => {
    Swal.fire(
        txt1,
        text2,
        ''
    ).then((result) => {
        if (result.value) {
            gotoDashboard();
        }
    })
}

const checkLogin = () => {
    let page = "_devices";
    let gid = getCookie("rtkgid");
    usrname = getCookie("rtkname");
    rtktoken = getCookie("rtktoken");
    if (usrname !== "" && rtktoken !== "") {
        const headers = {
            'Authorization': `Bearer ${rtktoken}`,
            'Content-Type': 'application/json'
        }

        axios.post('/apiv2/checktoken', { username: usrname, page, gid }, { headers })
            .then(r => {
                if (r.status === 200 && r.data.auth) {
                    displayLogin();
                    createChartDiv();
                    getData("solarcell");
                    $("#solarcell").show();
                    $("#battery").hide();
                    $("#temp").hide();
                    $("#humid").hide();
                } else {
                    showLogin("ท่านไม่มีสิทธิ์เข้าถึงหน้านี้", "หากต้องการเข้าถึงข้อมูล โปรดติดต่อ admin");
                }
            })
    } else {
        showLogin("ท่านยังไม่ได้เข้าสู่ระบบ", "กรุณา login");
    }
}

const logout = () => {
    gid = defaultGid;
    document.cookie = "rtkname=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "rtktoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "rtkgid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    checkLogin();
};

const login = async () => {
    await Swal.fire({
        title: 'เข้าสู่ระบบ ',
        html: `<form>
                username: <input id="eno" type="text" class="swal2-input" autocomplete="username">
                password: <input id="pwd" type="password" class="swal2-input" autocomplete="current-password">
            </form>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'เข้าสู่ระบบ',
        preConfirm: () => {
            axios.post('/apiv2/login', {
                eno: document.getElementById('eno').value,
                pwd: document.getElementById('pwd').value
            }).then(r => {
                if (r.data.status == "Verified") {
                    var expirationTime = new Date(r.data.exp * 1000);
                    var expires = expirationTime.toUTCString();

                    document.cookie = `rtkname=${r.data.eno}; expires=${expires}; path=/;`;
                    document.cookie = `rtktoken=${r.data.token}; expires=${expires}; path=/;`;
                    document.cookie = `rtkgid=${r.data.gid}; expires=${expires}; path=/;`;
                    // console.log(r.data);
                    setTimeout(() => {
                        checkLogin();
                    }, 1500);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'username หรือ password ไม่ถูกต้อง'
                    });
                }
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    });
}

$("#update").text(moment().format("DD-MM-YYYY HH:ss น."));


$(document).ready(function () {
    checkLogin();
    loadMarker();
});

// show version
axios.get("/apiv2/version").then(r => {
    $("#version").html(r.data.version)
})