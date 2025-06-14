const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const st_code = urlParams.get('st_code')

// map area
var map = L.map('map').setView([18.359549715002537, 99.69806926182481], 14);
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
    "แผนที่ถนน": grod,
    "แผนที่ภาพถ่าย": ghyb.addTo(map)
    // "Mapbox Streets": streets
};

var overlayMaps = {
    // "Cities": station.addTo(map)
};

var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

// get station
let removeLayer = () => {
    map.eachLayer(i => {
        if (i.options.name == "mk") {
            map.removeLayer(i)
        }
    })
}

var markers;
var redMarker = L.ExtraMarkers.icon({
    icon: 'fa-podcast',
    markerColor: 'red',
    shape: 'circle',
    prefix: 'fa'
});

var blueMarker = L.ExtraMarkers.icon({
    icon: 'fa-podcast',
    markerColor: 'blue',
    shape: 'circle',
    prefix: 'fa'
});

let showMarkerByList = (markers) => {
    removeLayer()
    markers.map(i => {
        // console.log(i);
        L.marker([i.y_coor, i.x_coor], { icon: redMarker, name: 'mk' }).bindPopup(`${i.stat_name}`).addTo(map);
        map.setView([i.y_coor, i.x_coor], 13)
    });
}

let loadMarker = (stat_code) => {
    console.log(stat_code);
    axios.post('/apiv2/basestation_by_id', { stat_code }).then((r) => {
        showMarkerByList(r.data)
    })
}

// regression calculation
var inv3hr3n;
var inv3hr7n;
var inv6hr3n;
var inv6hr7n;
var inv12hr3n;
var inv12hr7n;
let seriesName = [
    { name: 'inv 3hr 3n', color: "#FF0000" },
    { name: 'inv 3hr 7n', color: "#FF9999" },
    { name: 'inv 6hr 3n', color: "#00FF00" },
    { name: 'inv 6hr 7n', color: "#99FF99" },
    { name: 'predict line', color: "#AF7AC5" },
    { name: 'inv 3hr 3n predict', color: "#FF0000" },
    { name: 'inv 3hr 7n predict', color: "#FF9999" },
    { name: 'inv 6hr 3n predict', color: "#00FF00" },
    { name: 'inv 6hr 7n predict', color: "#99FF99" },
    { name: 'vln3hr ', color: "#FF0000" },
    { name: 'vln6hr', color: "#00FF00" },
    { name: 'vln12hr', color: "#0000FF" },
    { name: 'vln24hr', color: "#3A3A3C" },
    { name: 'inv 12hr 3n', color: "#F6635C" },
    { name: 'inv 12hr 7n', color: "#FFBA86" },
    { name: 'inv 12hr 3n predict', color: "#F6635C" },
    { name: 'inv 12hr 7n predict', color: "#FFBA86" },
]

let regressionFn = async (invSet) => {
    const { m, b } = await ss.linearRegression(invSet)
    var regressionLine = await ss.linearRegressionLine(ss.linearRegression(invSet));
    var r2 = await ss.rSquared(invSet, regressionLine);
    var x = invSet[0][0]
    var y = invSet[0][1]
    var predictSet = [];
    var espectTime = "";
    let i = 0;
    const limit = 300;
    while (y >= 0 && i <= limit) { // 125 hr
        y = (m * x) + b;
        predictSet.push([x, y]);
        x += 1500000; // 25 min
        espectTime = moment(x).format('DD-MMM-YYYY HH:mm:ss');
        i++;
    }

    if (i > limit) { espectTime = "ไม่สามารถทำนายได้" }

    return { predictSet, espectTime, m, b, r2 }
}

