var Vroom = {
	////////////////////////////// INIT //////////////////////////////
	init: function(options) {
		// Canvas
		Vroom.canvas = document.getElementById('vroom-canvas');
		Vroom.ctx = Vroom.canvas.getContext('2d');

		// Layers
		Vroom.maxLayers = 6;
		Vroom.layers = [];

		// Scale content
		Vroom.canvasSizeCache = {
			width: Vroom.canvas.width,
			height: Vroom.canvas.height,
		};
		Vroom.dim = options.dim;
		Vroom.scale = {
			x: Vroom.canvas.width / Vroom.dim.width,
			y: Vroom.canvas.height / Vroom.dim.height,
		};
		Vroom.ctx.scale(Vroom.scale.x, Vroom.scale.y);

		// Audio
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		Vroom.audioCtx = new AudioContext();

		// Run variables
		Vroom.fps = 60;

		// Camera
		Vroom.activeCamera = null;

		// Entity related lists
		Vroom.usedIDList = {};
		Vroom.entityList = {};

		// Input state
		Vroom.inputPreventDefault = [];
		Vroom.keyStateList = {};
		Vroom.mouseState = {
			pos: {
				x: 0,
				y: 0,
			},
			mouseDown: false,
			clicked: false,
		};

		// Engine state
		Vroom.halt = false;

		// Read init options
		if(typeof options !== 'undefined') {
			// fps
			if(typeof options.fps !== 'undefined' && typeof options.fps === 'number') {
				Vroom.fps = options.fps;
			}

			// inputPreventDefault
			if(typeof options.inputPreventDefault !== 'undefined' && Array.isArray(options.inputPreventDefault)) {
				Vroom.inputPreventDefault = options.inputPreventDefault;
			}

			// BckgroundColor
			if(typeof options.backgroundColor !== 'undefined') {
				Vroom.backgroundColor = options.backgroundColor;
			} else {
				Vroom.backgroundColor = '#000';
			}
		}

		// Event listners
		document.addEventListener('keydown', Vroom.handleKeyDown);
		document.addEventListener('keyup', Vroom.handleKeyUp);
		Vroom.canvas.addEventListener('mousemove', Vroom.handleMouseMove);
		Vroom.canvas.addEventListener('mousedown', Vroom.handleMouseDown);
		Vroom.canvas.addEventListener('mouseup', Vroom.handleMouseUp);
		Vroom.canvas.addEventListener('click', Vroom.handleMouseClick);

		// Check for canvas resize
		window.setInterval(function() {
			if(Vroom.canvas.width !== Vroom.canvasSizeCache.width || Vroom.canvas.height !== Vroom.canvasSizeCache.height) {
				Vroom.canvasSizeCache = {
					width: Vroom.canvas.width,
					height: Vroom.canvas.height,
				};
				Vroom.setCanvasScale();
			}
		}, 250);

		Vroom.mainUpdateLoopExtension = null;
	},





	////////////////////////////// UTILITY FUNCTIONS //////////////////////////////
	generateID: function() {
		var uniqe = false;
		var ID = '';

		while(uniqe === false) {
			// Generate 10 character random string starting with underscore
			ID = '_' + Math.random().toString(36).substr(2, 9);

			// Check if ID id already in use
			if(typeof Vroom.usedIDList[ID] === 'undefined') {
				uniqe = true;
			}
		}

		Vroom.usedIDList[ID] = ID;

		return ID;
	},

	setCanvasScale: function() {
		Vroom.scale = {
			x: Vroom.canvas.width / Vroom.dim.width,
			y: Vroom.canvas.height / Vroom.dim.height,
		};
		Vroom.ctx.scale(Vroom.scale.x, Vroom.scale.y);
	},

	getScaledPos: function(pos) {
		return {
			x: pos.x * Vroom.scale.x,
			y: pos.y * Vroom.scale.y,
		};
	},

	getCameraRelativePos: function(pos, camera) {
		if(typeof camera === 'undefined') {
			camera = Vroom.activeCamera;
		}

		var scaled = Vroom.getScaledPos(pos);

		return {
			x: pos.x * camera.zoom - camera.pos.x,
			y: pos.y * camera.zoom - camera.pos.y,
		};
	},

	getCameraRelativeDim: function(dim, camera) {
		if(typeof camera === 'undefined') {
			camera = Vroom.activeCamera;
		}

		return {
			width: dim.width * camera.zoom,
			height: dim.height * camera.zoom,
		};
	},

	lerpValue: function(step, value, targetValue, lerpPercentage) {
		var iterpolatedValue = 0;
		if(lerpPercentage !== false) {
			iterpolatedValue = (targetValue - value) * (lerpPercentage * (step * 10));
		} else {
			iterpolatedValue = targetValue - value;
		}

		if(Math.abs(targetValue - value) < 0.001) {
			iterpolatedValue = targetValue - value;
		}

		return iterpolatedValue;
	},

	lerpPosition: function(step, position, targetPosition, lerpPercentage) {
		return {
			x: this.lerpValue(step, position.x, targetPosition.x, lerpPercentage),
			y: this.lerpValue(step, position.y, targetPosition.y, lerpPercentage),
		};
	},

	getDistance: function(pos1, pos2) {
		return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
	},

	multilineText: function(text, x, y, margin) {
		if(typeof margin === 'undefined') {
			margin = 0;
		}

		textLines = text.split('\n');

		for(var i = 0; i < textLines.length; i++) {
			Vroom.ctx.fillText(textLines[i], x, y + (margin * i));
		}
	},





	////////////////////////////// INPUT //////////////////////////////
	handleKeyDown: function(e) {
		if(!e) e = window.event;
		if(Vroom.inputPreventDefault.includes(e.keyCode)) {
			e.preventDefault();
		}

		Vroom.keyStateList[String.fromCharCode(e.keyCode)] = true;
	},

	handleKeyUp: function(e) {
		if(!e) e = window.event;
		if(Vroom.inputPreventDefault.includes(e.keyCode)) {
			e.preventDefault();
		}

		Vroom.keyStateList[String.fromCharCode(e.keyCode)] = false;
	},

	isKeyPressed: function(keyCode) {
		key = String.fromCharCode(keyCode);
		if(key) {
			if(typeof Vroom.keyStateList[key] !== 'undefined' && Vroom.keyStateList[key] === true) {
				return true;
			}
		}

		return false;
	},

	handleMouseMove: function(e) {
		if(!e) e = window.event;
		var rect = Vroom.canvas.getBoundingClientRect();
		Vroom.mouseState.pos.x = (e.clientX - rect.left) / Vroom.scale.x;
		Vroom.mouseState.pos.y = (e.clientY - rect.top) / Vroom.scale.y;
	},

	handleMouseClick: function(e) {
		if(!e) e = window.event;
		Vroom.mouseState.clicked = true;
	},

	handleMouseDown: function(e) {
		if(!e) e = window.event;
		Vroom.mouseState.mouseDown = true;
	},

	handleMouseUp: function(e) {
		if(!e) e = window.event;
		Vroom.mouseState.mouseDown = false;
	},

	resetMouseState: function() {
		Vroom.mouseState.clicked = false;
	},

	isMouseOverArea: function(pos, dim, relativeToCamera) {
		if(typeof relativeToCamera === 'undefined') {
			relativeToCamera = true;
		}

		var areaPos = pos;
		var areaDim = dim;

		if(relativeToCamera) {
			areaPos = Vroom.getCameraRelativePos(areaPos);
			areaDim = Vroom.getCameraRelativeDim(areaDim);
		}

		if( Vroom.mouseState.pos.x > areaPos.x &&
			Vroom.mouseState.pos.x < areaPos.x + areaDim.width &&
			Vroom.mouseState.pos.y > areaPos.y &&
			Vroom.mouseState.pos.y < areaPos.y + areaDim.height
		) {
			return true;
		}

		return false;
	},

	isAreaClicked: function(pos, dim, relativeToCamera) {
		if(Vroom.mouseState.clicked) {
			if(typeof relativeToCamera === 'undefined') {
				relativeToCamera = true;
			}

			return Vroom.isMouseOverArea(pos, dim, relativeToCamera);
		}

		return false;
	},

	isEntityClicked: function(ID, relativeToCamera) {
		if(typeof relativeToCamera === 'undefined') {
			relativeToCamera = true;
		}

		if(typeof Vroom.entityList[ID] !== 'undefined') {
			if(typeof Vroom.entityList[ID].pos !== 'undefined' && typeof Vroom.entityList[ID].dim !== 'undefined') {
				return Vroom.isAreaClicked(Vroom.entityList[ID].pos, Vroom.entityList[ID].dim, relativeToCamera);
			} else {
				console.warn('Trying to check if entity ' + ID + ' is clicked when it does not have a pos or dim object defined.');
			}
		}

		return false;
	},





	////////////////////////////// ENTITIES //////////////////////////////
	registerEntity: function(entityObject) {
		// Check if entityObject is passed as argument
		if(typeof entityObject === 'undefined') {
			entityObject = {};
		}

		// Generate uniqe ID and add it to entityObject
		var entityID = Vroom.generateID();
		entityObject._id = entityID;

		// Run init function if defined
		if(typeof entityObject.init !== 'undefined') {
			entityObject.init();
		}

		// Check for layer declaration
		if(typeof entityObject.layer === 'undefined' || entityObject.layer > Vroom.maxLayers) {
			entityObject.layer = 1;
		}

		// Add entity object to entity list
		Vroom.entityList[entityID] = entityObject;

		return entityID;
	},

	getEntity: function(ID) {
		// Check if entity exists
		if(typeof Vroom.entityList[ID] !== 'undefined') {
			return Vroom.entityList[ID];
		} else {
			return false;
		}
	},

	updateEntity: function(ID, entityObject) {
		// Check if entityObject is passed as argument
		if(typeof entityObject === 'undefined') {
			entityObject = {};
		}

		// Check if entity exists
		if(typeof Vroom.entityList[ID] !== 'undefined') {
			Vroom.entityList[ID] = entityObject;
			return true;
		} else {
			return false;
		}
	},

	deleteEntity: function(ID) {
		delete Vroom.entityList[ID];
		delete Vroom.usedIDList[ID];
	},





	////////////////////////////// COLLISION DETECTION //////////////////////////////
	resetCollisionState: function() {
		for(var entity in Vroom.entityList) {
			if(typeof Vroom.entityList[entity].colliding !== 'undefined') {
				Vroom.entityList[entity].colliding = false;
			}

			if(typeof Vroom.entityList[entity].collidingWith !== 'undefined') {
				Vroom.entityList[entity].collidingWith = [];
			}
		}
	},

	checkForCollisions: function() {
		for(var entity in Vroom.entityList) {
			if(Vroom.entityList[entity].collisionDetection) {
				for(var target in Vroom.entityList) {
					if(entity !== target && Vroom.entityList[target].collisionDetection) {
						/*var distanceInSpace = Vroom.getDistance(Vroom.entityList[entity].pos, Vroom.entityList[target].pos);
						var combinedWidthFromCenter = (Vroom.entityList[entity].dim.width + Vroom.entityList[target].dim.width) / 2;
						var combinedHeightFromCenter = (Vroom.entityList[entity].dim.height + Vroom.entityList[target].dim.height) / 2;
						var largestDistanceBetweenCenters = Math.max(combinedWidthFromCenter, combinedHeightFromCenter);
						//console.log(distanceInSpace);
						if(distanceInSpace <= largestDistanceBetweenCenters) {
							Vroom.entityList[entity].colliding = true;
							Vroom.entityList[target].colliding = true;
						}*/

						/*if(Vroom.entityList[entity].pos.x <= Vroom.entityList[target].pos.x + Vroom.entityList[target].dim.width &&
							Vroom.entityList[target].pos.x <= Vroom.entityList[entity].pos.x + Vroom.entityList[entity].dim.width &&
							Vroom.entityList[entity].pos.y <= Vroom.entityList[target].pos.y + Vroom.entityList[target].dim.height &&
							Vroom.entityList[target].pos.y <= Vroom.entityList[entity].pos.y + Vroom.entityList[entity].dim.height) {
							console.log('COLLISION DUDE');
						}*/
					}
				}
			}
		}
	},





	////////////////////////////// UPDATE LAYERS //////////////////////////////
	updateLayers: function() {
		// Reset layers
		Vroom.layers = [];

		for(var entityID in Vroom.entityList) {
			if(typeof Vroom.entityList[entityID].layer !== 'undefined') {
				// Genereate layer if not already generated
				if(typeof Vroom.layers[Vroom.entityList[entityID].layer] === 'undefined') {
					Vroom.layers[Vroom.entityList[entityID].layer] = [];
				}

				// Push entity ID to layer
				Vroom.layers[Vroom.entityList[entityID].layer].push(entityID);
			}
		}
	},





	////////////////////////////// UPDATE //////////////////////////////
	update: function(step) {
		var reversedLayers = Vroom.layers;
		reversedLayers.reverse();
		// Loop through registered entity update functions
		for(var layer in reversedLayers){
			for(var entity in Vroom.layers[layer]) {
				if(typeof Vroom.entityList[Vroom.layers[layer][entity]] !== 'undefined' && typeof Vroom.entityList[Vroom.layers[layer][entity]].update === 'function') {
					Vroom.entityList[Vroom.layers[layer][entity]].update(step);
				}
			}
		}

		// Update active camera
		if(Vroom.activeCamera !== null) {
			Vroom.activeCamera.update(step);
		}

		// Run main update loop extension function
		if(typeof Vroom.mainUpdateLoopExtension === 'function') {
			Vroom.mainUpdateLoopExtension(step);
		}
	},





	////////////////////////////// RENDER //////////////////////////////
	render: function() {
		// Clear canvas
		Vroom.ctx.fillStyle = Vroom.backgroundColor;
		Vroom.ctx.fillRect(0, 0, Vroom.dim.width, Vroom.dim.height);

		// Get camera coordinates
		var camera = {
			pos: {
				x: 0,
				y: 0,
			},
			followingID: null,
			zoom: 1,
		};

		if(Vroom.activeCamera !== null) {
			camera.pos = Vroom.activeCamera.pos;
			camera.followingID = Vroom.activeCamera.followingID;
			camera.zoom = Vroom.activeCamera.zoom;
		}

		// Loop through registered entity render functions
		for(var layer in Vroom.layers){
			for(var entity in Vroom.layers[layer]) {
				if(typeof Vroom.entityList[Vroom.layers[layer][entity]] !== 'undefined' && typeof Vroom.entityList[Vroom.layers[layer][entity]].render === 'function') {
					Vroom.entityList[Vroom.layers[layer][entity]].render(camera);
				}
			}
		}
	},





	////////////////////////////// CAMERA //////////////////////////////
	createCamera: function(x, y, zoom, axis, lerpPercentage) {
		return new VroomCamera(x, y, zoom, axis, lerpPercentage);
	},

	activateCamera: function(camera) {
		Vroom.activeCamera = camera;
	},





	////////////////////////////// RUN //////////////////////////////
	run: function() {
		var now = 0;
		var last = timestamp();
		var delta = 0;
		var step = 1 / Vroom.fps;

		function timestamp() {
			return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
		}

		// Main game loop
		function main() {
			if(Vroom.halt === false) {
				now = timestamp();
				delta += Math.min(1, (now - last) / 1000);
				
				while(delta > step) {
					delta -= step;
					Vroom.resetCollisionState();
					Vroom.checkForCollisions();
					Vroom.update(step);
					Vroom.resetMouseState();
					Vroom.updateLayers();
				}

				Vroom.render();
			}

			last = now;

			requestAnimationFrame(main);
		}

		// Start looping
		main();
	},
};





