fanButton = document.getElementById("fan-button");
fanAutoButton = document.getElementById("auto-button");
temp = document.getElementById("temp-text");

const slider = document.getElementById("slider");
const fanslider = document.getElementById("fan-slider");

let fanOn = false;
let fanAuto = false;

const socket = new WebSocket("ws://192.168.1.20:8080");

fanButton.addEventListener("click", function(){
    fanOn = !fanOn;
    fanButton.classList.toggle("on", fanOn);

    socket.send("toggle");
    console.log("Sent toggle message to server");
});

light1.addEventListener("click", function() {
    light1.classList.toggle("on");
    socket.send("toggle-light");
    console.log("Sent toggle-light message to server");
});

const ledColor = document.getElementById("led-color");
if (ledColor) {
    ledColor.addEventListener("input", function() {
        socket.send("led-color:" + ledColor.value);
        console.log("Sent led-color:", ledColor.value);
    });
}

fanslider.addEventListener("input", function() {
    const value = fanslider.value;
    socket.send("fan-speed:" + value);
    console.log("Sent fan speed message to server:", value);
});

slider.addEventListener("input", function() {
    const value = slider.value;
    socket.send("led-brightness:" + value);
    console.log("Sent led brightness message to server:", value);
});

fanAutoButton.addEventListener("click", function(){
    fanAuto = !fanAuto;
    fanAutoButton.classList.toggle("on", fanAuto);

    socket.send("auto");
    console.log("Sent auto message to server");
});

// --- LED Presets & Effects (exclusive toggle) ---
const allToggleButtons = document.querySelectorAll("#presets .pres-button, #effects .pres-button");
let activeButton = null;

allToggleButtons.forEach(button => {
    button.addEventListener("click", function() {
        if (activeButton === button) {
            // Clicking the already-active button → deactivate it
            button.classList.remove("on");
            activeButton = null;
            socket.send("led-mode:off");
            console.log("Sent led-mode:off");
        } else {
            // Deactivate previous, activate new
            if (activeButton) {
                activeButton.classList.remove("on");
            }
            button.classList.add("on");
            activeButton = button;
            socket.send("led-mode:" + button.id);
            console.log("Sent led-mode:" + button.id);
        }
    });
});

socket.onmessage = function(event) {
    const message = event.data;
    console.log("Received message:", message);
    temperature = Number(message).toFixed(1);
    temp.textContent = temperature + "°C";
}

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