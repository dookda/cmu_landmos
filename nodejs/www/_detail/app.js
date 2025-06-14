// default user by gid
var defaultGid = 24;
var gid = defaultGid;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const st_code = urlParams.get('st_code')
// map area
var map = L.map('map').setView([18.359549715002537, 99.69806926182481], 12);
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
})

const grod = L.tileLayer('https://{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
    maxZoom: 26,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    lyr: 'basemap'
});
const ghyb = L.tileLayer('https://{s}.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}', {
    maxZoom: 26,
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
    let len = markers.length - 1;
    let path = markers.map(i => {
        return [i.lat, i.lng]
    })
    let polyline = L.polyline(path, {
        color: 'red',
        dashArray: '10, 10',
        dashOffset: '0'
    }).addTo(map);

    markers.map((i, k) => {
        let marker = L.marker([i.lat, i.lng], { name: 'mk' }).bindPopup(`station ${i.stat_code} <br>date ${i.init_date}`).addTo(map);
        k == len ? marker._icon.classList.add("huechange150") : marker._icon.classList.add("huechange300")
        map.setView([i.lat, i.lng], 13)
    });
}

let loadMarker = () => {
    axios.post('/apiv2/basestation_history', { stat_code: st_code }).then((r) => {
        // console.log(r.data);
        showMarkerByList(r.data)
    })
}

let getLastInitial = () => {
    axios.post('/apiv2/get_last_initial', { stat_code: st_code }).then((r) => {
        console.log(r.data);
        $("#initLat").html(Number(r.data[0].lat).toFixed(6));
        $("#initLng").html(Number(r.data[0].lng).toFixed(6));
        $("#initMineE").html(r.data[0].mine_e);
        $("#initMineN").html(r.data[0].mine_n);
        $("#initUtmE").html(r.data[0].utm_e);
        $("#initUtmN").html(r.data[0].utm_n);
        $("#initHeight").html(r.data[0].ortho_h);
        $("#initDate").html(`วันที่ ${moment(r.data[0].init_date).format("DD-MM-YYYY")} เวลา ${moment(r.data[0].init_date).format("HH:mm:ss")}`);
    })
}

let getLastGnssdata = () => {
    axios.post('/apiv2/get_last_gnssdata', { stat_code: st_code }).then((r) => {
        console.log(r.data);
        $("#lastLat").html(Number(r.data[0].lat).toFixed(6));
        $("#lastLng").html(Number(r.data[0].lng).toFixed(6));
        $("#lastMineE").html(r.data[0].mine_e);
        $("#lastMineN").html(r.data[0].mine_n);
        $("#lastUtmE").html(r.data[0].utm_e);
        $("#lastUtmN").html(r.data[0].utm_n);
        $("#lastPdop").html(r.data[0].pdop);
        $("#lastHeight").html(r.data[0].ortho_h);
        $("#lastDate").html(`วันที่ ${moment(r.data[0].init_date).format("DD-MM-YYYY")} เวลา ${moment(r.data[0].init_date).format("HH:mm:ss")}`);
    })
}

// chart area
const legend = {
    position: 'top',
    display: true,
    labels: {
        usePointStyle: true,
        boxWidth: 10,
        fontSize: 8
    }
}

const x = {
    type: 'time',
    ticks: {
        autoSkip: true,
        autoSkipPadding: 50,
        maxRotation: 0
    },
    time: {
        displayFormats: {
            // 'millisecond': 'h:mm a',
            // 'second': 'DD MMM h:mm a',
            'minute': 'DD MMM h:mm a',
            'hour': 'DD MMM h:mm a',
            'day': 'DD MMM YYYY',
            // 'week': 'DD MMM YYYY',
            // 'month': 'DD MMM YYYY',
            // 'quarter': 'DD MMM YYYY',
            // 'year': 'DD MMM YYYY',
        }
    },
}
const zoom = {
    pan: {
        enabled: true,
        mode: 'xy',
    },
    zoom: {
        wheel: {
            enabled: true,
        },
        pinch: {
            enabled: true
        },
        drag: {
            enabled: false
        },
        mode: 'xy',
    },
}

// chart SD
let showChartSD = (xData, yData_de, yData_dn, yData_dh, yData_pdop, yData_sat) => {
    const chartDom = document.getElementById('chart-sd');
    const chart = echarts.init(chartDom);
    const containerWidth = chartDom.clientWidth;
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
            data: ['sde', 'sdn', 'sdh', 'pdop', 'Satellite'],
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
            }, axisPointer: {
                type: 'shadow'
            }
        },
        yAxis: [
            {
                type: 'value',
                name: 'SD',
                // min: 0,
                // max: 250,
                // interval: 50,
                axisLabel: {
                    formatter: '{value} cm'
                }
            },
            {
                type: 'value',
                name: 'satellite',
                min: 0,
                // max: 30,
                // interval: 5,
                axisLabel: {
                    formatter: '{value} ดวง'
                }
            }
        ],
        grid: [
            { bottom: '20%' },
            { top: '0%' }
        ],
        series: [
            {
                name: 'sde',
                type: 'line',
                tooltip: {
                    valueFormatter: function (value) {
                        return value;
                    }
                },
                data: yData_de
            },
            {
                name: 'sdn',
                type: 'line',
                tooltip: {
                    valueFormatter: function (value) {
                        return value;
                    }
                },
                data: yData_dn
            }, {
                name: 'sdh',
                type: 'line',
                tooltip: {
                    valueFormatter: function (value) {
                        return value;
                    }
                },
                data: yData_dh
            }, {
                name: 'pdop',
                type: 'line',
                tooltip: {
                    valueFormatter: function (value) {
                        return value;
                    }
                },
                data: yData_pdop
            },
            {
                name: 'Satellite',
                type: 'bar',
                yAxisIndex: 1,
                tooltip: {
                    valueFormatter: function (value) {
                        return value + ' ดวง';
                    }
                },
                data: yData_sat,
                color: '#B7B5B5'
            }
        ],
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: [0],
                start: 0,
                end: 100
            }
        ]
    };

    // optionSD && chartSD.setOption(optionSD);
    chart.setOption(option);
    window.addEventListener('resize', () => {
        chart.resize();
    });
}

