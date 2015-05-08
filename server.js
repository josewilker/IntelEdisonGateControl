/**
 * Intel RoadShow
 *
 * A script that show how you can control a gate using RFID with MQTT+MOSCA+SOCKET.IO
 *
 * This example show how you can write a script NodeJS for run on Intel Edison and Galileo
 *
 * @author José Wilker <jose.wilker@smartapps.com.br>
 *
 */

/* GLOBAL VARS */

// S.M.A.R.T - SETTINGS
_saApiUrl = "www.smartapps.com.br";
_saSchema = "6478c499a047234defbd2dcdb489625d";
_saConnectKey = "Basic ODFiZDkzM2U0NzUzYTQ1MzI5YzJlM2QzMDJjYTMxNTU6V2pZSE9WWm5BRGtOYndsdA==";
require("./smartclient/smartapi/main.js");
SMARTAPI.connect(function(){});

var mraa = require("mraa"); //require mraa
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console

var AIO_pin = 0;//setup access analog input Analog pin #0 (A0) i.e. output of potentiometer. Assuming values read is between 0 and 1000.
var Servo_pin = 9;//Initialize PWM on Digital Pin #5 (D5) and enable the pwm pin
var PWM_period_us = 20000;

var analogPin0 = new mraa.Aio(AIO_pin);
var pwm = new mraa.Pwm(Servo_pin);
pwm.enable(false);
pwm.period_us(PWM_period_us);
pwm.enable(true);

// MOSCA + MQTT - SETTINGS
var mosca = require('mosca');
var settings = {
    port: 1884
};
var server = new mosca.Server(settings);

// Vars of states and messages.
var firedStatus = {
    open : "A",
    close : "F"
};

var gateStatus = firedStatus.close;

var messageStatus = {
    connected       : "client connected",
    serverReady     : "Mosca server is up and running...",
    gateIsOpen      : "Gate is open",
    gateIsOpening   : "Gate is openning...",
    gateIsClosed    : "Gate is closed",
    gateIsClosing   : "Gate is closing...",
    gateOpened      : "Opened gate",
    gateClosed      : "Closed gate"
}

/**
 * When the client is connected
 */
server.on('clientConnected', function(client) {
    console.log(messageStatus.connected, client.id);
});

console.log("First status gate: " + getGateStatus());

/**
 * Fired when a message is received.
 * tip: if u want more details about MOSCA, Google It!
 */

server.on('published', function(packet, client) {

    topic = packet.topic;

    switch(topic) {
        case firedStatus.open:

            if (getGateStatus() == firedStatus.close) {

                gateOpen();

                setGateStatus(topic);

                setTimeout(function(){
                    gateClosing();
                }, 10000);

            } else if (getGateStatus() == firedStatus.open) {

                console.log(messageStatus.gateIsOpen);

            }

        break;
        case firedStatus.close:

            // check state
            if (getGateStatus() == firedStatus.open) {

                setGateStatus(topic);

                gateClosing();

            } else if (getGateStatus() == firedStatus.open) {

                console.log(messagesStatus.gateIsClosed);

            }

        break;
    }

});

// start MQTT server
server.on('ready', setup);

/* FUNCTIONS */

/**
 * Fired when MQTT server is ready
 */
function setup() { console.log('Mosca server is up and running.'); }

/**
 * Fired when need get the actual state of the gate.
 * @return {[type]} [description]
 */
function getGateStatus() {
    return gateStatus;
}

/**
 * Fired when need set a status for the gate
 * @param {[type]} v [description]
 */
function setGateStatus(v) {
    gateStatus = v;
}

/**
 * Fired when send a data to S.M.A.R.T
 * @return {[type]} [description]
 */
function sendSmartData() {

    v = getGateStatus();

    if (v == firedStatus.open) { t = 1; } else { t=0; }

    SMARTAPI.sendExecData('variaveis_valores/insert', 'variavel=42&valor=' + t, 'json', function(response){
        console.log(response);
    });

}

/**
 * Fired when show a message of gate opened.
 * @return {[type]} [description]
 */
function gateOpenning() {
    console.log(messageStatus.gateOpened);
}

/**
 * Fired when need OPEN gate
 * @return {[type]} [description]
 */
function gateOpen() {

    console.log(messageStatus.gateIsOpening);

    setTimeout(function(){
        pwm.write(90);
        console.log(messageStatus.gateOpened);
        setGateStatus(firedStatus.open);
        sendSmartData();
    }, 1000);

}

/**
 * Fired when need CLOSE a gate
 */
function gateClosing() {

    console.log(messageStatus.gateIsClosing);
    setTimeout(function(){
        pwm.write(0);
        console.log(messageStatus.gateClosed);
        setGateStatus(firedStatus.close);
        sendSmartData();
    }, 1000);

}

/**
 * Fired when need show a message of gate closed.
 */
function gateClose() {
    console.log(messageStatus.gateClosed);
}