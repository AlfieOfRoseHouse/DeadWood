//Functions for commands
function tryMove(dir) { //Moves
	if (!canMove(dir)) {
		outputText("I can't go that way"); //If movement in said direction is impossible
		const exitText = currentRoom.desc == null
                	? currentRoom.exitText[(player.outside ? "outside" : "inside")]
                	: currentRoom.exitText;
		outputText(exitText);
		return;
	}
	const movement = uniqueMovement(dir);
	const movementActions = {
		N: () => player.y--, //Cardinal directions
		E: () => player.x++,
		S: () => player.y++,
		W: () => player.x--,
		D: () => (player.outside = !player.outside), // Through Door
		T: () => { player.x = 2; player.y = 0; }, // Toolshed
		K: () => { player.x = 3; player.y = 0; }, // Kennel
		G: () => { player.x = 3; player.y = 1; }, // Garden
		F: () => { player.x = 2; player.y = 2; }, // FrontDoor
		ENT: () => {player.outside = !player.outside}, //Enter
		EXI: () => {player.outside = !player.outside}, //Enter
	};

	movementActions[movement]?.(); // Execute the movement if it exists

	recalculateRoom();
	showRoom();
}
function tryEnter(dir, noun) {
	if (dir == "EXIT") {
		tryMove("EXI");
		return;
	}
	const itemsToEnter = items.filter(item => item.onEnter != null);
	const itemsInPos = itemsToEnter.filter(item => samePosition(item, player));
	if ( itemsInPos.length == 0 ) {
		tryMove("ENT");
		return;
	}
	if ( currentObj.name != "Truck" && currentObj.name != "Lorry" && currentObj.name != "" ) {
		outputText("I don't know how to enter that.");
		return;
	}
	itemsInPos[0].onEnter?.()
}
function tryGet() { //Pick ups items
	if (!canGet()) {
		return null;
	}
	//adds item to inventory
	let colour = addToInventory(currentObj.name);
	colour = colour ? colour.toUpperCase() : "NORMAL"
	outputText("I pick up " + currentObj.name, colour);
}
function tryExamine() { //Examines items
	if (!canExamine()) {
		return;
	}
	if (currentObj.obj.state == "BF" || currentObj.obj.state == "FB") {
		currentObj.obj.onUse?.()
		return;
	}
	currentObj.obj.onExamine?.();
	currentObj.obj.seeInside?.();
}
function tryUse() { //Uses items
	if (!currentObj.found || !currentObj.obj.onUse) {
		outputText("Do what now??");
		return;
	}
	currentObj.obj.onUse?.();
}
function tryFeed(noun) { //Feeds dog
	if (noun !== "DOG" && noun !== "" || !samePosition({ x: 3, y: 0, outside: true }, player)) {
		outputText("Feed what now? The trees? A rock? Let's focus here.");
		return;
	}

	if (dog.state !== 0) {
		outputText("I've already fed her. She looks at me with those bright eyes, full and content. She won't be needing food for now.");
		return;
	}

	const food = items[getObjIdx("DOGFOOD", items)];
	if (!food.inInventory) {
		outputText("With what? My charming personality? I need some actual dog food!");
		return;
	}
	//FEED
	currentRoom.desc = "A wooden kennel where Dogemeat's prison once was.";
	let idx = getObjIdx("DOGFOOD", inventory);
	inventory.splice(idx, 1)
	idx = getObjIdx("DOGFOOD", items);
	items[idx].inInventory = false;
	items[idx].visible = false;

	const interaction = [
		// Feeding interaction
		"I kneel down and stretch out my hand, the tin of dog food open and inviting.",
		"Her ears perk up, and she tilts her head, sniffing the air before bounding towards me with surprising speed.",
		"Her nose bumps against the can, warm and wet, as she eagerly digs in. The sound of happy munching fills the quiet around us.",
		"I can't help but smile as I watch her, there's a certain beauty in her scruffy coat and the fierce determination in her eyes.",
		// Building a bond
		"She finishes quickly, lifting her head to meet my gaze, her tail wagging furiously.",
		"I reach out cautiously, and she nudges her head against my palm, a small, trusting gesture.",
		"\"You know,\" I say softly, \"you’d make a fine companion. What do you think, girl? Want to stick together?\"",
		// Dog's response
		"Her response is immediate, a joyous bark that echoes through the trees. She spins in excited circles, her energy infectious.",
	].join("<br>");
	outputText(interaction);

	outputText("\"What should I name you girl?\" I say as I kneel down to stroke her head. (ENTER NAME BELOW)")
	toName = true;
	updateScore(100);
	dog.state = 1;
}
function tryPat() { //Plays with dog
	if (dog.state == 0) {
		outputGenericDefault();
		return;
	}
	outputText("I stroke the dog, patting down her fur. She spins around me joyously. We can continue on our journey.");
}
function tryFix(noun) { //Fixes truck
	switch (noun) {
		case "TRUCK": case "CAR":
		case null: case "":
			if (player.x == 0 && player.y == 2) {
				getCurrentObjInfo("TRUCK");
				currentObj.obj.onUse?.();
				break;
			}
		default:
			outputText("Fix what now??");
			break;
	}
}
function showHelp() { //Shows all functions/Comands
	const commands = [
		" - MOVE (N/S/E/W) - Move in a direction,",
		" - ENTER / EXIT - Enter exit building or vehicle",
		" - LOOK (L) - Look around the current area,",
		" - GET [ITEM] (G) - Pick up an item,",
		" - EXAMINE [ITEM] (X) - Examine an item,",
		" - USE [ITEM] (U) - Use an item,",
		" - UNLOCK - Unlocks a lock,",
		" - OPEN (O) - Opens something,",
		" - INVENTORY (I) - Show what you are carrying,",
		" - FIX (F) - Fixes target item,",
		" - FEED - Hmmmm,",
		" - PAT - hmmmmmmmm that would be a spoiler, no?",
		" - HELP (H) - Well you've done this haven't you."
	];
	outputText("Available commands:<br>" + commands.join("<br>"));
}

