
// default user by gid
var defaultGid = 24;
var gid = defaultGid;

// map
var map = L.map('map').setView([18.359549715002537, 99.69806926182481], 12);
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 22,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
})

const grod = L.tileLayer('https://{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
    maxZoom: 22,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    lyr: 'basemap'
});

const ghyb = L.tileLayer('https://{s}.google.com/vt/lyrs=y,m&x={x}&y={y}&z={z}', {
    maxZoom: 22,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    lyr: 'basemap'
});

const gter = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
    maxZoom: 22,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    lyr: 'basemap'
});

var MaemohArea_Ortho_UTM_Jul65 = L.tileLayer.wms('https://mmm-iotegat.egat.co.th/geoserver/gwc/service/wms?', {
    layers: 'EGAT-IoT:MaemohArea_Ortho_UTM_Jul65',
    format: 'image/png',
    transparent: true,
    tileSize: 256,
    maxZoom: 20,
    tms: true
});

var MaemohArea_Ortho_UTM_Jul66 = L.tileLayer.wms('https://mmm-iotegat.egat.co.th/geoserver/gwc/service/wms?', {
    layers: 'EGAT-IoT:MaemohArea_Ortho_UTM_Jul66',
    format: 'image/png',
    transparent: true,
    tileSize: 256,
    maxZoom: 20,
    tms: true
});

var MaemohArea_Ortho_UTM_Mar65 = L.tileLayer.wms('https://mmm-iotegat.egat.co.th/geoserver/gwc/service/wms?', {
    layers: 'EGAT-IoT:MaemohArea_Ortho_UTM_Mar65',
    format: 'image/png',
    transparent: true,
    tileSize: 256,
    maxZoom: 20,
    tms: true
});

var MaemohArea_Ortho_UTM_Nov65 = L.tileLayer.wms('https://mmm-iotegat.egat.co.th/geoserver/gwc/service/wms?', {
    layers: 'EGAT-IoT:MaemohArea_Ortho_UTM_Nov65',
    format: 'image/png',
    transparent: true,
    tileSize: 256,
    maxZoom: 20,
    tms: true
});

var isoFeature = L.featureGroup();

const getColor = (d) => {
    return d > 100 ? '#800026' :
        d > 50 ? '#BD0026' :
            d > 25 ? '#E31A1C' :
                d > 10 ? '#FC4E2A' :
                    d > 5 ? '#FD8D3C' :
                        d > 1 ? '#FEB24C' :
                            d > 0 ? '#FED976' :
                                '#FFEDA0';
}

const flaskUrl = "/pyapi/getisoline";
// const flaskUrl = "/apiv2/getisoline";
axios.post(flaskUrl, { fld: 'de', interval: 1 })
    .then((response) => {
        L.geoJSON(response.data, {
            style: function (feature) {
                return {
                    color: getColor(feature.properties.de)
                };
            }
        }).addTo(isoFeature).bindPopup((layer) => {
            return `ค่าการเคลื่อนตัว (de): ${layer.feature.properties.de} cm`
        });
    })
    .catch((error) => {
        if (error.response && error.response.status === 404) {
            console.error('Resource Not Found:', error.response.statusText);
        } else {
            console.error('Error:', error);
        }
    });


var getIsoFeature = () => {
    Swal.fire({
        // text: 'เลือกค่าการเคลื่อนตัวและ Interval ที่ต้องการ',
        html:
            'เลือกค่าการเคลื่อนตัวและ Interval ที่ต้องการ' +
            '<div class="swal2-row">' +
            '<div class="swal2-col">' +
            '<label for="select1">การเคลื่อนตัวแบบ:&nbsp;</label>' +
            '<select id="disotype" class="swal2-input">' +
            '<option value="de">de</option>' +
            '<option value="dn">dn</option>' +
            '<option value="dh">dh</option>' +
            '</select>' +
            '</div>' +
            '<div class="swal2-col mt-2">' +
            '<label for="select2">ค่าของ Interval:&nbsp;</label>' +
            '<select id="interval" class="swal2-input">' +
            '<option value="1">1 cm</option>' +
            '<option value="2">2 cm</option>' +
            '<option value="3">3 cm</option>' +
            '<option value="4">4 cm</option>' +
            '<option value="5">5 cm</option>' +
            '<option value="10">10 cm</option>' +
            '<option value="20">20 cm</option>' +
            '<option value="50">50 cm</option>' +
            '</select>' +
            '</div>' +
            '</div>',
        showCancelButton: true,
        confirmButtonText: 'ตกลง',
        cancelButtonText: 'ยกเลิก',
    }).then((result) => {
        if (result.isConfirmed) {
            const fld = document.getElementById('disotype').value;
            const interval = document.getElementById('interval').value;
            isoFeature.clearLayers()

            axios.post(flaskUrl, { fld, interval }).then((r) => {
                L.geoJSON(r.data, {
                    style: function (feature) {
                        return {
                            color: getColor(feature.properties[fld])
                        };
                    }
                }).addTo(isoFeature).bindPopup((layer) => {
                    return `ค่าการเคลื่อนตัว (${fld}): ${layer.feature.properties[fld]} cm`
                });
            })

        } else if (result.dismiss === Swal.DismissReason.cancel) {
            console.log('Cancelled');
        }
    }).then((result) => {
        console.log(result);
    });
}

// rainviewer
var radar = L.featureGroup();
var apiData = {};
var mapFrames = [];
var lastPastFramePosition = -1;
var radarLayers = [];

var optionKind = 'radar';

