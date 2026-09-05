#include <Arduino.h>
#include <Adafruit_BME280.h>
#include <Wire.h>
#include <PubSubClient.h>
#include <WiFi.h>

// --- Instances ---
Adafruit_BME280 bme;
WiFiClient wifi;
PubSubClient client(wifi);

// --- Global Variables ---
float temp = 0;
bool fanOn = false;
bool autoMode = false;
String fanSpeed = "0";

// --- Non-blocking Timer Variables ---
unsigned long lastTempUpdate = 0;
const unsigned long tempInterval = 2000; // Read BME280 every 2000ms (2 seconds)

// --- Configurations ---
#define WIFI_SSID "ASUS"
#define WIFI_PASSWORD "bubu2013"
#define BROKER_IP "192.168.1.20"

// --- ANSI Escape Colors for Serial ---
#define CLR_GREEN   "\033[32m"
#define CLR_YELLOW  "\033[33m"
#define CLR_RED     "\033[31m"
#define CLR_RESET   "\033[0m"

// --- Logging Macros ---
#define LOG_INFO(msg)  Serial.print(CLR_GREEN);  Serial.print("[INFO] ");    Serial.print(msg); Serial.println(CLR_RESET)
#define LOG_WARN(msg)  Serial.print(CLR_YELLOW); Serial.print("[WARNING] "); Serial.print(msg); Serial.println(CLR_RESET)
#define LOG_ERROR(msg) Serial.print(CLR_RED);    Serial.print("[ERROR] ");   Serial.print(msg); Serial.println(CLR_RESET)

// --- MQTT Callback Function ---
void mqtt_callback(char* topic, byte* payload, unsigned int length)
{
    String message = "";

    for (unsigned int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }

    Serial.print(CLR_GREEN);
    Serial.print("[MQTT] Topic: ");
    Serial.println(topic);

    Serial.print("[MQTT] Message: ");
    Serial.println(message);
    Serial.print(CLR_RESET);

    if (strcmp(topic, "home/fan") == 0)
    {
        if (message == "toggle")
        {
            fanOn = !fanOn;
            LOG_INFO("[FAN] Toggled");
        }
    }
    else if (strcmp(topic, "home/fan/auto") == 0)
    {
        if (message == "toggle")
        {
            autoMode = !autoMode;
            LOG_INFO("[FAN] Auto mode toggled");
        }
    }
    else if (strcmp(topic, "home/fan/speed") == 0)
    {
        fanSpeed = message;

        Serial.print(CLR_GREEN);
        Serial.print("[FAN] Speed set to: ");
        Serial.println(fanSpeed);
        Serial.print(CLR_RESET);
    }
}

// --- MQTT Reconnect Function ---
void mqtt_reconnect()
{
    while (!client.connected())
    {
        LOG_WARN("[MQTT] Connection Dropped Attempting Reconnect...");

        if (client.connect("USERNAME"))
        {
            LOG_INFO("[MQTT] Reconnection Success");

            client.subscribe("home/fan");
            client.subscribe("home/fan/auto");
            client.subscribe("home/fan/speed");
        }
        else
        {
            LOG_ERROR("[MQTT] CONNECTION FAILED");

            Serial.print(CLR_RED);
            Serial.print("[ERROR] [MQTT] ERROR: ");
            Serial.println(client.state());
            Serial.println(CLR_RESET);

            LOG_WARN("[MQTT] ATTEMPTING RECONNECTION IN 5 SECONDS");
            delay(5000);
        }
    }
}

