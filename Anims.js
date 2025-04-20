// Shared variables for animations
let screenWidth, screenHeight, padding = 10;

// Animation function to move any element
function moveElement(element, position, velocity, dimensions) {
    //console.log("Move:")
    //console.log(element)
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    position.x += velocity.x;
    position.y += velocity.y;

    // Reverse direction if element hits screen boundaries
    if (position.x <= padding || position.x + dimensions.width + padding >= screenWidth) velocity.x = -velocity.x;
    if (position.y <= padding / 2 || position.y + dimensions.height + padding >= screenHeight) velocity.y = -velocity.y;

    Object.assign(element.style, {
        right: `${position.x}px`,
        top: `${position.y}px`,
    });

    requestAnimationFrame(() => moveElement(element, position, velocity, dimensions));
}

// Score animation
function winAnim() {
    const scoreElement = document.getElementById("scoreTxt");
    if (!scoreElement) {
        console.error("Score element not found!");
        return;
    }

    // Apply styles using a class for cleaner code
    scoreElement.style.cssText = `
        display: block;
        background-color: ${currentColour};
        border-radius: 10px;
        padding: 0 ${padding}px;
    `;
    
    const dimensions = {
        width: scoreElement.offsetWidth,
        height: scoreElement.offsetHeight
    };
    const position = { x: 10, y: 5 };
    const velocity = { x: 2, y: 2 };

    moveElement(scoreElement, position, velocity, dimensions);
}

// Dog animation
function dogAnim() {
    const dogElement = document.getElementById("dog");
    if (!dogElement) {
        console.error("Dog element not found!");
        return;
    }

    // Apply styles using a class for cleaner code
    dogElement.style.cssText = `
        display: block;
        visibility: visible;
    `;

    const dimensions = {
        width: dogElement.offsetWidth,
        height: dogElement.offsetHeight
    };
    const position = { x: 10, y: 5 };
    const velocity = { x: 2, y: 2 };

    moveElement(dogElement, position, velocity, dimensions);
}

// Hide CLI with animation
function hideCLI() {
    const cli = document.getElementById("cli");
    if (!cli) {
        console.error("CLI element not found!");
        return;
    }

    // Add shrinking effect with CSS class
    cli.classList.add("shrink");

    // Hide element after animation
    setTimeout(() => {
        cli.style.display = "none"; 
        document.documentElement.style.setProperty("--gridTemplate", "50px auto"); 
    }, 500); // Matches the animation duration
}