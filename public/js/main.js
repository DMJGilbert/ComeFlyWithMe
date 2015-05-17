var startTime = Date.now();

var lat = 51.500183;
var lng = -0.1290511;
var lastLat;
var lastLng;

var map;
var camera;
var renderer;
var scene;
var material;
var mesh;

var ESRIPoint;
var config;

var flight = {};

require(["esri/map", "esri/geometry/Point", "esri/config", "dojo/domReady!"], function (Map, Point, esriConfig) {
	ESRIPoint = Point;
	config = esriConfig;
	esriConfig.defaults.map.panDuration = 1; // time in milliseconds, default panDuration: 350
	esriConfig.defaults.map.panRate = 1; // default panRate: 25
	esriConfig.defaults.map.zoomDuration = 100; // default zoomDuration: 500
	esriConfig.defaults.map.zoomRate = 1; // default zoomRate: 25
	map = new Map("map", {
		center: [lng, lat],
		zoom: 15,
		basemap: "satellite"
	});

	init();
	getWeather(lat, lng);
});

function init() {

	var container = document.createElement('div');
	document.body.appendChild(container);


	container.style.position = 'absolute';
	container.style.top = '0px';

	camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 3000);
	camera.position.z = 8000;
	camera.position.y = 1000;

	scene = new THREE.Scene();

	var geometry = new THREE.Geometry();

	var texture = THREE.ImageUtils.loadTexture('img/cloud10.png', null, animate);
	texture.magFilter = THREE.LinearMipMapLinearFilter;
	texture.minFilter = THREE.LinearMipMapLinearFilter;

	material = new THREE.ShaderMaterial({
		uniforms: {
			"map": {
				type: "t",
				value: texture
			}
		},
		vertexShader: document.getElementById('vs').textContent,
		fragmentShader: document.getElementById('fs').textContent,
		depthWrite: false,
		depthTest: false,
		transparent: true
	});

	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	mesh = new THREE.Mesh(geometry, material);
	mesh.position.z = -8000;
	scene.add(mesh);

	renderer = new THREE.WebGLRenderer({
		antialias: false
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	window.addEventListener('resize', onWindowResize, false);
}

function checkFlight() {
	var term = $('form>input').val();
	if (term == '') {
		term = 'random'
	} else {
		term = '?id=' + term;
	}
	$.ajax({
		url: '/api/inflightinfo/' + term
	}).done(function (data) {
		if (data.error) {
			showError();
		} else {
			flight = data.InFlightInfoResult;
			console.log(flight);
			lat = flight.latitude;
			lng = flight.longitude;

			$('#code').html(flight.ident);
			$('#flightDetails').show();

			$.ajax({
				url: '/api/airport/?id=' + flight.origin
			}).done(function (data) {
				if (data.error) {
					console.log('error');
				} else {
					console.log(data);
					$('#origin').html(data.AirportInfoResult.location);

				}
			}).error(function () {
				showError();
			});

			$.ajax({
				url: '/api/airport/?id=' + flight.destination
			}).done(function (data) {
				if (data.error) {
					console.log('error');
				} else {
					console.log(data);
					$('#destination').html(data.AirportInfoResult.location);
				}
			}).error(function () {
				showError();
			});

			config.defaults.map.panDuration = 1; // time in milliseconds, default panDuration: 350
			config.defaults.map.panRate = 1; // default panRate: 25
			config.defaults.map.zoomDuration = 100; // default zoomDuration: 500
			config.defaults.map.zoomRate = 1; // default zoomRate: 25

			getWeather(lat, lng);
			map.setZoom(convertAltToZoom(flight.altitude));
			camera.position.y = 1500 / 20 * (19 - convertAltToZoom(flight.altitude));
			map.disablePan();
			map.centerAt(new ESRIPoint(lng, lat));

			setTimeout(function () {
				config.defaults.map.panDuration = 350; // time in milliseconds, default panDuration: 350
				config.defaults.map.panRate = 25; // default panRate: 25
				config.defaults.map.zoomDuration = 500; // default zoomDuration: 500
				config.defaults.map.zoomRate = 25; // default zoomRate: 25
			}, 400);
		}
	}).error(function () {
		showError();
	})
	return false;
}

function showError() {
	var button = $('form>button');
	button.css('background-color', '#902636');
	$('#flightInfo').hide();
	button[0].innerHTML = "OOPS";
}

function clearError() {
	var button = $('form>button');
	button.css('background-color', '#28303B');
	button[0].innerHTML = "FLY";
}

function getWeather(lat, lng) {
	$.ajax({
		url: "/api/weather/?lat=" + lat + "&lng=" + lng,
	}).done(function (data) {
		var weatherData = JSON.parse(data);
		calculateLightLevel(weatherData.dt, weatherData.sys.sunrise, weatherData.sys.sunset);
		generateClouds(weatherData.clouds.all);
	});
}

function calculateLightLevel(date, sunrise, sunset) {
	if (date > sunrise && date < sunset) {
		$('#timeOverlay').css('background-color', 'rgba(0, 0, 0, 0.1)');
	} else {
		$('#timeOverlay').css('background-color', 'rgba(0, 0, 0, 0.77)');
	}
}

function onWindowResize(event) {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	var position = ((Date.now() - startTime) * 0.03) % 4000;

	camera.position.z = -position + 4000;
	camera.rotation.x = -Math.PI / 2;
	camera.rotation.y = 0;

	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

function generateClouds(clouds) {
	//clouds = 100 - clouds;
	var length = scene.children.length;
	for (var i = 0; i < length; i++) {
		scene.remove(scene.children[0])
	}
	var geometry = new THREE.Geometry();
	var plane = new THREE.Mesh(new THREE.PlaneGeometry(64, 64));
	var p = 1500 * (clouds / 100);
	for (var i = 0; i < p; i++) {
		plane.position.x = Math.random() * 1000 - 500;
		plane.position.y = Math.random() * Math.random() * 1200 - 15;
		plane.position.z = Math.random() * 4000 + 20;
		plane.rotation.z = Math.random() * Math.PI;
		plane.scale.x = plane.scale.y = Math.random() * Math.random() * 5 + 0.5;
		plane.rotation.x = 180;
		THREE.GeometryUtils.merge(geometry, plane);
	}
	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);
}

function getFlightInfo() {
	if (flight.ident) {
		$.ajax({
			url: '/api/inflightinfo/?id=' + flight.ident
		}).done(function (data) {
			if (data.error) {
				console.log('error');
			} else {
				flight = data.InFlightInfoResult;
				console.log(data);
				lat = flight.latitude;
				lng = flight.longitude;

				getWeather(lat, lng);
				if (lat == 0 && lng == 0) {
					flight = undefined;
					showFlightLanded();
				}

				map.centerAt(new ESRIPoint(lng, lat));
				map.setZoom(convertAltToZoom(flight.altitude));

				camera.position.y = 500 / 20 * (19 - convertAltToZoom(flight.altitude));

				$('#map').css('transform', 'rotate(' + flight.heading + 'deg)');
			}
		}).error(function () {
			showError();
		})
		return false;
	}
}

function updateFlightPath() {
	$('#map').css('transform', 'rotate(' + (360 - flight.heading) + 'deg)');

	var distance = flight.groundspeed * 1000 / (60 * 60 * 10);

	var newLatLong = new LatLon(lat, lng).destinationPoint(distance, flight.heading, 6371000);
	lat = newLatLong.lat;
	lng = newLatLong.lon;

	//	console.log(newLatLong);

	map.centerAt(new ESRIPoint(lng, lat));
}

function showFlightLanded() {
	document.getElementById('landedModal').style.display = 'block';
}

function hideFlightLanded() {
	document.getElementById('landedModal').style.display = 'none';
}

function convertAltToZoom(alt) {
	var zoom = Math.round(Math.log(35200000 / alt) / Math.log(2));
	if (zoom < 0) {
		zoom = 0;
	} else if (zoom > 19) {
		zoom = 19;
	}
	return zoom;
}

setInterval(function () {
	if (flight && flight.ident) {
		getFlightInfo();
	}
}, 60000);

setInterval(function () {
	if (flight && flight.ident) {
		updateFlightPath()
	}
}, 100);