//Scavenger encounter
function fightScavenger(style="", canRun=true, canTalk=true) {
	scav.state = 1;
	if (style == "") { //Start
		scav.state = 1;
		outputText("You draw your fists and charge at the bulk of a man, ready for a fight!", "GOOD");
		if (dog.state != 0) { outputText("Dogmeat pins him down!"), scav.health -= 1; }
		scav.health -= 3;
		outputText(`You strike the scavenger with your fists! He stumbles back, but he's still standing. His health: ${scav.health}`, "GOOD");
		outputText("He retaliates, swinging a brutal punch that lands squarely on your chest. You double over in pain, spitting blood.", "Bad");
		outputText(`What will you do next? [KICK], [PUNCH], ${canRun? '[RUN], ':''}${canTalk? 'or try to [TALK] it out':''}?`);
	}
	else if (style === "K") { //KICK
		outputText("With a surge of anger, you lift your foot and deliver a powerful kick to the scavenger’s head.", "GOOD");
		scav.health -= 3;
		if (scav.health <= 0) {
		    outputText("The blow lands with a sickening thud. The man crumples to the ground, his blood staining the floor.<br>He is dead.<br>What have you done?", "Good");
		    scav.state = -1; // End the encounter
		} else {
		    outputText(`He staggers back, clutching his head. He’s still alive but barely hanging on. His health: ${scav.health}`);
		    outputText(`The scavenger glares at you with rage. What will you do next? [KICK], [PUNCH], ${canRun? '[RUN], ':''}${canTalk? 'or try to [TALK] it out':''}?`);
		}
	}	
	else if (style == "P") { //PUNCH
		outputText("Your fists blaze with fury as you punch the scavenger with all your strength. The blow lands with a sickening crack.", "GOOD");
		scav.health -= 3;
		if (scav.health <= 0) {
			outputText("The blow lands with a sickening thud. The man crumples to the ground, his blood staining the floor.<br>He is dead.<br>What have you done?", "good");
			scav.state = -1; // End the encounter
			fight = false;
		} else {
			outputText(`The scavenger stumbles back, clearly hurt but not finished. His health: ${scav.health}`);
			outputText(`His eyes flash with anger as he prepares for his next move. What will you do next? [KICK], [PUNCH], ${canRun? '[RUN], ':''}${canTalk? 'or try to [TALK] it out':''}?`);
		}
	}
	else if (style == "T") { //TALK
		outputText("You attempt to reason with the scavenger, hoping to avoid further violence. \"We don't have to do this,\" you plead.");
		let responseChance = Math.random();
		if (responseChance > 1 - (scav.health / 9)) {
		    outputText("The scavenger pauses, his anger momentarily waning. He lowers his fists, considering your words.","green");
		    outputText("He sighs, wiping the blood from his face. \"Fine, you win. Just get out of here.\"");
		    scav.state = 3;
		    fight = false
		} else {
		    outputText("The scavenger laughs menacingly. \"Talk? You think I’ll just let you walk away after all that?\" He swings his right elbow at you!", "BAD");
		    outputText(`You narrowly dodge the blow. This fight isn’t over. What will you do next? [KICK], [PUNCH], ${canRun? '[RUN], ':''}`);
		    scav.canTalk = false;
		}
	}
	if (scav.state == -1) {
		updateScore(10);
		if (dog.state != 0) { outputText("Dogmeat lays dow next to his old captor resting her head on his chest. <br> He then jumps up to follow you.") }
	}
	else if (scav.state == 3) {
		updateScore(20);
	}
	bloodiedClothes()
}
function runFromScavenger() {
	scav.state = 2;
	scav.canRun = false;
	outputText("You decide to make a break for it, trying to escape the confrontation before it gets worse.");
	
	let escapeChance = Math.random();
    	let successThreshold = 1 - (scav.health / 9);

	if (escapeChance < successThreshold) {
		outputText("You sprint down the corridor, the scavenger too slow to catch up. You manage to escape!", "GOOD");
		scav.state = 2;
		tryMove("E");
		fight = false;
	} else {
		outputText("You turn to run, but the scavenger is too fast. He tackles you back into the fight!", "BAD");
		if (dog.state != 0) { outputText("Dogmeat attacks his old captor biting his face."), scav.health -= 2; }
		outputText("The fight continues. What will you do next? [KICK], [PUNCH], or try to [TALK]?");
		scav.state = 1;
	}
	
}
function talkToScavenger() {
	scav.state = 3;
	outputText("You take a deep breath, hoping to calm the situation. \"We don’t have to do this, we can talk.\"");
	let responseChance = Math.random();
	let successThreshold = 1 - (scav.health / 9);
	if (responseChance > successThreshold) {
		outputText("The scavenger looks at you, his anger fading for a moment. He lowers his fists, considering your words.", "GOOD");
		outputText("He sighs deeply, wiping the blood from his face. \"Fine, you win. Just get out of here.\"");
		scav.state = 3;
		fight = false
	} else {
		outputText("The scavenger grins menacingly. \"You think I’ll listen to you after all this? You're dead wrong!\" He lunges forward!", "BAD");
		outputText("His eyes burn with rage. The fight isn’t over. What will you do next? [KICK], [PUNCH]?");
		scav.state = 1;
		scav.canTalk = false;
	}
}
function bloodiedClothes() {
	items[getObjIdx("MIRROR", items)].desc = "I look at myself in the mirror. My shirt is stained with blood what have I done?"
	items[getObjIdx("CUPBOARD", items)].desc = "I look at myself in the cupboard door. My shirt is stained with blood what have I done? The door is slighty open and I can see inside."
}

