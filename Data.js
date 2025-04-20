//Initialise Global Variables
//Game World
const rooms = new Map(); //Stores all locations
let currentRoom = {}; //Stores current room

//Player
let player = { x: 0, y: 2, outside: true }; //Stores Player Stats
let score = 0; //Score for actions of player

//Items
const items = []; //Stores all interactables
let inventory = []; //Stores items in inventory
let currentObj = { found: false, obj: {}, name: "", idx: 0 }; //Stores info for current object

//NPCs
const dog = { state: 0, actions: [] }; //State being if following or not
let toName = false;
const scav = { state: 0, health: 9, canRun: true, canTalk:true }
let fight = false;

//Game stats
let started = false; //Stores whether the game has been started or not - load screen
let end = false; //Stores whether Y or N is inputs - eg to win after fixing the truck
let wonBefore = false; //Stores if end has happpened but n was inputted
let won = false; //Stores if end and y used

//Title at the top
let title = null; //Title element
let roomColours = {}; //Colour chart
let currentColour = "#000000"; //Current title colour

//Audio
const _goodSound = new Audio("./Music/GoodSound.wav");
const _badSound = new Audio("./Music/BadSound.wav");
const _music = new Audio("./Music/MainTrack.wav");

//Classes
class Room {
	constructor(x, y, options) {
		this.x = x;
		this.y = y;
		this.name = options.name || "Unnamed Room";
		this.title = options.title || "Unknown Area";
		this.exits = options.exits || "";
		this.desc = options.desc || undefined;
		this.OIDesc = options.OIDesc || undefined;
		this.exitText = options.exitText || "There are no visible exits.";
		this.canSee = options.canSee ?? true;
		this.cantSeeTxt = options.cantSeeTxt || "It's too dark to see anything.";
		this.requiresTorch = options.requiresTorch || false;
	}
	onLook(player) {
		if (this.requiresTorch && items[getObjIdx("TORCH", items)].state != 1) { return this.cantSeeTxt; }
		if (this.desc == null) { return this.OIDesc[player.outside ? "outside" : "inside"] };
		return this.desc;
	}
}
class Item {
	constructor(name, options) {
		this.name = name;
		this.x = options.x;
		this.y = options.y;
		this.outside = options.outside;
		this.gettable = options.gettable || false;
		this.visible = options.visible;
		this.requiresTorch = options.requiresTorch || false;
		this.inInventory = false;
		this.onExamine = options.onExamine || null;
		this.seeInside = options.seeInside || null;
		this.display = options.display || null;
		this.onUse = options.onUse || null;
		this.onGet = options.onGet || null;
		this.onEnter = options.onEnter || null;
		this.state = options.state || "";
		this.door = options.door || false;
		this.open = false;
		this.locked = options.locked || null;
	}
	onExamine() {
		if (this.onExamine) { this.onExamine(); }
	}
	seeInside() {
		if (this.seeInside) { this.seeInside(); }
	}
	onUse() {
		if (this.onUse) { this.onUse(); }
	}
	onGet() {
		if (this.onGet) { this.onGet(); }
	}
	display() {
		if (this.display) { this.display(); }
	}
	onEnter() {
		if ( this.onEnter ) { this.onEnter(); }
	}
}
class Action {
	constructor(x, y, options) {
		this.x = x;
		this.y = y;
		this.outside = options.outside || false;
		this.trigger = options.trigger || "";
		this.effect = options.effect || "";
		this.state = 0;
		this.outcome = options.outcome || null;
		this.prerequisite = options.prerequisite || null;
	}
	Do() {
		if (this.outcome) { this.outcome(); }
		this.state++
		if ( this.state > 1 ) { return false }
		else if (this.trigger != "") { return `${this.trigger}<br>${this.effect}`; }
		else { return this.effect; }
	}
}

