
var usrname;
var rtktoken;
var gid;

// map area
var map = L.map('map').setView(
    [18.34640, 99.69807], 12);
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

var rainMarker = L.ExtraMarkers.icon({
    icon: 'fa fa-tint',
    markerColor: 'green',
    shape: 'circle',
    prefix: 'fa'
});

var rtkMarker = L.ExtraMarkers.icon({
    icon: 'fa fa-podcast',
    markerColor: 'blue',
    shape: 'circle',
    prefix: 'fa'
});

var gwaterMarker = L.ExtraMarkers.icon({
    icon: 'fa fa-exchange',
    markerColor: 'cyan',
    shape: 'circle',
    prefix: 'fa'
});

var rainMarkerSel = L.ExtraMarkers.icon({
    icon: 'fa fa-tint',
    markerColor: 'orange',
    shape: 'circle',
    prefix: 'fa'
});

var gwaterMarkerSel = L.ExtraMarkers.icon({
    icon: 'fa fa-exchange',
    markerColor: 'orange',
    shape: 'circle',
    prefix: 'fa'
});

var rtkMarkerSel = L.ExtraMarkers.icon({
    icon: 'fa fa-podcast',
    markerColor: 'orange',
    shape: 'circle',
    prefix: 'fa'
});

let removeLayer = (name) => {
    map.eachLayer(i => {
        if (i.options.name == name) {
            map.removeLayer(i)
        }
    })
}

const showSwal = (text) => {
    Swal.fire(text)
}

var rtk = [];
var rain = [];
var upliftForce = [];
let showLandmosStation = () => {
    axios.get("/apiv2/basestation_fillter").then((r) => {
        if (r.data.data !== "error") {
            rtk = r.data.map(i => i.lat != null ? i : { ...i, lat: 0, lng: 0, station_id: i.stat_code });
            rtk.forEach(i => {
                L.marker([Number(i.lat), Number(i.lng)], {
                    icon: rtkMarker,
                    name: "rtk"
                }).addTo(map).bindPopup(`<b>RTK-LANDMOS ${i.stat_code}</b>`);
            });
        }
    })
}

let showupliftForceStation = () => {
    axios.post('/apiv2/get_water_station', { stat_type: "upliftForce" }).then((r) => {
        // console.log(r.data);
        if (r.data.data !== "error") {
            upliftForce = r.data.data.geo_piezometer_master_2.map(i => ({ ...i, lat: i.latitude, lng: i.longitude, station_id: i.piezo_id }));
            upliftForce.forEach(i => {
                L.marker([Number(i.lat), Number(i.lng)], {
                    icon: gwaterMarker,
                    name: "upliftForce"
                }).addTo(map).bindPopup(`<b>piezo id ${i.piezo_id}</b>`);
            })
        } else {
            showSwal("ไม่พบข้อมูลแรงดันน้ำไต้ดิน");
        }
    })
}

let showRainStation = () => {
    axios.post('/apiv2/get_water_station', { stat_type: "rain" }).then((r) => {
        // console.log(r.data);
        if (r.data.data !== "error") {
            rain = r.data.data.wtele_rain_station.map(i => ({ ...i, lat: i.latitude, lng: i.longitude, station_id: i.station_id }));
            rain.forEach(i => {
                L.marker([Number(i.lat), Number(i.lng)], {
                    icon: rainMarker,
                    name: "rain"
                }).addTo(map).bindPopup(`<b>สถานี ${i.name_th}</b> <br>code ${i.code}`);
            })
        } else {
            showSwal("ไม่พบข้อมูลน้ำฝน");
        }
    })
}

let showMarkerByMap = (mks, bnd, type, icon, iconSel) => {
    removeLayer(type);
    return new Promise((resolve, reject) => {
        var polygon = turf.polygon([bnd.geometry.coordinates[0]]);
        let data = mks.map(i => ({ ...i, within: (turf.pointsWithinPolygon(turf.point([Number(i.lng), Number(i.lat)]), polygon)).features.length > 0 ? true : false }));
        let filter = data.filter(i => i.within).map(i => i.stat_code ? i.stat_code : i.station_id);
        data.forEach(i => {
            if (i.within) {
                L.marker([Number(i.lat), Number(i.lng)], {
                    icon: iconSel,
                    name: type
                }).addTo(map).bindPopup(`<b>station ${i.stat_code}</b>`)
            } else {
                L.marker([Number(i.lat), Number(i.lng)], {
                    icon: icon,
                    name: type
                }).addTo(map).bindPopup(`<b>station ${i.stat_code}</b>`)
            }
        });
        resolve(filter);
    })
}