var optionTileSize = 256; // can be 256 or 512.
var optionColorScheme = 2; // from 0 to 8. Check the https://rainviewer.com/api/color-schemes.html for additional information
var optionSmoothData = 1; // 0 - not smooth, 1 - smooth
var optionSnowColors = 1; // 0 - do not show snow colors, 1 - show snow colors

var animationPosition = 0;
var animationTimer = false;

var apiRequest = new XMLHttpRequest();
apiRequest.open("GET", "https://api.rainviewer.com/public/weather-maps.json", true);
apiRequest.onload = function (e) {
    apiData = JSON.parse(apiRequest.response);
    initialize(apiData, optionKind);
};
apiRequest.send();

function initialize(api, kind) {
    for (var i in radarLayers) {
        map.removeLayer(radarLayers[i]);
    }
    mapFrames = [];
    radarLayers = [];
    animationPosition = 0;

    if (!api) {
        return;
    }
    if (kind == 'satellite' && api.satellite && api.satellite.infrared) {
        mapFrames = api.satellite.infrared;

        lastPastFramePosition = api.satellite.infrared.length - 1;
        changeRadarPosition(lastPastFramePosition);
        // showFrame(lastPastFramePosition);
    }
    else if (api.radar && api.radar.past) {
        mapFrames = api.radar.past;
        if (api.radar.nowcast) {
            mapFrames = mapFrames.concat(api.radar.nowcast);
        }
        lastPastFramePosition = api.radar.past.length - 1;
        changeRadarPosition(lastPastFramePosition);
        // showFrame(lastPastFramePosition);
    }
}

function addLayer(frame) {
    if (!radarLayers[frame.path]) {
        var colorScheme = optionKind == 'satellite' ? 0 : optionColorScheme;
        var smooth = optionKind == 'satellite' ? 0 : optionSmoothData;
        var snow = optionKind == 'satellite' ? 0 : optionSnowColors;

        radarLayers[frame.path] = new L.TileLayer(apiData.host + frame.path + '/' + optionTileSize + '/{z}/{x}/{y}/' + colorScheme + '/' + smooth + '_' + snow + '.png', {
            tileSize: 256,
            opacity: 0.001,
            zIndex: frame.time,
            name: "lyr"
        });
    }

    if (!map.hasLayer(radarLayers[frame.path])) {
        radar.addLayer(radarLayers[frame.path]);
    }
}

function changeRadarPosition(position, preloadOnly) {
    while (position >= mapFrames.length) {
        position -= mapFrames.length;
    }
    while (position < 0) {
        position += mapFrames.length;
    }

    var currentFrame = mapFrames[animationPosition];
    var nextFrame = mapFrames[position];

    addLayer(nextFrame);

    if (preloadOnly) {
        return;
    }

    animationPosition = position;

    if (radarLayers[currentFrame.path]) {
        radarLayers[currentFrame.path].setOpacity(0);
    }
    radarLayers[nextFrame.path].setOpacity(100);
}

// const station = L.layerGroup();
var baseMaps = {
    "แผนที่ OSM": osm,
    "แผนที่ถนน Google Map": grod,
    "แผนที่ภาพจากดาวเทียม Google Map": ghyb.addTo(map),
    "แผนที่ภูมิประเทศ Google Map": gter
};

var overlayMaps = {
    "ภาพ Orthophoto Jul65": MaemohArea_Ortho_UTM_Jul65,
    "ภาพ Orthophoto Jul66": MaemohArea_Ortho_UTM_Jul66,
    "ภาพ Orthophoto Mar65": MaemohArea_Ortho_UTM_Mar65,
    "ภาพ Orthophoto Nov65": MaemohArea_Ortho_UTM_Nov65,
    "ข้อมูล isoline <button onclick='getIsoFeature()'>เลือก interval</button>": isoFeature,
    "ข้อมูล Radar น้ำฝน <a onclick='console.log(111)'>aa</a>": radar.addTo(map)
};

L.control.layers(baseMaps, overlayMaps).addTo(map);
L.control.scale({ metric: true }).addTo(map);

// leaflet-measure
L.Measure = {
    linearMeasurement: "วัดระยะทาง",
    areaMeasurement: "วัดเนื้อที่",
    start: "จุดเริ่มต้น",
    meter: "m",
    kilometer: "km",
    squareMeter: "m²",
    squareKilometers: "km²",
};

L.control.measure({ title: "เครื่องมือวัดพื้นที่", position: "topright" }).addTo(map);

// geolocation
const onLocationFound = (e) => {
    console.log(e);
}

const onLocationError = (e) => {
    console.log(e.message);
}

const refreshPage = () => {
    location.reload(true);
}

map.on("locationfound", onLocationFound);
// map.on('locationerror', onLocationError);
// map.locate({ setView: true, maxZoom: 18 });

var lc = L.control.locate({
    position: "topleft",
    strings: {
        title: "enable gps"
    },
    locateOptions: {
        maxZoom: 15,
        enableHighAccuracy: true
    }
}).addTo(map);
// lc.start();

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

// Add a 'draw:created' event listener to the map
map.on("pm:create", (e) => {
    let bnd = e.layer.toGeoJSON();
    showMarkerByMap(markers, bnd);
    popupBtngroup()
    map.removeLayer(e.layer);
});

// get marker station
let removeLayer = () => {
    map.eachLayer(i => {
        if (i.options.name == "mk") {
            map.removeLayer(i)
        }
    })
}

