/**
 * The representation of a CollectPoint
 * @typedef {Object} CollectPoint
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} logo_url
 * @property {number} latitude
 * @property {number} longitude
 * @property {google.maps.Marker?} __marker
 */

/**
 * @type {{[index: number]: CollectPoint}}
 */
const collectPointsById = {};

/**
 * @returns {CollectPoint[]}
 */
function getCollectPoints() {
    return JSON.parse(document.getElementById('collect_points').textContent);
}

/**
 * This function can't be renamed because it's the entry point
 * called by the Google Maps JavaScript API.
 */
function loadMap() {
    /**
     * @returns {google.maps.Map}
     */
    function createMap() {
        return new google.maps.Map(document.getElementById('map'), {
            center: {lat: -23.5552229, lng: -46.4130287},
            zoom: 15,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false
        });
    }

    /**
     * @param {CollectPoint[]} collectPoints
     * @param {google.maps.Map} map
     */
    function loadMarkers(collectPoints, map) {
        for (const point of collectPoints) {
            const marker = new google.maps.Marker({
                position: new google.maps.LatLng(point.latitude, point.longitude),
                map: map,
                title: point.name
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `
<div class="map-marker">
    <h1>${point.name}</h1>
    <div class="map-marker-field">
        <small>Endereço</small>
        <p>${point.description}</p>
    </div>
</div>
                `,
            });

            marker.set('onclick', () => {
                infoWindow.open({
                    anchor: marker,
                    map: map,
                    shouldFocus: true
                });
            });

            marker.addListener('click', () => marker.get('onclick')());

            point.__marker = marker;
        }
    }

    /**
     * @param {CollectPoint[]} collectPoints
     */
    function loadSearch(collectPoints) {
        const searchList = document.querySelector('.search-list');

        // Empty the list to remove the loading state placeholder
        searchList.innerHTML = '';

        for (const point of collectPoints) {
            searchList.innerHTML += `
<li class="search-list__item" onclick="onFocusCollectPoint(${point.id})">
    <h2>${point.name}</h2>
    <div class="search-list__item__field">
        <p>${point.description}</p>
    </div>
</li>
            `;
        }
    }

    const collectPoints = getCollectPoints();
    collectPoints.forEach(x => collectPointsById[x.id] = x);
    const map = createMap();

    loadMarkers(collectPoints, map);
    loadSearch(collectPoints, map);
}

/**
 * @param {number} id
 */
function onFocusCollectPoint(id) {
    const collectPoint = collectPointsById[id];

    if (!collectPoint) {
        throw Error(`Collect point not found (ID=${id})`);
    }

    collectPoint.__marker.getMap().setCenter(collectPoint.__marker.getPosition());
    collectPoint.__marker.get('onclick')();
}