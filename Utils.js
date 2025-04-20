//Common Checks
function samePosition(obj, plr) { //Checks if two objects are in the same area eg the player and an item
        return obj.x == plr.x && obj.y == plr.y && (obj.door || obj.outside == plr.outside);
}
function isInInventory(obj) { //Checks if an item is in the inventory
        return inventory.some(item => item.name.toUpperCase() === obj.name.toUpperCase());
}

//Generic Functions
//GetObjIdx in Data.js

//Utils
function displayInventory() { //Displays the inventory
        const inventoryDesc = inventory.length
                ? `In my backpack I have: ${inventory.map(item => item.name).join(", ")}.`
                : "My backpack is empty.";
        outputText(inventoryDesc);
}
function updateScore(scoreToAdd) {
        score += scoreToAdd;
        loadScore(score);
}
function coordKey(x, y) {
        return `${x},${y}`;
}