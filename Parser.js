function parser(cmd) { //Figures out what to do with that input
        //Outputs input
        outputText("<br> > " + cmd.trim());
        //Normalises input
        const commandWords = cmd.trim().toUpperCase().split(" ");
        const verb = commandWords[0];
        let noun = commandWords.slice(1).join(" ");
        //Deals with inputs of door
        if (noun == "DOOR") {
                noun = findDoor().toUpperCase();
        }
        //Gets current obj
        getCurrentObjInfo(noun);
        if ( noun == "IT" ) { outputText(`(${currentObj.name})`) }
        //Replaces noun to new name
        noun = currentObj.name.toUpperCase();
        //Win Y/N parser
        if (end) {
                switch (verb) {
                        case "Y":
                                win();
                                break;
                        case "N":
                        default:
                                dontWin();
                                break;
                }
                return;
        }
        //Scavenger parser
        if (scavengerParser(verb)) {
                return;
        }
        //Parser
        switch (verb) {
                //Movement
                case "N": case "NORTH": //North
                case "S": case "SOUTH": //South
                case "E": case "EAST": //East
                case "W": case "WEST": //West
                        tryMove(verb.substring(0, 1));
                        break;
                case "ENTER": case "EXIT":
                        tryEnter(verb, noun);
                        break;
                //Locational
                case "L": case "LOOK": //Look around area
                        showRoom();
                        break;
                //Items
                case "PICKUP": case "PICK-UP":
                case "T": case "TAKE":
                case "G": case "GET":
                        tryGet();
                        break;
                case "X": case "EXAMINE":
                        tryExamine();
                        break;
                case "O": case "OPEN":
                        if (!canOpen(noun)) {
                        outputText("How do you expect me to do that now???");
                        break;
                        }
                case "U": case "USE":
                        tryUse();
                        break;
                case "UNLOCK":
                        getCurrentObjInfo("LOCK");
                        if (!(player.x == 2 && player.y == 0 && currentObj.obj.visible)) {
                                outputText("Unlock what now..");
                                break;
                        }
                        tryUse();
                        break;
                case "READ":
                        if (currentObj.name != "Journal") {
                                outputGenericDefault();
                                break;
                        }
                        tryRead();
                        break;
                case "FEED":
                        tryFeed(noun);
                        break;
                case "I": case "INV": case "INVENTORY":
                        displayInventory();
                        break;
                //DOG
                case "P": case "PAT": case "PLAY": case "STROKE":
                        tryPat();
                        break;
                //WIN
                case "F": case "FIX":
                        tryFix(noun);
                        break;
                //HELP
                case "H": case "HELP":
                        showHelp();
                        break;
                //Not understood command
                default:
                        outputText("I don't know how to do that!");
        }
}

//Scavenger
function scavengerParser(verb) {
        if (!(fight && scav.state >= 0)) {
                return false;
        }
        if (scav.state == 0) { //default
                switch (verb) {
                        case "F": case "FIGHT":
                                fightScavenger();
                                break;
                        case "R": case "RUN":
                                runFromScavenger();
                                break;
                        case "T": case "TALK":
                                talkToScavenger();
                                break;
                        default:
                                outputText("Please input a correct function eg [FIGHT][RUN][TALK].");
                                break;
                }
        }
        else if (scav.state == 1) { //fight
                switch (verb) {
                        case "K": case "KICK":
                                fightScavenger("K",scav.canRun, scav.canTalk);
                                break;
                        case "P": case "PUNCH":
                                fightScavenger("P",scav.canRun, scav.canTalk);
                                break;
                        case "T": case "TALK":
                                fightScavenger("T",scav.canRun, scav.canTalk);
                                break;
                        case "R": case "RUN":
                                if (scav.canRun) {
                                        runFromScavenger();
                                        break;
                                }
                        default:
                                outputText(`Please input a correct function eg [KICK][PUNCH]${scav.canRun? '[RUN]':''}${scav.canTalk? '[TALK]':''}.`);
                                break;
                }
        }
        else if (scav.state == 2) { //ran away successfully
                outputText("The man is angry. I can try [RUN] again or go in for a [FIGHT]");
                switch (verb) {
                        case "F": case "FIGHT":
                                fightScavenger(false, scav.canTalk);
                                break;
                        case "R": case "RUN":
                                runFromScavenger();
                                break;
                        default:
                                outputText(`Please input a correct function eg [FIGHT][RUN].`);
                }

        }
        if (scav.state == 3) { //Peaceful will just stand there but block bathroom
                let currentExit = "E"
                if (currentRoom.exits["inside"].includes("W")) { currentExit += "W" } //Checks if front door is open
                currentRoom.exits["inside"] = currentExit; //Can no longer go into the bathroom
                scav.state = -2;
        }

        return true;
}

//Functions for finding targets
function findDoor() {//Finds out what door it is //Allows input of 'door'
        for (item of items) {
            if (samePosition(item, player)) {
                if (item.name.toUpperCase().includes("DOOR")) {
                    return item.name;
                }
            }
        }
        return "";
}
function getCurrentObjInfo(objName) { //Gets the object info and stores it for
        if (objName === "IT") {
            return;
        }
        const idx = getObjIdx(objName, items);
        if (idx > -1) {
            currentObj = {
                found: true,
                obj: items[idx],
                name: items[idx].name,
                idx: idx
            };
        } else {
            currentObj = { found: false, obj: {}, name: "", idx: 0 };
        }
}