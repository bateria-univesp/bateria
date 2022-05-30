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

const interactivityZoom = 15;

/**
 * @returns {CollectPoint[]}
 */
function getCollectPoints() {
    return JSON.parse(document.getElementById('collect_points').textContent);
}

/**
 * @returns {Promise<unknown>}
 */
function onRequestAnimationFrame() {
    return new Promise(res => requestAnimationFrame(res));
}

/**
 * @template T
 * @param {T[]} array
 * @param {number} chunkSize
 * @return {(T[])[]}
 */
function sliceInChunks(array, chunkSize) {
    if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
        throw Error(`The parameter 'chunkSize' must be a positive integer.`);
    }

    const result = [];

    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }

    return result;
}

/**
 * This function can't be renamed because it's the entry point
 * called by the Google Maps JavaScript API.
 */
async function loadMap() {
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
    async function loadMarkers(collectPoints, map) {
        const markers = [];

        for (const chunk of sliceInChunks(collectPoints, 100)) {
            for (const point of chunk) {
                const marker = new google.maps.Marker({
                    position: new google.maps.LatLng(point.latitude, point.longitude),
                    title: point.name,
                });

                const navigationUrl = new URL('https://www.google.com/maps/dir/');
                navigationUrl.searchParams.set('api', '1');
                navigationUrl.searchParams.set('destination', point.address);

                marker.set('content', `
<div class="map-marker">
    <h1>${point.name}</h1>
    <div class="map-marker-field">
        <small>Endereço</small>
        <p>${point.address}</p>
    </div>
    <div class="map-marker-navigate">
        <a class="button" href="${navigationUrl}" target="_blank">Navegar</a>
    </div>
</div>
            `);

                marker.set('onclick', () => {
                    if (map.getZoom() <= interactivityZoom) {
                        map.setZoom(interactivityZoom);
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
                markers.push(marker);
            }

            await onRequestAnimationFrame();
        }

        const clusterer = new markerClusterer.MarkerClusterer({
            map,
            algorithm: new markerClusterer.SuperClusterAlgorithm({
                extent: 128,
                radius: 40,
                maxZoom: 14,
                minZoom: 12,
                minPoints: 3
            }),
            renderer: {
                render: ({count, position}) => new google.maps.Marker({
                    label: {text: String(count), color: "white", fontSize: "0.625rem"},
                    position,
                    // adjust zIndex to be above other markers
                    zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
                })
            }
        });

        /**
         * The 'tilesloaded' event is used here because it's triggered less often
         * than 'bounds_changed', for example, and this speeds up the website.
         */
        google.maps.event.addListener(map, 'tilesloaded', () => {
            const bounds = map.getBounds();
            clusterer.clearMarkers();
            clusterer.addMarkers(markers.filter(marker => bounds.contains(marker.getPosition())));
        });
    }

    /**
     * @param {CollectPoint[]} collectPoints
     */
    async function loadList(collectPoints) {
        const list = document.querySelector('.collect-points-list');

        // Empty the list to remove the loading state placeholder
        list.innerHTML = '';

        if (collectPoints.length === 0) {
            if (map.getZoom() < interactivityZoom) {
                list.innerHTML = `
<li class="collect-points-list__loading">
    Aproxime em uma área do mapa
    <br>
    para ver detalhes dos pontos de coleta.
</li>
            `;
            } else {
              list.innerHTML = `
<li class="collect-points-list__loading">
    <p style="margin-bottom: 0.5rem">
    Esta região não possui pontos de coleta.
    </p>
    <p>
        <a href="mailto:lv201122+bateria@gmail.com">Entre em contato conosco</a>
        <span style="white-space: nowrap">para sugerir novos pontos.</span>
    </p>
</li>
            `;
            }

            return;
        }

        for (const chunk of sliceInChunks(collectPoints, 3)) {
            for (const point of chunk) {

                list.innerHTML += `
<li class="collect-points-list__item" onclick="onFocusCollectPoint(${point.id})">
    <h2>${point.name}</h2>
    <div class="collect-points-list__item__field">
        <p>${point.address}</p>
    </div>
</li>
                `;
            }

            // Wait for the next frame to add a new point.
            await new Promise(res => requestAnimationFrame(res));
        }
    }

    function watchBoundsChanged() {
        // Manual debounce
        let timeoutId = -1;

        async function updateList() {
            timeoutId = -1;

            const zoom = map.getZoom();

            if (zoom < interactivityZoom) {
                await loadList([]);
                return;
            }

            const bounds = map.getBounds();
            const pointsInBounds = collectPoints
                .filter(x => bounds.contains({
                    lat: x.latitude,
                    lng: x.longitude
                }));

            const center = map.getCenter();
            const centerLat = center.lat();
            const centerLng = center.lng();

            pointsInBounds.sort((x, y) => {
                // Calculate distance using simple trigonometry because the zoom level
                // is too high for the Earth radius to have any effect on the results.
                const deltaX1 = centerLng - x.longitude;
                const deltaY1 = centerLat - x.latitude;
                const distance1 = Math.sqrt(Math.pow(deltaX1, 2) + Math.pow(deltaY1, 2));

                const deltaX2 = centerLng - y.longitude;
                const deltaY2 = centerLat - y.latitude;
                const distance2 = Math.sqrt(Math.pow(deltaX2, 2) + Math.pow(deltaY2, 2));

                return distance1 - distance2;
            });

            await loadList(pointsInBounds);
        }

        google.maps.event.addListener(map, 'bounds_changed', async () => {
            if (timeoutId < 0) {
                timeoutId = setTimeout(updateList, 500);
            }
        });
    }

    const collectPoints = getCollectPoints();
    collectPoints.forEach(x => collectPointsById[x.id] = x);
    map = createMap();

    await onRequestAnimationFrame();
    await loadMarkers(collectPoints, map);
    // Load the list with an empty list to show instructions to the user.
    await loadList([]);

    watchBoundsChanged();
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