let clearMarker = () => {
    removeLayer("rtk");
    removeLayer("rain");
    removeLayer("upliftForce");

    rtk.forEach(i => {
        L.marker([Number(i.lat), Number(i.lng)], {
            icon: rtkMarker,
            name: "rtk"
        }).addTo(map).bindPopup(`<b>RTK-LANDMOS ${i.stat_code}</b>`);
    });

    rain.forEach(i => {
        L.marker([Number(i.lat), Number(i.lng)], {
            icon: rainMarker,
            name: "rain"
        }).addTo(map).bindPopup(`<b>สถานี ${i.name_th}</b> <br>code ${i.code}`);
    });

    upliftForce.forEach(i => {
        L.marker([Number(i.lat), Number(i.lng)], {
            icon: gwaterMarker,
            name: "upliftForce"
        }).addTo(map).bindPopup(`<b>piezo id ${i.piezo_id}</b>`);
    });


    let series0 = { name: [], yAxisIndex: 0, type: 'line', data: [], }
    let series1 = { name: [], yAxisIndex: 1, type: 'line', data: [], }

    showChart("chartRtkUpliftForce", [], series0, "การเคลื่อนตัว", "แรงดันน้ำไต้ดิน", "cm/hr", "kpa");
    showChart("chartRtkRain", [], series1, "การเคลื่อนตัว", "ปริมาณน้ำฝน", "cm/hr", "mm");

}

// draw polygon
map.pm.addControls({
    position: 'bottomleft',
    drawMarker: false,
    drawCircle: false,
    drawCircleMarker: false,
    drawPolyline: false,
    drawText: false,
    editMode: false,
    dragMode: false,
    cutPolygon: false,
    removalMode: false,
    rotateMode: false,
});

map.pm.setPathOptions({
    color: 'orange',
    // fillColor: 'green',
    dashArray: "10 10",
    fillOpacity: 0.0,
});

const mainLoad = async (bnd) => {
    const [rtkSta, upliftForceSta, rainSta] = await Promise.all([
        showMarkerByMap(rtk, bnd, "rtk", rtkMarker, rtkMarkerSel),
        showMarkerByMap(upliftForce, bnd, "upliftForce", gwaterMarker, gwaterMarkerSel),
        showMarkerByMap(rain, bnd, "rain", rainMarker, rainMarkerSel)
    ]);

    await Promise.all(
        [getData(rtkSta, "rtk"),
        getData(upliftForceSta, "upliftForce"),
        getData(rainSta, "rain")]
    ).then((r) => {
        let rtk = r.filter(i => i.data.type == "rtk")[0];
        let upliftForce = r.filter(i => i.data.type == "upliftForce")[0];
        let rain = r.filter(i => i.data.type == "rain")[0];

        let combineRtkUpliftForceLegend = [...rtk.data.legend, ...upliftForce.data.legend];
        let combineRtkUpliftForceSeries = [...rtk.data.series, ...upliftForce.data.series];
        let combineRtkRainLegend = [...rtk.data.legend, ...rain.data.legend];
        let combineRtkRainSeries = [...rtk.data.series, ...rain.data.series];

        showChart("chartRtkUpliftForce", combineRtkUpliftForceLegend, combineRtkUpliftForceSeries, "การเคลื่อนตัว", "แรงดันน้ำไต้ดิน", "cm/hr", "kpa");
        showChart("chartRtkRain", combineRtkRainLegend, combineRtkRainSeries, "การเคลื่อนตัว", "ปริมาฯน้ำฝน", "cm/hr", "mm");
    });
}

var bnd;
map.on("pm:create", async (e) => {
    bnd = e.layer.toGeoJSON();
    mainLoad(bnd);
    map.removeLayer(e.layer);
});