//Generic functions for data collection
//Checks if actions are viable
function canMove(dir) {
	if (currentRoom.desc == undefined) {
		return currentRoom.exits[(player.outside ? "outside" : "inside")].includes(dir);
	} else {
		return currentRoom.exits.includes(dir);
	}
}
function canGet() {
	if (!currentObj.found || !currentObj.obj.visible) {
		outputGenericDefault();
		return false;
	}
	if (currentObj.obj.inInventory) {
		outputText("But I already have that, to open my backpack type [INVENTORY]?");
		return false;
	}
	if (!samePosition(currentObj.obj, player)) { //Checks if obj is at player's location
		outputGenericDefault(); //Not at location
		return false;
	}
	if (!currentObj.obj.gettable) {
		outputText("Who do you think I am, picking up that thing!!");
		return false;
	}
	return true;
}
function canExamine() {
	if (!currentObj.found || !currentObj.obj.visible) {
		outputGenericDefault();
		return false;
	}
	if (!samePosition(currentObj.obj, player) && !isInInventory(currentObj)) { //Checks if obj is at player's location
		outputGenericDefault(); //Not at location
		return false;
	}
	return true;
}
function canOpen(noun) {
	return noun.toUpperCase().includes("DOOR") || noun.toUpperCase().includes("CUPBOARD")
}