let popupBtnNotify = (staname) => {
    // <input id="alert" type="checkbox"> เปิดรับการแจ้งเตือนจากสถานีนี้
    usrname = getCookie("rtkname");
    Swal.fire({
        title: 'กำหนดค่าเพื่อการแจ้งเตือน',
        html: `<form>
            <b>ตั้งค่าแจ้งเตือนความเร็วเคลื่อนตัว</b><br>
            Attention<br>
            <input id="vi_attention" type="number" class="swal2-input" value="0"> cm/ชั่วโมง <br>
            Warning<br>
            <input id="vi_warning" type="number" class="swal2-input" value="0"> cm/ชั่วโมง <br>
            Alarm<br>
            <input id="vi_alarm" type="number" class="swal2-input" value="0"> cm/ชั่วโมง <br>
        </form>`,
        showCancelButton: true,
        confirmButtonText: 'ตกลง',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            axios.post('/apiv2/update_sta_line_notify', {
                ref: moment().valueOf(),
                gid: gid,
                stat_code: staname,
                vi_attention: document.getElementById('vi_attention').value,
                vi_warning: document.getElementById('vi_warning').value,
                vi_alarm: document.getElementById('vi_alarm').value,
                alert: true,
            }).then(r => console.log(r))
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        loadMarkergroup()
    })
}