//Rooms
function setupRooms() {
	//Sets up roomColours:
	roomColours = {
		Forest: "#005000",
		Garden: "#006000",
		Road: "#505050",
		Cave: "#353535",
		Cabin: "#7F5539",
		WINNER: "#DFB700"
	}
	//Sets up Rooms
	rooms.set("0,0", new Room(0, 0, { //RoadN
		name: "Road",
		title: "Road",
		exits: "S",
		desc: "Graffiti scrawled on the pavement, “Turn back!”—its message feels more like a warning, but it’s too late to heed it now.",
		exitText: "I need to go back to the south."
	}));
	rooms.set("0,1", new Room(0, 1, { //Road
		name: "Road",
		title: "Road",
		exits: "NS",
		desc: "A broken-down lorry sits by the side, its boot wide open. There's something hidden inside, but it’s hard to tell from here.",
		exitText: "The road continues north and south. To the west, a winding river flows, while cliffs rise to the east."
	}));
	rooms.set("0,2", new Room(0, 2, { //RoadS
		name: "Road",
		title: "Road",
		exits: "NE",
		desc: "My truck, rusty, stands dead in the middle of the road, its bonnet up as if abandoned mid-repair—something’s wrong here.",
		exitText: "The road continues north, with a forest clearing lying to the east."
	}));
	rooms.set("1,2", new Room(1, 2, { //Forest
		name: "Forest",
		title: "Forest",
		exits: "NEW",
		desc: "A crude trap sits nearby, its twisted metal tangled around a rotten corpse—bulging pockets suggesting it wasn’t just any victim.",
		exitText: "To the north lies the cave entrance, and to the east, you can see a faint plume of light grey smoke rising into the sky."
	}));
	rooms.set("1,1", new Room(1, 1, { //Cave
		name: "Cave Entrance",
		title: "Cave",
		exits: "NS",
		desc: "The remnants of a once-roaring fire smoulder faintly, the ashes cold and forgotten, marking the entrance to a darker place.",
		exitText: "It’s too dark to venture further north into the cave."
	}));
	rooms.set("1,0", new Room(1, 0, { //CaveDeep
		name: "Cave Deep",
		title: "Cave",
		exits: "S",
		canSee: 0,
		cantSeeTxt: "It's too dark too see as I stumble around trying not too bump into anything.",
		desc: "The air is thick with moisture, the darkness pressing in from all sides, every step sinking into the damp earth beneath.",
		exitText: "The faint light from the south entrance is barely visible now.",
		requiresTorch: true
	}));
	rooms.set("2,2", new Room(2, 2, { //Cabin
		name: { outside: "Cabin Entrance", inside: "Corridor" },
		title: "Cabin",
		exits: { outside: "NW", inside: "NE" },
		OIDesc: { outside: "Outside a house", inside: "A single cracked window and a worn-out Christmas tree, likely stolen, stand as the only signs of life in this desolate hall. " },
		exitText: { outside: "The forest is to the west, to the east there is the front door of a house. To the north there is a hole in a fence", inside: "To the west there is the front door to the forst, to the north is an open door and to the east there is an archway leading into a dining room" }
	}));
	rooms.set("2,1", new Room(2, 1, { //Bathroom
		name: "Bathroom",
		title: "Cabin",
		exits: "S",
		desc: "A generic, grimy bathroom, the mirror cracked and shattered leaving minuscule shards along the floor, the cupboard slightly ajar as if someone was in a rush to leave.",
		exitText: "The door to the corridor is to the south."
	}));
	rooms.set("3,2", new Room(3, 2, { //Dining Room
		name: "Dining Room",
		title: "Cabin",
		exits: "NW",
		desc: "A grand, forgotten table with a single plate set before a dusty centrepiece, and spider webs draping every corner like ghostly curtains.",
		exitText: "The corridor to the west, and to the north is the kitchen."
	}));
	rooms.set("3,1", new Room(3, 1, { //Kitchen / Garden
		name: { outside: "Garden", inside: "Kitchen" },
		title: "Cabin",
		exits: { outside: "NEW", inside: "S" },
		OIDesc: { outside: "A generic garden with wilting flowers.", inside: "The kitchen’s eerie silence is broken only by the faint light from a dirty window, illuminating rotting food scattered across the counters. There is what looks like a keybox on the wall by the external door." },
		exitText: { outside: "The cabin is to the south through the door, to the north I can see a kennel and to the east a toolshed lies. Theres a gaping hole in the fence to the west, not suprising.", inside: "To the south is the dining room, and there is an external door leading to a garden to the north." }
	}));
	rooms.set("3,0", new Room(3, 0, { //Kennel
		name: "Kennel",
		title: "Garden",
		exits: "SE",
		desc: "A wooden kennel, old and neglected, houses a menacing German Shepherd. Its eyes stare at you, hungry —can you be friends?",
		exitText: "The tool-shed lies to the east, and the kitchen is to the south."
	}));
	rooms.set("2,0", new Room(2, 0, { //Toolshed
		name: { outside: "Tool Shed", inside: "Tool Shed" },
		title: "Garden",
		exits: { outside: "SW", inside: "S" },
		OIDesc: { outside: "A generic toolshed with a beefy door like some damned juggernaut trying to stop my curiosity", inside: "Clutter and tools are strewn everywhere in the dim light, with cobwebs claiming every surface, turning the shed into a silent graveyard of forgotten labour." },
		exitText: { outside: "The kennel is to the west, and the kitchen is to the south.", inside: "I can exit again south" }
	}));
}
//Items
function setupItems() {
	addItem(new Item("Battery", { //Battery
		x: 1, y: 0,
		outside: true,
		gettable: true,
		visible: false,
		requiresTorch: true,
		onExamine: () => (outputText("A heavy black battery used to power a beefy looking truck.")),
		onGet: () => (updateScore(10), "Good"),
		display: () => "On the floor lies what looks like a battery."
	}));
	addItem(new Item("Fuel", { //Fuel
		x: 2, y: 0,
		outside: false,
		gettable: true,
		visible: true,
		onExamine: () => (outputText("A weighted, bright red jerry can filled with fuel.")),
		onGet: () => (updateScore(10), "GOOD"),
		display: () => "On the table there is some fuel in a can."
	}));
	addItem(new Item("Key", { //Toolshed Key
		x: 3, y: 1,
		outside: false,
		gettable: true,
		visible: false,
		onExamine: () => (outputText("A small, rusted iron key worn down by time feeling cold in your palm.")),
		onGet: () => (updateScore(10), "GOOD"),
		onUse: () => (getCurrentObjInfo("LOCK"), unlockLock(items[getObjIdx("KEY", items)])),
		display: () => "In the Box: a lonesome key hangs."
	}));
	addItem(new Item("Truck", { //Truck
		x: 0, y: 2,
		outside: true,
		visible: true,
		onExamine: () => (outputText("An aged, beefy looking truck that I used to get here, with mounds of dust collected over the years.<br>Betty served me well.", "GOOD")),
		onUse: () => (tryFixTruck()),
		onEnter: () => (outputText("I get in my truck. I need to get out of here."), tryFixTruck())
	}));
	addItem(new Item("Dogfood", { //Dogfood
		x: 0, y: 1,
		outside: true,
		gettable: true,
		visible: false,
		onExamine: () => (outputText("A medium sized tin slightly bigger than my hand the words “Pedigree” written on the front with a picture of a smiling German shepherd, just enough to feed one dog.<br>I miss Dasher hope he comes back one day.")),
		onGet: () => (updateScore(10), "GOOD"),
		onUse: () => (tryFeed("")),
		display: () => "In the ransacked compartment of the lorry only dogfood remains."
	}));
	addItem(new Item("Lorry", { //Lorry
		x: 0, y: 1,
		outside: true,
		visible: true,
		onExamine: () => (outputText(`A massive lorry seemingly abandoned after ramming into an unsuspecting tree, still smoking from the bonnet.${items[getObjIdx("DOGFOOD", items)].inInventory? "<br>The cubby is empty from where I took the dogfood.":"<br>The back is wide open showing a tin of dogfood however the rest of the back is surprisingly empty.<br>Probably ransacked."}`, "GOOD")),
		seeInside: () => (items[getObjIdx("DOGFOOD", items)].visible = true),
		onEnter: () => (outputText("I try open the door but it is jammed from age. I get up on the stair amd I see a corpse within. Oh God."))
	}));
	addItem(new Item("Meds", { //Meds
		x: 2, y: 1,
		outside: false,
		gettable: true,
		visible: false,
		onExamine: () => (outputText("An open box filled with assorted gauzes and a half empty bottle of alcohol.<br>Everything else looks too complicated.<br>It seems messily disordered, that damn scavenger got here before me, only a few bits let.")),
		onGet: () => (updateScore(5), "GOOD"),
		display: () => "In the cupboard lies meds strewn across the shelf. Wait those were mine! Blasted thug."
	}));
	addItem(new Item("Cupboard", { //Cupboard
		x: 2, y: 1,
		outside: false,
		gettable: false,
		visible: true,
		onExamine: () => (outputText("There’s a mirror on the front, I could stare at my stunning face for days.<br>There seems to be a grip on the right side. The cupboard is already open.")),
		seeInside: () => ((items[getObjIdx("MEDS", items)].inInventory? "": outputText("Within I can see some Meds.")), items[getObjIdx("MEDS", items)].visible = true)
	}));
	addItem(new Item("Food", { //Off food
		x: 3, y: 1,
		outside: false,
		gettable: true,
		visible: true,
		onExamine: () => (outputText("A messy pile of sludge slapped on a plate, green, brown and white fuzz cover the left side.<br> I cover my nose so it isn’t infiltrated by the sour smell.<br> A small group of flies’ feasts on the repulsive meal, if you can even call it that.")),
		display: () => "On the cabinet there is a plate of food, probably off."
	}));
	addItem(new Item("Torch", { //Torch
		x: -1, y: -1,
		gettable: true,
		state: 0,
		visible: true,
		onExamine: () => (outputText("A small torch that can comfortably fit in my hand which lights the path in front of me.<br> Without it I would be helpless in this pitch-black night.")),
		onUse: () => (useTorch())
	}));
	addItem(new Item("Vase", { //Vase
		x: 3, y: 2,
		outside: false,
		gettable: false,
		visible: false,
		onExamine: () => (outputText("A generic floral vase.")),
		display: () => "On the table there is a generic vase."
	}));
	addItem(new Item("Vase", { //Broken Vase
		x: 3, y: 2,
		outside: false,
		gettable: false,
		visible: false,
		onExamine: () => (outputText("The beautiful floral vase is in pieces, damnable dog.")),
		display: () => "Pieces of what where once a vase are strewn accross the floor."
	}));
	addItem(new Item("Coin", { //Strange Coin
		x: 3, y: 2,
		outside: false,
		gettable: true,
		visible: false,
		onExamine: () => (outputText("A strange coin. Abby (Renarin's wife) collects strange American coins. I could gift her this.", "GOOD")),
		onGet: () => (updateScore(10), "GOOD"),
		display: () => "There is a coin on the floor."
	}));
	addItem(new Item("Collar", { //Dog Collar
		x: 3, y: 0,
		gettable: true,
		visible: false,
		onExamine: () => (outputText("A momento to Dogmeat I guess. It must remind her of her time imprisoned by her old owner."))
	}));
	addItem(new Item("Front Door", { //Front door
		x: 2, y: 2,
		door: true,
		visible: true,
		onExamine: () => (outputText("Paint is peeling off the front to show the dirty brown of the door underneath, dozens of holes cover the door, what’s the point.<br>I notice it’s slightly ajar.")),
		onUse: () => (openDoor({outside:"I push it open, as it creeks obnoxiously, clearly showing its old age.<br>To the east there is a long corridor.", inside:"I push it open, as it creeks obnoxiously, clearly showing its old age and I get smacked in the face by the stale wind of the forest to the west."}))
	}));
	addItem(new Item("Back Door", { //Back door
		x: 3, y: 1,
		door: true,
		visible: true,
		onExamine: () => (outputText("A regular wooden door wide open, very rundown and aged looking like it could fall off its hinges any moment now.")),
		onUse: () => (openDoor({outside:"I push open the door and within is the smell of stale air a kitchen is within to the south", inside:"I push open the door light floods my vision as I’ve just been in a dark room.<br>There’s an overgrown garden to the north."}))
	}));
	addItem(new Item("Toolshed Door", { //Toolshed door
		x: 2, y: 0,
		door: true,
		visible: true,
		onExamine: () => (outputText("A dark brown tool shed door with rotting green spots splattered about.<br>It’s held closed by a sturdy lock.")),
		seeInside: () => (items[getObjIdx("LOCK", items)].visible = true),
		onUse: () => (openDoor({inside:"If you are seeing this you have cheated and I don't know how please tell me!", outside:"I force open the mouldy door; it emits a loud squeak piercing my ears."}, items[getObjIdx("LOCK", items)], "I try to open the door but the lock is stopping me."))
	}));
	addItem(new Item("Lock", { //Toolshed door lock
		x: 2, y: 0,
		outside: true,
		visible: false,
		locked: true,
		onExamine: () => (outputText("A bulky, sturdy lock holding the tool shed door closed.<br>I need to find a key to unlock it.")),
		onUse: () => (unlockLock(items[getObjIdx("KEY", items)]))
	}));
	addItem(new Item("Graffiti", { //Graffiti
		x: 0, y: 0,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("White, scraggy graffiti, clearly not done by a professional, spelling out \"Turn back!\""))
	}));
	addItem(new Item("Pavement", { //Pavement
		x: 0, y: 0,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A generic pavement with large obvious cracks slightly covered by the graffiti."))
	}));
	addItem(new Item("Trap", { //Bear Trap
		x: 1, y: 2,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A bear trap with menacing teeth holding a decomposing corpse. Poor guy."))
	}));
	addItem(new Item("Corpse", { //Corpse
		x: 1, y: 2,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A pale, blueish body with no life left in it. Swarms of flies circling around slowly feeding on the innocent body.  Blood seeped into its clothing where a small journal pokes out one of the pockets.")),
		seeInside: () => (items[getObjIdx("POCKET", items)].visible = true, items[getObjIdx("JOURNAL", items)].visible = true)
	}));
	addItem(new Item("Pocket", { //Corpse
		x: 1, y: 2,
		outside: true,
		visible: false,
		gettable: false,
		onExamine: () => (outputText("I open the buldging pocket and see what looks like a journal within.")),
		seeInside: () => (items[getObjIdx("JOURNAL", items)].visible = true),
		display: () => "One of the corpse's pockets are bulding. I wonder what is within."
	}));
	addItem(new Item("Journal", { //Journal
		x: 1, y: 2,
		outside: true,
		visible: false,
		gettable: true,
		state: 0,
		onExamine: () => (outputText("23/12/2077–<br>I was just out driving my car when a person in need of help flags me down. DO NOT STOP! He attacked me and took my money and the battery out of my car to ensure I don’t make it out. I write this note in hopes of warning future victims. DO NOT SSS;..."), addPointsOnReadingJournal(5)),
		display: () => "There is a journal within the pocket."
	}));
	addItem(new Item("Fire", { //Fire
		x: 1, y: 1,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("I can feel a small amount of heat emanating from the fire – It was only recently put out."))
	}));
	addItem(new Item("Brick", { //Brick -- fresh blood - yours
		x: 1, y: 1,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("An ordinary brick, however, there seems to be blood splattered on one side. Was this what was used on me?")),
		display: () => "There is a brick on the floor next to the fire."
	}));
	addItem(new Item("Mirror", { //Mirror
		x: 2, y: 2,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("I can see my full body in the mirror, I wore my best outfit for the party. I hope I make it in time."))
	}));
	addItem(new Item("Tree", { //Tree
		x: 2, y: 2,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A Christmas tree stands before you, a scrappy testament to holiday spirit in hard times. The lights flicker weakly, some completely burnt out, casting an uneven glow. Decorations are sparse but creative: a handful of dangling spark plugs serve as ornaments, a shiny hubcap proudly crowns the tree as its star, and a battered license plate hangs crookedly, reading: 'WAR BOY.' It's a tree that screams, 'Merry Apocalypse!'"))
	}));
	addItem(new Item("Christmas Tree", { //Christmas tree
		x: 2, y: 2,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A Christmas tree stands before you, a scrappy testament to holiday spirit in hard times. The lights flicker weakly, some completely burnt out, casting an uneven glow. Decorations are sparse but creative: a handful of dangling spark plugs serve as ornaments, a shiny hubcap proudly crowns the tree as its star, and a battered license plate hangs crookedly, reading: 'WAR BOY.' It's a tree that screams, 'Merry Apocalypse!'"))
	}));
	addItem(new Item("Sink", { //Sink
		x: 2, y: 1,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A generic sink however there’s black mould emerging from the handles and sink plug. Ironic how a place where you’d clean your hands is disgusting."))
	}));
	addItem(new Item("Toilet", { //Toilet
		x: 2, y: 1,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A nice toilet, if you ould call mouldy off-coloured crackes nice. This is better off a seat for some unexpecting cat."))
	}));
	addItem(new Item("Table", { //Dining Table
		x: 3, y: 2,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A small dusty square table for only a few people to eat at, with a checkered tablecloth on top scattered with holes showing more of the table than covering.")),
		seeInside: () => (items[getObjIdx("VASE", items)].visible = true)
	}));
	addItem(new Item("Chair", { //Sink
		x: 3, y: 2,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A single oak chair…I suppose this person lives alone."))
	}));
	addItem(new Item("Cabinet", { //Cabinet
		x: 3, y: 1,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A small cabinet with a weird, sour smell coming from it. I’d rather not find out what it is."))
	}));
	addItem(new Item("Countertop", { //Counter top
		x:3, y: 1,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => ("An unkempt countertop filled with unnecessary junk. How can one even use this anymore?")
	}));
	addItem(new Item("Keybox", { //Keybox
		x: 3, y: 1,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A small wooden box for keys. It is open already.")),
		seeInside: () => (items[getObjIdx("KEY", items)].visible = true)
	}));
	addItem(new Item("Flowers", { //Flowers
		x: 3, y: 1,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("Wilting flowers with barely any colour to them, no water or proper sunlight for weeks I almost feel sorry. My wife, Shallan, would die seeing these poor flowers in misery."))
	}));
	addItem(new Item("Kennel", { //Kennel
		x: 3, y: 0,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A small red wooden box in the far end of the garden, so distanced from the main house. The wood is moist with mould slowly spreading."))
	}));
	addItem(new Item("Toolshed", { //Toolshed
		x: 2, y: 0,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("A flimsy wooden shed in the back of the garden, the wood is rotting, I’m surprised it hasn’t broken."))
	}));
	addItem(new Item("Cabin", { //Toolshed
		x: 2, y: 2,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("An old looking cabin with moss growing uo the decayed walls and shoddy windows, with shot grass covering the front."))
	}));
	addItem(new Item("Cabin", { //Toolshed
		x: 3, y: 1,
		outside: true,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("An old looking cabin with moss growing uo the decayed walls and shoddy windows, with shot grass covering the front."))
	}));
	addItem(new Item("Clutter", { //Clutter within Toolshed
		x: 2, y: 0,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("Randomly scattered junk takes up majority of the space in this already cramped shed. All looks pretty useless."))
	}));
	addItem(new Item("Tools", { //Clutter within Toolshed
		x: 2, y: 0,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (outputText("Randomly scattered junk takes up majority of the space in this already cramped shed. All looks pretty useless."))
	}));
	addItem(new Item("MAN", { //Clutter within Toolshed
		x: 2, y: 2,
		outside: false,
		visible: true,
		gettable: false,
		onExamine: () => (scav.state == -1 ? outputText("The body of the man who tried to kill me."): scav.state == -2 ? outputText("The hulking frame of the man blocks the doorway to the bathroom. I should get out of here."): "" )
	}));

	//Adds items to inventory
	addToInventory("TORCH");
	devTools() //hmmmmmm you shouldn't be seeing this
}
function devTools() {
	//Wins game by deault -- adds fuel and battery to inv
	//addToInventory("FUEL");
	//addToInventory("BATTERY");

	//Automatically gives dogfood
	//addToInventory("DOGFOOD"); 
	//Automatically gives you dog
	//dog.state = 1;
}
function addItem(data) { //Makes it easier to add interactables
	items.push(data);
}
function addToInventory(objName) { 
	const item = items[getObjIdx(objName.toUpperCase(), items)];
	inventory.push(item);
	item.inInventory = true;
	item.x = -1;
	item.y = -1;
	return item.onGet?.();
}
//Doggo fun
function setupDog() {
	addDogAction(0, 0, new Action(0, 0, { //RN
		outside: true,
		trigger: "Dogmeat sniffs at the grafitti on the ground, growling softly.",
		effect: "She tilts her head, barks once, and starts pawing at the pavement.",
		outcome: (items[getObjIdx("PAVEMENT", items)].visible = true)
	}));
	addDogAction(0, 1, new Action(0, 1, { //R
		outside: true,
		trigger: "Dogmeat circles the broken-down lorry, sniffing loudly, then barks into the empty boot.",
		effect: "She stays there, wagging her tail, before hopping back down to follow you. \"I'm sorry girl, you've already eaten it.\"",
	}));
	addDogAction(0, 2, new Action(0, 2, { //RS
		outside: true,
		trigger: "Dogmeat sniffs around the truck, then hops onto the bonnet, barking at something invisible in the distance.",
		effect: "She stays there, standing like Simba, wagging her tail, before hopping back down to follow you.",
	}));
	addDogAction(1, 2, new Action(1, 2, { //F
		outside: true,
		trigger: "Dogmeat darts into the bushes, rustling loudly.",
		effect: "She reappears moments later with a stick, wagging her tail triumphantly.",
	}));
	addDogAction(1, 1, new Action(1, 1, { //CE
		outside: true,
		trigger: "Dogmeat whines at the fire’s ashes, sniffing around and pawing at the ground.",
		effect: "She sneezes dramatically at the ash, then gives you a sheepish look.",
	}));
	addDogAction(1, 0, new Action(1, 0, { //CD
		outside: true,
		trigger: "Dogmeat presses close to you, growling softly into the darkness.",
		effect: "Her ears perk up, and she lets out a low bark before settling down beside you, her warmth reassuring.",
	}));
	addDogAction(2, 2, new Action(2, 2, { //C
		outside: true,
		trigger: "Dogmeat scratches at the door of the cabin before sitting and tilting her head expectantly.",
		effect: "She wags her tail when you approach, as if urging you to open it quickly.",
	}));
	addDogAction(2, 2, new Action(2, 2, { //Corridor
		outside: false,
		trigger: "Dogmeat skids to a stop at a mirror tilting her head at her reflection.",
		effect: "Then her head snaps towards the door. She starts growling menacingly.",
		outcome: () => (replaceCorridorAction())
	}));
	addDogAction(2, 1, new Action(2, 1, { //Bathroom
		outside: false,
		prerequisite: () => (!items[getObjIdx("MEDS", items)].inInventory),
		trigger: "Dogmeat paws at the slightly ajar cupboard, whining softly.",
		effect: "The door swings open, revealing an old first-aid kit. She wags her tail, proud of her discovery, then drops it in my hand. This could be helpful.",
		outcome: () => (items[getObjIdx("CUPBOARD", items)].open = true, items[getObjIdx("MEDS", items)].visible = true, addToInventory("MEDS"))
	}));
	addDogAction(3, 2, new Action(3, 2, { //Dining Room
		outside: false,
		trigger: "Dogmeat sniffs around, then leaps onto the dusty table, tail wagging.",
		effect: "The vase teeters before falling and shattering. Among the shards, you notice an unusual coin.",
		outcome: () => (items.splice(getObjIdx("VASE", items), 1), items[getObjIdx("VASE", items)].visible = true, items[getObjIdx("COIN", items)].visible = true)
	}));
	addDogAction(3, 1, new Action(3, 1, { //Kitchen
		outside: false,
		trigger: "Dogmeat sniffs at a pile of rotting food on the counter, then recoils dramatically, sneezing.",
		effect: "She gives me an accusatory look, as if blaming you for the smell.",
	}));
	addDogAction(3, 1, new Action(3, 1, { //Garden
		outside: true,
		effect: "Dogmeat prances in circles, chasing her tail like it’s a prize worth winning. After a few dizzying spins, she collapses into the grass with an exaggerated sigh, rolling onto her back and kicking her legs lazily in the air. It’s hard not to laugh at her antics.",
	}));
	addDogAction(3, 0, new Action(3, 0, { //Kennel
		outside: true,
		trigger: "Dogmeat circles the kennel, sniffing loudly, then squeezes inside, wagging her tail.",
		effect: "She emerges with a weathered collar in her mouth, her tail wagging furiously.",
		outcome: () => (items[getObjIdx("COLLAR", items)].visible = true, addToInventory("COLLAR") )
	}));
	addDogAction(2, 0, new Action(2, 0, { //Toolshed Outside
		outside: true,
		trigger: "Dogmeat sniffs around the toolshed door before trying to nudge it open with her nose. A lock is stopping her.",
		effect: "She trots back to you with an old, rusted key in her mouth, dropping it at your feet proudly. You pick it up. Maybe this could unlock that lock.",
		outcome: () => (items[getObjIdx("LOCK", items)].visible = true, addToInventory("KEY"))
	}));
	addDogAction(2, 0, new Action(2, 0, { //Toolshed Inside
		outside: false,
		trigger: "Dogmeat sniffs at a dusty pile of old tools, her nose twitching furiously. Suddenly, she lets out a loud sneeze, sending a small puff of dust into the air.",
		effect: "She snorts indignantly and pads away, looking back at the tools like they’ve personally insulted her.",
	}));
}
function addDogAction(x, y, data) {
	if (!dog.actions[y]) {
		dog.actions[y] = [];
	}
	if (!dog.actions[y][x]) {
		dog.actions[y][x] = {};  // Initialize the object at dog.actions[x][y]
	}
	dog.actions[y][x][data.outside ? "outside" : "inside"] = data;
}
function replaceCorridorAction() {
	addDogAction(2, 2, new Action(2, 2, { //Corridor with man
		outside: false,
		prerequisite: dog.state != 0,
		trigger: "Dogmeat sees his old master and shies away. \"It's ok girl he won't hurt you anymore\"",
		effect: "Dogmeat wanders over to you slowly keeping his distance from the large man"
	}));
}

//Utils that need to be accessed earlier
function getObjIdx(objName, arr) { //Gets idx of an item within an array
	return arr.findIndex(item => item.name.toUpperCase() === objName.toUpperCase());
}

//Score
function updateScore(amount) {
	score += amount;
}
function addPointsOnReadingJournal(amount) {
	if ( currentObj.obj.state == 0 ) { updateScore(amount) }
	currentObj.obj.state++;
}