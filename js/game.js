////////////////////////////// INIT //////////////////////////////
Vroom.init({
	dim: {
		width: 1280,
		height: 720,
	},
	fps: 60,
	inputPreventDefault: [32, 37, 38, 39, 40],
});

// Constants
var TABLE = 'table';
var DECK = 'deck';
var DEVELOPMENT = 'development';


// Gameplay variables
var playerDeck = {};

var unrest = 0;

var spaceProgramDevelopment = {
	planning: 0,
	groundControl: 0,
	externalSensors: 0,
	rocketEngines: 0,
	stabilization: 0,
};

var table = {
	list: [],
	limit: 3,
	cardMargin: 10,
	pos: {
		x: 10,
		y: 10,
	}
};





////////////////////////////// CARD CLASS CONSTRUCTOR //////////////////////////////
function Card(name, type, effects, effectValue, unrestValue) {
	this.name = name;
	this.type = type;
	this.effects = effects;
	this.effectValue = effectValue;
	this.unrestValue = unrestValue;

	this.entityID = Vroom.registerEntity({
		location: null,
		order: 0,
		pos: {
			x: 0,
			y: 0,
		},
		image: new VroomSprite('sprites/cards/' + name + '.png', false),

		update: function(step) {

		},

		render: function(camera) {
			if(this.location === TABLE) {
				var calculatedX = table.pos.x + (table.cardMargin * this.order) + (this.image.dim.width * this.order);
				this.image.render(calculatedX, table.pos.y, this.image.dim.width, this.image.dim.height);
			}
		},
	});
}

Card.prototype.addToPlayerDeck = function() {
	Vroom.entityList[this.entityID].location = DECK;
	playerDeck[this.entityID] = this;
	unrest += this.unrestValue;

	if(this.type == DEVELOPMENT) {
		spaceProgramDevelopment[this.effects] += this.effectValue;
	}
};

Card.prototype.addToTable = function() {
	Vroom.entityList[this.entityID].location = TABLE;
	Vroom.entityList[this.entityID].order = table.list.length;
	table.list.push(this);
};

Card.prototype.removeFromTable = function() {
	for(var card in table.list) {
		if(table.list[card].entityID == this.entityID) {
			delete table.list[card];
		}
	}
};





////////////////////////////// CARD TYPE FACTORIES //////////////////////////////
function TestCard() {
	return new Card('test', DEVELOPMENT, 'externalSensors', 2, 4);
}





////////////////////////////// CARD HANDELING //////////////////////////////
function addCardsToTable() {
	while(table.list.length < table.limit) {
		var card = new TestCard();
		card.addToTable();
	}
}

function clearTable() {
	for(var card in table.list) {
		Vroom.deleteEntity(table.list[card].entityID);
	}

	table.list = [];
}





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