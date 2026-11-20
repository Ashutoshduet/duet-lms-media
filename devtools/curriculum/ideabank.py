#!/usr/bin/env python3
"""DUET STEM Robotics: the project idea bank.

Every idea here is a project our own team writes (code, steps, 3D build, Hindi/Hinglish text). Ideas only come from
the common stock of school electronics around the world (Arduino's own example sketches, micro:bit classroom
projects, SparkFun-style starter circuits, Raspberry Pi physical-computing projects, maker sites and Indian ATL
practice); nothing is copied from any source.

  python3 devtools/curriculum/ideabank.py            -> writes devtools/curriculum/ideas.json and prints the counts

Each idea: id, title, family, board, parts (keys of robotics/js/parts.js; '+name' = a part the app does not have
yet), band [first class, last class], level (1-12), theme, live (lesson id when it is already in the app), rule
(input -> output, for the project factory).
"""
import json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))

BOARDS = {
    'none':     {'name': 'No board (battery circuit)', 'lang': '-', 'lvl': 1},
    'microbit': {'name': 'BBC micro:bit', 'lang': 'Blocks / MicroPython', 'lvl': 3},
    'uno':      {'name': 'Arduino Uno', 'lang': 'Blocks / Arduino C++', 'lvl': 6},
    'esp32':    {'name': 'ESP32', 'lang': 'Arduino C++', 'lvl': 8},
    'nano':     {'name': 'Arduino Nano', 'lang': 'Arduino C++', 'lvl': 7},
    'mega':     {'name': 'Arduino Mega', 'lang': 'Arduino C++', 'lvl': 7},
    'pico':     {'name': 'Raspberry Pi Pico', 'lang': 'MicroPython', 'lvl': 9},
    'pi4':      {'name': 'Raspberry Pi 4', 'lang': 'Python', 'lvl': 10},
}

# ---------------------------------------------------------------- outputs: phrase, parts, extra level
OUT = {
    'led':     ('LED', ['led', 'resistor'], 0),
    'rgb':     ('colour LED', ['rgb', 'resistor'], 0),
    'buzzer':  ('tune on a buzzer', ['buzzer'], 0),
    'abuzz':   ('beeper', ['abuzz'], 0),
    'servo':   ('servo', ['servo'], 1),
    'fan':     ('fan motor', ['motor', 'npn', 'diode', 'resistor'], 1),
    'relay':   ('230 V lamp through a relay', ['relay', 'load230'], 1),
    'pump':    ('water pump', ['relay', 'pump', 'aa4'], 1),
    'stepper': ('stepper motor', ['stepper'], 2),
    'lcd':     ('LCD readout', ['lcd16'], 1),
    'oled':    ('OLED screen', ['oled'], 2),
    'seg7':    ('7-segment digit', ['seg7', 'resistor'], 1),
    'bar':     ('10-LED bar graph', ['bar10', 'sip10'], 1),
    'matrix':  ('LED screen', [], 0),          # micro:bit's own 5x5 LEDs
    'speaker': ('speaker', [], 0),             # micro:bit V2 speaker
    'web':     ('web page on a phone', [], 2), # ESP32 / Pi WiFi
    'btapp':   ('Bluetooth phone app', [], 2),
    'plot':    ('live graph', [], 1),          # Serial plotter / Thonny plotter
    'ws2812':  ('RGB LED strip', ['+ws2812'], 2),
    'max7219': ('scrolling LED sign', ['+max7219'], 2),
    'sms':     ('SMS alert', ['+gsm'], 3),
}

# ---------------------------------------------------------------- inputs
# key: (label, parts, boards it works on, extra level)
# micro:bit lines use its own sensors where it has them (light, temperature, compass, motion, sound, touch).
INP = {
    'button':  ('push button', ['button'], ['uno', 'esp32', 'pico', 'microbit', 'pi4'], 0),
    'touch':   ('touch plate', ['touch4'], ['esp32', 'microbit'], 0),
    'pot':     ('knob', ['pot'], ['uno', 'esp32', 'pico', 'microbit'], 0),
    'ldr':     ('light sensor', ['ldr', 'resistor'], ['uno', 'esp32', 'pico', 'microbit'], 0),
    'temp':    ('temperature sensor', ['lm35'], ['uno', 'esp32', 'microbit'], 0),
    'dht':     ('temperature & humidity sensor', ['dht11'], ['uno', 'esp32', 'pico', 'pi4'], 1),
    'soil':    ('soil moisture sensor', ['soil'], ['uno', 'esp32', 'pico', 'microbit'], 0),
    'pir':     ('motion sensor', ['pir'], ['uno', 'esp32', 'pico', 'pi4', 'microbit'], 0),
    'ir':      ('IR sensor', ['ir'], ['uno', 'esp32', 'pico', 'microbit', 'pi4'], 0),
    'sonar':   ('ultrasonic sensor', ['hcsr04'], ['uno', 'esp32', 'pico', 'pi4'], 1),
    'gas':     ('gas sensor', ['mq2'], ['uno', 'esp32', 'pico'], 1),
    'remote':  ('TV remote', ['irrx'], ['uno', 'esp32', 'pico'], 1),
    'keypad':  ('keypad', ['keypad'], ['uno', 'esp32', 'pico'], 2),
    'rfid':    ('RFID card', ['rfid'], ['uno', 'esp32', 'pico', 'pi4'], 2),
    'joy':     ('joystick', ['joystick'], ['uno', 'esp32', 'pico'], 1),
    'tilt':    ('tilt / shake', [], ['microbit'], 0),
    'compass': ('compass', [], ['microbit'], 0),
    'sound':   ('clap / sound', ['sound'], ['uno', 'esp32', 'pico', 'microbit', 'pi4'], 1),
    'flame':   ('flame sensor', ['flame'], ['uno', 'esp32', 'pico', 'pi4'], 1),
    'rain':    ('rain sensor', ['rain'], ['uno', 'esp32', 'pico', 'pi4'], 1),
    'reed':    ('door magnet switch', ['reed'], ['uno', 'esp32', 'pico', 'pi4', 'microbit'], 0),
    'vib':     ('vibration sensor', ['vibe'], ['uno', 'esp32', 'pico', 'pi4'], 1),
    'water':   ('water level sensor', ['+waterlevel'], ['uno', 'esp32', 'pico'], 1),
    'ds18':    ('waterproof temperature probe', ['+ds18b20'], ['uno', 'esp32', 'pico'], 2),
    'lux':     ('lux meter sensor', ['+bh1750'], ['uno', 'esp32', 'pico'], 2),
    'bmp':     ('air pressure sensor', ['+bmp180'], ['uno', 'esp32', 'pico'], 2),
    'mpu':     ('motion sensor MPU6050', ['+mpu6050'], ['uno', 'esp32', 'pico'], 3),
    'color':   ('colour sensor', ['+tcs3200'], ['uno', 'esp32'], 2),
    'weight':  ('load cell', ['+hx711'], ['uno', 'esp32'], 3),
    'pulse':   ('pulse sensor', ['+pulse'], ['uno', 'esp32', 'microbit'], 2),
    'volt':    ('voltage sensor', ['+voltsense'], ['uno', 'esp32'], 2),
    'current': ('current sensor', ['+acs712'], ['uno', 'esp32'], 3),
    'tds':     ('water quality (TDS) probe', ['+tds'], ['uno', 'esp32'], 3),
    'irtemp':  ('contactless thermometer', ['+mlx90614'], ['uno', 'esp32'], 3),
    'finger':  ('fingerprint sensor', ['+fingerprint'], ['uno', 'esp32'], 3),
    'gps':     ('GPS', ['+gps'], ['uno', 'esp32'], 3),
    'rtc':     ('real-time clock', ['+rtc'], ['uno', 'esp32', 'pico'], 2),
    'encoder': ('rotary knob with click', ['+encoder'], ['uno', 'esp32', 'pico'], 2),
    'hall':    ('magnet (Hall) sensor', ['hall'], ['uno', 'esp32', 'pico', 'pi4'], 1),
    'thermistor': ('thermistor', ['+thermistor', 'resistor'], ['uno', 'esp32', 'pico'], 1),
    'alcohol': ('alcohol sensor MQ-3', ['+mq3'], ['uno', 'esp32', 'pico'], 2),
    'air':     ('air quality sensor MQ-135', ['+mq135'], ['uno', 'esp32', 'pico'], 2),
    'dust':    ('dust (PM2.5) sensor', ['+pm25'], ['uno', 'esp32'], 3),
    'uv':      ('UV sensor', ['+uv'], ['uno', 'esp32', 'pico'], 2),
    'radar':   ('microwave radar sensor', ['+rcwl0516'], ['uno', 'esp32', 'pico', 'pi4', 'microbit'], 1),
    'tof':     ('laser distance sensor (ToF)', ['+vl53l0x'], ['uno', 'esp32', 'pico'], 3),
    'flow':    ('water flow sensor', ['+flow'], ['uno', 'esp32'], 2),
    'flex':    ('flex sensor', ['+flex', 'resistor'], ['uno', 'esp32', 'pico'], 2),
    'force':   ('pressure pad (FSR)', ['+fsr', 'resistor'], ['uno', 'esp32', 'pico', 'microbit'], 1),
    'gesture': ('hand-gesture sensor', ['+apds9960'], ['uno', 'esp32'], 3),
    'ecg':     ('ECG sensor', ['+ad8232'], ['uno', 'esp32'], 3),
    'spo2':    ('pulse-oximeter sensor', ['+max30102'], ['uno', 'esp32'], 3),
    'wind':    ('anemometer (wind speed)', ['anemo'], ['uno', 'esp32'], 2),
    'nfc':     ('NFC phone tap', ['+pn532'], ['esp32'], 3),
    'radio':   ('433 MHz radio remote', ['+rf433'], ['uno', 'esp32'], 2),
    'nrf':     ('nRF24 wireless link', ['+nrf24'], ['uno', 'esp32'], 3),
}

