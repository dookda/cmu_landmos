

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

const summary_station = (xAxis, yAxis) => {
    const chartDom = document.getElementById('summary_station');
    const myChart = echarts.init(chartDom);
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
            type: 'category',
            data: xAxis
        },
        yAxis: {
            type: 'value',
            name: 'สถานี',
            axisLabel: {
                formatter: '{value} ครั้ง'
            }
        },
        series: [
            {
                data: yAxis,
                type: 'bar',
                showBackground: true,
                backgroundStyle: {
                    color: 'rgba(180, 180, 180, 0.2)'
                }
            }
        ]
    };

    option && myChart.setOption(option);
}

const summary_sta_light = (xAxis, yAxis0, yAxis1) => {
    const chartDom = document.getElementById('summary_sta_light');
    const myChart = echarts.init(chartDom);

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
            type: 'category',
            data: xAxis
        },
        yAxis: {
            type: 'value',
            name: 'จำนวน (ครั้ง)',
            axisLabel: {
                formatter: '{value} ครั้ง'
            }
        },
        series: [
            {
                name: 'status 0',
                type: 'bar',
                data: yAxis0
            },
            {
                name: 'status 1',
                type: 'bar',
                data: yAxis1
            },
        ]
    };

    option && myChart.setOption(option);
}

const summary_alert = (xAxis, yAxis) => {
    const chartDom = document.getElementById('summary_alert');
    const myChart = echarts.init(chartDom);
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
            type: 'category',
            data: xAxis
        },
        yAxis: {
            type: 'value',
            name: 'จำนวนแจ้งเตือน (ครั้ง)',
            axisLabel: {
                formatter: '{value} ครั้ง'
            }
        },
        series: [
            {
                data: yAxis,
                type: 'bar',
                showBackground: true,
                backgroundStyle: {
                    color: 'rgba(180, 180, 180, 0.2)'
                }
            }
        ]
    };

    option && myChart.setOption(option);
}

const getData = () => {
    let data = {
        start_date: moment($('#datetimes').data('daterangepicker').startDate).format('YYYY-MM-DD HH:mm:ss'),
        end_date: moment($('#datetimes').data('daterangepicker').endDate).format('YYYY-MM-DD HH:mm:ss')
    };

    axios.post('/apiv2/get_summary_station', data).then(r => {
        const xAxis = r.data.filter(i => i.stat_code != null).map(i => i.stat_code);
        const yAxis = r.data.filter(i => i.stat_code != null).map(i => i.count_dat);
        summary_station(xAxis, yAxis);
    })

    axios.post('/apiv2/get_summary_sta_light', data).then(r => {
        const xAxis = r.data.filter(i => i.stat_code != null).map(i => i.stat_code);
        const yAxis0 = r.data.filter(i => i.stat_code != null).map(i => i.case0);
        const yAxis1 = r.data.filter(i => i.stat_code != null).map(i => i.case1);
        summary_sta_light(xAxis, yAxis0, yAxis1);
    })

    axios.post('/apiv2/get_summary_alert', data).then(r => {
        const xAxis = r.data.filter(i => i.stat_code != null).map(i => i.stat_code);
        const yAxis = r.data.filter(i => i.stat_code != null).map(i => i.alert_count);
        summary_alert(xAxis, yAxis);
    })
}

let getStation = () => {
    axios.get('/apiv2/basestation_fillter').then(r => {
        r.data.forEach(i => {
            document.getElementById("select_station").innerHTML += `<option value="${i.stat_code}">${i.stat_code}</option>`
        })
    })
}

const getCsv = async () => {
    try {
        const response = await axios.get("./../_output/output.csv", {
            responseType: 'blob' // Important
        });

        const blob = new Blob([response.data], { type: response.data.type });

        const link = document.createElement('a');

        link.href = window.URL.createObjectURL(blob);

        link.download = "output.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error('Failed to download:', error);
    }
}

const downloadcsv = async () => {
    let stat_code = document.getElementById("select_station").value;
    let start_date = moment($('#datetimes').data('daterangepicker').startDate).format('YYYY-MM-DD HH:mm:ss');
    let end_date = moment($('#datetimes').data('daterangepicker').endDate).format('YYYY-MM-DD HH:mm:ss');

    axios.post('/apiv2/post_data_csv', { stat_code, start_date, end_date })
        .then(async r => {
            getCsv();
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

    getData();
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
    // getData();
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
    getData();
    getStation();
    // summary_station();
    // summary_sta_light();
    // summary_alert();
});

// show version
axios.get("/apiv2/version").then(r => {
    $("#version").html(r.data.version)
})