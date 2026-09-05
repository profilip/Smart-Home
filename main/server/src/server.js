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
    });
});