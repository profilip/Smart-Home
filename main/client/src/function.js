fanButton = document.getElementById("fan-button");
fanAutoButton = document.getElementById("auto-button");
temp = document.getElementById("temp-text");

const slider = document.getElementById("slider");
const fanslider = document.getElementById("fan-slider");

const arrowUp = document.getElementById("rollerblind-up");
const arrowDown = document.getElementById("rollerblind-down");

let fanOn = false;
let fanAuto = false;

let socket = null;

function connectWebSocket() {
    socket = new WebSocket("ws://192.168.1.20:8080");

    socket.onopen = function() {
        console.log("WebSocket connected to ws://192.168.1.20:8080");
    };

    socket.onclose = function() {
        console.warn("WebSocket disconnected. Reconnecting in 2 seconds...");
        setTimeout(connectWebSocket, 2000);
    };

    socket.onerror = function(err) {
        console.error("WebSocket error:", err);
    };

    socket.onmessage = function(event) {
        const message = event.data;
        console.log("Received message:", message);
        temperature = Number(message).toFixed(1);
        temp.textContent = temperature + "°C";
    };
}

connectWebSocket();

function sendMessage(msg) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(msg);
        console.log("Sent message to server:", msg);
    } else {
        console.warn("Cannot send message, WebSocket not connected (readyState=" + (socket ? socket.readyState : "null") + "):", msg);
    }
}

if (fanButton) {
    fanButton.addEventListener("click", function(){
        fanOn = !fanOn;
        fanButton.classList.toggle("on", fanOn);
        sendMessage("toggle");
    });
}

const light1 = document.getElementById("light1");
if (light1) {
    light1.addEventListener("click", function() {
        light1.classList.toggle("on");
        sendMessage("toggle-light");
    });
}

const ledColor = document.getElementById("led-color");
if (ledColor) {
    ledColor.addEventListener("input", function() {
        sendMessage("led-color:" + ledColor.value);
    });
}

if (fanslider) {
    fanslider.addEventListener("input", function() {
        sendMessage("fan-speed:" + fanslider.value);
    });
}

if (slider) {
    slider.addEventListener("input", function() {
        sendMessage("led-brightness:" + slider.value);
    });
}

// --- Continuous Hold Handler for Roller Blinds ---
function setupContinuousHold(element, messagePayload) {
    if (!element) return;

    let holdInterval = null;

    const startHolding = (e) => {
        e.preventDefault(); // Prevents double-triggering issues on mobile devices
        
        if (holdInterval) return; // Stop overlapping interval configurations
        
        // Fire once instantly upon initial press down
        sendMessage(messagePayload);

        // Continue sending the message command every 100ms
        holdInterval = setInterval(() => {
            sendMessage(messagePayload);
        }, 200);
    };

    const stopHolding = () => {
        if (holdInterval) {
            clearInterval(holdInterval);
            holdInterval = null;
        }
    };

    // Desktop Interface Controls
    element.addEventListener("mousedown", startHolding);
    element.addEventListener("mouseup", stopHolding);
    element.addEventListener("mouseleave", stopHolding); // Safety cutoff if mouse slides away

    // Mobile / Tablet Interface Controls
    element.addEventListener("touchstart", startHolding, { passive: false });
    element.addEventListener("touchend", stopHolding);
    element.addEventListener("touchcancel", stopHolding);
}

// Initialize continuous hold loops for your arrows
setupContinuousHold(arrowUp, "rollerblind-up");
setupContinuousHold(arrowDown, "rollerblind-down");

if (fanAutoButton) {
    fanAutoButton.addEventListener("click", function(){
        fanAuto = !fanAuto;
        fanAutoButton.classList.toggle("on", fanAuto);
        sendMessage("auto");
    });
}

// --- LED Presets & Effects (exclusive toggle) ---
const allToggleButtons = document.querySelectorAll("#presets .pres-button, #effects .pres-button");
let activeButton = null;

allToggleButtons.forEach(button => {
    button.addEventListener("click", function() {
        if (activeButton === button) {
            // Clicking the already-active button → deactivate it
            button.classList.remove("on");
            activeButton = null;
            sendMessage("led-mode:off");
        } else {
            // Deactivate previous, activate new
            if (activeButton) {
                activeButton.classList.remove("on");
            }
            button.classList.add("on");
            activeButton = button;
            sendMessage("led-mode:" + button.id);
        }
    });
});

function updateSlider() {
    const value = slider.value;

    slider.style.background =
        `linear-gradient(to right,
        white 0%,
        white ${value}%,
        rgba(255, 255, 255, 0.2) ${value}%,
        rgba(255, 255, 255, 0.2) 100%)`;
}

function updatefanSlider() {
    const value = fanslider.value;

    fanslider.style.background =
        `linear-gradient(to right,
        white 0%,
        white ${value}%,
        rgba(255, 255, 255, 0.2) ${value}%,
        rgba(255, 255, 255, 0.2) 100%)`;
}

slider.addEventListener("input", updateSlider);
fanslider.addEventListener("input", updatefanSlider);

updateSlider();
updatefanSlider();