let predictFailureTwin = async () => {
    const xAxis = chart.getModel().getComponent('xAxis');
    const dtStart = xAxis.axis.scale.getExtent()[0];
    const dtEnd = xAxis.axis.scale.getExtent()[1];

    var invSet3n;
    var invSet7n;
    let legendSet3n;
    let legendSet7n;
    let invtype = $('#invtype').val();

    if (invtype == 'inv 3hr' || invtype == 'inv 3hr') {
        legendSet3n = seriesName.filter((i) => i.name == "inv 3hr 3n" || i.name == "inv 3hr 3n predict");
        invSet3n = inv3hr3n.filter((i) => i[0] >= dtStart && i[0] <= dtEnd).map((i) => [i[0], Number(i[1])]);
        legendSet7n = seriesName.filter((i) => i.name == "inv 3hr 7n" || i.name == "inv 3hr 7n predict");
        invSet7n = inv3hr7n.filter((i) => i[0] >= dtStart && i[0] <= dtEnd).map((i) => [i[0], Number(i[1])]);
    } else if (invtype == 'inv 6hr' || invtype == 'inv 6hr') {
        legendSet3n = seriesName.filter((i) => i.name == "inv 6hr 3n" || i.name == "inv 6hr 3n predict");
        invSet3n = inv6hr3n.filter((i) => i[0] >= dtStart && i[0] <= dtEnd).map((i) => [i[0], Number(i[1])]);
        legendSet7n = seriesName.filter((i) => i.name == "inv 6hr 7n" || i.name == "inv 6hr 7n predict");
        invSet7n = inv6hr7n.filter((i) => i[0] >= dtStart && i[0] <= dtEnd).map((i) => [i[0], Number(i[1])]);
    } else if (invtype == 'inv 12hr' || invtype == 'inv 12hr') {
        legendSet3n = seriesName.filter((i) => i.name == "inv 12hr 3n" || i.name == "inv 12hr 3n predict");
        invSet3n = inv12hr3n.filter((i) => i[0] >= dtStart && i[0] <= dtEnd).map((i) => [i[0], Number(i[1])]);
        legendSet7n = seriesName.filter((i) => i.name == "inv 12hr 7n" || i.name == "inv 12hr 7n predict");
        invSet7n = inv12hr7n.filter((i) => i[0] >= dtStart && i[0] <= dtEnd).map((i) => [i[0], Number(i[1])]);
    }

    if (invSet3n.length > 3 && invSet7n.length > 3) {

        var _invSet3n = await regressionFn(invSet3n);
        var _invSet7n = await regressionFn(invSet7n);

        _invSet3n.invSet = invSet3n;
        _invSet3n.legend = legendSet3n;
        _invSet7n.invSet = invSet7n;
        _invSet7n.legend = legendSet7n;

        // $('#divpredict2').show();
        $('#dtfail2').html(`<div class="col-sm-6"> 
                                <div class="border p-2 rounded" style="color:${_invSet3n.legend[0].color};">${_invSet3n.legend[0].name} <br>
                                    Failure Time: <b>${_invSet3n.espectTime}</b><br>
                                    y = (${(_invSet3n.m).toFixed(4)} * x) + ${(_invSet3n.b).toFixed(4)} R<sup>2</sup> = ${(_invSet3n.r2).toFixed(2)}
                                </div>
                            </div>
                            <div class="col-sm-6">  
                                <div class="border p-2 rounded" style="color:${_invSet7n.legend[0].color};">${_invSet7n.legend[0].name} <br>
                                    Failure Time: <b>${_invSet7n.espectTime}</b><br>
                                    y = (${(_invSet7n.m).toFixed(4)} * x) + ${(_invSet7n.b).toFixed(4)} R<sup>2</sup> = ${(_invSet7n.r2).toFixed(2)}    
                                </div>
                            <div>`);

        regresstionChartTwin(_invSet3n, _invSet7n)
    } else {
        alert("Not enough data to predict, please select more data.")
    }
}