# ---------------------------------------------------------------- uses: input -> list of (title, theme, outputs)
# Each use is a real job the sensor does; each output listed is one that makes sense for that job.
USES = {
    'button': [
        ('Doorbell', 'home', ['buzzer', 'abuzz', 'rgb', 'speaker']),
        ('Quiz buzzer for the first hand up', 'school', ['led', 'buzzer', 'lcd', 'seg7']),
        ('Light switch that toggles', 'home', ['led', 'relay']),
        ('People counter with a clicker', 'school', ['seg7', 'lcd', 'oled', 'matrix']),
        ('Reaction-time game', 'game', ['led', 'lcd', 'oled', 'matrix']),
        ('Pedestrian crossing button', 'traffic', ['led', 'buzzer']),
        ('Morse code key', 'communication', ['buzzer', 'led', 'matrix']),
        ('Digital dice', 'game', ['seg7', 'oled', 'matrix']),
        ('Stopwatch', 'tools', ['lcd', 'oled', 'seg7']),
        ('Fan speed selector', 'home', ['fan']),
        ('Gate opener', 'safety', ['servo']),
        ('Mini piano', 'music', ['buzzer', 'speaker']),
        ('Voting machine', 'school', ['lcd', 'oled', 'matrix', 'web']),
    ],
    'touch': [
        ('Touch lamp', 'home', ['led', 'relay']),
        ('Touch doorbell', 'home', ['buzzer', 'speaker']),
        ('Touch piano', 'music', ['buzzer', 'speaker']),
        ('Touch counter', 'tools', ['oled', 'matrix']),
        ('Secret touch code lock', 'safety', ['servo', 'matrix']),
    ],
    'pot': [
        ('Dimmer', 'home', ['led', 'rgb']),
        ('Volume and pitch knob', 'music', ['buzzer', 'speaker']),
        ('Fan speed regulator', 'home', ['fan']),
        ('Steering a servo', 'tools', ['servo']),
        ('Level meter', 'tools', ['bar', 'lcd', 'oled', 'matrix', 'plot']),
        ('Mood lamp colour picker', 'home', ['rgb', 'ws2812']),
        ('Timer you set with a knob', 'tools', ['seg7', 'lcd', 'buzzer']),
        ('Stepper position control', 'factory', ['stepper']),
    ],
    'ldr': [
        ('Night lamp', 'home', ['led', 'rgb', 'relay', 'matrix']),
        ('Automatic street light', 'city', ['relay', 'led', 'bar']),
        ('Sunrise alarm', 'home', ['buzzer', 'abuzz', 'speaker']),
        ('Automatic curtain', 'home', ['servo', 'stepper']),
        ('Light meter', 'science', ['bar', 'lcd', 'oled', 'matrix', 'plot']),
        ('Laser tripwire alarm', 'safety', ['buzzer', 'abuzz', 'rgb']),
        ('Shadow counter for a conveyor', 'factory', ['seg7', 'lcd', 'oled']),
        ('Day and night logger', 'science', ['plot', 'web']),
        ('Fridge door left open alarm', 'home', ['abuzz', 'buzzer']),
    ],
    'temp': [
        ('Thermometer', 'science', ['lcd', 'oled', 'seg7', 'matrix', 'plot']),
        ('Too-hot warning', 'safety', ['rgb', 'buzzer', 'abuzz']),
        ('Automatic cooling fan', 'home', ['fan', 'relay']),
        ('Fever check station', 'health', ['lcd', 'rgb', 'matrix']),
        ('Temperature colour bar', 'science', ['bar', 'rgb']),
        ('Classroom temperature on a phone', 'school', ['web', 'btapp']),
    ],
    'dht': [
        ('Weather station', 'science', ['lcd', 'oled', 'web', 'plot']),
        ('Humidity alert for a storeroom', 'farm', ['abuzz', 'rgb']),
        ('Greenhouse fan control', 'farm', ['fan', 'relay']),
        ('Comfort meter for a classroom', 'school', ['rgb', 'lcd', 'bar']),
        ('Weather logger to a file', 'science', ['plot', 'web']),
    ],
    'soil': [
        ('Plant thirst alarm', 'farm', ['abuzz', 'buzzer', 'rgb', 'matrix']),
        ('Automatic plant watering', 'farm', ['pump']),
        ('Soil moisture meter', 'farm', ['bar', 'lcd', 'oled', 'matrix']),
        ('Farm moisture on a phone', 'farm', ['web', 'btapp']),
        ('Garden sprinkler valve', 'farm', ['servo', 'relay']),
    ],
    'pir': [
        ('Burglar alarm', 'safety', ['buzzer', 'abuzz', 'rgb', 'sms']),
        ('Automatic room light', 'home', ['relay', 'led']),
        ('Stair light that switches off itself', 'home', ['relay', 'led']),
        ('Visitor counter', 'school', ['seg7', 'lcd', 'oled']),
        ('Welcome greeter', 'home', ['speaker', 'buzzer', 'servo']),
        ('Wildlife camera trigger', 'science', ['led', 'web']),
        ('Classroom energy saver (fan and light)', 'school', ['relay', 'fan']),
    ],
    'ir': [
        ('Object counter on a conveyor', 'factory', ['seg7', 'lcd', 'oled', 'matrix']),
        ('Automatic hand sanitiser', 'health', ['pump', 'servo']),
        ('Smart tap', 'home', ['pump', 'servo']),
        ('Obstacle alarm', 'safety', ['abuzz', 'buzzer', 'led']),
        ('Parking slot sensor', 'city', ['rgb', 'led']),
        ('Car speed trap with two sensors', 'traffic', ['lcd', 'oled']),
        ('Railway level crossing', 'traffic', ['servo', 'buzzer']),
        ('Contactless doorbell', 'home', ['buzzer', 'speaker']),
    ],
    'sonar': [
        ('Parking distance beeper', 'traffic', ['buzzer', 'abuzz', 'bar']),
        ('Distance meter', 'tools', ['lcd', 'oled', 'seg7', 'plot']),
        ('Smart dustbin lid', 'home', ['servo']),
        ('Water tank level meter', 'home', ['bar', 'lcd', 'web']),
        ('Blind stick (third eye)', 'health', ['abuzz', 'buzzer']),
        ('Sonar radar sweep', 'science', ['servo', 'oled', 'plot']),
        ('Height measuring station', 'health', ['lcd', 'oled']),
        ('Automatic door opener', 'home', ['servo', 'stepper']),
        ('Social-distance alarm', 'health', ['abuzz', 'rgb']),
    ],
    'gas': [
        ('Gas leak alarm', 'safety', ['buzzer', 'abuzz', 'rgb', 'sms']),
        ('Kitchen exhaust fan on gas', 'home', ['fan', 'relay']),
        ('Gas valve shut-off', 'safety', ['servo']),
        ('Air quality meter', 'science', ['bar', 'lcd', 'oled', 'web']),
    ],
    'remote': [
        ('TV-remote home automation', 'home', ['relay', 'led']),
        ('Remote fan speed control', 'home', ['fan']),
        ('Remote servo door', 'home', ['servo']),
        ('Remote RGB mood light', 'home', ['rgb', 'ws2812']),
        ('Remote key decoder', 'tools', ['lcd', 'oled']),
    ],
    'keypad': [
        ('Password door lock', 'safety', ['servo', 'relay']),
        ('Calculator', 'tools', ['lcd', 'oled']),
        ('Bank locker with alarm', 'safety', ['servo', 'buzzer']),
        ('Quiz answer pad', 'school', ['lcd', 'seg7']),
        ('Set-your-own countdown timer', 'tools', ['lcd', 'seg7']),
    ],
    'rfid': [
        ('RFID door lock', 'safety', ['servo', 'relay']),
        ('Attendance register', 'school', ['lcd', 'oled', 'web']),
        ('Toll gate', 'traffic', ['servo']),
        ('Library book check-out', 'school', ['lcd', 'oled']),
        ('Canteen prepaid card', 'school', ['lcd', 'oled']),
    ],
    'joy': [
        ('Pan-tilt camera mount', 'tools', ['servo']),
        ('Joystick game', 'game', ['oled', 'matrix']),
        ('Crane control', 'factory', ['servo', 'stepper']),
        ('Joystick colour mixer', 'art', ['rgb', 'ws2812']),
    ],
    'tilt': [
        ('Spirit level', 'tools', ['matrix']),
        ('Shake dice', 'game', ['matrix', 'speaker']),
        ('Step counter', 'health', ['matrix']),
        ('Fall alarm', 'health', ['speaker', 'matrix']),
        ('Tilt maze game', 'game', ['matrix']),
        ('Gesture remote by radio', 'communication', ['matrix', 'servo']),
    ],
    'compass': [
        ('Direction finder', 'tools', ['matrix']),
        ('Treasure hunt with headings', 'game', ['matrix', 'speaker']),
        ('Magnet detector', 'science', ['matrix', 'plot']),
    ],
    'sound': [
        ('Clap switch', 'home', ['led', 'relay']),
        ('Noise meter for the library', 'school', ['bar', 'rgb', 'matrix']),
        ('Baby cry alert', 'home', ['abuzz', 'speaker']),
        ('Sound-reactive lights', 'art', ['ws2812', 'bar', 'matrix']),
    ],
    'flame': [
        ('Fire alarm', 'safety', ['buzzer', 'abuzz', 'sms']),
        ('Fire sprinkler', 'safety', ['pump']),
        ('Fire exit sign that lights up', 'safety', ['led', 'relay']),
    ],
    'rain': [
        ('Rain alarm', 'home', ['abuzz', 'buzzer']),
        ('Automatic roof for drying clothes', 'home', ['servo', 'stepper']),
        ('Rain gauge logger', 'farm', ['lcd', 'web']),
        ('Wiper that starts on rain', 'traffic', ['servo']),
    ],
    'reed': [
        ('Door open alarm', 'safety', ['abuzz', 'buzzer', 'sms']),
        ('Bicycle speedometer', 'tools', ['lcd', 'oled']),
        ('Window open reminder', 'home', ['rgb', 'buzzer']),
    ],
    'vib': [
        ('Earthquake alarm', 'safety', ['abuzz', 'buzzer']),
        ('Machine vibration watch', 'factory', ['rgb', 'lcd']),
        ('Knock-knock door code', 'safety', ['servo']),
    ],
    'water': [
        ('Water tank overflow alarm', 'home', ['abuzz', 'buzzer']),
        ('Automatic tank pump', 'home', ['pump', 'relay']),
        ('Flood warning', 'safety', ['rgb', 'sms']),
    ],
    'ds18': [
        ('Water heater thermometer', 'home', ['lcd', 'oled']),
        ('Fish tank temperature keeper', 'home', ['relay', 'rgb']),
        ('Cooking thermometer', 'home', ['oled', 'buzzer']),
    ],
    'lux': [
        ('Lux meter for a classroom', 'school', ['lcd', 'oled']),
        ('Smart blinds by lux', 'home', ['servo', 'stepper']),
        ('Plant grow light by lux', 'farm', ['relay', 'ws2812']),
    ],
    'bmp': [
        ('Altitude meter', 'science', ['lcd', 'oled']),
        ('Storm warning from falling pressure', 'science', ['rgb', 'buzzer']),
        ('Pressure logger', 'science', ['plot', 'web']),
    ],
    'mpu': [
        ('Digital spirit level', 'tools', ['oled', 'lcd']),
        ('Gesture-controlled servo', 'tools', ['servo']),
        ('Fall detector for elders', 'health', ['abuzz', 'sms']),
        ('Air mouse', 'tools', ['btapp']),
    ],
    'color': [
        ('Colour detector', 'science', ['lcd', 'rgb']),
        ('Colour sorting machine', 'factory', ['servo']),
        ('Fruit ripeness checker', 'farm', ['lcd', 'rgb']),
    ],
    'weight': [
        ('Digital weighing scale', 'tools', ['lcd', 'oled']),
        ('Parcel overweight alarm', 'factory', ['abuzz', 'rgb']),
        ('Gas cylinder level by weight', 'home', ['lcd', 'web']),
    ],
    'pulse': [
        ('Heart-rate monitor', 'health', ['oled', 'lcd', 'matrix']),
        ('Heartbeat light', 'health', ['led', 'rgb']),
    ],
    'volt': [
        ('Battery level meter', 'tools', ['bar', 'lcd']),
        ('Solar panel voltage logger', 'energy', ['lcd', 'web']),
    ],
    'current': [
        ('Energy meter', 'energy', ['lcd', 'web']),
        ('Overload cut-off', 'safety', ['relay']),
    ],
    'tds': [
        ('Drinking water quality tester', 'health', ['lcd', 'rgb']),
        ('RO water monitor on a phone', 'health', ['web']),
    ],
    'irtemp': [
        ('Contactless fever gun', 'health', ['oled', 'lcd']),
        ('Contactless check-in gate', 'health', ['servo', 'buzzer']),
    ],
    'finger': [
        ('Fingerprint door lock', 'safety', ['servo', 'relay']),
        ('Fingerprint attendance', 'school', ['lcd', 'web']),
    ],
    'gps': [
        ('School bus tracker', 'traffic', ['web', 'sms']),
        ('Speed and position display', 'traffic', ['lcd', 'oled']),
    ],
    'rtc': [
        ('Digital clock', 'tools', ['lcd', 'oled', 'max7219']),
        ('Automatic school bell', 'school', ['buzzer', 'relay']),
        ('Medicine reminder', 'health', ['buzzer', 'oled']),
        ('Timer switch for a pump', 'farm', ['relay', 'pump']),
    ],
    'encoder': [
        ('Menu with a click knob', 'tools', ['lcd', 'oled']),
        ('Precise volume control', 'music', ['buzzer', 'bar']),
        ('Combination safe dial', 'safety', ['servo', 'lcd']),
    ],
    'hall': [
        ('Bicycle wheel speed', 'tools', ['lcd', 'oled']),
        ('Fan RPM meter', 'science', ['lcd', 'seg7']),
        ('Magnet door alarm', 'safety', ['abuzz', 'rgb']),
        ('Wind-turbine speed counter', 'energy', ['lcd', 'web']),
    ],
    'thermistor': [
        ('Thermistor thermometer', 'science', ['lcd', 'seg7', 'plot']),
        ('Incubator heater control', 'farm', ['relay', 'rgb']),
        ('Overheat cut-off for a motor', 'safety', ['relay', 'abuzz']),
    ],
    'alcohol': [
        ('Drink-and-drive ignition lock', 'traffic', ['relay', 'abuzz']),
        ('Alcohol level meter', 'health', ['lcd', 'bar']),
    ],
    'air': [
        ('Classroom air quality lamp', 'school', ['rgb', 'ws2812']),
        ('Air purifier fan on bad air', 'home', ['fan', 'relay']),
        ('Pollution meter for the school gate', 'city', ['lcd', 'oled', 'web']),
    ],
    'dust': [
        ('PM2.5 meter', 'city', ['oled', 'lcd', 'web']),
        ('Dust alarm for a workshop', 'factory', ['abuzz', 'rgb']),
    ],
    'uv': [
        ('UV index meter', 'health', ['lcd', 'oled', 'bar']),
        ('Sunscreen reminder', 'health', ['buzzer', 'rgb']),
    ],
    'radar': [
        ('Through-the-wall motion light', 'home', ['relay', 'led']),
        ('Corridor occupancy counter', 'school', ['seg7', 'lcd']),
        ('Motion alarm that ignores heat', 'safety', ['abuzz', 'buzzer']),
    ],
    'tof': [
        ('Laser tape measure', 'tools', ['oled', 'lcd']),
        ('Gesture swipe switch', 'home', ['relay', 'rgb']),
        ('Liquid level by laser', 'factory', ['bar', 'oled']),
    ],
    'flow': [
        ('Water meter for a tap', 'home', ['lcd', 'oled', 'web']),
        ('Leak alarm (water flowing at night)', 'home', ['abuzz', 'relay']),
        ('Fill exactly one litre', 'factory', ['relay', 'pump']),
    ],
    'flex': [
        ('Glove that moves a robot finger', 'health', ['servo']),
        ('Bend-to-play music', 'music', ['buzzer']),
        ('Posture alert band', 'health', ['abuzz']),
    ],
    'force': [
        ('Bed exit alarm for patients', 'health', ['abuzz', 'buzzer']),
        ('Pressure mat doorbell', 'home', ['buzzer', 'speaker']),
        ('Grip strength meter', 'health', ['bar', 'lcd', 'matrix']),
        ('Parking space pad', 'city', ['rgb', 'led']),
    ],
    'gesture': [
        ('Wave-to-switch lamp', 'home', ['relay', 'rgb']),
        ('Gesture slideshow remote', 'school', ['btapp']),
        ('Touchless colour reader', 'science', ['lcd', 'rgb']),
    ],
    'ecg': [
        ('ECG trace on the plotter', 'health', ['plot', 'oled']),
    ],
    'spo2': [
        ('Pulse oximeter', 'health', ['oled', 'lcd']),
        ('Low-oxygen alarm', 'health', ['abuzz', 'sms']),
    ],
    'wind': [
        ('Wind speed meter', 'science', ['lcd', 'oled', 'web']),
        ('Storm alarm for a farm', 'farm', ['abuzz', 'sms']),
    ],
    'nfc': [
        ('Tap-your-phone door lock', 'safety', ['servo']),
        ('NFC lab inventory', 'school', ['web']),
    ],
    'radio': [
        ('Wireless doorbell', 'home', ['buzzer']),
        ('Four-button wireless switch board', 'home', ['relay']),
        ('Wireless gate opener', 'home', ['servo']),
    ],
    'nrf': [
        ('Long-range remote for a robot', 'robots', ['servo', 'lcd']),
        ('Wireless sensor node to a base station', 'iot', ['lcd', 'oled']),
    ],
}