////////////////////////////// VROOM CAMERA CONSTRUCTOR //////////////////////////////
function VroomCamera(x, y, zoom, axis, lerpPercentage) {
	this._id = Vroom.generateID();
	this.pos = {
		x: x || 0,
		y: y || 0,
	};
	this.targetPos = {
		x: 0,
		y: 0,
	};
	this.deadZoneX = 0;
	this.deadZoneY = 0;
	this.followingID = null;
	this.lerpPercentage = lerpPercentage || false;
	this.zoom = zoom || 1;
	this.targetZoom = this.zoom;
	this.zoomLerpPercentage = this.lerpPercentage;
	this.axis = axis || 'both';

}

VroomCamera.prototype.update = function(step) {
	// Interpolate zoom
	var zoomChange = 0;
	if(this.zoom !== this.targetZoom) {
		zoomChange = Vroom.lerpValue(step, this.zoom, this.targetZoom, this.zoomLerpPercentage);
		this.zoom += zoomChange;
	}

	if(this.followingID !== null) {

		// Handle horizontal movement
		if(this.axis === 'horizontal' || this.axis === 'both') {
			// Get the x position of the followed entity
			var followingX = Vroom.entityList[this.followingID].pos.x * this.zoom;
			
			if(followingX - this.pos.x + this.deadZoneX > Vroom.dim.width) {
				this.targetPos.x = followingX - (Vroom.dim.width - this.deadZoneX);

			} else if(followingX - this.deadZoneX < this.pos.x) {
				this.targetPos.x = followingX - this.deadZoneX;
			}
		}

		// Handle vertical movemebt
		if(this.axis === 'vertical' || this.axis === 'both') {
			// Get the y position of the followed entity
			var followingY = Vroom.entityList[this.followingID].pos.y * this.zoom;

			if(followingY - this.pos.y + this.deadZoneY > Vroom.dim.height) {
				this.targetPos.y = followingY - (Vroom.dim.height - this.deadZoneY);

			} else if(followingY - this.deadZoneY < this.pos.y) {
				this.targetPos.y = followingY - this.deadZoneY;
			}
		}

		// Interpolate position
		if(this.pos.x !== this.targetPos.x || this.pos.y !== this.targetPos.y) {
			var lerpedPosition = Vroom.lerpPosition(step, this.pos, this.targetPos, this.lerpPercentage);
			this.pos.x += lerpedPosition.x;
			this.pos.y += lerpedPosition.y;
		}
	}

	// FIX ME: Keep camera centered while zooming
	// Constrain camera to world size?
};