let popupBtngroup = () => {
    Swal.fire({
        title: 'ท่านต้องการบันทึกสถานีที่เลือกหรือไม่?',
        text: "กรอกชื่อและคลิกปุ่ม บันทึก เพื่อบันทึกสถานีที่เลือก",
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ไม่บันทึก',
        showLoaderOnConfirm: true,
        preConfirm: (name) => {
            // console.log(name);
            let stat_code = [];
            $(":checkbox:checked").each(function (e) {
                stat_code.push($(this).val());
            });
            mkgroup.push({ name, stat_code });
            axios.post('/apiv2/update_sta_web_notify', {
                gid, mkgroup: JSON.stringify(mkgroup)
            })
                .then(r => {
                    loadMarkergroup()
                    console.log("add to list")
                })
            return "ok"
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        getData()
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

var redIcon = L.icon({
    iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-red.png',
    iconSize: [38, 95],
});

var blueIcon = L.icon({
    iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-blue.png',
    iconSize: [38, 95],
});

let showMarkerByList = (stations) => {
    removeLayer();
    markers.map(i => {
        let sta = i.stat_code;
        let chk = stations.includes(sta);
        if (chk) {
            let mk = L.marker([i.y_coor, i.x_coor], {
                icon: redMarker, name: 'mk'
            }).bindPopup(`RTK-LANDMOS ${i.stat_code}`)
                .addTo(map);
        } else {
            let mk = L.marker([i.y_coor, i.x_coor], {
                icon: blueMarker, name: 'mk'
            }).bindPopup(`RTK-LANDMOS ${i.stat_code}`)
                .addTo(map);
            mk.on('click', (i) => { console.log(i) });
        }
    });
}

let showMarkerByMap = (mks, bnd) => {
    removeLayer();
    var polygon = turf.polygon([bnd.geometry.coordinates[0]]);
    var stat_code = [];
    mks.forEach((i) => {
        var point = turf.point([i.x_coor, i.y_coor]);
        var ptsWithin = turf.pointsWithinPolygon(point, polygon);
        if (ptsWithin.features.length > 0) {
            if (!ptsWithin.features[0].geometry.coordinates.includes(0)) {
                $('#st' + i.stat_code).prop('checked', true);
                stat_code.push(i.stat_code);
                let mk = L.marker([i.y_coor, i.x_coor], {
                    icon: redMarker, name: 'mk'
                }).addTo(map)
            }
        } else {
            $('#st' + i.stat_code).prop('checked', false);
            let mk = L.marker([i.y_coor, i.x_coor], {
                icon: blueMarker, name: 'mk'
            }).addTo(map)
            mk.on('click', (i) => { console.log(i) });
        }
    });
    orderCheckBox();
}

const showDeviceStatus = (data) => {
    // สถานะการทำงาน <strong>${data.sta_light}</strong> <br>
    Swal.fire({
        title: `<strong>สถานะอุปกรณ์ RTK-LANDMOS  ${data.stat_code} </strong>`,
        // icon: 'info',
        html: `
          <div>
            แรงดันแผงโซล่าเซลล์ <strong>${data.solar_volt}</strong> V<br>
            กระแสแผงโซล่าเซลล์ <strong>${data.solar_amp}</strong> mA<br>
            แรงดันแบตเตอรี่ <strong>${data.batt_volt}</strong> V<br>
            กระแสแบตเตอรี่ <strong>${data.batt_amp}</strong> mA<br>
            อุณหภูมิ <strong>${data.sta_temp}</strong> °C<br>
            ความชื้น <strong>${data.sta_hum}</strong> %<br>
            <br>
            เวลา: ${data.ts7}
          </div>
        `,
        // showCloseButton: true,
        // showCancelButton: true,
        focusConfirm: false,
        confirmButtonText: 'Ok',
        cancelButtonText: 'No, thanks'
    });
}

const getDeviceInfo = (stat_code) => {
    axios.post('/apiv2/select_device_info', { stat_code }).then(r => {
        console.log(r.data[0]);
        showDeviceStatus(r.data[0]);
    });
}

const setSessionCookie = () => {
    let stat_code = [];
    $('input[name="chkbox_station"]:checked').each(function () {
        stat_code.push($(this).val());
    });
    const stat_code_str = stat_code.join(',');
    document.cookie = `rtkstation=${encodeURIComponent(stat_code_str)};path=/`;
}

const showList = (status, auth) => {
    return new Promise((resolve, reject) => {
        try {
            document.getElementById("accordion").innerHTML = "";
            let stat_code = getCookie("rtkstation");
            stat_code = stat_code.split(',');

            if (status) {
                if (auth) {
                    stationsList.map((i, k) => {
                        let div = `<div class="card form-check">
                                    <div class="card-header " role="tab" id="heading-1">
                                        <div class="form-check form-check-flat d-flex justify-content-between">
                                            <label class="form-check-label">
                                                <input class="checkbox form-check-input" type="checkbox" name="chkbox_station" id="st${i.stat_code}" value="${i.stat_code}" onchange="getData()"> RTK-LANDMOS ${i.stat_code}
                                                <i class="input-helper"></i>
                                            </label>
                                            <a class="collapsed cursor" data-toggle="collapse"  data-target="#collapse-${k}" aria-expanded="false" aria-controls="collapse-1" ></a>
                                        </div>
                                    </div>
                                    <div id="collapse-${k}" class="collapse" role="tabpanel" data-parent="#accordion">
                                        <div class="card-body">
                                            <a class="text-muted cursor" href="#"onclick="popupStationinit('${i.stat_code}')"><i class="bi bi-joystick" ></i> ตั้งค่า initial ใหม่</a>  
                                            <br><a class="text-muted cursor" href="#" onclick="addAccelerationgauge('${i.stat_code}')"><i class="bi bi-bookmark-check" ></i> bookmark มาตรความเร็ว</a> 
                                            <br><a class="text-muted cursor" href="./../_inv/index.html?st_code=${i.stat_code}"><i class="bi bi-clipboard-pulse"></i> วิเคราะห์ความเร็วการเคลื่อนตัว</a>  
                                            <br><a class="text-muted cursor" href="#" onclick="getDeviceInfo('${i.stat_code}')"><i class="bi bi-battery-charging" ></i> สถานะการทำงานของอุปกรณ์ตรวจวัด</a>  
                                            <br><a class="text-muted cursor" href="#" onclick="popupBtnNotify('${i.stat_code}')"><i class="bi bi-bell" ></i> ตั้งค่าการแจ้งเตือน</a>  
                                            <br><a class="text-muted cursor" href="./../_detail/index.html?st_code=${i.stat_code}"><i class="bi bi-file-earmark-text" ></i> รายละเอียดของข้อมูล</a>
                                        </div>
                                    </div>
                                </div>`
                        document.getElementById("accordion").innerHTML += div;
                    })
                } else {
                    stationsList.map((i, k) => {
                        let div = `<div class="card form-check">
                                    <div class="card-header " role="tab" id="heading-1">
                                        <div class="form-check form-check-flat d-flex justify-content-between">
                                            <label class="form-check-label">
                                                <input class="checkbox form-check-input" type="checkbox" name="chkbox_station" id="st${i.stat_code}" value="${i.stat_code}" onchange="getData()"> RTK-LANDMOS ${i.stat_code}
                                                <i class="input-helper"></i>
                                            </label>
                                            <a class="collapsed cursor" data-toggle="collapse"  data-target="#collapse-${k}" aria-expanded="false" aria-controls="collapse-1" ></a>
                                        </div>
                                    </div>
                                    <div id="collapse-${k}" class="collapse" role="tabpanel" data-parent="#accordion">
                                        <div class="card-body">
                                            <a class="text-muted cursor" href="#"onclick="popupStationinit('${i.stat_code}')"><i class="bi bi-joystick" ></i> ตั้งค่า initial ใหม่</a>  
                                            <br><a class="text-muted cursor" href="#" onclick="addAccelerationgauge('${i.stat_code}')"><i class="bi bi-bookmark-check" ></i> bookmark มาตรความเร็ว</a> 
                                            <br><a class="text-muted cursor" href="./../_inv/index.html?st_code=${i.stat_code}"><i class="bi bi-clipboard-pulse"></i> วิเคราะห์ความเร็วการเคลื่อนตัว</a>  
                                            <br><a class="text-muted cursor" href="#" onclick="getDeviceInfo('${i.stat_code}')"><i class="bi bi-battery-charging" ></i> สถานะการทำงานของอุปกรณ์ตรวจวัด</a> 
                                            <br><a class="text-muted cursor" href="./../_detail/index.html?st_code=${i.stat_code}"><i class="bi bi-file-earmark-text" ></i> รายละเอียดของข้อมูล</a>
                                        </div>
                                    </div>
                                </div>`
                        document.getElementById("accordion").innerHTML += div;
                    })
                }
            } else {
                stationsList.map((i, k) => {
                    // console.log(i);
                    let div = `<div class="card form-check">
                                <div class="card-header " role="tab" id="heading-1">
                                    <div class="form-check form-check-flat d-flex justify-content-between">
                                        <label class="form-check-label">
                                            <input class="checkbox form-check-input" type="checkbox" name="chkbox_station" id="st${i.stat_code}" value="${i.stat_code}" onchange="getData()"> RTK-LANDMOS ${i.stat_code}
                                            <i class="input-helper"></i>
                                        </label>
                                        <a class="collapsed cursor" data-toggle="collapse"  data-target="#collapse-${k}" aria-expanded="false" aria-controls="collapse-1" ></a>
                                    </div>
                                </div>
                                <div id="collapse-${k}" class="collapse" role="tabpanel" data-parent="#accordion">
                                    <div class="card-body">
                                    <br><a class="text-muted cursor" href="#" onclick="addAccelerationgauge('${i.stat_code}')"><i class="bi bi-bookmark-check" ></i> bookmark มาตรความเร็ว</a> 
                                    <br><a class="text-muted cursor" href="./../_inv/index.html?st_code=${i.stat_code}"><i class="bi bi-clipboard-pulse"></i> วิเคราะห์ความเร็วการเคลื่อนตัว</a>  
                                    <br><a class="text-muted cursor" href="#" onclick="getDeviceInfo('${i.stat_code}')"><i class="bi bi-battery-charging" ></i> สถานะการทำงานของอุปกรณ์ตรวจวัด</a>  
                                    <br><a class="text-muted cursor" href="./../_detail/index.html?st_code=${i.stat_code}"><i class="bi bi-file-earmark-text" ></i> รายละเอียดของข้อมูล</a>
                                    </div>
                                </div>
                            </div>`
                    document.getElementById("accordion").innerHTML += div;
                })
            }

            $('input[type="checkbox"][name="chkbox_station"]').change(function () {
                setSessionCookie();
            });

            stat_code.map(i => $('#st' + i).prop('checked', true));
            orderCheckBox();
            resolve();
        } catch (err) {
            console.log(err);
            reject(err);
        }
    })
}

var stationsList = [];
const getStation = () => {
    return new Promise((resolve, reject) => {
        axios.get('/apiv2/basestation_fillter').then(r => {
            let data = r.data.map(i => i.lat != null ? i : { ...i, lat: 0, lng: 0, x_coor: 0, y_coor: 0 });
            // console.log(data);
            stationsList = data;
            markers = data;

            markers.map(i => {
                L.marker([i.y_coor, i.x_coor], {
                    icon: blueMarker, name: 'mk'
                }).bindPopup(`RTK-LANDMOS ${i.stat_code}`)
                    .addTo(map);
            })
            resolve(r.data);
        })
    })
}

// chart
var dom_e = document.getElementById('chart-e');
var chart_e = echarts.init(dom_e, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_n = document.getElementById('chart-n');
var chart_n = echarts.init(dom_n, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_h = document.getElementById('chart-h');
var chart_h = echarts.init(dom_h, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_2d = document.getElementById('chart-2d');
var chart_2d = echarts.init(dom_2d, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_3d = document.getElementById('chart-3d');
var chart_3d = echarts.init(dom_3d, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_re = document.getElementById('chart-re');
var chart_re = echarts.init(dom_re, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_rn = document.getElementById('chart-rn');
var chart_rn = echarts.init(dom_rn, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_rh = document.getElementById('chart-rh');
var chart_rh = echarts.init(dom_rh, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_r2d = document.getElementById('chart-r2d');
var chart_r2d = echarts.init(dom_r2d, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_r3d = document.getElementById('chart-r3d');
var chart_r3d = echarts.init(dom_r3d, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var dom_v = document.getElementById('chart-v');
var chart_v = echarts.init(dom_v, null, {
    renderer: 'canvas',
    useDirtyRect: false
});

var option = {
    title: {
        text: 'ชื่อกราฟ',
        textStyle: {
            fontFamily: 'kanit',
            fontSize: 14
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross'
        }
    },
    calculable: true,
    xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
            formatter: (function (value) {
                return (moment(value).format('DD/MM/YYYY HH:mm')).replace(' ', '\n');
            }),
            rotate: 45,
            interval: 0,
        },
        splitLine: {
            show: true
        }
    },
    yAxis: {
        name: 'cm',
        type: 'value',
        axisLabel: {
            formatter: '{value}'
        },
        // name: 'การเคลื่อนตัว',
        nameLocation: 'middle',
        nameGap: 30,
        boundaryGap: [2, 2],
        splitLine: {
            show: true
        }
    },
    grid: {
        top: '10%',
        left: '8%',
        right: '4%',
        bottom: '25%'
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
    dataZoom: [
        {
            type: 'slider',
            xAxisIndex: 0,
            filterMode: 'none',
            top: 480,
            height: 20
            // start: 40,
            // end: 60
        }, {
            type: 'slider',
            yAxisIndex: 0,
            filterMode: 'none',
            width: 20
        }, {
            type: 'inside',
            xAxisIndex: 0,
            filterMode: 'none'
        }, {
            type: 'inside',
            yAxisIndex: 0,
            filterMode: 'none'
        }
    ],
    legend: {
        orient: 'horizontal',
        // right: 100,
        bottom: '1',
        // top: 'center'
    },
}

let showChart = (series, variable, axisName) => {
    option["series"] = series
    option["title"]["text"] = axisName

    if (option && typeof option === 'object') {
        variable.setOption(option, true);
    }
    window.addEventListener('resize', variable.resize);
}

let color = [
    '#dd6b66',
    '#759aa0',
    '#e69d87',
    '#8dc1a9',
    '#ea7e53',
    '#eedd78',
    '#73a373',
    '#73b9bc',
    '#7289ab',
    '#91ca8c',
    '#f49f42',
    '#37A2DA',
    '#32C5E9',
    '#67E0E3',
    '#9FE6B8',
    '#FFDB5C',
    '#ff9f7f',
    '#fb7293',
    '#E062AE',
    '#E690D1',
    '#e7bcf3',
    '#9d96f5',
    '#8378EA',
    '#96BFFF'
]

var initPosition;
const getInitPosition = () => {
    axios.post('/apiv2/get_init_position').then(r => {
        initPosition = r.data;
    })
};

let formatDataByInit = async (dat, st_code, axis) => {
    let stat_code = JSON.parse(st_code);
    let series = [];
    let tasks = [];
    // console.log(dat);
    _.forEach(stat_code, async (st, i) => {
        // let sta = initPosition.filter(i => i.stat_code == st);
        tasks.push(new Promise((resolve, reject) => {
            let result = dat.filter(d => d.stat_code == st)
                .sort((a, b) => a.ts7 - b.ts7)
                .map(x => [moment(x.ts7).format(), x[`${axis}`]]);
            series.push({
                name: 'Station' + st,
                type: 'line',
                symbolSize: 4,
                color: color[i],
                smooth: true,
                data: result
            });
            resolve();
        }));
    });

    await Promise.all(tasks);
    return series;
}

let formatDataByInitCal = async (dat, st_code, axis) => {
    let stat_code = JSON.parse(st_code);
    let series = [];
    let tasks = [];
    _.forEach(stat_code, function (st, i) {
        tasks.push(new Promise((resolve, reject) => {
            let result = dat.filter(d => d.stat_code == st)
                .sort((a, b) => moment(a.ts7) - moment(b.ts7))
                .map(x => [x.ts7, (x[`${axis}`]).toFixed(3)]);
            series.push({
                name: 'Station' + st,
                type: 'line',
                symbolSize: 4,
                color: color[i],
                smooth: true,
                data: result
            });
            resolve();
        }));
    });

    await Promise.all(tasks);
    return series;
}

let formatDataByTime = async (dat, st_code, axis) => {
    let stat_code = JSON.parse(st_code);
    let series = [];
    let tasks = [];
    _.forEach(stat_code, function (st, i) {
        tasks.push(new Promise((resolve, reject) => {
            let datArr = dat.filter(d => d.stat_code == st)
            let order = datArr.sort((a, b) => moment(a.ts7) - moment(b.ts7))
            let init = order[0];
            let result = order.map(x => [x.ts7, (x[`${axis}`] - init[`${axis}`]).toFixed(3)]);

            series.push({
                name: 'Station' + st,
                type: 'line',
                symbolSize: 4,
                color: color[i],
                smooth: true,
                data: result
            });
            resolve();
        }));
    });

    await Promise.all(tasks);
    return series;
}

var vln3hr;
let formatVln = (arr, stat) => {
    vln3hr = arr.filter(i => i.vln3hr != null).map((i) => [i.ts, Number(i.vln3hr).toFixed(2)])
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
    }]

    let yAxis = {
        name: 'Velocity \n(cm/hr)',
        type: 'value',
        boundaryGap: ['100%', '100%'],
        splitLine: { show: true }
    };
    showVelochart(series, yAxis)
}

// gaage chart
var optionG = {
    series: [
        {
            type: 'gauge',
            min: 0,
            max: 50,
            axisLine: {
                lineStyle: {
                    width: 7,
                    color: [
                        [0.3, '#67e0e3'],
                        [0.7, '#37a2da'],
                        [1, '#fd666d']
                    ]
                }
            },
            pointer: {
                itemStyle: {
                    color: 'inherit'
                }
            },
            axisTick: {
                distance: -6,
                length: 7,
                lineStyle: {
                    color: '#fff',
                    width: 1
                }
            },
            splitLine: {
                distance: -8,
                length: 8,
                lineStyle: {
                    color: '#fff',
                    width: 2
                }
            },
            axisLabel: {
                color: 'inherit',
                distance: 10,
                fontSize: 9
            },
            detail: {
                valueAnimation: true,
                formatter: '{value} cm/hr',
                color: 'inherit',
                fontSize: 12,
                offsetCenter: [0, '100%']
            },
            data: [
                {
                    value: (Math.random() * 100).toFixed(1)
                }
            ]
        }
    ]
};

// show acceleration gauge
var gaugeArr = []
const getAccelerationgauge = () => {
    axios.post("/apiv2/select_acceleration_gauge", { gid }).then(async (r) => {
        gaugeArr = [];
        $("#accelerationgauge").empty();
        let datArr = await JSON.parse(r.data[0].acc_gauge);
        if (datArr) {
            await datArr.forEach(async (i) => {
                gaugeArr.push({ stat_code: i.stat_code })
                await $("#accelerationgauge").append(`<div class="col-2 mb-4 stretch-card transparent">
                        <div class="card">
                            <div class="card-body card-gauge">
                                <div class="d-flex justify-content-between p-1">
                                    <span >${i.stat_code}</span> <i class="bi bi-dash-circle-fill gray cursor" onclick="removeAccelerationgauge('${i.stat_code}')"></i>
                                </div>
                                <div class="chart-gauge"  id="g1_${i.stat_code}" ></div>
                            </div>
                        </div>
                    </div>`)
            });

            datArr.forEach(async (i) => {
                let start_date = moment($('#datetimes').data('daterangepicker').startDate).format('YYYY-MM-DD HH:mm:ss');
                let end_date = moment($('#datetimes').data('daterangepicker').endDate).format('YYYY-MM-DD HH:mm:ss');
                let data = { stat_code: JSON.stringify([i.stat_code]), start_date, end_date, stat_status: JSON.stringify([0, 1, 2, 3]) };

                const velocity = await axios.post("/apiv2/select_displacement", data);
                if (velocity.data !== "no data") {
                    const allItem = velocity.data;
                    // console.log(allItem);
                    const lastItem = allItem[allItem.length - 1];
                    let chart = await echarts.init(document.getElementById('g1_' + i.stat_code));
                    optionG.series[0].data[0].value = (lastItem.vln3hr).toFixed(3);
                    chart.setOption(optionG);
                } else {
                    document.getElementById('g1_' + i.stat_code).innerHTML = "<br>ไม่มีข้อมูล";
                }
            })
        }
    });
}

let removeAccelerationgauge = (stat_code) => {
    let newgaugeArr = gaugeArr.filter(i => i.stat_code !== stat_code);
    axios.post("/apiv2/update_acceleration_gauge", { gid, gauges: JSON.stringify(newgaugeArr) }).then(() => getAccelerationgauge());
}

let addAccelerationgauge = async (stat_code) => {
    gaugeArr.push({ stat_code: stat_code });
    let newgaugeArr = await _.uniqBy(gaugeArr, "stat_code")
    await axios.post("/apiv2/update_acceleration_gauge", { gid, gauges: JSON.stringify(newgaugeArr) }).then(() => getAccelerationgauge());
}

// get data
const getData = (arr) => {
    let stat_code = [];
    $('input[type="checkbox"][name="chkbox_station"]:checked').each(function (e) {
        console.log($(this).val());
        stat_code.push($(this).val());
    });

    let stat_status = [];
    $('input[name="chkbox_status"]:checked').each(function (e) {
        stat_status.push(Number($(this).val()));
    });

    let start_date = moment($('#datetimes').data('daterangepicker').startDate).format('YYYY-MM-DD HH:mm:ss');
    let end_date = moment($('#datetimes').data('daterangepicker').endDate).format('YYYY-MM-DD HH:mm:ss');
    let data = { stat_code: JSON.stringify(stat_code), start_date, end_date, stat_status: JSON.stringify(stat_status) };

    showMarkerByList(stat_code)
    orderCheckBox();

    axios.post('/apiv2/select_displacement', data).then(async (r) => {
        // console.log(r.data);
        let series_de = await formatDataByInit(r.data, data.stat_code, "de");
        let series_dn = await formatDataByInit(r.data, data.stat_code, "dn");
        let series_dh = await formatDataByInit(r.data, data.stat_code, "dh");

        showChart(series_de, chart_e, `การเคลื่อนตัวแบบสัมบูรณ์แนวตะวันออก-ตะวันตก (\u2190 -W , +E \u2192)`)
        showChart(series_dn, chart_n, `การเคลื่อนตัวแบบสัมบูรณ์แนวเหนือ-ใต้ (+N , -S)`)
        showChart(series_dh, chart_h, `การเคลื่อนตัวแบบสัมบูรณ์แนวดิ่ง (\u2191 +Up , -Down \u2193)`)

        let series_rde = await formatDataByTime(r.data, data.stat_code, "de");
        let series_rdn = await formatDataByTime(r.data, data.stat_code, "dn");
        let series_rdh = await formatDataByTime(r.data, data.stat_code, "dh");

        showChart(series_rde, chart_re, `การเคลื่อนตัวแบบสัมพัทธ์แนวตะวันออก-ตะวันตก (\u2190 -W , +E \u2192)`)
        showChart(series_rdn, chart_rn, `การเคลื่อนตัวแบบสัมพัทธ์แนวเหนือ-ใต้ (+N , -S)`)
        showChart(series_rdh, chart_rh, `การเคลื่อนตัวแบบสัมพัทธ์แนวดิ่ง (\u2191 +Up , -Down \u2193)`)

        let series_2d = await formatDataByInitCal(r.data, data.stat_code, "d2d");
        let series_3d = await formatDataByInitCal(r.data, data.stat_code, "d3d");
        showChart(series_2d, chart_2d, `การเคลื่อนตัวแบบสัมบูรณ์ (2D)`);
        showChart(series_3d, chart_3d, `การเคลื่อนตัวแบบสัมบูรณ์ (3D)`);

        let series_r2d = await formatDataByTime(r.data, data.stat_code, "d2d");
        let series_r3d = await formatDataByTime(r.data, data.stat_code, "d3d");
        showChart(series_r2d, chart_r2d, `การเคลื่อนตัวแบบสัมพัทธ์ (2D)`);
        showChart(series_r3d, chart_r3d, `การเคลื่อนตัวแบบสัมพัทธ์ (3D)`);

        let series_v = await formatDataByInitCal(r.data, data.stat_code, "vln3hr");
        showChart(series_v, chart_v, `ความเร็วการเคลื่อนตัว (cm/hr)`);
    });
}

$("#absolute").show();
$("#relative").hide();
$("#direction").hide();

$("#nav-absolute-tab").on("click", () => {
    $("#absolute").show();
    $("#relative").hide();
    $("#direction").hide();
});

$("#nav-relative-tab").on("click", () => {
    $("#absolute").hide();
    $("#relative").show();
    $("#direction").hide();
});

$("#nav-direction-tab").on("click", () => {
    $("#absolute").hide();
    $("#relative").hide();
    $("#direction").show();
});

// order check box
let orderCheckBox = () => {
    const formChecks = document.querySelectorAll('.form-check');
    const checkedChecks = [];

    formChecks.forEach((formCheck) => {
        const checkbox = formCheck.querySelector('.form-check-input');

        if (checkbox.checked) {
            checkedChecks.push(formCheck);
        }
    });

    checkedChecks.forEach((checkedCheck) => {
        checkedCheck.parentNode
            .insertBefore(checkedCheck, checkedCheck.parentNode.firstChild);
    });
}

// maker group
var mkgroup;
let loadMarkergroup = () => {
    $("#tagsel").empty();
    $("#tagsel").append(`<option ></option>`);
    axios.post("/apiv2/select_sta_web_notify", { gid }).then(r => {
        if (r.data[0].sta_web_notify) {
            mkgroup = JSON.parse(r.data[0].sta_web_notify);
            mkgroup.forEach(i => {
                $("#tagsel").append(`<option value="${i.name}">${i.name}</option>`)
            })
        } else {
            console.log(r.data[0].sta_web_notify);
        }
    })
}

$("#tagsel").on("change", async () => {
    let mkname = $("#tagsel").val();
    $('input[name="chkbox_station"]').prop('checked', false);
    let newmkgroup = await mkgroup.filter(i => i.name == mkname);
    await newmkgroup[0].stat_code.forEach(i => {
        $('#st' + i).prop('checked', true);
    });
    getData();
    orderCheckBox();
})

const removeMarkerGroup = (staname) => {
    let mkname = $("#tagsel").val();
    let newmkgroup = mkgroup.filter(i => i.name !== mkname);
    axios.post("/apiv2/update_sta_web_notify", { gid, mkgroup: JSON.stringify(newmkgroup) })
        .then(r => {
            loadMarkergroup();
            getData();
        });
}

const blankPoly = {
    "type": "Feature",
    "properties": {},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[[0.0, 0.0], [0.1, 0.0], [0.1, 0.1], [0.0, 0.1], [0.0, 0.0]]]
    }
}
const clearMarkerGroup = () => {
    showMarkerByMap(markers, blankPoly);
}

let removeMarkerList = () => {
    const mkname = $("#tagsel").val();
    console.log(mkname);
    Swal.fire({
        title: 'ท่านต้องการลบสถานีที่เลือกหรือไม่?',
        text: "กลุ่มสถานี : " + mkname,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        showLoaderOnConfirm: true,
        preConfirm: (name) => {
            let newmkgroup = mkgroup.filter(i => i.name !== mkname);
            axios.post("/apiv2/update_sta_web_notify", { gid, mkgroup: JSON.stringify(newmkgroup) })
                .then(r => loadMarkergroup());
            return "ok"
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.dismiss === 'cancel') {
            console.log("nothing");
        } else {
            showMarkerByMap(markers, blankPoly);
        }
    });
}

// station initial
let loadStation = (staname) => {
    // console.log(staname);
    axios.post('/apiv2/lastposition', { stat_code: staname }).then(async r => {
        $("#lat").val(r.data.lat);
        $("#lng").val(r.data.lng);
        $("#utm_e").val(r.data.utm_e);
        $("#utm_n").val(r.data.utm_n);
        $("#mine_e").val(r.data.mine_e);
        $("#mine_n").val(r.data.mine_n);
        $("#ortho_h").val(r.data.ortho_h);
        $("#de").val(r.data.de);
        $("#dn").val(r.data.dn);
        $("#dh").val(r.data.dh);
    })
}

let popupStationinit = async (staname) => {
    await Swal.fire({
        title: 'ระบุพิกัดใหม่ ของสถานี ' + staname,
        html: `<div>
                    <button type="button" id="btnCoorRead" class="btn btn-outline-primary btn-fw" onclick="loadStation('${staname}')">อ่านค่าพิกัดล่าสุด</button><br>
                        <div class="col">latitude:</div>
                        <div class="col"><input id="lat" type="number" class="swal2-input"></div>
                        <div class="col">longitude:</div>
                        <div class="col"><input id="lng" type="number" class="swal2-input"></div>
                        <input id="utm_e" type="hidden">
                        <input id="utm_n" type="hidden">
                        <input id="mine_e" type="hidden">
                        <input id="mine_n" type="hidden">
                        <input id="ortho_h" type="hidden">
                        <input id="de" type="hidden">
                        <input id="dn" type="hidden">
                        <input id="dh" type="hidden">
                </div>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        preConfirm: () => {
            axios.post('/apiv2/initstation', {
                data: {
                    stat_code: staname,
                    lat: document.getElementById('lat').value,
                    lng: document.getElementById('lng').value,
                    utm_e: document.getElementById('utm_e').value,
                    utm_n: document.getElementById('utm_n').value,
                    mine_e: document.getElementById('mine_e').value,
                    mine_n: document.getElementById('mine_n').value,
                    ortho_h: document.getElementById('ortho_h').value,
                    de: document.getElementById('de').value,
                    dn: document.getElementById('dn').value,
                    dh: document.getElementById('dh').value
                }
            })
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        loadMarkergroup();
        if (result.isConfirmed) {
            Swal.fire('บันทึกข้อมูลแล้ว', '', 'success')
        }
    })
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

// select date
let selectDate = (val) => {
    // let dd = moment().subtract(val, 'days')
    // let dd = moment().subtract(val, 'minutes')
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

$("#selectDateList").on("change", function () {
    let date = $(this).val();
    selectDate(date);
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
    loadMarkergroup();
    getAccelerationgauge();
}

const displayLogout = () => {
    document.getElementById("profile").innerHTML = `<a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown" id="profileDropdown" onclick="login()">
                                                        <span><i class="bi bi-person-circle"></i>เข้าสู่ระบบ</span>
                                                    </a>`;
    loadMarkergroup();
    getAccelerationgauge();
}

const checkLogin = () => {
    let page = "_dashboard";
    let gid = getCookie("rtkgid");
    usrname = getCookie("rtkname");
    rtktoken = getCookie("rtktoken");
    if (usrname !== "" && rtktoken !== "") {
        const headers = {
            'Authorization': `Bearer ${rtktoken}`,
            'Content-Type': 'application/json'
        }
        // console.log("sss");
        axios.post('/apiv2/checktoken', { username: usrname, page, gid }, { headers })
            .then(r => {
                if (r.status === 200 && r.data.auth) {
                    displayLogin();
                    showList(true, true)
                } else if (r.status === 200 && r.data.auth == false) {
                    displayLogin();
                    showList(true, false)
                } else {
                    displayLogout();
                }
            })
    } else {
        console.log("no login");
        displayLogout();
    }
}

const logout = () => {
    gid = defaultGid;
    document.cookie = "rtkname=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "rtktoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "rtkgid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    checkLogin();
    showList(false, false);
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
                // console.log(r.data);
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
    getStation().then(async (r) => {
        checkLogin();
        getInitPosition();

        $('input[type="checkbox"][name="chkbox_status"]').change(function () {
            getData();
        });

        $('#datetimes').on('apply.daterangepicker', function (ev, picker) {
            getData();
        });

        await showList(false, false).then(() => getData());
    });

    // show version
    axios.get("/apiv2/version").then(r => {
        $("#version").html(r.data.version)
    })
});
