var container;
var camera, scene, renderer;
var mesh, geometry, material;

var mouseX = 0,
	mouseY = 0;
var start_time = Date.now();

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var flightId = '';
var lastKnownLong, lastKnownLat, longDif, latDif;

init();

function init() {

	container = document.createElement('div');
	document.body.appendChild(container);

	// Bg gradient

	var canvas = document.createElement('canvas');
	canvas.id = 'canvasClouds';
	canvas.width = 32;
	canvas.height = window.innerHeight;

	var context = canvas.getContext('2d');

	//

	camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 3000);
	camera.position.z = 6000;

	scene = new THREE.Scene();

	geometry = new THREE.Geometry();

	var texture = THREE.ImageUtils.loadTexture('../img/cloud10.png', null, animate);
	texture.magFilter = THREE.LinearMipMapLinearFilter;
	texture.minFilter = THREE.LinearMipMapLinearFilter;

	var fog = new THREE.Fog(0xffffff, -100, 3000);

	material = new THREE.ShaderMaterial({

		uniforms: {

			"map": {
				type: "t",
				value: texture
			},
			"fogColor": {
				type: "c",
				value: fog.color
			},
			"fogNear": {
				type: "f",
				value: fog.near
			},
			"fogFar": {
				type: "f",
				value: fog.far
			},

		},
		vertexShader: document.getElementById('vs').textContent,
		fragmentShader: document.getElementById('fs').textContent,
		depthWrite: false,
		depthTest: false,
		transparent: true

	});

	plane = new THREE.Mesh(new THREE.PlaneGeometry(64, 64));

	for (var i = 0; i < 4000; i++) {
		plane.position.x = Math.random() * 1000 - 500;
		plane.position.y = Math.random() * Math.random() * 200 - 15;
		plane.position.z = i;
		plane.rotation.z = Math.random() * Math.PI;
		plane.scale.x = plane.scale.y = Math.random() * Math.random() * 1.5 + 0.5;
		plane.rotation.x = 180;
		THREE.GeometryUtils.merge(geometry, plane);
	}

	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	mesh = new THREE.Mesh(geometry, material);
	mesh.position.z = -400;
	scene.add(mesh);

	renderer = new THREE.WebGLRenderer({
		antialias: false
	});
	renderer.setSize(window.innerWidth, window.innerHeight);

	renderer.domElement.id = 'canvasClouds';

	container.appendChild(renderer.domElement);

	$('#canvasClouds').css('position', 'absolute');
	$('#canvasClouds').css('width', '100%');
	$('#canvasClouds').css('height', '100%');
	$('#canvasClouds').css('left', '0');

	window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize(event) {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

	requestAnimationFrame(animate);

	position = ((Date.now() - start_time) * 0.005) % 4000;

	camera.position.z = -position + 2000;
	camera.position.y = 400;

	// camera.position.x = - position + 400;

	camera.rotation.x = -Math.PI / 2;

	camera.rotation.y = 0; // Y first
	// camera.rotation.x = 0;

	renderer.render(scene, camera);

}

var lat = 51.5033630;
var lng = -0.1276250;
var lastLat = 51.5033630;
var lastLng = -0.1276250;

var latlng = new google.maps.LatLng(lat, lng);

var myOptions = {
	zoom: 15,
	disableDefaultUI: true,
	center: latlng,
	mapTypeId: google.maps.MapTypeId.SATELLITE
};
var map = new google.maps.Map(document.getElementById("map"), myOptions);

setInterval(function () {
	if (flightId) {
		getFlightInfo(flightId);
	}
}, 10000);

setInterval(function (){
	if(longDif){
		updateFlightPath();
	}
}, 60);

function getFlight() {
	$.ajax({
		url: "/api/flights/search?query=" + document.getElementById('flightNo').value,
	}).done(function (data) {
		location.href = '/flight?id=' + data.result.response.flight.data[Object.keys(data.result.response.flight.data)[0]].identification.id;
	});
}

function getFlightInfo(id) {
	flightId = id;
	$.ajax({
		url: "/api/flight/?id=" + id
	}).done(function (data) {
		var newData = JSON.parse(data)
		if(lastLat != newData.trail[0] && lastLng != newData.trail[1]){
			map.setCenter(new google.maps.LatLng(newData.trail[0], newData.trail[1]));

			lat = lastLat = newData.trail[0];
			lng = lastLng = newData.trail[1];
			longDif = newData.trail[4] - newData.trail[1];
			latDif = newData.trail[3] - newData.trail[0];


			// Returns a float with the angle between the two points
			var x = newData.trail[3] - newData.trail[0];
			var dLon = newData.trail[4] - newData.trail[1];

			var y = Math.sin(dLon) * Math.cos(newData.trail[3]);

			var x = Math.cos(newData.trail[0]) * Math.sin(newData.trail[3]) - Math.sin(newData.trail[0]) * Math.cos(newData.trail[3]) * Math.cos(dLon);

			var brng = Math.atan2(y, x);

			brng = brng * (180 / Math.PI);

			$('#map').css('transform', 'rotate(' + (brng) + 'deg)');
			map.setZoom(convertAltToZoom(newData.trail[2]));
		}
	});
}

function updateFlightPath(){
	lng -= longDif / 1000;
	lat -= latDif / 1000;
	map.setCenter(new google.maps.LatLng(lat, lng));
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