VroomCamera.prototype.follow = function(ID, deadZoneX, deadZoneY) {
	this.followingID = ID;
	this.deadZoneX = deadZoneX || Vroom.dim.width / 2;
	this.deadZoneY = deadZoneY || Vroom.dim.height / 2;
};

VroomCamera.prototype.stationary = function() {
	this.followingID = null;
};

VroomCamera.prototype.setZoom = function(zoomLevel, lerpPercentage) {
	this.zoomLerpPercentage = lerpPercentage || false;
	this.targetZoom = zoomLevel;
};

VroomCamera.prototype.adjustZoom = function(zoomAdjustment, lerpPercentage) {
	this.zoomLerpPercentage = lerpPercentage || false;
	this.targetZoom += zoomAdjustment;
};





////////////////////////////// VROOM SPRITE CONSTRUCTOR //////////////////////////////
function VroomSprite(imagePath, animated, timePerAnimationFrame, frameWidth, frameHeight, numberOfFrames, frameSpacing) {
	this._id = Vroom.generateID();
	this.image = new Image();
	this.image.src = imagePath;
	this.numberOfFrames = numberOfFrames || 0;
	this.dim = {
		width: frameWidth || 0,
		height: frameHeight || 0,
	};
	this.frameSpacing = frameSpacing || 0;
	this.frameIndex = 0;
	this.timePerAnimationFrame = timePerAnimationFrame || 0;
	this.elapsedTime = 0;
	this.animated = false || animated;
	this.loaded = false;

	var sprite = this;
	this.image.onload = function() {
		if(sprite.dim.width === 0) {
			sprite.dim.width = sprite.image.width;
		}
		if(sprite.dim.height === 0) {
			sprite.dim.height = sprite.image.height;
		}
		sprite.loaded = true;
		sprite = null;
	};
}