# micro:bit can drive these outputs from its edge connector
MB_OUT = {'led', 'rgb', 'buzzer', 'abuzz', 'servo', 'matrix', 'speaker', 'pump', 'relay', 'plot', 'ws2812'}
ONLY = {'matrix': {'microbit'}, 'speaker': {'microbit'}, 'web': {'esp32', 'pi4'}, 'btapp': {'esp32'},
        'sms': {'uno', 'esp32'}, 'plot': {'uno', 'esp32', 'pico', 'microbit', 'pi4'}}
NOT_ON = {'pi4': {'seg7', 'bar', 'max7219', 'sms'}, 'pico': {'web', 'btapp', 'sms'}}

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

ideas = []
seen = set()

def add(title, family, board, parts, theme, level, rule=None, live=None, note=None):
    key = slug(re.sub(r' \((ESP32|BBC micro:bit|Raspberry Pi Pico|Raspberry Pi 4|micro:bit)\)$', '', title))[:72].strip('-') + '-' + board
    if key in seen:
        return
    seen.add(key)
    lv = max(1, min(12, level))
    lo = lv; hi = min(12, lv + 2)
    newp = sorted({p[1:] for p in parts if p.startswith('+')})
    ideas.append({'id': key, 'title': title, 'family': family, 'board': board,
                  'parts': sorted({p.lstrip('+') for p in parts}), 'newparts': newp, 'band': [lo, hi], 'level': lv,
                  'theme': theme, 'live': live, 'rule': rule, 'note': note})

