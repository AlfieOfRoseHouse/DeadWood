//Initialises Game
function initGame() { //Resets game to base stats
        //Resets room
        setupRooms();
        setupItems();
        setupDog();

        load();
        cli.focus();
}
function load() {
        //TITLE
        const titleTxt = [
                "    _____                                                              ",
                " __|__   |__  ______  ____    _____   __  __  __  _____  _____  _____  ",
                "|     \\     ||   ___||    \\  |     \\ |  \\/  \\|  |/     \\/     \\|     \\ ",
                "|  [)  \\    ||   ___||  ^  \\ |  [)  \\|    /\\    || ( ) || ( ) ||  [)  \\",
                "|______/  __||______||__|\\__\\|______/|___/  \\___|\\_____/\\_____/|______/",
                "   |_____|                                                             ",
        ].join("<br>");
        const lore = [
                "I was driving to my brother Renarin, for Christmas when my dashboard lit up, flashing bright red—my fuel was almost gone.",
                "The road had been empty until I spotted a distressed figure standing by the edge.",
                "I stopped, hoping for directions to a nearby petrol station, but as soon as I stepped out of the car,",
                "a sharp pain shot through the back of my head, and everything went black.",
                "I woke up to find my car dead—no fuel, no battery, nothing.",
                "The figure was gone, and I was alone, stranded in the cold with no answers, only the haunting feeling that something was terribly wrong.",
                "I see my truck, bonnet up and unable to start.",
                "<br>I remember my car is out of fuel, I check the open bonnet to be faced with a missing battery.",
                "I go back to where my body was dragged to and pick up my backpack My torch clipped to the side still. The rest of it seems to be looted. Damnable ravens.",
                "Enter [HELP] if that is what you require."
        ].join("<br>");
        outputText(titleTxt);
        outputText(lore) //Info dump
}
function startGame() {
        //Plays bad sound
        _badSound.play();
        //Starts music after 1000ms
        setTimeout(function () {
                _music.loop = true; //Puts the music file on loop
                _music.play();      //Plays the music file

        }, 1000);
        recalculateRoom();
        showRoom();
}

//Debugs input
function checkInput(e) { //Validates input
        if (won) {
                cli.innerHTML = "";
                e.preventDefault();
                return;
        }
        if (e.key != "Enter") {
                return;
        }
        if (toName) { //DOG name entry
                outputText(` > ${cli.textContent}<br>Actually no I don't like that name.`)
                outputText("\"Dogmeat,\" I decide, grinning. \"That’s what I’ll call you. Let’s face the world together, Dogmeat.\"", "GOOD")
                cli.innerHTML = "";
                e.preventDefault();
                toName = false;
                return;
        }
        command = cli.textContent; // use the typed command
        //Clears input box
        cli.innerHTML = "";
        e.preventDefault();
        if (started) {
                parser(command);
                return;
        }
        //Runs code to start game
        outputText("<br> > ")
        startGame();
        started = true;
}