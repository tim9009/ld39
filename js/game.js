////////////////////////////// INIT //////////////////////////////
Vroom.init({
	dim: {
		width: 1280,
		height: 720,
	},
	fps: 60,
	inputPreventDefault: [32, 37, 38, 39, 40],
	backgroundColor: '#fff',
});

// Constants
var TABLE = 'table';
var HAND = 'hand';
var DEVELOPMENT = 'development';
var PUBLIC_WORK = 'public_work';
var ACTION = 'action';
var LARGE_PIXEL_SCALE = Vroom.dim.width / 240;


// Gameplay variables
var unrest = 20;
var maxUnrest = 100;

var gameEnd = false;

var development = {
	guidance: 0,
	computer: 0,
	sensors: 0,
	rocketFuel: 0,
	control: 0,
	propulsion: 0,
};

var developmentRequirements = {
	guidance: 10,
	computer: 10,
	sensors: 10,
	rocketFuel: 10,
	control: 10,
	propulsion: 10,
};

var playerHand = {
	list: [],
	limit: 3,
	cardMargin: 10,
	cardScale: 0.5,
	pos: {
		x: 600,
		y: 500,
	}
};

var table = Vroom.registerEntity({
	layer: 2,
	list: [],
	limit: 3,
	drawLimit: 1,
	cardMargin: 10,
	cardScale: 0.7,
	pos: {
		x: 600,
		y: 100,
	},

	update: function(step) {
		if(this.list.length <= this.limit - this.drawLimit) {
			clearTable();
			addCardsToTable();
		}
	},

	render: function(camera) {
		Vroom.ctx.fillStyle = '#333';
		Vroom.ctx.textAlign = 'start';
		Vroom.ctx.font = '21px lcd_solid';
		Vroom.ctx.fillText("NEXT PROJECT TO SPEND TAX MONEY ON:", this.pos.x, this.pos.y - 10);
	},
});

function restartGame() {
	unrest = 20;
	maxUnrest = 100;
	gameEnd = false;

	development = {
		guidance: 0,
		computer: 0,
		sensors: 0,
		rocketFuel: 0,
		control: 0,
		propulsion: 0,
	};

	clearTable();
	addCardsToTable();

	console.log('RESTARTED');
}




////////////////////////////// MAIN UPDATE LOOP EXTENSION //////////////////////////////
Vroom.mainUpdateLoopExtension = function(step) {
	if(unrest >= maxUnrest) {
		gameEnd = true;
	}
};