# ---------------------------------------------------------------- 1. sensor -> output projects (the factory family)
for ik, (ilabel, iparts, iboards, ilv) in INP.items():
    for (title, theme, outs) in USES.get(ik, []):
        for o in outs:
            ophrase, oparts, olv = OUT[o]
            for b in iboards:
                if o in ONLY and b not in ONLY[o]:
                    continue
                if b == 'microbit' and o not in MB_OUT:
                    continue
                if b in NOT_ON and o in NOT_ON[b]:
                    continue
                if o in ('matrix', 'speaker') and b != 'microbit':
                    continue
                parts = list(iparts) + list(oparts)
                if b == 'microbit' and ik in ('ldr', 'temp', 'button', 'tilt', 'compass', 'touch'):
                    parts = list(oparts)  # its own sensor
                lvl = BOARDS[b]['lvl'] + ilv + olv
                if b == 'uno' and ilv == 0 and olv == 0:
                    lvl = 5  # one simple part each side: Class 5 with blocks
                if b == 'microbit' and not parts:
                    lvl = 3
                name = f'{title}: {ilabel} and {ophrase}'
                if b != 'uno':
                    name += f' ({BOARDS[b]["name"]})'
                add(name, 'sensor-to-output', b, parts, theme, lvl, rule={'in': ik, 'out': o, 'job': title})