const ctx = document.getElementById('en').getContext('2d');
const chart = new Chart(ctx, {
    type: 'scatter',
    data: {},
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: legend,
            // title: {
            //     display: true,
            //     text: 'ค่าการเคลื่อนตัว (de และ dn) '
            // },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                    drag: {
                        enabled: false
                    },
                    mode: 'xy',
                },
            },
        },
        scales: {
            x: {
                // min: -300,
                // max: 3000,
                title: {
                    display: true,
                    text: 'de (cm)'
                },
                grid: {
                    display: true,
                    drawTicks: true,
                    drawBorder: true,
                    lineWidth: function (context) {
                        if (context.tick.value == 0) {
                            return 2;
                        } {
                            return 0.5;
                        }
                    },
                    color: function (context) {
                        if (context.tick.value == 0) {
                            return '#6e6b6b';
                        } {
                            return '#bfbfbf';
                        }
                    }
                }
            },
            y: {
                // min: -300,
                // max: 4500,
                title: {
                    display: true,
                    text: 'dn (cm)'
                },
                grid: {
                    display: true,
                    drawTicks: true,
                    drawBorder: true,
                    lineWidth: function (context) {
                        if (context.tick.value == 0) {
                            return 2;
                        } {
                            return 0.5;
                        }
                    },
                    color: function (context) {
                        if (context.tick.value == 0) {
                            return '#6e6b6b';
                        } {
                            return '#bfbfbf';
                        }
                    }
                }
            }
        }
    },
});

const resetZoom = () => {
    chart.resetZoom();
}

// chart h
const cth = document.getElementById('h').getContext('2d');
const chartH = new Chart(cth, {
    type: 'line',
    data: {},
    options: {
        animation: false,
        spanGaps: true,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: legend,
            // title: {
            //     display: true,
            //     text: 'ค่า H Difference (dh)'
            // },
            tooltip: true,
            zoom: zoom
        },
        scales: {
            x: x,
            y: {
                title: {
                    display: true,
                    text: 'dh (cm)'
                }
            }
        },
    },
});
const resetZoomH = () => {
    chartH.resetZoom();
}