const showChart = (div, legend, series, yAxisName0, yAxisName1, yAxisUnit0, yAxisUnit1) => {
    var chartDom = document.getElementById(div);
    var myChart = echarts.init(chartDom);
    myChart.clear()
    var option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            }
        },
        toolbox: {
            feature: {
                dataView: { show: true, readOnly: false },
                magicType: { show: true, type: ['line', 'bar'] },
                restore: { show: true },
                saveAsImage: { show: true }
            }
        },
        legend: {
            data: legend,
            type: 'scroll', // Enables scrolling for legend
            orient: 'horizontal', // Makes the legend horizontal
            bottom: 10, // Places the legend at the bottom, but you can adjust this
            width: '90%', // Uses 90% of the container's width; adjust as needed
        },
        xAxis: [
            {
                type: 'time',
                axisPointer: {
                    type: 'shadow'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: yAxisName0,
                position: 'left',
                axisLabel: {
                    formatter: '{value} ' + yAxisUnit0
                }
            },
            {
                type: 'value',
                name: yAxisName1,
                position: 'right',
                axisLabel: {
                    formatter: '{value} ' + yAxisUnit1
                }
            }
        ],
        series: series,
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: [0],
                start: 0,
                end: 100
            }
        ]
    };

    option && myChart.setOption(option);
}

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

let formatData = (dataset, stationDataset, stationKey, timestemp, valueKey, yAxisIndex, unit) => {
    return new Promise((resolve, reject) => {
        try {
            let series = [];
            let legend = [];

            stationDataset.forEach((st, i) => {
                let result = dataset.filter(i => i[stationKey] == st)
                    .sort((a, b) => new Date(a[timestemp]).getTime() - new Date(b[timestemp]).getTime())
                    .map(i => [i[timestemp], (i[valueKey]).toFixed(2)]);

                series.push({
                    name: st,
                    yAxisIndex: yAxisIndex,
                    tooltip: { valueFormatter: value => value + " " + unit },
                    type: 'line',
                    smooth: true,
                    data: result,
                });

                legend.push(st);
            });

            resolve({ type: "rtk", series, legend });
        } catch (error) {
            reject(error);
        }
    });
}

const getData = (sta, type) => {
    return new Promise((resolve, reject) => {
        let data = {
            stat_code: JSON.stringify(sta),
            datestart: moment($('#datetimes').data('daterangepicker').startDate).format('YYYY-MM-DD HH:mm:ss'),
            dateend: moment($('#datetimes').data('daterangepicker').endDate).format('YYYY-MM-DD HH:mm:ss')
        };

        if (type == "rtk" && sta.length > 0) {
            axios.post('/apiv2/get_value_for_acceleration_chart', data).then(async (r) => {
                let data = await formatData(r.data.data, sta, "stat_code", "ts", "a", 0, "cm/hr");
                resolve({ data });
            });
        } else if (type == "upliftForce" && sta.length > 0) {
            axios.post('/apiv2/get_water_data', { ...data, stat_type: "upliftForce" }).then(async (r) => {
                resolve(r);
            });
        } else if (type == "rain" && sta.length > 0) {
            axios.post('/apiv2/get_water_data', { ...data, stat_type: "rain" }).then(async (r) => {
                resolve(r);
            });
        } else {
            resolve({ data: { type: type, series: [], legend: [] } });
        }
    });
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

    mainLoad(bnd);
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
    mainLoad(bnd);
    clearToggleBtn();
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

const showLogin = () => {
    Swal.fire(
        'ท่านยังไม่ได้เข้าสู่ระบบ',
        'กรุณา login',
        ''
    ).then((result) => {
        if (result.value) {
            gotoDashboard();
        }
    })
}

const checkLogin = () => {
    let page = "_water";
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

// $("#update").text(moment().format("DD-MM-YYYY HH:ss น."));
$(document).ready(function () {
    checkLogin();
    showLandmosStation();
    showupliftForceStation();
    showRainStation();
    // getData();
});

// show version
axios.get("/apiv2/version").then(r => {
    $("#version").html(r.data.version)
})