# ---------------------------------------------------------------- 2. output-only and classic exercises
CLASSIC = [
    # (title, parts, boards, level, theme)
    ('Blink without delay', ['led', 'resistor'], ['uno', 'esp32', 'pico'], 6, 'tools'),
    ('Two LEDs blinking at different speeds', ['led', 'resistor'], ['uno', 'esp32', 'pico'], 6, 'tools'),
    ('LED chaser (Knight Rider)', ['bar10', 'sip10'], ['uno', 'esp32'], 6, 'art'),
    ('Binary counter on 4 LEDs', ['led', 'resistor'], ['uno', 'pico', 'microbit'], 6, 'maths'),
    ('Dice on a 7-segment display', ['seg7', 'resistor', 'button'], ['uno', 'pico'], 6, 'game'),
    ('Countdown timer on a 7-segment display', ['seg7', 'resistor'], ['uno', 'esp32', 'pico'], 6, 'tools'),
    ('Scrolling message on an LCD', ['lcd16'], ['uno', 'esp32'], 7, 'tools'),
    ('Clock from millis() on an LCD', ['lcd16'], ['uno', 'esp32'], 7, 'tools'),
    ('Custom characters on an LCD', ['lcd16'], ['uno'], 7, 'art'),
    ('Bouncing ball on an OLED', ['oled'], ['uno', 'esp32', 'pico'], 8, 'game'),
    ('Pong on an OLED with a knob', ['oled', 'pot'], ['uno', 'esp32', 'pico'], 8, 'game'),
    ('Snake game on an OLED with a joystick', ['oled', 'joystick'], ['uno', 'esp32'], 9, 'game'),
    ('Music box: play a melody', ['buzzer'], ['uno', 'esp32', 'pico', 'microbit'], 5, 'music'),
    ('Happy birthday on a buzzer', ['buzzer'], ['uno', 'pico', 'microbit'], 5, 'music'),
    ('Morse code beacon', ['led', 'resistor', 'buzzer'], ['uno', 'pico', 'microbit'], 6, 'communication'),
    ('Servo dance', ['servo'], ['uno', 'pico', 'microbit'], 6, 'art'),
    ('Servo clock hand', ['servo'], ['uno', 'esp32'], 7, 'tools'),
    ('Stepper motor clock', ['stepper'], ['uno', 'esp32'], 8, 'tools'),
    ('Traffic light with a pedestrian button', ['led', 'resistor', 'button', 'buzzer'], ['uno', 'pico', 'microbit', 'pi4'], 6, 'traffic'),
    ('Four-way traffic junction', ['led', 'resistor'], ['uno', 'esp32'], 7, 'traffic'),
    ('Debounce a push button', ['button', 'led', 'resistor'], ['uno', 'pico'], 7, 'tools'),
    ('Count button presses (state change)', ['button'], ['uno', 'pico'], 6, 'tools'),
    ('Smoothing a noisy sensor', ['pot'], ['uno', 'esp32', 'pico'], 8, 'science'),
    ('Calibrating a light sensor', ['ldr', 'resistor'], ['uno', 'pico'], 8, 'science'),
    ('Knock detector with a piezo', ['buzzer'], ['uno'], 7, 'science'),
    ('Tone keyboard with three keys', ['button', 'buzzer'], ['uno', 'pico'], 6, 'music'),
    ('Serial ASCII table', [], ['uno'], 7, 'tools'),
    ('Serial command lamp (type ON or OFF)', ['led', 'resistor'], ['uno', 'esp32', 'pico'], 7, 'tools'),
    ('Plot a sine wave on the Serial Plotter', [], ['uno', 'esp32'], 8, 'maths'),
    ('Ohm\'s law tester', ['resistor', 'pot'], ['uno'], 7, 'science'),
    ('Resistor colour-code reader', ['resistor'], ['uno'], 6, 'science'),
    ('Capacitor charging curve', ['+capacitor', 'resistor'], ['uno'], 9, 'science'),
    ('Diode one-way street', ['diode', 'led', 'resistor'], ['uno'], 6, 'science'),
    ('Transistor as a switch', ['npn', 'led', 'resistor'], ['uno'], 7, 'science'),
    ('PWM fan speed curve', ['motor', 'npn', 'diode', 'resistor'], ['uno', 'esp32'], 8, 'science'),
    ('Rainbow on an RGB LED strip', ['+ws2812'], ['uno', 'esp32', 'pico', 'microbit'], 7, 'art'),
    ('Scrolling name on an LED matrix', ['+max7219'], ['uno', 'esp32'], 8, 'art'),
    ('Hourglass on an LED matrix', ['+max7219'], ['uno'], 9, 'game'),
    ('Simon says memory game', ['led', 'resistor', 'button', 'buzzer'], ['uno', 'pico', 'microbit'], 7, 'game'),
    ('Whack-a-mole with LEDs', ['led', 'resistor', 'button'], ['uno', 'pico'], 7, 'game'),
    ('Steady-hand wire game', ['buzzer'], ['uno', 'microbit'], 5, 'game'),
    ('Electronic hourglass with LEDs', ['bar10', 'sip10'], ['uno'], 7, 'game'),
    ('Data logger to the SD card', ['+sdcard', 'dht11'], ['uno', 'esp32'], 9, 'science'),
    ('Real-time plot of two sensors', ['ldr', 'resistor', 'lm35'], ['uno', 'esp32'], 8, 'science'),
]
for (t, p, bs, lv, th) in CLASSIC:
    for b in bs:
        name = t if b == 'uno' else f'{t} ({BOARDS[b]["name"]})'
        add(name, 'classic', b, p, th, max(lv, BOARDS[b]['lvl'] - 1) if b in ('pico', 'pi4', 'esp32') else lv)

# ---------------------------------------------------------------- 3. micro:bit classroom projects (its own sensors)
MB = [
    ('Name badge', 3, 'art'), ('Beating heart', 3, 'art'), ('Emotion badge', 3, 'art'), ('Smiley buttons', 3, 'art'),
    ('Coin flipper', 3, 'game'), ('Love meter (touch pins)', 3, 'game'), ('Hot potato', 4, 'game'),
    ('Rock, paper, scissors', 4, 'game'), ('Reaction time game', 4, 'game'), ('Tug of LED', 4, 'game'),
    ('Seven-second game', 4, 'game'), ('Catch the falling dot', 5, 'game'), ('Snap the dot', 5, 'game'),
    ('Flappy bird on 5 by 5 LEDs', 6, 'game'), ('Countdown timer', 4, 'tools'), ('Hand-washing timer', 4, 'health'),
    ('Stopwatch', 4, 'tools'), ('Binary stopwatch', 6, 'maths'), ('Light level meter', 4, 'science'),
    ('Thermometer', 4, 'science'), ('Night light', 4, 'home'), ('Compass', 5, 'tools'), ('Spirit level', 5, 'tools'),
    ('Step counter', 4, 'health'), ('Shake dice', 4, 'game'), ('Clap lights (V2 microphone)', 4, 'home'),
    ('Noise meter (V2 microphone)', 5, 'school'), ('Blow away the LEDs (V2)', 4, 'game'), ('Pet hamster (V2)', 4, 'game'),
    ('Morse chat by radio', 6, 'communication'), ('Micro chat by radio', 5, 'communication'), ('Fireflies by radio', 6, 'science'),
    ('Voting machine by radio', 6, 'school'), ('Hot or cold by radio signal strength', 6, 'game'),
    ('Red light, green light by radio', 5, 'game'), ('Infection game by radio', 7, 'science'),
    ('Mood radio', 5, 'communication'), ('Multi dice by radio', 5, 'game'), ('Timing gates for a toy car', 6, 'science'),
    ('Kick strength data logger', 6, 'science'), ('Traffic survey data logger', 6, 'school'),
    ('Environment data logger', 6, 'science'), ('Solar panel experiment logger', 7, 'energy'),
    ('Calming breathing LEDs', 4, 'health'), ('Activity picker', 4, 'school'), ('Distance calculator (step length)', 5, 'maths'),
    ('Funny voice recorder (V2)', 5, 'music'), ('Poetry generator', 5, 'art'), ('Dance steps', 4, 'art'),
    ('Trundle wheel', 5, 'maths'), ('Digital balance (tilt)', 5, 'science'), ('Plot acceleration', 6, 'science'),
    ('Guitar from the accelerometer', 5, 'music'), ('Banana keyboard (touch pins)', 4, 'music'),
    ('Railway crossing with a servo', 6, 'traffic'), ('Inchworm robot (servo)', 6, 'art'), ('Milk carton robot (servo)', 5, 'art'),
    ('Waving arm (servo)', 5, 'art'), ('Combination lock with buttons', 6, 'safety'), ('Teleporting duck by radio', 5, 'game'),
    ('Rock, paper, scissors teams by radio', 6, 'game'), ('Battery tester', 6, 'science'), ('Egg drop impact logger', 7, 'science'),
    ('Rocket acceleration logger', 7, 'science'), ('Population trait counter', 5, 'science'),
    ('Simple AI exercise timer', 7, 'health'), ('Gesture recognition with machine learning', 7, 'ai'),
]
for (t, lv, th) in MB:
    add(t + ' (micro:bit)', 'microbit-classroom', 'microbit', ['servo'] if 'servo' in t else [], th, lv)