VroomSprite.prototype.reset = function() {
	this.frameIndex = 0;
	this.elapsedTime = 0;
};

VroomSprite.prototype.update = function(step) {
	if(this.animated) {
		this.elapsedTime += step;

		if(this.elapsedTime >= this.timePerAnimationFrame / 100) {
			this.frameIndex++;
			this.elapsedTime = 0;
		}

		if(this.frameIndex >= this.numberOfFrames) {
			this.frameIndex = 0;
		}
	}
};

VroomSprite.prototype.render = function(x, y, width, height) {
	if(this.loaded) {
		width = width || this.dim.width;
		height = height || this.dim.height;
		Vroom.ctx.drawImage(
			this.image,                                                                                                 // Image source
			this.frameIndex * this.dim.width + (this.frameIndex * this.frameSpacing),                                  // X position of image slice
			Math.floor((this.frameIndex * this.dim.width) / this.image.width) + (this.frameIndex * this.frameSpacing), // Y position (row) of image slice
			this.dim.width,                                                                                            // Slice width
			this.dim.height,                                                                                           // Slice height
			x,                                                                                                          // Destination (canvas) x position
			y,                                                                                                          // Destination (canvas) y position
			width,                                                                                                      // Destination (canvas) width
			height                                                                                                      // Destination (canvas) height
		);
	}
};