let regresstionChartTwin = (_invSet3n, _invSet7n) => {
    let predictchart = echarts.init(document.getElementById('predictchart2'));
    let series = [{
        name: _invSet3n.legend[0].name,
        data: _invSet3n.invSet,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: _invSet3n.legend[0].color
        },
        lineStyle: {
            width: 1.5
        }
    }, {
        name: _invSet3n.legend[1].name,
        data: _invSet3n.predictSet,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: _invSet3n.legend[1].color
        },
        lineStyle: {
            width: 1.5,
            type: 'dashed'
        }
    }, {
        name: _invSet7n.legend[0].name,
        data: _invSet7n.invSet,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: _invSet7n.legend[0].color
        },
        lineStyle: {
            width: 1.5
        }
    }, {
        name: _invSet7n.legend[1].name,
        data: _invSet7n.predictSet,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: _invSet7n.legend[1].color
        },
        lineStyle: {
            width: 1.5,
            type: 'dashed'
        }
    }]

    let option = {
        legend: {
            data: [_invSet3n.legend[0].name, _invSet3n.legend[1].name, _invSet7n.legend[0].name, _invSet7n.legend[1].name],
            left: 10,
            type: 'scroll',
            orient: 'horizontal',
            // bottom: 0,
            width: '75%',
        },
        dataZoom: [{
            type: 'inside',
            start: 0,
            end: 100
        }, {
            start: 0,
            end: 100,
        }],
        grid: {
            bottom: 80,
            left: 60,
            right: 30
        },
        toolbox: {
            feature: {
                saveAsImage: {
                    title: 'Save'
                },
                dataZoom: {
                    yAxisIndex: 'none'
                },
                dataView: {
                    readOnly: false
                },
                restore: {}
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                animation: false,
                label: {
                    backgroundColor: '#505765'
                }
            },
        },
        xAxis: {
            type: 'time',
            splitLine: {
                show: true
            },
            axisLabel: {
                formatter: (function (value) {
                    return (moment(value).format('DD/MM/YYYY HH:mm')).replace(' ', '\n');
                })
            },
        },
        yAxis: {
            name: 'Inverted Velocity \n(hr/cm)',
            type: 'value',
            splitLine: {
                show: true
            },
            axisLabel: {
                formatter: function (value, index) {
                    return value.toFixed(2)
                }
            }
        },
        series: series
    }
    option && predictchart.setOption(option);
}

// invert calculation
var vln3hr;
var vln6hr;
var vln12hr;
var vln24hr;
let formatVln = (arr, stat) => {
    vln3hr = arr.filter(i => i.vln3hr != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.vln3hr).toFixed(2)])
    vln6hr = arr.filter(i => i.vln6hr != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.vln6hr).toFixed(2)])
    vln12hr = arr.filter(i => i.vln12hr != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.vln12hr).toFixed(2)])
    vln24hr = arr.filter(i => i.vln24hr != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.vln24hr).toFixed(2)])
    let series = [{
        name: seriesName[9].name,
        data: vln3hr,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[9].color
        },
        lineStyle: {
            width: 1.5
        }
    }, {
        name: seriesName[10].name,
        data: vln6hr,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[10].color
        },
        lineStyle: {
            width: 1.5
        }
    }, {
        name: seriesName[11].name,
        data: vln12hr,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[11].color
        },
        lineStyle: {
            width: 1.5
        }
    }, {
        name: seriesName[12].name,
        data: vln24hr,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[12].color
        }, lineStyle: {
            width: 1.5
        }
    }]

    let yAxis = {
        name: 'Velocity \n(cm/hr)',
        type: 'value',
        boundaryGap: ['100%', '100%'],
        splitLine: { show: true }
    };
    showVelochart(series, yAxis)
}