# ---------------------------------------------------------------- 4. robot cars
CAR = ['l298n', 'bomotor', 'bat18650']
ROBOTS = [
    ('Line-follower car', ['ir'], 7, 'robots'), ('Obstacle-avoiding car', ['hcsr04', 'servo'], 7, 'robots'),
    ('Edge-avoiding table robot', ['ir'], 7, 'robots'), ('Light-seeking robot', ['ldr', 'resistor'], 7, 'robots'),
    ('Hand-following robot', ['ir', 'hcsr04'], 7, 'robots'), ('Bluetooth phone-controlled car', ['hc05'], 8, 'robots'),
    ('TV-remote car', ['irrx'], 8, 'robots'), ('Wired joystick car', ['joystick'], 7, 'robots'),
    ('Wall-following robot', ['hcsr04'], 8, 'robots'), ('Maze-solving robot (left-hand rule)', ['ir', 'hcsr04'], 9, 'robots'),
    ('Sumo robot', ['ir', 'hcsr04'], 9, 'robots'), ('Robot soccer player', ['hc05'], 8, 'robots'),
    ('Delivery robot that stops at stations', ['ir'], 9, 'robots'), ('Parking robot', ['hcsr04'], 8, 'robots'),
    ('Dancing robot (timed moves)', [], 6, 'robots'), ('Drawing robot with a pen lift', ['servo'], 8, 'robots'),
    ('Lap-counting race car', ['ir', 'seg7', 'resistor'], 8, 'robots'), ('PID line follower (smooth and fast)', ['ir'], 11, 'robots'),
    ('Sound-following robot', ['sound'], 9, 'robots'), ('Fire-fighting robot', ['flame', 'pump', 'relay'], 10, 'robots'),
    ('Gesture-controlled car', ['+mpu6050', 'hc05'], 10, 'robots'), ('Self-balancing robot', ['+mpu6050'], 12, 'robots'),
    ('Mecanum-wheel car (moves sideways)', ['+mecanum'], 10, 'robots'), ('Voice-controlled car (phone app)', ['hc05'], 9, 'robots'),
    ('Agriculture sprayer robot', ['pump', 'relay', 'ir'], 9, 'farm'), ('Floor-cleaning robot', ['hcsr04', 'fan'], 9, 'home'),
    ('Solar-powered rover', ['solar'], 10, 'energy'), ('Mars rover model with a rocker-bogie', ['servo'], 11, 'space'),
    ('Wheelchair joystick model', ['joystick'], 9, 'health'), ('Railway track inspection robot', ['ir', 'hcsr04'], 10, 'traffic'),
]
for (t, extra, lv, th) in ROBOTS:
    for b in ('uno', 'esp32', 'pico', 'microbit', 'pi4'):
        if b == 'microbit' and any(p in extra for p in ('hc05', 'irrx', 'joystick', 'hcsr04', '+mpu6050')):
            continue
        if b == 'pi4' and t not in ('Obstacle-avoiding car', 'Line-follower car', 'Wall-following robot', 'Maze-solving robot (left-hand rule)', 'Bluetooth phone-controlled car', 'Robot soccer player'):
            continue
        if b == 'pico' and lv > 10:
            continue
        p = CAR + [x for x in extra if not (b == 'esp32' and x == 'hc05')]
        name = t if b == 'uno' else f'{t} ({BOARDS[b]["name"]})'
        if b == 'esp32' and 'hc05' in extra:
            name = t.replace('Bluetooth phone-controlled', 'WiFi/Bluetooth phone-controlled') + ' (ESP32)'
        add(name, 'robot-car', b, p, th, max(lv, BOARDS[b]['lvl']) if b in ('pico', 'pi4') else (lv - 1 if b == 'microbit' else lv))

# ---------------------------------------------------------------- 5. robot arm and machines
ARM = [
    ('Robot arm: base rotation', 9), ('Robot arm: shoulder and elbow', 9), ('Robot arm: gripper', 9),
    ('Robot arm: pick and place', 10), ('Robot arm: joystick control', 10), ('Robot arm: record and play back moves', 10),
    ('Robot arm: phone control over Bluetooth', 10), ('Robot arm: copy a knob arm (master and slave)', 10),
    ('Robot arm: inverse kinematics to reach a point', 12), ('Robot arm: sort blocks by colour', 11),
    ('Robot arm: draw a square', 11), ('Robot arm on a car', 11), ('Hydraulic arm with syringes', 6),
    ('Conveyor belt with a stepper', 9), ('Pick-and-place line: conveyor, sensor and arm', 11),
    ('Pen plotter with two steppers', 11), ('Camera slider with a stepper', 10), ('Solar tracker (two light sensors)', 8),
    ('Dual-axis solar tracker', 10), ('Automatic car barrier', 8), ('Mini lift with floor buttons', 10),
    ('Vending machine model', 10), ('Coin sorter', 9), ('Self-watering greenhouse', 9), ('Smart parking lot (4 slots)', 9),
    ('Smart bus stop display', 9), ('Wind turbine power logger', 9), ('Water ATM with RFID', 10),
]
for (t, lv) in ARM:
    for b in ('uno', 'esp32'):
        add(t if b == 'uno' else t + ' (ESP32)', 'machines', b, ['servo', 'mg996r', 'psu5'] if 'arm' in t.lower() else [], 'factory', lv if b == 'uno' else lv + 1)

# ---------------------------------------------------------------- 6. IoT on ESP32 and Raspberry Pi
IOT_SENS = ['dht11', 'lm35', 'soil', 'ldr', 'pir', 'mq2', 'hcsr04', 'rain', 'flame', '+bmp180', '+bh1750', '+acs712', '+tds', '+waterlevel', '+ds18b20']
IOT_WAYS = [('dashboard on the school WiFi', 8), ('alert on the phone', 9), ('cloud logger with a graph', 10)]
for s in IOT_SENS:
    nm = s.lstrip('+')
    lab = {'dht11': 'Temperature & humidity', 'lm35': 'Temperature', 'soil': 'Soil moisture', 'ldr': 'Light level', 'pir': 'Motion',
           'mq2': 'Gas level', 'hcsr04': 'Tank level', 'rain': 'Rain', 'flame': 'Fire', 'bmp180': 'Air pressure', 'bh1750': 'Lux',
           'acs712': 'Power use', 'tds': 'Water quality', 'waterlevel': 'Water level', 'ds18b20': 'Water temperature'}[nm]
    for (w, lv) in IOT_WAYS:
        add(f'{lab} {w} (ESP32)', 'iot', 'esp32', [s], 'iot', lv + (1 if s.startswith('+') else 0))
        if lv == 8 and nm in ('dht11', 'pir', 'ldr', 'soil'):
            add(f'{lab} {w} (Raspberry Pi 4)', 'iot', 'pi4', [s], 'iot', 10)
IOT_EXTRA = [('WiFi lamp from a phone', ['led', 'resistor'], 8), ('Four-switch home automation web page', ['relay', 'load230'], 9),
             ('ESP-NOW walkie-talkie between two boards', [], 10), ('ESP-NOW remote-control car', CAR, 10),
             ('WiFi robot car with a web joystick', CAR, 10), ('Internet clock from NTP time', ['lcd16'], 9),
             ('Smart energy monitor with a daily graph', ['+acs712'], 11), ('Smart farm: soil, rain and pump on the phone', ['soil', 'rain', 'pump', 'relay'], 10),
             ('Smart classroom: lights and fans by occupancy', ['pir', 'relay', 'load230'], 10), ('Smart dustbin that reports when full', ['hcsr04', 'servo'], 9),
             ('Air quality index display for the school gate', ['mq2', 'dht11', 'oled'], 10), ('Weather station that posts to a website', ['dht11', '+bmp180', 'rain'], 11),
             ('Bluetooth lamp from a phone', ['led', 'resistor'], 8), ('ESP32 camera robot', ['+esp32cam'] + CAR, 12),
             ('Face-count at the door with ESP32-CAM', ['+esp32cam'], 12), ('Patient monitor: pulse and temperature on a web page', ['+pulse', 'lm35'], 11)]
for (t, p, lv) in IOT_EXTRA:
    add(t + ' (ESP32)', 'iot', 'esp32', p, 'iot', lv)
PI = [('GPIO LED and button', 10), ('Traffic lights in Python', 10), ('Reaction game in Python', 10), ('Burglar alarm with a PIR', 10),
      ('Weather logger to a CSV file', 10), ('Plot sensor data with matplotlib', 11), ('Web-controlled lamp with Flask', 11),
      ('Quiz buzzer for three teams', 10), ('Morse code translator', 10), ('Music player on a button', 10),
      ('Robot car in Python', 11), ('Line-follower in Python', 11), ('Camera doorbell that saves a photo', 12),
      ('Time-lapse plant camera', 11), ('Object detection with a camera (AI)', 12), ('Voice assistant that switches a lamp (AI)', 12),
      ('Attendance with RFID and a spreadsheet', 11), ('Home server dashboard for all sensors', 12), ('Parent detector (motion + camera)', 11),
      ('Laser tripwire in Python', 10), ('Distance sensor with GPIO Zero', 10), ('Temperature-controlled fan in Python', 11)]
for (t, lv) in PI:
    add(t + ' (Raspberry Pi 4)', 'raspberry-pi', 'pi4', [], 'computing', lv)