////////////////////////////// CARD CLASS CONSTRUCTOR //////////////////////////////
function Card(text, type, effects, effectValue, unrestValue) {
	this.text = text;
	this.type = type;
	this.effects = effects;
	this.effectValue = effectValue;
	this.unrestValue = unrestValue;

	this.entityID = Vroom.registerEntity({
		layer: 3,
		alpha: 1,
		location: null,
		order: 0,
		scale: Vroom.entityList[table].cardScale,
		targetScale: Vroom.entityList[table].cardScale,
		effectValue: this.effectValue,
		unrestValue: this.unrestValue,
		type: this.type,
		effects: this.effects,
		text: this.text,
		pos: {
			x: 0,
			y: -400,
		},
		targetPos: {
			x: 0,
			y: 0,
		},
		image: new VroomSprite('sprites/cards/' + this.type + '.png', false),

		update: function(step) {
			// Location specific settings
			if(this.location === TABLE) {
				this.pos.x = Vroom.entityList[table].pos.x + (Vroom.entityList[table].cardMargin * this.order) + ((this.image.dim.width * this.scale) * this.order);
				this.targetPos.x = this.pos.x;
				this.targetPos.y = Vroom.entityList[table].pos.y;
			}

			if(this.location === HAND) {
				this.pos.x = playerHand.pos.x + (playerHand.cardMargin * this.order) + ((this.image.dim.width * this.scale) * this.order);
			}

			// Move card if not at target position
			if(this.pos.x !== this.targetPos.x || this.pos.y !== this.targetPos.y) {
				var lerpedPosition = Vroom.lerpPosition(step, this.pos, this.targetPos, 0.8);
				this.pos.x += lerpedPosition.x;
				this.pos.y += lerpedPosition.y;
			}

			// Scale card if not at target scale
			if(this.scale !== this.targetScale) {
				var lerpedScale = Vroom.lerpValue(step, this.scale, this.targetScale, 0.8);
				console.log('lol', this.scale, this.targetScale, lerpedScale);
				this.scale += lerpedScale;
			}

			// Events
			var scaledDim = {
				width: this.image.dim.width * this.scale,
				height: this.image.dim.height * this.scale,
			};

			// reset mouse over
			this.mouseOver = false;

			if(Vroom.isMouseOverArea(this.pos, scaledDim)) {
				this.mouseOver = true;

				if(Vroom.isAreaClicked(this.pos, scaledDim)) {
					if(this.location === TABLE) {
						// console.log('Card on table clicked!');
						for(var card in Vroom.entityList[table].list) {
							if(Vroom.entityList[table].list[card].entityID === this._id) {
								// Play dictator hitting animation
								Vroom.entityList[dictator].hitPodium();

								// Apply card effect and remove card from table
								Vroom.entityList[table].list[card].applyCardEffect();
								Vroom.entityList[table].list[card].removeFromTable();
							}
						}
					}
				}
			}
		},

		render: function(camera) {
			if(this.image.loaded) {
				// Set alpha value
				Vroom.ctx.globalAlpha = this.alpha;

				if(this.location === TABLE) {
					// Card image
					this.image.render(this.pos.x, this.pos.y, this.image.dim.width * this.scale, this.image.dim.height * this.scale);

					// Style
					Vroom.ctx.textAlign = 'center';
					Vroom.ctx.font = (21 * this.scale) + 'px lcd_solid';

					if(this.type === DEVELOPMENT) {
						Vroom.ctx.fillStyle = '#333';

						// Text
						Vroom.multilineText(this.text, this.pos.x + (140 * this.scale), this.pos.y + (60 * this.scale), 15);

						Vroom.ctx.fillStyle = '#24D7DD';

						// Effects
						Vroom.ctx.fillText(this.effects.toUpperCase(), this.pos.x + (this.image.dim.width / 2) * this.scale, this.pos.y + (200 * this.scale));

						Vroom.ctx.font = (60 * this.scale) + 'px lcd_solid';

						// Effect value
						Vroom.ctx.fillText(String(this.effectValue), this.pos.x + (this.image.dim.width / 2) * this.scale, this.pos.y + (346 * this.scale));
					}

					if(this.type === PUBLIC_WORK) {
						Vroom.ctx.fillStyle = '#333';
						
						// Text
						Vroom.multilineText(this.text, this.pos.x + (140 * this.scale), this.pos.y + (60 * this.scale), 15);

						Vroom.ctx.fillStyle = '#1DC936';
						Vroom.ctx.font = (60 * this.scale) + 'px lcd_solid';

						// Happiness value
						Vroom.ctx.fillText(String(this.effectValue), this.pos.x + ((this.image.dim.width / 2) * this.scale), this.pos.y + 346 * this.scale);
					}

					// Unrest
					Vroom.ctx.fillStyle = '#fff';
					Vroom.ctx.font = (40 * this.scale) + 'px lcd_solid';
					Vroom.ctx.fillText(String(this.unrestValue), this.pos.x + (this.image.dim.width - 30) * this.scale, this.pos.y + (this.image.dim.height - 16) * this.scale);

					// On mouse over
					if(this.mouseOver) {
						// Draw triangle under card
						var triangleWidth = 30;
						var triangleHeight = 15;
						var triangleHalfWidth = triangleWidth / 2;
						var cardCenterX = (this.pos.x + (this.image.dim.width / 2) * this.scale);
						var startY = this.pos.y + (this.image.dim.height * this.scale) + 15;
						Vroom.ctx.beginPath();
						Vroom.ctx.moveTo(cardCenterX, startY);
						Vroom.ctx.lineTo(cardCenterX + triangleHalfWidth, startY + triangleHeight);
						Vroom.ctx.lineTo(cardCenterX - triangleHalfWidth, startY + triangleHeight);
						Vroom.ctx.fill();
					}
				}

				// Reset alpha
				Vroom.ctx.globalAlpha = 1;
			}
		},
	});
}

Card.prototype.applyCardEffect = function() {
	unrest += this.unrestValue;
	switch(this.type) {
		case DEVELOPMENT:
			development[this.effects] += this.effectValue;
		break;

		case PUBLIC_WORK:
			unrest -= this.effectValue;
		break;
	}
	
	// console.log('Effect applied.');
};

