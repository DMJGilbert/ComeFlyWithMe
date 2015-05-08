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

var esriPoint;

var flight = {};

//latitude: 51.10524
//longitude: -0.49579

require(["esri/map", "esri/geometry/Point", "dojo/domReady!"], function (Map, Point) {
	esriPoint = Point;
	map = new Map("map", {
		center: [lng, lat],
		zoom: 15,
		basemap: "satellite"
	});
	init();
	getWeather(lat, lng);
});

function init() {

	container = document.createElement('div');
	document.body.appendChild(container);


	container.style.position = 'absolute';
	container.style.top = '0px';

	camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 3000);
	camera.position.z = 8000;
	camera.position.y = 1000;

	scene = new THREE.Scene();

	geometry = new THREE.Geometry();

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

	$.ajax({
		url: '/api/inflightinfo/?id=' + term
	}).done(function (data) {
		if (data.error) {
			console.log('error');
		} else {
			flight = data.InFlightInfoResult;
			console.log(flight);
			lat = flight.latitude;
			lng = flight.longitude;
			getWeather(lat, lng);
			map.centerAt(new esriPoint(lng, lat));
		}
	}).error(function () {
		showError();
	})
	return false;
}

function showError() {
	var button = $('form>button');
	button.css('background-color', '#902636');
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
//	if (date > sunrise && date < sunset) {
//		$('#timeOverlay').css('background-color', 'rgba(0, 0, 0, 0.1)');
//	} else {
//		$('#timeOverlay').css('background-color', 'rgba(0, 0, 0, 0.77)');
//	}
}

function onWindowResize(event) {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	position = ((Date.now() - startTime) * 0.03) % 4000;

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
	geometry = new THREE.Geometry();
	plane = new THREE.Mesh(new THREE.PlaneGeometry(64, 64));
	var p = 1500 * (clouds / 100);
	for (var i = 0; i < p; i++) {
		plane.position.x = Math.random() * 1000 - 500;
		plane.position.y = Math.random() * Math.random() * 1200 - 15;
		plane.position.z = Math.random() * 4000;
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
				if(lat == 0 && lng == 0){
					flight = undefined;
					showFlightLanded();
				}

				map.centerAt(new esriPoint(lng, lat));

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

	var distance = (flight.groundspeed / 1050) * 100;

	var newLatLong = new LatLon(lat, lng).destinationPoint(distance, flight.heading, 6371000);
	lat = newLatLong.lat;
	lng = newLatLong.lon;

//	console.log(newLatLong);

	map.centerAt(new esriPoint(lng, lat))
}

function showFlightLanded(){
	document.getElementById('landedModal').style.display = 'block';
}

function hideFlightLanded(){
	document.getElementById('landedModal').style.display = 'none';
}

setInterval(function () {
	if (flight.ident) {
		getFlightInfo();
	}
}, 60000);

setInterval(function () {
	if (flight.ident) {
		updateFlightPath()
	}
}, 100);