// invert calculation
let invByInit = (arr, stat) => {
    inv3hr3n = arr.filter(i => i.inv3hr_3n != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.inv3hr_3n).toFixed(2)])
    inv3hr7n = arr.filter(i => i.inv3hr_3n != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.inv3hr_7n).toFixed(2)])
    inv6hr3n = arr.filter(i => i.inv6hr_3n != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.inv6hr_3n).toFixed(2)])
    inv6hr7n = arr.filter(i => i.inv6hr_7n != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.inv6hr_7n).toFixed(2)])
    inv12hr3n = arr.filter(i => i.inv12hr_3n != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.inv12hr_3n).toFixed(2)])
    inv12hr7n = arr.filter(i => i.inv12hr_7n != null).map((i) => [Number(moment(i.ts).add(7, 'h').format('x')), Number(i.inv12hr_7n).toFixed(2)])

    let series = [{
        name: seriesName[0].name,
        data: inv3hr3n,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[0].color
        },
        lineStyle: {
            width: 1.5
        }
    }, {
        name: seriesName[1].name,
        data: inv3hr7n,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[1].color
        },
        lineStyle: {
            width: 1.5
        }
    }, {
        name: seriesName[2].name,
        data: inv6hr3n,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[2].color
        },
        lineStyle: {
            width: 1.5
        }
    }, {
        name: seriesName[3].name,
        data: inv6hr7n,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[3].color
        }, lineStyle: {
            width: 1.5
        }
    }, {
        name: seriesName[13].name,
        data: inv6hr3n,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[13].color
        },
        lineStyle: {
            width: 1.5
        }
    }, {
        name: seriesName[14].name,
        data: inv6hr7n,
        type: 'line',
        smooth: true,
        symbol: '',
        symbolSize: 4,
        itemStyle: {
            color: seriesName[14].color
        }, lineStyle: {
            width: 1.5
        }
    }]

    let yAxis = $("input[name='chartlog']:checked").val() != "log" ? { name: 'Inverted Velocity \n(hr/cm)', type: 'value', splitLine: { show: true } } : { name: 'Inverted Velocity \n(cm/hr)', type: 'log', logBase: 10, min: 0.001, max: 1000, splitLine: { show: true } }
    showChart(series, yAxis)
}

let chart = echarts.init(document.getElementById("chart"));
let showChart = (series, yAxis) => {
    let option = {
        legend: {
            data: seriesName,
            left: 10,
            type: 'scroll',
            orient: 'horizontal',
            // bottom: 0,
            width: '75%',
        },
        dataZoom: [
            {
                show: true,
                realtime: true,
                start: 0,
                end: 100,
                xAxisIndex: [0, 1]
            }, {
                type: 'inside',
                realtime: true,
                start: 0,
                end: 100,
                xAxisIndex: [0, 1],
                zoomLock: true,
                zoom: true,
            }, {
                show: true,
                realtime: true,
                start: 0,
                end: 100,
                yAxisIndex: [0, 1]
            }, {
                type: 'inside',
                realtime: true,
                start: 0,
                end: 100,
                yAxisIndex: [0, 1],
                zoomLock: true,
                zoom: true,
            }
        ],
        grid: {
            bottom: 80,
            left: 50,
            right: 50
        },
        toolbox: {
            feature: {
                saveAsImage: {
                    title: 'Save'
                },
                dataZoom: {
                    yAxisIndex: 'none'
                },
                dataView: {
                    readOnly: false
                },
                restore: {}
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                animation: false,
                label: {
                    backgroundColor: '#505765'
                }
            },
        },
        xAxis: {
            type: 'time',
            triggerEvent: true,
            splitLine: {
                show: true
            },
            axisLabel: {
                formatter: (function (value) {
                    return (moment(value).format('DD/MM/YYYY HH:mm')).replace(' ', '\n');
                })
            },
        },
        yAxis: yAxis,
        series: series
    };
    option && chart.setOption(option);
}

let velochart = echarts.init(document.getElementById("velochart"));
let showVelochart = (series, yAxis) => {
    let option = {
        legend: {
            data: seriesName,
            left: 10,
            type: 'scroll',
            orient: 'horizontal',
            // bottom: 0,
            width: '75%',
        },
        dataZoom: [
            {
                show: true,
                realtime: true,
                start: 0,
                end: 100,
                xAxisIndex: [0, 1]
            }, {
                type: 'inside',
                realtime: true,
                start: 0,
                end: 100,
                xAxisIndex: [0, 1],
                zoomLock: true,
                zoom: false,
            }, {
                show: true,
                realtime: true,
                start: 0,
                end: 100,
                yAxisIndex: [0, 1]
            }, {
                type: 'inside',
                realtime: true,
                start: 0,
                end: 100,
                yAxisIndex: [0, 1],
                zoomLock: true,
                zoom: false,
            }
        ],
        grid: {
            bottom: 80,
            left: 50,
            right: 50
        },
        toolbox: {
            feature: {
                saveAsImage: {
                    title: 'Save'
                },
                dataZoom: {
                    yAxisIndex: 'none'
                },
                dataView: {
                    readOnly: false
                },
                restore: {}
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                animation: false,
                label: {
                    backgroundColor: '#505765'
                }
            },
        },
        xAxis: {
            type: 'time',
            triggerEvent: true,
            splitLine: {
                show: true
            },
            axisLabel: {
                formatter: (function (value) {
                    return (moment(value).format('DD/MM/YYYY HH:mm')).replace(' ', '\n');
                })
            },
        },
        yAxis: yAxis,
        series: series
    };
    option && velochart.setOption(option);
}