# ---------------------------------------------------------------- 7. Classes 1-3: battery circuits (no board)
CIRCUITS = [
    ('Light an LED with a battery', ['battery', 'led', 'resistor'], 1), ('Torch with a switch', ['aa4', 'led', 'resistor', 'button'], 1),
    ('Doorbell with a buzzer', ['aa4', 'abuzz', 'button'], 1), ('Fan with a switch', ['aa4', 'motor', 'button'], 1),
    ('Which way round? LED polarity', ['battery', 'led', 'resistor'], 1), ('Why the resistor? Save the LED', ['battery', 'led', 'resistor'], 2),
    ('Two LEDs in series', ['aa4', 'led', 'resistor'], 2), ('Two LEDs in parallel', ['aa4', 'led', 'resistor'], 2),
    ('Conductor or insulator tester', ['aa4', 'led', 'resistor'], 1), ('Traffic signal by hand (three switches)', ['aa4', 'led', 'resistor', 'button'], 2),
    ('Lighthouse model', ['aa4', 'led', 'resistor'], 1), ('Electric quiz board', ['aa4', 'led', 'resistor', 'abuzz'], 2),
    ('Steady-hand game (no board)', ['aa4', 'abuzz'], 2), ('Morse tapper (no board)', ['aa4', 'abuzz', 'button'], 2),
    ('Spinning top with a motor', ['aa4', 'motor'], 1), ('Motor that runs both ways (swap wires)', ['aa4', 'motor'], 2),
    ('Rain alarm with two wires', ['aa4', 'abuzz', 'npn', 'resistor'], 3), ('Water level indicator with a transistor', ['aa4', 'led', 'npn', 'resistor'], 3),
    ('Automatic night light with a transistor', ['aa4', 'led', 'ldr', 'npn', 'resistor'], 3), ('Dimmer with a knob (no board)', ['aa4', 'led', 'pot', 'resistor'], 2),
    ('Diode: the one-way gate', ['aa4', 'led', 'diode', 'resistor'], 3), ('Colour mixing with three switches', ['aa4', 'rgb', 'resistor', 'button'], 2),
    ('Burglar alarm with a door wire', ['aa4', 'abuzz'], 2), ('Battery level by brightness', ['battery', 'led', 'resistor'], 2),
    ('Short circuit: what goes wrong and why', ['battery'], 1), ('Electromagnet crane (coil)', ['aa4', '+coil'], 3),
    ('Solar cell lights an LED', ['solar', 'led'], 2), ('Fruit battery (lemon cells)', ['lemon', 'led'], 2),
    ('Simple motor car with a switch', ['aa4', 'bomotor', 'button'], 2), ('Hand-crank generator lights an LED', ['+dynamo', 'led'], 3),
    ('Stair light with two switches', ['aa4', 'led', 'resistor', '+twoway'], 3), ('Flashing light with a 555 timer', ['+ne555', 'led', 'resistor'], 3),
]
for (t, p, lv) in CIRCUITS:
    add(t, 'circuits', 'none', p, 'science', lv)

# ---------------------------------------------------------------- 8. multi-sensor smart systems
SYSTEMS = [
    ('Smart greenhouse: humidity, soil and light', ['dht11', 'soil', 'ldr', 'pump', 'motor', 'relay'], 9),
    ('Smart home: motion light, gas alarm and fan', ['pir', 'mq2', 'relay', 'motor', 'abuzz'], 9),
    ('Smart street: dim lights that brighten on motion', ['ldr', 'pir', 'led'], 8),
    ('Smart traffic junction that counts cars', ['ir', 'led', 'seg7'], 9),
    ('Bank locker: keypad plus RFID plus alarm', ['keypad', 'rfid', 'servo', 'buzzer'], 10),
    ('Smart farm: soil, rain and pump', ['soil', 'rain', 'pump', 'relay'], 9),
    ('Fire and gas safety panel', ['mq2', 'flame', 'buzzer', 'relay'], 9),
    ('Smart parking: free slots on a display', ['ir', 'lcd16', 'servo'], 9),
    ('Smart classroom: attendance, lights and noise', ['rfid', 'pir', 'sound', 'relay'], 10),
    ('Smart kitchen: gas, temperature and exhaust', ['mq2', 'lm35', 'motor'], 9),
    ('Hospital bed call system', ['button', 'lcd16', 'buzzer'], 8),
    ('Smart water tank: level, pump and alarm', ['hcsr04', 'pump', 'relay', 'abuzz'], 9),
    ('Cold-storage monitor with alarm', ['dht11', 'lcd16', 'abuzz'], 9),
    ('School bus safety: seat count and door alarm', ['ir', 'reed', 'lcd16'], 10),
    ('Village water pump timer and dry-run cut-off', ['+rtc', '+waterlevel', 'relay'], 10),
    ('Smart irrigation by time and moisture', ['+rtc', 'soil', 'pump', 'relay'], 10),
    ('Disaster alert box: flood, quake and fire', ['+waterlevel', 'vibe', 'flame', 'buzzer'], 10),
    ('Smart shop door: count, greet and lock at night', ['ir', 'ldr', 'servo', 'buzzer'], 9),
    ('Automatic railway gate with two sensors', ['ir', 'servo', 'buzzer', 'led'], 8),
    ('Smart helmet: alcohol and fall check before the bike starts', ['mq2', '+mpu6050', 'relay'], 11),
    ('Smart blind stick: distance, water and SOS', ['hcsr04', '+waterlevel', 'abuzz'], 10),
    ('Smart cradle: cry detect and swing', ['sound', 'servo'], 10),
    ('Smart mirror clock and weather', ['oled', 'dht11', '+rtc'], 10),
    ('Smart medicine box with reminders and lids', ['+rtc', 'servo', 'buzzer'], 10),
    ('Smart energy saver for a classroom', ['pir', 'ldr', 'relay', 'load230'], 9),
]
for (t, p, lv) in SYSTEMS:
    for b in ('uno', 'esp32'):
        add(t if b == 'uno' else t + ' (ESP32)', 'smart-system', b, p, 'systems', lv if b == 'uno' else lv + 1)

# ---------------------------------------------------------------- 8b. famous maker projects from around the world (our own versions)
WORLD = [
    ('Ultrasonic radar with a servo sweep', ['hcsr04', 'servo'], 8), ('Hexapod walking robot', ['servo'], 12), ('Quadruped spider robot', ['servo'], 11),
    ('SCARA robot arm', ['stepper'], 12), ('Pen plotter (CNC drawing machine)', ['stepper', 'servo'], 11), ('Self-stabilising gimbal', ['+mpu6050', 'servo'], 11),
    ('RC hovercraft', ['motor', '+nrf24'], 11), ('Wire bending machine', ['stepper', 'servo'], 12), ('Mars rover replica', ['servo', 'bomotor'], 12),
    ('Laser harp', ['ldr', 'buzzer'], 9), ('Theremin with two distance sensors', ['hcsr04', 'buzzer'], 9), ('LED cube 3x3x3', ['led', 'resistor'], 9),
    ('Persistence-of-vision display', ['led', 'motor'], 10), ('Plant that tweets when thirsty', ['soil'], 10), ('Rubik cube colour scanner', ['+tcs3200'], 12),
    ('Ball-on-beam balancer (PID)', ['hcsr04', 'servo'], 12), ('Automatic cat or dog feeder', ['servo', '+rtc'], 9), ('Fish feeder on a timer', ['servo', '+rtc'], 9),
    ('Weather vane and wind logger', ['anemo'], 10), ('Smart walking stick with GPS SOS', ['hcsr04', '+gps', '+gsm'], 11), ('Bionic hand with flex glove', ['servo', '+flex'], 11),
    ('Drawing robot (turtle)', ['stepper', 'servo'], 10), ('Chess-move detector board', ['hall'], 12), ('Electronic voting machine model', ['button', 'lcd16'], 9),
    ('Interactive LED coffee table', ['+ws2812', 'ir'], 11), ('Word clock', ['+ws2812', '+rtc'], 11), ('Digital hourglass with tilt', ['+max7219', '+mpu6050'], 10),
    ('Air hockey score board', ['ir', 'seg7'], 9), ('Bowling pin counter', ['ir', 'lcd16'], 9), ('Marble run lift', ['stepper', 'ir'], 9),
    ('Musical stairs', ['ir', 'buzzer'], 8), ('Automatic chess clock', ['button', 'lcd16'], 8), ('Typing speed tester', ['lcd16'], 9),
    ('Drone flight controller basics (simulation)', ['+mpu6050'], 12), ('Water rocket launch pad timer', ['button', 'seg7', 'servo'], 9),
]
for (t, p, lv) in WORLD:
    for b in ('uno', 'esp32'):
        add(t if b == 'uno' else t + ' (ESP32)', 'world-maker', b, p, 'world', lv if b == 'uno' else lv + 1)

