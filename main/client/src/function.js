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

fanslider.addEventListener("input", function() {
    const value = fanslider.value;
    socket.send("fan-speed:" + value);
    console.log("Sent fan speed message to server:", value);
});

fanAutoButton.addEventListener("click", function(){
    fanAuto = !fanAuto;
    fanAutoButton.classList.toggle("on", fanAuto);

    socket.send("auto");
    console.log("Sent auto message to server");
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