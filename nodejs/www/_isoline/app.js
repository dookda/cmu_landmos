var map = L.map("map", {
    center: [16.81370282475579, 100.2696424793907],
    zoom: 13
})

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

Esri_WorldImagery.addTo(map)

// Make a GET request to your Express.js route
fetch('/apiv2/getisojson')
    .then((response) => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then((jsonData) => {
        console.log(jsonData);
        L.geoJSON(jsonData).addTo(map);
    })
    .catch((error) => {
        console.error('Fetch error:', error);
    });

// L.geoJSON("./../_gdal/json/isoline.geojson").addTo(map)
var url_to_geotiff_file = "/apiv2/getisotif";

fetch(url_to_geotiff_file)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        parseGeoraster(arrayBuffer).then(georaster => {
            var layer = new GeoRasterLayer({
                georaster: georaster,
                opacity: 0.7
            });
            layer.addTo(map);

            // map.fitBounds(layer.getBounds());

        });
    });