Card.prototype.addToPlayerHand = function() {
	Vroom.entityList[this.entityID].location = HAND;
	Vroom.entityList[this.entityID].targetScale = playerHand.cardScale;
	Vroom.entityList[this.entityID].targetPos = playerHand.pos;
	playerHand[this.entityID] = this;
};

Card.prototype.addToTable = function() {
	Vroom.entityList[this.entityID].location = TABLE;
	Vroom.entityList[this.entityID].order = Vroom.entityList[table].list.length;
	Vroom.entityList[this.entityID].targetScale = Vroom.entityList[table].cardScale;
	Vroom.entityList[table].list.push(this);
};

Card.prototype.deleteCard = function() {
	this.removeFromTable();
	Vroom.deleteEntity(this.entityID);
	// console.log('Card deleted permanently.');
};

Card.prototype.removeFromTable = function() {
	for(var card in Vroom.entityList[table].list) {
		if(Vroom.entityList[table].list[card].entityID == this.entityID) {
			Vroom.entityList[table].list.splice(card, 1);
			this.deleteCard();
			// console.log('Card removed.');
		}
	}
};





////////////////////////////// CARD TYPE FACTORIES //////////////////////////////
function TestCard() {
	return new Card('TEST CARD', DEVELOPMENT, 'sensors', 2, 4);
}

function DevelopmentCard() {
	var texts = [];
	var types = [
		'guidance',
		'computer',
		'sensors',
		'rocketFuel',
		'control',
		'propulsion',
	];

	var selectedType = types[Math.floor(Math.random() * types.length)];

	switch(selectedType) {
		case 'guidance':
			texts = [
				'Paper map',
			];
		break;

		case 'computer':
			texts = [
				'Calculator parts',
			];
		break;

		case 'sensors':
			texts = [
				'Sensor research',
				'Smoke detector',
				'Canary birds',
				'Compass and tape',
			];
		break;

		case 'rocketFuel':
			texts = [
				'Unstable explosives',
			];
		break;

		case 'control':
			texts = [
				'Random sheet metal',
			];
		break;

		case 'propulsion':
			texts = [
				'Old Bucket',
			];
		break;

	}

	var text = texts[Math.floor(Math.random() * texts.length)];

	var effectValue = Math.floor(Math.random() * (5 - 1) + 1);
	var unrestValue = Math.floor(Math.random() * (9 - 1) + 1);

	return new Card(text, DEVELOPMENT, selectedType, effectValue, unrestValue);
}

function PublicWorkCard() {
	var texts = [
		'National park',
		'Hospital or whatever',
		'Water slides\nfor the elderly',
	];

	var text = texts[Math.floor(Math.random() * texts.length)];
	var happinessValue = Math.floor(Math.random() * (5 - 1) + 1);

	return new Card(text, PUBLIC_WORK, null, happinessValue, 0);
}

function ActionCard() {
	var effects = [
		'discardTable',
		'drawTwoCards',
		'ignoreUnrest',
		'doubleStats',
	];

	var effect = effects[Math.floor(Math.random() * effects.length)];

	return new Card('', ACTION, effects, 0, 0);
}





////////////////////////////// CARD HANDELING //////////////////////////////
function addCardsToTable() {
	while(Vroom.entityList[table].list.length < Vroom.entityList[table].limit) {
		var randomNumber = Math.floor((Math.random() * 10) + 1);
		console.log(randomNumber);
		var card = null;
		switch(true) {
			case (randomNumber < 10):
				card = new DevelopmentCard();
			break;

			case (randomNumber == 10):
				card = new PublicWorkCard();
			break;
		}

		card.addToTable();
	}
}

function clearTable() {
	for(var card in Vroom.entityList[table].list) {
		Vroom.deleteEntity(Vroom.entityList[table].list[card].entityID);
	}

	Vroom.entityList[table].list = [];
}




////////////////////////////// UI ELEMENTS //////////////////////////////
var background = Vroom.registerEntity({
	pos: {
		x: 0,
		y: 0,
	},
	layer: 1,
	image: new VroomSprite('sprites/design/background.jpg', false),

	render: function(camera) {
		Vroom.ctx.mozImageSmoothingEnabled = false;
		Vroom.ctx.webkitImageSmoothingEnabled = false;
		Vroom.ctx.msImageSmoothingEnabled = false;
		Vroom.ctx.imageSmoothingEnabled = false;
		this.image.render(this.pos.x, this.pos.y, this.image.dim.width * LARGE_PIXEL_SCALE, this.image.dim.height * LARGE_PIXEL_SCALE);
	},
});