////////////////////////////// VROOM SOUND CONSTRUCTOR //////////////////////////////
function VroomSound(url) {
	this._id = Vroom.generateID();
	this.ready = false;
	this.playing = false;
	this.buffer = null;
	this.bufferSource = null;
	this.gain = 1;
	this.url = url;
}

VroomSound.prototype.loadBuffer = function() {
	// Load buffer asynchronously
	var request = new XMLHttpRequest();
	request.open('GET', this.url, true);
	request.responseType = 'arraybuffer';

	// Create copy of self for use in callback
	var loader = this;

	request.onload = function() {
		Vroom.audioCtx.decodeAudioData(
			request.response,
			function(buffer) {
				if(buffer) {
					loader.buffer = buffer;
					loader.ready = true;
				} else {
					console.warn('Error decoding audio file data for sound entity ' + loader._id + ' at ' + loader.url);
				}
			}
		);
	};

	request.send();
};

VroomSound.prototype.play = function() {
	if(this.ready === true) {
		// Create copy of self for use in callback
		var loader = this;

		// Initiate nodes
		var gainNode = Vroom.audioCtx.createGain();
		this.bufferSource = Vroom.audioCtx.createBufferSource();

		this.bufferSource.onended = function() {
			loader.playing = false;
		};

		// Connect nodes
		this.bufferSource.connect(gainNode);
		gainNode.connect(Vroom.audioCtx.destination);

		// Set buffer and gain and start playing
		this.bufferSource.buffer = this.buffer;
		gainNode.gain.value = this.gain;
		this.bufferSource.start(0);
		this.playing = true;
	}
};