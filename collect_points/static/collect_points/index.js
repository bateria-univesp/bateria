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
 * @type {google.maps.places.PlacesService | null}
 */
let placesService = null;
/**
 * @type {google.maps.Map | null}
 */
let map = null;

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
            streetViewControl: false,
            mapId: '77c239c51543e29e'
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
    function loadList(collectPoints) {
        const list = document.querySelector('.collect-points-list');

        // Empty the list to remove the loading state placeholder
        list.innerHTML = '';

        for (const point of collectPoints) {
            list.innerHTML += `
<li class="collect-points-list__item" onclick="onFocusCollectPoint(${point.id})">
    <h2>${point.name}</h2>
    <div class="collect-points-list__item__field">
        <p>${point.description}</p>
    </div>
</li>
            `;
        }
    }

    const collectPoints = getCollectPoints();
    collectPoints.forEach(x => collectPointsById[x.id] = x);
    map = createMap();

    loadMarkers(collectPoints, map);
    loadList(collectPoints);
}

/**
 * @param {number} id
 */
function onFocusCollectPoint(id) {
    const collectPoint = collectPointsById[id];

    if (!collectPoint) {
        throw Error(`Collect point not found (ID=${id}).`);
    }

    collectPoint.__marker.getMap().setCenter(collectPoint.__marker.getPosition());
    collectPoint.__marker.get('onclick')();
}

/**
 * @param {Event} event
 */
function onSearchSubmit(event) {
    event.preventDefault();

    if (!map) {
        throw Error('The map hasn\'t been initialized.');
    }

    if (!placesService) {
        placesService = new google.maps.places.PlacesService(map);
    }

    /**
     * @type {HTMLInputElement}
     */
    const searchInput = document.getElementById('search-input');
    const searchList = document.querySelector('.search-list');
    const collectPointsList = document.querySelector('.collect-points-list');

    function clearInput() {
        searchInput.value = '';
        updateLayout();
    }

    function updateLayout() {
        const hasSearch = Boolean(searchInput.value.trim());

        searchList.style.display = hasSearch ? '' : 'none';
        searchList.innerHTML = '';
        collectPointsList.style.display = hasSearch ? 'none' : '';
    }

    function updateSearchResults() {
        if (searchInput.value) {
            placesService.findPlaceFromQuery(
                {
                    query: searchInput.value,
                    fields: ['name', 'geometry.viewport'],
                    locationBias: 'IP_BIAS'
                },
                (results, status) => {
                    searchList.innerHTML = '';

                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        searchList.innerHTML += `<p class="search-list__title">Resultados:</p>`;
                        for (const result of results) {
                            searchList.innerHTML += `
<li class="search-list__item">
    <a href="#">${result.name}</a>
</li>
                                `;

                            searchList.lastElementChild.addEventListener('click', () => {
                                map.fitBounds(result.geometry.viewport);
                                clearInput();
                            });
                        }
                    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        searchList.innerHTML = '<p>Nenhum resultado encontrado.</p>';
                    } else {
                        alert('Algo deu errado. Tente novamente mais tarde.');
                    }
                }
            )
            ;
        }
    }

    updateLayout();
    updateSearchResults();
}

function onUseCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                map.setCenter({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                map.setZoom(15);
            }
        );
    } else {
        alert('Seu browser não suporta geolocalização.');
    }
}

window.addEventListener('load', () => {
    document.getElementById('search-form').addEventListener('submit', onSearchSubmit);
    document.getElementById('use-current-location').addEventListener('click', onUseCurrentLocation);
});