$("#invtype").on("change", () => {
    // const xAxis = chart.getModel().getComponent('xAxis');
    predictFailureTwin()
})

chart.on('dataZoom', function () {
    const xAxis = chart.getModel().getComponent('xAxis');
    $("#start").val(moment(xAxis.axis.scale.getExtent()[0]).format('DD/MM/YYYY HH:mm'));
    $("#end").val(moment(xAxis.axis.scale.getExtent()[1]).format('DD/MM/YYYY HH:mm'));
    predictFailureTwin()
});

let getData = (stat_code) => {
    let invtype = $("input[name='invtype']:checked").val();
    let start_date = moment($('#datetimes').data('daterangepicker').startDate).format('YYYY-MM-DD HH:mm:ss');
    let end_date = moment($('#datetimes').data('daterangepicker').endDate).format('YYYY-MM-DD HH:mm:ss');

    let stat_status = [];
    $('input[name="chkbox_status"]:checked').each(function (e) {
        stat_status.push(Number($(this).val()));
    });

    let data = { stat_code: stat_code, start_date, end_date, stat_status: JSON.stringify(stat_status) };

    axios.post("/apiv2/select_vindata_" + invtype, data).then(r => {
        formatVln(r.data, data.stat_code)
    })

    axios.post("/apiv2/select_ivndata_" + invtype, data).then(r => {
        // console.log(r.data);
        invByInit(r.data, data.stat_code)
        predictFailureTwin()
    })
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

// select date
let selectDate = (val) => {
    let dd;
    if (val < 1) {
        dd = moment().subtract(val * 1000, 'minutes')
    } else {
        dd = moment().subtract(val, 'days')
    }

    $('#datetimes').data('daterangepicker').setStartDate(dd);
    $('#datetimes').data('daterangepicker').setEndDate(moment());
    getData(st_code);
}

// date picker initial
$('#datetimes').daterangepicker({
    autoApply: true,
    timePicker: true,
    startDate: moment().subtract(7, 'days').startOf('hour'),
    endDate: moment().startOf('hour'),
    locale: {
        format: 'M/DD hh:mm'
    }
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

var usrname;
var rtktoken;
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

const checkLogin = () => {
    let page = "_inv";
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
                    displayLogout();
                }
            })
    } else {
        displayLogout();
        // console.log("not login");
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

$(document).ready(function () {
    checkLogin();
    $("#st_code").html(st_code);
    getData(st_code);
    loadMarker(st_code);

    $('#datetimes').on('apply.daterangepicker', function () {
        getData(st_code);
        clearToggleBtn();
    });

    $('input[type="radio"][name="invtype"]').change(function () {
        getData(st_code);
    });

    $('input[type="checkbox"][name="chkbox_status"]').change(function () {
        getData(st_code);
    });

    $('input[type=checkbox][name=chartlog]').change(function () {
        getData(st_code);
    });

    setTimeout(() => {
        var xAxis = chart.getModel().getComponent('xAxis');
        $("#start").val(moment(xAxis.axis.scale.getExtent()[0]).format('DD/MM/YYYY HH:mm'));
        $("#end").val(moment(xAxis.axis.scale.getExtent()[1]).format('DD/MM/YYYY HH:mm'));
    }, 2000);
});

axios.get("/apiv2/version").then(r => {
    $("#version").html(r.data.version)
})