// --- Setup ---
void setup()
{
    Serial.begin(115200);

    LOG_INFO("[SERIAL] STARTED SUCCESSFULLY PROCEED TO OTHER FUNCTIONS...");
    LOG_INFO("[WIRE] INIT WIRE.h");

    Wire.begin();

    LOG_INFO("[WIRE] SUCCESS");
    LOG_INFO("[BME280] Starting Init On Address 0x76");
    LOG_WARN("[BME280] Address 0x77 Failed");

    if (!bme.begin(0x76))
    {
        LOG_ERROR("[BME280] INIT FAILED");
        LOG_ERROR("[BME280] HALTING OPERATION");

        while (true);
    }

    // Configure BME280 Forced Mode to eliminate self-heating
    bme.setSampling(Adafruit_BME280::MODE_FORCED,
                    Adafruit_BME280::SAMPLING_X1, // Temperature
                    Adafruit_BME280::SAMPLING_X1, // Pressure
                    Adafruit_BME280::SAMPLING_X1, // Humidity
                    Adafruit_BME280::FILTER_OFF);

    LOG_INFO("[BME] SUCCESS");
    LOG_INFO("[PINMODE] INIT");

    pinMode(6, OUTPUT);

    LOG_INFO("[PINMODE] SUCCESS");

    LOG_INFO("[WIFI] CONNECTING TO: " WIFI_SSID);

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    delay(2000);

    if (WiFi.status() != WL_CONNECTED)
    {
        LOG_ERROR("[WIFI] CONNECTION FAILED");

        Serial.print(CLR_RED);
        delay(250);

        Serial.print("[ERROR] [WIFI] CODE ERR: ");
        Serial.println(WiFi.status());

        while (true);
    }

    LOG_INFO("[WIFI] CONNECTED SUCCESSFULLY");

    Serial.print(CLR_GREEN);
    Serial.print("[INFO] [WIFI] Local IP: ");
    Serial.println(WiFi.localIP());

    if (WiFi.localIP() == IPAddress(0, 0, 0, 0))
    {
        LOG_WARN("[WIFI] IP 0.0.0.0 VERY POSSIBLE SILENT FAILED CONNECTION PLEASE SEND 'ACKNOWLAGE' TO CONTINUE");

        bool ackowlage = false;

        while (!ackowlage)
        {
            if (Serial.available() > 0)
            {
                String msg = Serial.readStringUntil('\n');
                msg.trim();

                if (msg == "ACKNOWLAGE")
                {
                    ackowlage = true;
                }
                else if (msg.length() > 0)
                {
                    LOG_ERROR("[WIFI] CONNECTION HALTED, FAILED SILENT CONNECTION");
                    while (true);
                }
            }

            delay(10);
        }
    }

    Serial.println(CLR_RESET);

    LOG_INFO("[MQTT] SETTING PARAMS TO BROKER");

    client.setServer(BROKER_IP, 1883);
    client.setCallback(mqtt_callback);

    LOG_INFO("[MQTT] Connecting to broker...");

    if (client.connect("USERNAME"))
    {
        LOG_INFO("[MQTT] Initial Connection Success!");

        client.subscribe("home/fan");
        client.subscribe("home/fan/auto");
        client.subscribe("home/fan/speed");
    }
    else
    {
        LOG_ERROR("[MQTT] Initial Broker Connection Failed!");
    }

    LOG_INFO("[MQTT] SUCCESS");
}

// --- Main Loop ---
void loop()
{
    // 1. Maintain MQTT connection and process browser actions instantly (0ms delay)
    if (!client.connected())
    {
        mqtt_reconnect();
    }
    client.loop();

    // 2. Non-blocking BME280 Reading & Publishing (Runs once every 2 seconds)
    unsigned long currentMillis = millis();
    if (currentMillis - lastTempUpdate >= tempInterval)
    {
        lastTempUpdate = currentMillis;

        // Manually trigger a sensor reading (Forced Mode)
        bme.takeForcedMeasurement();
        temp = bme.readTemperature();

        char msg[10];
        dtostrf(temp, 6, 2, msg);

        client.publish("home/temperature", msg);

        Serial.print(CLR_GREEN);
        Serial.print("[INFO] [BME280] Temperature: ");
        Serial.print(temp);
        Serial.println(CLR_RESET);

        if (temp == 180.41f)
        {
            LOG_WARN("[BME280] FALLBACK TEMP DETECTED");
        }
    }

    // 3. Process Fan Control Actions Instantly
    if (fanOn)
    {
      if (autoMode)
      {
        float minTemp = 20.0;
        float maxTemp = 30.0;

        float speed = (temp - minTemp) / (maxTemp - minTemp);
        speed = constrain(speed, 0.0, 1.0);

        int pwm = speed * 255.0;

        analogWrite(6, pwm);
      }
      else
      {
        int actualSpeed = fanSpeed.toInt();
        actualSpeed = constrain(actualSpeed, 0, 100);

        analogWrite(6, map(actualSpeed, 0, 100, 0, 255));
      }
    }
    else
    {
        analogWrite(6, 0);
    }
}

