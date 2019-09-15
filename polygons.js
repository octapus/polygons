'use strict';

var pointAmount = 8;

function randomPoints(amount) {
	var result = [];
	for(var i = 0; i < amount; i++) {
		result.push([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1]);
		// result[result.length - 1][3] = result[result.length - 1][2]; // overwrite color with z coord
	}
	return result;
}

function resizeRendererToDisplaySize(renderer) {
	const canvas = renderer.domElement;
	const pixelRatio = window.devicePixelRatio;
	const width = canvas.clientWidth * pixelRatio | 0;
	const height = canvas.clientHeight * pixelRatio | 0;
	const needResize = canvas.width != width || canvas.height != height;
	if(needResize) {
		renderer.setSize(width, height, false);
	}
	return needResize;
}


function main() {
	const scene = new THREE.Scene();

	const canvas = document.querySelector('#c');
	const renderer = new THREE.WebGLRenderer({canvas, antialias: true});

	const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000 );
	camera.position.z = 2;

	scene.add(new THREE.AmbientLight(0xFFFFFF, 0.2));
	const cameraLight = new THREE.PointLight(0xFFFFFF, 0.8);
	cameraLight.position.set(camera.position.x, camera.position.y, camera.position.z);
	scene.add(cameraLight);

	// TODO: make own trackball controls
	const controls = new THREE.OrbitControls(camera, canvas);
	controls.target.set(0, 0, 0);

	// TODO: replace dots with shapes
	var currentBase = randomPoints(pointAmount);
	var baseGeometry = [];
	var baseMaterial = [];
	var basePoints = [];
	for(var i = 0; i < currentBase.length; i++) {
		baseGeometry[i] = new THREE.Geometry();
		baseGeometry[i].vertices.push(new THREE.Vector3(currentBase[i][0], currentBase[i][1], currentBase[i][2]));
		baseGeometry[i].colors.push(new THREE.Color("hsl(" + (currentBase[i][3] + 1) * 180 + ", 100%, 50%)"));
		baseMaterial[i] = new THREE.PointsMaterial( { size: 12, sizeAttenuation: false, vertexColors: THREE.VertexColors } );

		basePoints[i] = new THREE.Points(baseGeometry[i], baseMaterial[i]);
		basePoints[i].visible = false;

		scene.add(basePoints[i]);
	}

	function render() {
		if(resizeRendererToDisplaySize(renderer)) {
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}

		cameraLight.position.set(camera.position.x, camera.position.y, camera.position.z);

		renderer.render(scene, camera);
	}
	render();

	var spaceHeld = false;
	var keysHeld = [];

	var line;
	var triangle;
	var tetrahedron;

	var finalPolygons = [];
	document.addEventListener('keydown', function(event) {
		// TODO: pressing space after a triangle has already been drawn doesn't add it to finalPolygons
		if(event.keyCode == 32) {
			spaceHeld = true;
			return;
		}
		if(event.keyCode == 13) {
			for(var point of basePoints) {
				point.visible = true;
			}
			for(var polygon of finalPolygons) {
				scene.add(polygon);
			}
			render();
			return;
		}

		var key = event.keyCode - 65;
		if(key >= 0 && key < pointAmount) {
			basePoints[key].visible = true;
			if(!keysHeld.includes(key)) {
				keysHeld.push(key);

				if(keysHeld.length == 2) {
					var lineGeometry = new THREE.Geometry();
					for(var k of keysHeld) {
						lineGeometry.vertices.push(baseGeometry[k].vertices[0]);
						lineGeometry.colors.push(baseGeometry[k].colors[0]);
					}

					var lineMaterial = new THREE.LineBasicMaterial( { linewidth: 8, vertexColors: THREE.VertexColors } );
					line = new THREE.Line(lineGeometry, lineMaterial);

					scene.add(line);
				} else if(keysHeld.length == 3) {
					scene.remove(line);
					var triangleGeometry = new THREE.Geometry();
					for(var k of keysHeld) {
						triangleGeometry.vertices.push(baseGeometry[k].vertices[0]);
						triangleGeometry.colors.push(baseGeometry[k].colors[0]);
					}
					var triangleFace = new THREE.Face3(0, 1, 2);
					triangleFace.vertexColors = triangleGeometry.colors;

					triangleGeometry.faces.push(triangleFace);
					triangleGeometry.computeFaceNormals();

					var triangleMaterial = new THREE.MeshPhongMaterial( { vertexColors: THREE.VertexColors, side: THREE.DoubleSide } );

					triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);

					scene.add(triangle);
				} else if(keysHeld.length == 4) {
					scene.remove(triangle);
					var tetrahedronGeometry = new THREE.Geometry();
					for(var k of keysHeld) {
						tetrahedronGeometry.vertices.push(baseGeometry[k].vertices[0]);
						tetrahedronGeometry.colors.push(baseGeometry[k].colors[0]);
					}
					var tetrahedronFaces = [ new THREE.Face3(0, 1, 2), new THREE.Face3(0, 2, 3), new THREE.Face3(0, 3, 1), new THREE.Face3(1, 3, 2) ];
					for(var face of tetrahedronFaces) {
						face.vertexColors = [ tetrahedronGeometry.colors[face.a], tetrahedronGeometry.colors[face.b], tetrahedronGeometry.colors[face.c] ];
					}

					tetrahedronGeometry.faces = tetrahedronFaces;
					tetrahedronGeometry.computeFaceNormals();

					var tetrahedronMaterial = new THREE.MeshPhongMaterial( { vertexColors: THREE.VertexColors, side: THREE.DoubleSide  } );

					tetrahedron = new THREE.Mesh(tetrahedronGeometry, tetrahedronMaterial);

					scene.add(tetrahedron);

					if(spaceHeld && !finalPolygons.includes(tetrahedron)) {
						finalPolygons.push(tetrahedron);
					}
				}
			}

			render();
		}
	});

	document.addEventListener('keyup', function(event) {
		if(event.keyCode == 8) {
			finalPolygons.pop();
		}
		if(event.keyCode == 32) {
			spaceHeld = false;
			for(var point of basePoints) {
				point.visible = false;
			}
			keysHeld = [];
			scene.remove(line);
			scene.remove(triangle);
			scene.remove(tetrahedron);
			render();
		}
		if(event.keyCode == 13) {
			for(var i = 0; i < basePoints.length; i++) {
				if(!keysHeld.includes(i)) {
					basePoints[i].visible = false;
				}
			}
			for(var polygon of finalPolygons) {
				scene.remove(polygon);
			}
			render();
		}

		if(!spaceHeld) {
			var key = event.keyCode - 65;
			if(key >= 0 && key < pointAmount) {
				basePoints[key].visible = false;
				var index = keysHeld.indexOf(key);
				if(index > -1) {
					keysHeld.splice(index, 1);

					if(index == 0 || index == 1) {
						scene.remove(line);
					}
					if(index == 0 || index == 1 || index == 2) {
						scene.remove(triangle);
					}
					if(index == 0 || index == 1 || index == 2 || index == 3) {
						scene.remove(tetrahedron);
					}
				}
				render();
			}
		}
	});

	controls.addEventListener('change', render);
	window.addEventListener('resize', render);
}

main();