//Utils
function outputGenericDefault() {
	outputText("Nothing too special.")
}

//Movement
function uniqueMovement(dir) {
	const uniqueMovements = [
		{ x: 2, y: 2, restrictedDirs: ["E", "W"], outsideCheck: [true, false], result: "D" }, // Front door
		{ x: 3, y: 1, restrictedDirs: ["N", "S"], outsideCheck: [false, true], result: "D" }, // Back door
		{ x: 2, y: 0, restrictedDirs: ["N", "S"], outsideCheck: [true, false], result: "D" }, // Toolshed door
		{ x: 3, y: 1, restrictedDirs: ["E", "E"], outsideCheck: [true, true], result: "T" }, // Garden->Toolshed
		{ x: 3, y: 1, restrictedDirs: ["W", "W"], outsideCheck: [true, true], result: "F" }, // Garden->Front door
		{ x: 2, y: 2, restrictedDirs: ["N", "N"], outsideCheck: [true, true], result: "G" }, // Front door->Garden
		{ x: 2, y: 0, restrictedDirs: ["S", "S"], outsideCheck: [true, true], result: "G" }, // Toolshed->Garden
		{ x: 2, y: 0, restrictedDirs: ["W", "W"], outsideCheck: [true, true], result: "K" }, // Toolshed->Kennel
		{ x: 3, y: 0, restrictedDirs: ["E", "E"], outsideCheck: [true, true], result: "T" }, // Kennel->Toolshed
	];

	return uniqueMovements.find(({ x, y, restrictedDirs, outsideCheck, result }) =>
		player.x === x &&
		player.y === y &&
		restrictedDirs.some((rDir, i) => rDir === dir && player.outside === outsideCheck[i])
	)?.result || dir;
}

