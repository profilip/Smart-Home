temp = 0;
const mqtt = require('mqtt');
const WebSocket = require('ws');

const client = mqtt.connect({port: 1883, host: 'localhost'});
const wss = new WebSocket.Server({port: 8080});

client.on('connect', () => {
    client.subscribe('home/temperature');
    console.log('Connected');
});

client.on('message', (topic, message) => {
    console.log(message.toString());

    wss.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
        }
    })
});

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('Received message from client:', message);
        if(message.toString() === 'toggle') {
            client.publish('home/fan', 'toggle');
            console.log('Published toggle message to MQTT broker');
        }
        if(message.toString() === 'auto') {
            client.publish('home/fan/auto', 'toggle');
            console.log('Published auto message to MQTT broker');
        }
        if(message.toString().startsWith('fan-speed:')) {
            const speed = message.toString().split(':')[1];
            client.publish('home/fan/speed', speed);
            console.log('Published fan speed message to MQTT broker:', speed);
        }

        if(message.toString().startsWith('led-color:')) {
            const color = message.toString().split(':')[1];
            client.publish('home/led/color', color);
            console.log('Published led color message to MQTT broker:', color);
        }

        if(message.toString().startsWith('led-brightness:')) {
            const brightness = message.toString().split(':')[1];
            client.publish('home/led/brightness', brightness);
            console.log('Published led brightness message to MQTT broker:', brightness);
        }

        if(message.toString() === 'toggle-light') {
            client.publish('home/led/toggle', 'toggle');
            console.log('Published toggle-light message to MQTT broker');
        }
        if(message.toString().startsWith('led-mode:')) {
            const mode = message.toString().split(':')[1];
            client.publish('home/led/mode', mode);
            console.log('Published led mode message to MQTT broker:', mode);
        }
    });
});