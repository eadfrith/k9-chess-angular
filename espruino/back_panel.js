/*
Simple espruino program to manage the twelve buttons on the back panel
and to provide proximity readings from the five IR sensors

When a button is turned on or off, a message will be sent to node-RED.

Every 200 ms the IR sensors will be polled for a reading and sent to node-RED.

All messages to node-RED are sent as JSON strings terminated in an ! via a
serial connection over a USB cable.

Published under The Unlicense

Richard Hopkins, 4th January 2018
*/

// set up USB connector to send messages to Pi via
// serial over USB
USB.setup(115200,{bytesize:8,stopbits:1,parity:none});

// this array of objects represent the Sharp infrared
// sensors built into the back panel
var sensors=[
  {sensorName:"left",pinName:"C0",angle:Math.PI/2},
  {sensorName:"bl_corner",pinName:"C1",angle:Math.PI*3/4},
  {sensorName:"tail",pinName:"C2",angle:Math.PI},
  {sensorName:"br_corner",pinName:"C3",angle:Math.PI*-3/4},
  {sensorName:"right",pinName:"A0",angle:Math.PI/-2}
];
var numSensors=sensors.length;

// The array of switch objects used to associate buttons to pin names
var switches=[
  {switchName:"r1_c1",pinName:"B2"},
  {switchName:"r1_c2",pinName:"B3"},
  {switchName:"r1_c3",pinName:"B4"},
  {switchName:"r1_c4",pinName:"B5"},
  {switchName:"r2_c1",pinName:"B6"},
  {switchName:"r2_c2",pinName:"B7"},
  {switchName:"r2_c3",pinName:"B8"},
  {switchName:"r2_c4",pinName:"B9"},
  {switchName:"r3_c1",pinName:"B12"},
  {switchName:"r3_c2",pinName:"B13"},
  {switchName:"r3_c3",pinName:"B14"},
  {switchName:"r3_c4",pinName:"B15"}
];
var numSwitches=switches.length;

// this function will scan all the array of sensors
// objects and will send a message to the Raspberry Pi
// for each sensor
function IRReading() {
  for (var sensor=0; sensor < numSensors; sensor++) {
    adcPin= new Pin(sensors[sensor].pinName);
    sensorName = sensors[sensor].sensorName;
    reading = analogRead(adcPin);
    distance = convertPin2m(reading);
    angle = str(sensors[sensor].angle);
    sendMsg("sensor",sensorName,distance,angle);
    }
}

// this loop registers a separate rising and falling watcher for each
// of the switch buttons.  When activated they will send an 'on' of 'off' message
// to the Raspberry Pi via the USB serial connection
function BackPanelSwitches() {
  for (var sw=0; sw < numSwitches; switch++) {
    switchPin= new Pin(switches[sw].pinName);
    switchName = switches[sw].switchName;
    pinMode(switchPin,"input_pulldown");
    // the debounce function X
    setWatch(function() {
      sendMsg("switch",switchName,"on",999);
    },switchPin,{ repeat: true, debounce : 50, edge: "rising" });
    setWatch(function() {
      sendMsg("switch",switchName,"off",999);
    },switchPin,{ repeat: true, debounce : 50, edge: "falling" });
    }
}

// converts a pin voltage reading to metres, within the constraints
// of the device
function convertPin2m(pinreading) {
  var volts = pinreading * 3.3;
  var m = 1/volts*0.65;
  if (m>1.5){m=1.5;}
  if (m<0.2){m=0.2;}
  return m;
}

// this function is used by the IR sensors and back panel switches to
// send a message to the Rapsberry Pi via a USB serial connection
function sendMsg(type,sensor,distance,angle) {
  message = String('{"type":"'+type+'","sensor":"'+sensor+'","distance":"'+distance+'","angle":"'+angle+'"}!');
  USB.print(message);
  }

var i = setInterval(IRReading, 200);
