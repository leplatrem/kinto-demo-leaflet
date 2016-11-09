function main() {
  // Mozilla demo server (flushed every day)
  var server = "https://kinto.dev.mozaws.net/v1";
  // Simplest credentials ever.
  var authorization =  "Basic " + btoa("public:notsecret");

  // Kinto bucket/collection.
  var bucket = "default";
  var collection = "kinto_demo_leaflet";
  var url = `${server}/buckets/${bucket}/collections/${collection}/records`;

  // Resuable HTTP headers.
  var headers = {
    "Accept":        "application/json",
    "Content-Type":  "application/json",
    "Authorization": authorization,
  };

  // Initialize map centered on my hometown.
  var map = L.map('map', {
    doubleClickZoom: false,
    layers: [L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')],
    center: [48.49, 1.395],
    zoom: 16
  });

  // Group of markers.
  var markers = {};

  // Get records from server on load.
  fetch(url, {headers: headers})
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      // Add each marker to map.
      result.data.map(addMarker);
    });

  // Create marker on double-click.
  map.on('dblclick', function(event) {
    // POST the record on server.
    var body = JSON.stringify({data: {latlng: event.latlng}});
    fetch(url, {method: "POST", body: body, headers: headers})
      .then(function (response) {
        return response.json();
      })
      .then(function (result) {
        // Add marker to map.
        addMarker(result.data);
      });
  });

  function addMarker(record) {
    // Create new marker.
    var marker = L.marker(record.latlng, {draggable: true})
                  .addTo(map);
    // Store reference by record id.
    markers[record.id] = marker;

    // Listen to events on marker.
    var recordUrl = `${url}/${record.id}`;
    marker.on('dblclick', function () {
      // Send DELETE request on server.
      fetch(recordUrl, {method: "DELETE", headers: headers})
        .then(removeMarker.bind(undefined, record));
    });
    marker.on('dragend', function () {
      var body = JSON.stringify({data: {latlng: marker.getLatLng()}});
      // Send PATCH request (modify) on server.
      fetch(recordUrl, {method: "PATCH", body: body, headers: headers});
    });
  }

  function removeMarker(record) {
    map.removeLayer(markers[record.id]);
    delete markers[record.id];
  }
}

window.addEventListener("DOMContentLoaded", main);
