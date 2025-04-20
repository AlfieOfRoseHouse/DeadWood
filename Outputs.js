//Shows the player their current room
function recalculateRoom() { //Used to save time when coding and use less data as the array doesnt have to be called upon so often
        currentRoom = rooms.get(coordKey(player.x, player.y));
}
function showRoom() {
        //Updates header score and title
        loadTitle(currentRoom.title);
        loadScore(score);

        //Initialise output text
        let txtToPrint = "";

        //Retrieve Room details
        const weirdRoom = currentRoom.desc == null;
        const name = weirdRoom
                ? currentRoom.name[(player.outside ? "outside" : "inside")]
                : currentRoom.name;
        const desc = rooms.get(coordKey(player.x, player.y)).onLook(player);
        const exitText = weirdRoom
                ? currentRoom.exitText[(player.outside ? "outside" : "inside")]
                : currentRoom.exitText;

        //Add room name and description to the output
        txtToPrint = `I am in a ${name}. ${desc}`;

        //Handles Dog interaction if applicable
        const dogData = dog.actions?.[player.y]?.[player.x]?.[player.outside ? "outside" : "inside"];
        if (dog.state != 0 && dogData?.prerequisite != false) {
                const dogInteraction = dogAction(player.x, player.y);
                if ( dogInteraction != false ) { txtToPrint += dogInteraction; }
        }

        // Display items in the room
        for (const item of items.filter((item) => item.x == player.x && item.y == player.y && item.outside == player.outside && item.visible)) {
                if (item.display != undefined) { txtToPrint += " " + item.display?.(); }
        }

        //Scavneger
        if (player.x == 2 && player.y == 2 && !player.outside) {
                if (scav.state == -1) {
                        txtToPrint += " Oh God. He is dead isn't he. I wish I could bury him. What have I become?";
                }
                if (scav.state == -2) {
                        txtToPrint += " The big man blocks the doorway. \"Move it\" He grunts, menacingly staring into my soul with those beady eyes.";
                }
        }

        txtToPrint += " " + exitText;

        outputText(txtToPrint); // Display room exit text

        //Scavenger encounter
        if ( player.x == 2 && player.y == 2 && !player.outside  && scav.state >= 0 ) {
                outputScavengerText();
        }
}
function outputScavengerText() {
        let txtToPrint = [
                "",
                "...",
                "The handle to the door creaks under the weight of a slow, deliberate turn.",
                "A soft, eerie squeak escapes as the door inches open, the faint sound echoing down the dark hallway.",
                "A figure stands before me, blocking the doorway. He's enormous, his hulking frame filling the space, casting a long shadow. His eyes narrow, assessing me, waiting for a response. I can [FIGHT], [RUN], or attempt to [TALK] to the man."
        ].join("<br>");
        outputText(txtToPrint,"BAD");
        fight = true;
}

//Handles outputs
function outputText(txt,feedback=" ") { //Creates a new paragraph in the output field
        // add txt to a new paragraph
        // could add enhanced feedback eg classes for feedback eg outputText(txt,type = "Normal") then in css have p.normal(color: white), p.error and p.success 
        let newPara = document.createElement("p");
        if (feedback[0].toUpperCase() == "G") { newPara.style.color = "green"; }
        if (feedback[0].toUpperCase() == "B") { newPara.style.color = "red"; }
        newPara.innerHTML = txt;
        output.appendChild(newPara);
        newPara.scrollIntoView();
        if (txt.includes(" __|__   |__")) {
                //We know it is the ascii title
                newPara.style.textAlign = "center";
        }
}
function loadTitle(txt) { //Changes the title output
        //Adds title name
        title = document.getElementById("title");
        titleTxt = document.getElementById("titleTxt");
        titleTxt.innerText = txt;
        //Unhides title
        title.style.display = "inline-flex";
        title.classList.remove("hidden");
        document.documentElement.style.setProperty("--gridTemplate", "50px auto 79px")
        //Setsup anuimation
        document.documentElement.style.setProperty("--startColor", currentColour);
        currentColour = roomColours[txt]
        document.documentElement.style.setProperty("--endColor", currentColour);

        //Animates
        title.classList.add("animate");
        //Removes animation after 2000ms
        setTimeout(function () {
                title.classList.remove("animate");
                title.style.backgroundColor = currentColour;

        }, 1000);
}
function loadScore(score) { //Changes Score text
        scoreTxt = document.getElementById("scoreTxt");
        scoreTxt.innerText = "Score:" + score;
}


//Doggo
function dogAction(x, y) {
        return dog.actions[y][x][player.outside ? "outside" : "inside"].Do();
}