// chart e
const cte = document.getElementById('e').getContext('2d');
// var timeFormat = 'YYYY/MM/DD HH:mm:ss';
const chartE = new Chart(cte, {
    type: 'line',
    data: {},
    options: {
        animation: false,
        spanGaps: true,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: legend,
            // title: {
            //     display: true,
            //     text: 'ค่า E Difference (de)'
            // },
            tooltip: true,
            zoom: zoom
        },
        scales: {
            x: x,
            y: {
                title: {
                    display: true,
                    text: 'de (cm)'
                }
            },
        }
    },
});

const resetZoomE = () => {
    chartE.resetZoom();
}

// chart n
const ctn = document.getElementById('n').getContext('2d');
// var timeFormat = 'YYYY/MM/DD HH:mm:ss';
const chartN = new Chart(ctn, {
    type: 'line',
    data: {},
    options: {
        animation: false,
        spanGaps: true,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: legend,
            // title: {
            //     display: true,
            //     text: 'ค่า N Difference (dn)'
            // },
            tooltip: true,
            zoom: zoom
        },
        scales: {
            x: x,
            y: {
                title: {
                    display: true,
                    text: 'dn (cm)'
                }
            },
        }
    },
});

const resetZoomN = () => {
    chartN.resetZoom();
}

// table area;
const updateTable = (id, index) => {

    const de = $('#de').val();
    const dn = $('#dn').val();
    const dh = $('#dh').val();
    const status = $('#status').val();
    // console.log(de, dn, dh);
    axios.post('/apiv2/updatedata', { id, de, dn, dh, status }).then((res) => {
        var row = table.row(index);
        var rowData = row.data();
        rowData.de = de;
        rowData.dn = dn;
        rowData.dh = dh;
        rowData.status = status;
        row.data(rowData).draw();
    }).catch((err) => {
        console.log(err);
    });
}

const format = (d, index) => {
    return (
        `<div class="form-group-mod">
            <label>de</label>
            <input type="text" class="form-control form-control-sm" id="de" value="${d.de}">
        </div>
        <div class="form-group-mod">
            <label>dn</label>
            <input type="text" class="form-control form-control-sm" id="dn" value="${d.dn}">
        </div>
        <div class="form-group-mod">
            <label>dh</label>
            <input type="text" class="form-control form-control-sm" id="dh" value="${d.dh}">
        </div>
        <div class="form-group-mod">
            <label>status</label>
            <input type="text" class="form-control form-control-sm" id="status" value="${d.status}">
        </div>
        <button type="button" class="btn btn-primary btn-mod" onclick="updateTable(${d.id}, ${index})">ตกลง</button>`
    );
}