var crowd = Vroom.registerEntity({
	pos: {
		x: 0,
		y: 0,
	},
	layer: 4,
	animation: new VroomSprite('sprites/design/crowd.png', true, 40, 240, 135, 2, 0),

	update: function(step) {
		this.animation.update(step);
		this.pos.y = Math.max((maxUnrest - unrest) * 4, 0);
	},

	render: function(camera) {
		Vroom.ctx.mozImageSmoothingEnabled = false;
		Vroom.ctx.webkitImageSmoothingEnabled = false;
		Vroom.ctx.msImageSmoothingEnabled = false;
		Vroom.ctx.imageSmoothingEnabled = false;
		this.animation.render(this.pos.x, this.pos.y, this.animation.dim.width * LARGE_PIXEL_SCALE, this.animation.dim.height * LARGE_PIXEL_SCALE);
	},
});

var dictator = Vroom.registerEntity({
	pos: {
		x: Vroom.dim.width / 4,
		y: 13 * LARGE_PIXEL_SCALE,
	},
	dim: {
		width: 42,
		height: 70,
	},
	layer: 3,
	currentAction: 'thinking',
	thinkingAnimation: new VroomSprite('sprites/design/dictator_thinking.png', true, 20, 42, 70, 8, 0),
	hittingAnimation: new VroomSprite('sprites/design/dictator_hitting_podium.png', true, 20, 42, 70, 5, 0),
	activeAnimation: {},

	init: function() {
		this.activeAnimation = this.thinkingAnimation;
	},

	think: function() {
		this.currentAction = 'thinking';
		this.activeAnimation = this.thinkingAnimation;
		this.activeAnimation.reset();
	},

	hitPodium: function() {
		this.currentAction = 'hitting';
		this.activeAnimation = this.hittingAnimation;
		this.activeAnimation.reset();
	},

	update: function(step) {
		if(this.currentAction == 'hitting') {
			if(this.activeAnimation.frameIndex == this.activeAnimation.numberOfFrames - 1) {
				this.think();
			}
		}

		this.activeAnimation.update(step);
	},

	render: function() {
		this.activeAnimation.render(this.pos.x, this.pos.y, this.dim.width * LARGE_PIXEL_SCALE, this.dim.height * LARGE_PIXEL_SCALE);
	},
});

var developmentScreen = Vroom.registerEntity({
	pos: {
		x: 50,
		y: 100,
	},
	scale: 0.7,
	image: new VroomSprite('sprites/ui/rocket_screen.png', false),

	update: function(step) {

	},

	render: function(camera) {
		this.image.render(this.pos.x, this.pos.y, this.image.dim.width * this.scale, this.image.dim.height * this.scale);
		Vroom.ctx.textAlign = 'center';
		Vroom.ctx.font = (30 * this.scale) + 'px lcd_solid';
		Vroom.ctx.fillStyle = '#333';

		// Guidance
		if(development.guidance < developmentRequirements.guidance) {
			Vroom.ctx.fillStyle = '#FC452D';
		} else {
			Vroom.ctx.fillStyle = '#1BDD37';
		}
		Vroom.ctx.fillText(development.guidance + '/' + developmentRequirements.guidance, this.pos.x + (240 * this.scale), this.pos.y + (22 * this.scale));

		// Interface
		if(development.computer < developmentRequirements.computer) {
			Vroom.ctx.fillStyle = '#FC452D';
		} else {
			Vroom.ctx.fillStyle = '#1BDD37';
		}
		Vroom.ctx.fillText(development.computer + '/' + developmentRequirements.computer, this.pos.x + (40 * this.scale), this.pos.y + (70 * this.scale));

		// Sensors
		if(development.sensors < developmentRequirements.sensors) {
			Vroom.ctx.fillStyle = '#FC452D';
		} else {
			Vroom.ctx.fillStyle = '#1BDD37';
		}
		Vroom.ctx.fillText(development.sensors + '/' + developmentRequirements.sensors, this.pos.x + (240 * this.scale), this.pos.y + (120 * this.scale));

		// Rocket fuel
		if(development.rocketFuel < developmentRequirements.rocketFuel) {
			Vroom.ctx.fillStyle = '#FC452D';
		} else {
			Vroom.ctx.fillStyle = '#1BDD37';
		}
		Vroom.ctx.fillText(development.rocketFuel + '/' + developmentRequirements.rocketFuel, this.pos.x + (40 * this.scale), this.pos.y + (185 * this.scale));

		// Control
		if(development.control < developmentRequirements.control) {
			Vroom.ctx.fillStyle = '#FC452D';
		} else {
			Vroom.ctx.fillStyle = '#1BDD37';
		}
		Vroom.ctx.fillText(development.control + '/' + developmentRequirements.control, this.pos.x + (240 * this.scale), this.pos.y + (280 * this.scale));

		// Propulsion
		if(development.propulsion < developmentRequirements.propulsion) {
			Vroom.ctx.fillStyle = '#FC452D';
		} else {
			Vroom.ctx.fillStyle = '#1BDD37';
		}
		Vroom.ctx.fillText(development.propulsion + '/' + developmentRequirements.propulsion, this.pos.x + (40 * this.scale), this.pos.y + (335 * this.scale));
	},
});