//Functions for using objects
function openDoor(openTxt, lockObj = { locked: false }, lockedTxt = "") {
	if (currentObj.obj.open) {
		outputText("But I've already opened that.");
		return;
	}
	if (lockObj.locked) {
		outputText(lockedTxt);
		lockObj.visible = true;
		return;
	}
	currentObj.obj.open = true;
	outputText(openTxt[player.outside? "outside":"inside"]);
	const doors = [
		{ x: 2, y: 2, inside: "WEXI", outside: "EENT" }, //Front door
		{ x: 3, y: 1, inside: "NEXI", outside: "SENT" }, //Back door
		{ x: 2, y: 0, inside: "SEXI", outside: "NENT" }  //Toolshed door
	]
	for (const door of doors) {
		if (player.x == door.x && player.y == door.y) {
			currentRoom.exits.inside += door.inside;
			currentRoom.exits.outside += door.outside;
		}
	}
}
function unlockLock(key) {
	if (!key.inInventory) {
		outputText("I'm going to need a key for that");
		return;
	}
	currentObj.obj.locked = false;
	updateScore(15);
	outputText("I insert the key and with a click it turns. The door is unlocked.","GOOD");
}
let torchUseIdx = 0
function useTorch() {
	currentObj.obj.state = (currentObj.obj.state == 0 ? 1 : 0);
	if (currentObj.obj.state == 0) { outputText("I turn off the torch", "BAD"); }
	else if (currentObj.obj.state == 1) {
		outputText("I turn on the torch", "GOOD");
		torchUseIdx++;
		if (torchUseIdx == 1) { updateScore(5); }
	}
	torchItems = items.filter(item => item.requiresTorch);
	for (const item of torchItems) { item.visible = (currentObj.obj.state == 0 ? false : true); }
}
function tryRead() { //Reads items
	if (currentObj.obj.inInventory || samePosition(currentObj.obj, player)) {
		currentObj.obj.onExamine();
		if (!currentObj.obj.inInventory) { tryGet(); }
		return;
	}
	outputText("Read what now??");
}

//Winning
function tryFixTruck() {
	if ( !currentObj.found ) { getCurrentObjInfo("TRUCK"); }
	const { state } = currentObj.obj;
	const fuelNeeded = !state.includes("F");
	const batteryNeeded = !state.includes("B");
	const hasFuel = items[getObjIdx("FUEL", items)].inInventory;
	const hasBattery = items[getObjIdx("BATTERY", items)].inInventory;

	// Add fuel if needed and available
	if (fuelNeeded && hasFuel) {
		updateScore(15);
		addToTruck("FUEL", "I open the fuel cap, and pour the contents of the jerrycan in. I have fuel now! I discard the useless jerry can now that it's empty.", "F");
	}
	// Add battery if needed and available
	if (batteryNeeded && hasBattery) {
		updateScore(15);
		addToTruck("BATTERY", "I peer into the engine. I position my missing battery and connect the clamp and wires. I have electricity now!", "B");
	}

	//Check to show what is missing
	if ((fuelNeeded && !hasFuel) || (batteryNeeded && !hasBattery)) {
		const missingParts = [
			!hasFuel && fuelNeeded ? "fuel" : "",
			!hasBattery && batteryNeeded ? "a battery" : "",
		].filter(Boolean).join(" and ");
		outputText((!(hasFuel && fuelNeeded) && !(hasBattery && batteryNeeded) ? '' : 'Also, ') + `I need ${missingParts}! I've got neither.`,"BAD");
	}

	// Check if both fuel and battery are in place (win condition)
	const newState = currentObj.obj.state;

	const fuel = newState.includes("F");
	const battery = newState.includes("B");

	if (fuel && battery) {
		if (!wonBefore) {
			outputText("<br>I start up the engine. I can drive!!", "GOOD");
		}
		outputText("Should I leave this god-forsaken place? (Y/N)");
		end = true;
		wonBefore = true;
	}
}
function addToTruck(itemKey, itemDescription, stateChar) {
	const itemIdx = getObjIdx(itemKey, items);
	outputText(itemDescription, "GOOD");
	items[itemIdx].inInventory = false;
	inventory.splice(getObjIdx(itemKey, inventory), 1);
	currentObj.obj.state += stateChar;
}
function dontWin() {
	end = false;
	outputText("My job isn't done here. I return to the forest.");
	tryMove("E");
}
function win() {
	updateScore(100);
	outputText("I push my foot hard to the floor, and leave this stupid forest in my dust. I hope I can get to Renarin's on time.", "GOOD");
	loadTitle("WINNER");
	won = true;
	winAnim();
	hideCLI();
	setTimeout(dogAnim, 1500);
}