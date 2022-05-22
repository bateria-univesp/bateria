/**
 * The representation of a CollectPoint
 * @typedef {Object} CollectPoint
 * @property {number} id
 * @property {string} name
 * @property {string} address
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
 * @type {google.maps.InfoWindow | null}
 */
let infoWindow = null;

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
            center: {lat: -23.6076277, lng: -46.6017167},
            zoom: 11.25,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            mapId: '77c239c51543e29e'
        });
    }

    function initializeInfoWindowIfNeeded() {
        if (!infoWindow) {
            infoWindow = new google.maps.InfoWindow();
        }
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
                title: point.name,
            });

            const navigationUrl = new URL('https://www.google.com/maps/dir/');
            navigationUrl.searchParams.set('api', 1);
            navigationUrl.searchParams.set('destination', point.address);

            marker.set('content', `
<div class="map-marker">
    <h1>${point.name}</h1>
    <div class="map-marker-field">
        <small>Endereço</small>
        <p>${point.address}</p>
    </div>
    <div class="map-marker-navigate">
        <a class="button" href="${navigationUrl}" target="_blank">Navigate</a>
    </div>
</div>
            `);

            marker.set('onclick', () => {
                const minMapZoom = 15;
                if (map.getZoom() <= minMapZoom) {
                    map.setZoom(minMapZoom);
                }
                map.setCenter(marker.getPosition());

                initializeInfoWindowIfNeeded();
                infoWindow.setContent(marker.get('content'));
                infoWindow.open({
                    anchor: marker,
                    map: map,
                    shouldFocus: false
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
        <p>${point.address}</p>
    </div>
</li>
            `;
        }
    }

    const collectPoints = getCollectPoints();
    collectPoints.forEach(x => collectPointsById[x.id] = x);
    map = createMap();

    loadMarkers(collectPoints, map);
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