var publicUnrestMeter = Vroom.registerEntity({
	pos: {
		x: 0,
		y: 0,
	},
	dim: {
		width: Vroom.dim.width / maxUnrest,
		height: 50,
	},

	update: function(step) {
		this.dim.width = (Vroom.dim.width / maxUnrest) * unrest;
	},

	render: function(camera) {
		// Meter
		Vroom.ctx.fillStyle = '#FC452D';
		Vroom.ctx.fillRect(this.pos.x, this.pos.y, this.dim.width, this.dim.height);

		// Text
		Vroom.ctx.textAlign = 'start';
		Vroom.ctx.font = 20 + 'px lcd_solid';
		Vroom.ctx.fillStyle = '#fff';
		Vroom.ctx.fillText('PUBLIC UNREST ' + Math.min(Math.floor(((unrest / maxUnrest) * 100)), 100) + '%', this.pos.x + 10, this.pos.y + 32);
	},
});

var gameEndMessage = Vroom.registerEntity({
	layer: 6,
	pos: {
		x: (Vroom.dim.width / 2) - 200,
		y: (Vroom.dim.height / 2) - 100,
	},
	dim: {
		width: 400,
		height: 200,
	},
	buttonPos: {
		x: 0,
		y: 0,
	},
	buttonDim: {
		width: 160,
		height: 50,
	},

	init: function() {
		this.buttonPos = {
			x: this.pos.x + (this.dim.width / 2) - 80,
			y: this.pos.y + 130,
		};
	},

	update: function(step) {
		if(gameEnd) {
			if(Vroom.isAreaClicked(this.buttonPos, this.buttonDim)) {
				// Prevent further click events from triggering
				Vroom.resetMouseState();
				restartGame();
			}
		}
	},

	render: function(camera) {
		if(gameEnd) {
			// Box
			Vroom.ctx.fillStyle = '#98B9FF';
			Vroom.ctx.fillRect(this.pos.x, this.pos.y, this.dim.width, this.dim.height);

			// Text
			Vroom.ctx.textAlign = 'center';
			Vroom.ctx.font = 14.7 + 'px lcd_solid';
			Vroom.ctx.fillStyle = '#fff';
			Vroom.ctx.fillText('Oh no!', this.pos.x + (this.dim.width / 2), this.pos.y + 50);
			Vroom.ctx.fillText('The people want to govern themselves!', this.pos.x + (this.dim.width / 2), this.pos.y + 70);

			// Button
			Vroom.ctx.fillStyle = '#FC452D';
			Vroom.ctx.fillRect(this.buttonPos.x, this.buttonPos.y, this.buttonDim.width, this.buttonDim.height);

			// Button text
			Vroom.ctx.fillStyle = '#fff';
			Vroom.ctx.fillText('TRY AGAIN', this.buttonPos.x + (this.buttonDim.width / 2), this.buttonPos.y + 33);
		}
	},
});





////////////////////////////// START ENGINE //////////////////////////////
function start() {
	// Create camera
	Vroom.activateCamera(Vroom.createCamera(0, 0, 1, 'both', 0.5));

	// Vroooom vrooom!
	Vroom.run();

	// Test code PLEASE KILL ME AAARRGGHHH
	addCardsToTable();
}
start();