var table;
let showData = (data) => {
    table = $('#table').DataTable({
        ajax: {
            type: 'POST',
            url: '/apiv2/selectdata',
            data: data,
            dataSrc: 'data',
            destroy: true
        },
        columns: [
            {
                className: 'dt-control',
                orderable: false,
                data: null,
                defaultContent: '',
            },
            { data: 'id', visible: false, },
            { data: 'stat_code' },
            { data: 'de' },
            { data: 'dn' },
            { data: 'dh' },
            { data: 'lat' },
            { data: 'lng' },
            { data: 'mine_e' },
            { data: 'mine_n' },
            { data: 'utm_e' },
            { data: 'utm_n' },
            { data: 'sde' },
            { data: 'sdn' },
            { data: 'sdh' },
            { data: 'pdop' },
            { data: 'no_satellite' },
            { data: 'status' },
            { data: 'ts7t' }
        ],
        "order": [[13, 'desc']],
        "paging": true,
        "ordering": true,
        "info": false,
        "filter": true,
        select: {
            style: 'os',
            selector: 'td:first-child'
        },
        // dom: 'Bfrtip',
        // buttons: [
        //     'excel', 'print'
        // ],
        // responsive: true,
        scrollX: true,
        // order: [[5, 'asc']],
    });

    $('#table').on('click', 'tbody td.dt-control', function () {
        var tr = $(this).closest('tr');
        var row = table.row(tr);
        if (row.child.isShown()) {
            row.child.hide();
        } else {
            row.child(format(row.data(), row.index())).show();
        }
    });

    // $('#table').on('requestChild.dt', function (e, row) {
    //     row.child(format(row.data())).show();
    // });

    table.on('search.dt', async () => {
        let dat = table.rows({ search: 'applied' }).data();
        // console.log(dat);
        const xData = dat.map(i => {
            let date = new Date(i.ts7);
            return `${date.toLocaleDateString()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        });
        const yData_de = dat.map(i => i.de);
        const yData_dn = dat.map(i => i.dn);
        const yData_dh = dat.map(i => i.dh);
        const yData_pdop = dat.map(i => i.pdop);
        const yData_sat = dat.map(i => i.no_satellite);
        showChartSD(xData, yData_de, yData_dn, yData_dh, yData_pdop, yData_sat);

        let en0 = []
        dat.filter(i => i.status == 0).map(i => en0.push({ x: i.de, y: i.dn, z: i.status }))
        let en1 = []
        dat.filter(i => i.status == 1).map(i => en1.push({ x: i.de, y: i.dn, z: i.status }))
        let en2 = []
        dat.filter(i => i.status == 2).map(i => en2.push({ x: i.de, y: i.dn, z: i.status }))
        let en3 = []
        dat.filter(i => i.status == 3).map(i => en3.push({ x: i.de, y: i.dn, z: i.status }))
        let en4 = []
        dat.filter(i => i.status == 4).map(i => en4.push({ x: i.de, y: i.dn, z: i.status }))

        let h0 = []
        dat.filter(i => i.status == 0).map(i => h0.push({ x: moment(i.ts7).format(), y: i.dh, z: i.status }))
        let h1 = []
        dat.filter(i => i.status == 1).map(i => h1.push({ x: moment(i.ts7).format(), y: i.dh, z: i.status }))
        let h2 = []
        dat.filter(i => i.status == 2).map(i => h2.push({ x: moment(i.ts7).format(), y: i.dh, z: i.status }))
        let h3 = []
        dat.filter(i => i.status == 3).map(i => h3.push({ x: moment(i.ts7).format(), y: i.dh, z: i.status }))
        let h4 = []
        dat.filter(i => i.status == 4).map(i => h4.push({ x: moment(i.ts7).format(), y: i.dh, z: i.status }))

        let e0 = []
        dat.filter(i => i.status == 0).map(i => e0.push({ x: moment(i.ts7).format(), y: i.de, z: i.status }))
        let e1 = []
        dat.filter(i => i.status == 1).map(i => e1.push({ x: moment(i.ts7).format(), y: i.de, z: i.status }))
        let e2 = []
        dat.filter(i => i.status == 2).map(i => e2.push({ x: moment(i.ts7).format(), y: i.de, z: i.status }))
        let e3 = []
        dat.filter(i => i.status == 3).map(i => e3.push({ x: moment(i.ts7).format(), y: i.de, z: i.status }))
        let e4 = []
        dat.filter(i => i.status == 4).map(i => e4.push({ x: moment(i.ts7).format(), y: i.de, z: i.status }))

        let n0 = []
        dat.filter(i => i.status == 0).map(i => n0.push({ x: moment(i.ts7).format(), y: i.dn, z: i.status }))
        let n1 = []
        dat.filter(i => i.status == 1).map(i => n1.push({ x: moment(i.ts7).format(), y: i.dn, z: i.status }))
        let n2 = []
        dat.filter(i => i.status == 2).map(i => n2.push({ x: moment(i.ts7).format(), y: i.dn, z: i.status }))
        let n3 = []
        dat.filter(i => i.status == 3).map(i => n3.push({ x: moment(i.ts7).format(), y: i.dn, z: i.status }))
        let n4 = []
        dat.filter(i => i.status == 4).map(i => n4.push({ x: moment(i.ts7).format(), y: i.dn, z: i.status }))


        chart.data = {
            datasets: [{
                spanGaps: true,
                backgroundColor: 'green',
                label: 'สถานะ 0',
                data: en0,
                showLine: false,
            }, {
                backgroundColor: 'yellow',
                label: "สถานะ 1",
                data: en1,
                showLine: false,
            }, {
                backgroundColor: 'orange',
                label: "สถานะ 2",
                data: en2,
                showLine: false,
            }, {
                backgroundColor: 'red',
                label: "สถานะ 3",
                data: en3,
                showLine: false,
            }, {
                backgroundColor: 'gray',
                label: "สถานะ 4",
                data: en4,
                showLine: false,
                hidden: true
            }]
        };
        chart.update();

        chartH.data = {
            datasets: [{
                spanGaps: true,
                backgroundColor: 'green',
                label: 'สถานะ 0',
                data: h0,
                showLine: false,
            }, {
                backgroundColor: 'yellow',
                label: "สถานะ 1",
                data: h1,
                showLine: false,
            }, {
                backgroundColor: 'orange',
                label: "สถานะ 2",
                data: h2,
                showLine: false,
            }, {
                backgroundColor: 'red',
                label: "สถานะ 3",
                data: h3,
                showLine: false,
            }, {
                backgroundColor: 'gray',
                label: "สถานะ 4",
                data: h4,
                showLine: false,
                hidden: true
            }]
        };
        chartH.scales.x.min = new Date(data.start_date).valueOf();
        chartH.scales.x.max = new Date(data.end_date).valueOf();
        chartH.update();
        chartH.resetZoom();

        chartE.data = {
            datasets: [{
                spanGaps: true,
                backgroundColor: 'green',
                label: 'สถานะ 0',
                data: e0,
                showLine: false,
            }, {
                backgroundColor: 'yellow',
                label: "สถานะ 1",
                data: e1,
                showLine: false,
            }, {
                backgroundColor: 'orange',
                label: "สถานะ 2",
                data: e2,
                showLine: false,
            }, {
                backgroundColor: 'red',
                label: "สถานะ 3",
                data: e3,
                showLine: false,
            }, {
                backgroundColor: 'gray',
                label: "สถานะ 4",
                data: e4,
                showLine: false,
                hidden: true
            }]
        };
        chartE.scales.x.min = new Date(data.start_date).valueOf();
        chartE.scales.x.max = new Date(data.end_date).valueOf();
        chartE.update();
        chartE.resetZoom();

        chartN.data = {
            datasets: [{
                spanGaps: true,
                backgroundColor: 'green',
                label: 'สถานะ 0',
                data: n0,
                showLine: false,
            }, {
                backgroundColor: 'yellow',
                label: "สถานะ 1",
                data: n1,
                showLine: false,
            }, {
                backgroundColor: 'orange',
                label: "สถานะ 2",
                data: n2,
                showLine: false,
            }, {
                backgroundColor: 'red',
                label: "สถานะ 3",
                data: n3,
                showLine: false,
            }, {
                backgroundColor: 'gray',
                label: "สถานะ 4",
                data: n4,
                showLine: false,
                hidden: true
            }]
        };
        chartN.scales.x.min = new Date(data.start_date).valueOf();
        chartN.scales.x.max = new Date(data.end_date).valueOf();
        chartN.update();
        chartN.resetZoom();
    })
}

const getData = () => {
    let stat_code = st_code;
    let start_date = moment($('#datetimes').data('daterangepicker').startDate).format('YYYY-MM-DD HH:mm:ss');
    let end_date = moment($('#datetimes').data('daterangepicker').endDate).format('YYYY-MM-DD HH:mm:ss');

    $("#table").dataTable().fnDestroy();
    showData({ stat_code, start_date, end_date })
}

let closeModal = () => {
    $('#checkModal').modal('hide')
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
    getData();
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
    let page = "_detail";
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
    }
}

const logout = () => {
    gid = defaultGid;
    document.cookie = "rtkname=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "rtktoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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

$("#st_code").html(st_code)
$("#st_code2").html(st_code)
$("#st_code3").html(st_code)


$(function () {
    getData();
    checkLogin();
    getLastInitial();
    getLastGnssdata();
    loadMarker();
});

axios.get("/apiv2/version").then(r => {
    $("#version").html(r.data.version)
})