# ---------------------------------------------------------------- 8c. problems from Indian schools, villages and cities (ATL-style)
INDIA = [
    ('Crop guard: scare animals at night', ['pir', 'abuzz', 'led'], 8), ('Drip irrigation on a timer', ['+rtc', 'pump', 'relay'], 9),
    ('Borewell rescue claw model', ['servo', 'stepper'], 10), ('Rail track crack detector trolley', ['ir', 'hcsr04', 'bomotor'], 10),
    ('Smart ration shop: RFID card and grain weight', ['rfid', '+hx711', 'lcd16'], 11), ('Manhole gas alarm for workers', ['mq2', 'abuzz', '+gsm'], 10),
    ('Women safety band with SOS', ['button', '+gps', '+gsm'], 11), ('Bike accident alert', ['+mpu6050', '+gps', '+gsm'], 11),
    ('Kisan weather station for the panchayat', ['dht11', 'rain', 'anemo'], 10), ('Milk adulteration tester', ['+tds', 'lcd16'], 10),
    ('Vaccine cold-chain box monitor', ['+ds18b20', 'abuzz'], 10), ('Toll plaza with RFID FASTag model', ['rfid', 'servo'], 9),
    ('Solar street light with auto dimming', ['solar', 'ldr', 'led'], 9), ('Anganwadi attendance with RFID', ['rfid', 'lcd16'], 9),
    ('Driver drowsiness alarm', ['ir', 'abuzz'], 10), ('Smart dustbin for Swachh Bharat', ['hcsr04', 'servo'], 7),
    ('Village water ATM model', ['rfid', 'pump', 'relay'], 10), ('Grain storage humidity guard', ['dht11', 'motor', 'abuzz'], 9),
    ('Monsoon flood siren for a river bank', ['+waterlevel', 'buzzer', '+gsm'], 10), ('Smart school bell with periods', ['+rtc', 'buzzer', 'lcd16'], 9),
    ('Mid-day meal temperature check', ['+ds18b20', 'lcd16'], 9), ('Cattle shed fan and water automation', ['dht11', 'motor', 'pump'], 9),
    ('Tractor reversing sensor', ['hcsr04', 'abuzz'], 8), ('Fog light that switches on in fog', ['ldr', 'led', 'relay'], 8),
    ('Electricity theft alarm model', ['+acs712', 'abuzz'], 11), ('Smart traffic for ambulances (green corridor)', ['rfid', 'led'], 10),
    ('Gas cylinder leak and level monitor', ['mq2', '+hx711'], 11), ('Temple or school crowd counter', ['ir', 'seg7'], 8),
    ('Solar dryer for crops with fan control', ['dht11', 'motor', 'solar'], 10), ('Rainwater harvesting tank monitor', ['hcsr04', 'lcd16'], 9),
    ('Smart parking for a market', ['ir', 'lcd16', 'servo'], 9), ('Fire alarm for a hut with a GSM call', ['flame', '+gsm'], 10),
    ('Pump dry-run protection for farmers', ['+waterlevel', 'relay'], 9), ('Mobile phone charging locker with RFID', ['rfid', 'servo', 'relay'], 10),
    ('Hand pump water flow counter', ['hall', 'lcd16'], 9), ('Bus arrival display for a village stop', ['+rf433', 'lcd16'], 10),
    ('Elephant or animal crossing alert on a road', ['pir', 'led', 'buzzer'], 9), ('Earthquake alert for a school', ['vibe', 'buzzer'], 9),
    ('Paddy field water level keeper', ['+waterlevel', 'pump', 'relay'], 9), ('Smart helmet that starts the bike only when worn', ['reed', 'relay'], 9),
]
for (t, p, lv) in INDIA:
    for b in ('uno', 'esp32'):
        add(t if b == 'uno' else t + ' (ESP32)', 'india-problems', b, p, 'india', lv if b == 'uno' else lv + 1)

# ---------------------------------------------------------------- 9. AI and capstones (Classes 10-12)
AI = [
    ('Teach a computer to recognise gestures (no-code AI)', 'microbit', 7), ('Smart bin that sorts by AI image class', 'pi4', 12),
    ('Rock-paper-scissors with a camera (AI)', 'pi4', 12), ('Face-tracking pan-tilt camera', 'pi4', 12),
    ('Line-following with a camera instead of IR', 'pi4', 12), ('Plant disease photo checker (AI)', 'pi4', 12),
    ('Sign-language letter reader (AI)', 'pi4', 12), ('Voice command robot (AI keyword spotting)', 'esp32', 12),
    ('Predict tomorrow\'s temperature from logged data', 'pi4', 11), ('Traffic counter that learns rush hours', 'esp32', 11),
    ('Autonomous delivery robot: map, path and stop', 'pi4', 12), ('Solution for a problem in your school', 'uno', 10),
    ('Solution for a problem in your village or city', 'esp32', 11), ('Assistive device for a person with a disability', 'esp32', 12),
    ('Clean-energy monitor for the school', 'esp32', 12), ('Competition robot (school, district, ATL Marathon)', 'uno', 12),
]
for (t, b, lv) in AI:
    add(t, 'ai-capstone', b, [], 'ai', lv)

# ---------------------------------------------------------------- the live lessons in the app (robotics/js/lessons*.js)
def live_lessons():
    import subprocess
    js = os.path.join(HERE, 'live.mjs')
    out = subprocess.run(['node', js], capture_output=True, text=True, cwd=HERE)
    if out.returncode:
        print(out.stderr, file=sys.stderr); return []
    return json.loads(out.stdout)

LIVE = live_lessons()
# factory lessons (robotics/js/factory.js) make planned sensor -> output ideas live: same job, sensor and output on the Uno
F_IN = {'button': ['button'], 'pot': ['pot'], 'ldr': ['ldr', 'ldrb'], 'temp': ['lm35', 'cold'], 'dht': ['dht', 'hum'], 'soil': ['soil'], 'pir': ['pir'], 'ir': ['ir'], 'sonar': ['sonar'], 'gas': ['gas']}
F_OUT = {'led': 'led', 'rgb': 'rgb', 'buzzer': 'buzzer', 'abuzz': 'buzzer', 'servo': 'servo', 'relay': 'relay', 'pump': 'pump', 'lcd': 'lcd'}
FMAP = {}
for l in LIVE:
    f = l.get('factory')
    if f: FMAP[(l['title'].split(':')[0].strip().lower(), f['inp'], f['out'])] = l['id']
used_f = set()
for i in ideas:
    r = i.get('rule')
    if not r or i['board'] != 'uno' or i['live']: continue
    for fin in F_IN.get(r['in'], []):
        k = (r['job'].lower(), fin, F_OUT.get(r['out']))
        if k in FMAP and FMAP[k] not in used_f:
            i['live'] = FMAP[k]; used_f.add(FMAP[k]); break
LIVE = [l for l in LIVE if l['id'] not in used_f]
for l in LIVE:
    b = l['board'] if l['board'] in BOARDS else ('microbit' if l['id'].startswith('mb') else 'uno')
    lv = l['cls'] or None
    if not lv:
        lv = {'basics': 6, 'robots': 7, 'boards': 8, 'modules': 7, 'microbit': 5, 'pi': 9}.get(l['group'], 7)
    ideas.insert(0, {'id': 'live-' + l['id'], 'title': l['title'], 'family': 'live' if not l.get('factory') else 'factory', 'board': b, 'parts': l['parts'], 'newparts': [],
                     'band': [lv, min(12, lv + 2)], 'level': lv, 'theme': l.get('group'), 'live': l['id'], 'rule': None, 'note': None})

if __name__ == '__main__':
    with open(os.path.join(HERE, 'ideas.json'), 'w') as f:
        json.dump(ideas, f, ensure_ascii=False, indent=0)
    fam = collections.Counter(i['family'] for i in ideas)
    brd = collections.Counter(i['board'] for i in ideas)
    distinct = len({re.sub(r' \((ESP32|BBC micro:bit|Raspberry Pi Pico|Raspberry Pi 4|micro:bit)\)$', '', i['title']) for i in ideas})
    need = collections.Counter(p for i in ideas for p in i['newparts'])
    print('ideas', len(ideas), 'distinct titles', distinct, 'live', len(LIVE))
    print('family', dict(fam)); print('board', dict(brd))
    print('ready with today\'s parts', sum(1 for i in ideas if not i['newparts']))
    print('new parts needed', need.most_common())
    lv = collections.Counter(i['level'] for i in ideas); print('level', sorted(lv.items()))
