import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiZG9va2RhIiwiYSI6ImNscTM3azN3OTA4dmEyaXF1bmg3cXRvbDUifQ.d1Ovd_n9PwJqc_MdGS66-A';

function Map() {
    const mapRef = useRef(null);
    const markerRefs = useRef([]);
    const mapContainerRef = useRef(null);
    const [markerStates, setMarkerStates] = useState({}); // Track toggle per index

    const locations = [
        { lng: 100.5018, lat: 13.7563, number: 1, name: 'Bangkok' },
        { lng: 100.5232, lat: 13.7270, number: 2, name: 'Wat Pho' },
        { lng: 100.5293, lat: 13.7423, number: 3, name: 'Chatuchak' },
    ];

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [100.5018, 13.7563],
            zoom: 12,
        });

        // Remove any previous markers
        markerRefs.current.forEach((m) => m.remove());
        markerRefs.current = [];

        locations.forEach((loc, index) => {
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.textContent = loc.number;

            // Add toggle logic per marker
            el.addEventListener('click', () => {
                setMarkerStates((prev) => ({
                    ...prev,
                    [index]: !prev[index], // Toggle this marker only
                }));

                new mapboxgl.Popup()
                    .setLngLat([loc.lng, loc.lat])
                    .setHTML(`<strong>${loc.name}</strong>`)
                    .addTo(map);
            });

            const marker = new mapboxgl.Marker(el)
                .setLngLat([loc.lng, loc.lat])
                .addTo(map);

            markerRefs.current.push(marker);
        });

        mapRef.current = map;

        return () => map.remove();
    }, []);

    // Update marker style when toggle state changes
    useEffect(() => {
        markerRefs.current.forEach((marker, index) => {
            const el = marker.getElement();
            if (markerStates[index]) {
                el.classList.add('marker-active');
            } else {
                el.classList.remove('marker-active');
            }
        });
    }, [markerStates]);

    return (
        <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '500px', borderRadius: '12px' }}
        />
    );
}

export default Map;
