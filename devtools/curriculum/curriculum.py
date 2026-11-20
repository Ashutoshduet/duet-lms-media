#!/usr/bin/env python3
"""DUET STEM Robotics & AI curriculum: Class 1 to 12, 32 sessions a year each (one 40-minute session a week).

  python3 devtools/curriculum/curriculum.py     -> devtools/curriculum/curriculum.json (+ prints a check)

Sessions 8, 16 and 24 are the term build challenges; 30-32 are the capstone (plan, build, show).
Entry codes:  L:<lesson id> = a live lesson in Robotics Lab 360   I:<title> = a project from ideas.json (exact title)
              U:<title> = an unplugged activity (no device)        C:<brief> = term challenge   P:<step> = capstone
"""
import json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
IDEAS = json.load(open(os.path.join(HERE, 'ideas.json')))
BY_TITLE = {i['title']: i for i in IDEAS}
LIVE = {i['live']: i for i in IDEAS if i['live']}
LIVE_ID = {i['id']: i['live'] for i in IDEAS if i['live']}

MB = ' (micro:bit)'; BBC = ' (BBC micro:bit)'; PICO = ' (Raspberry Pi Pico)'; PI = ' (Raspberry Pi 4)'; ESP = ' (ESP32)'
CAP = ['P:Capstone 1: choose a problem, sketch the idea, list the parts', 'P:Capstone 2: build it in 3D, then on the kit', 'P:Capstone 3: demo day for parents and a jury']

CLASSES = {
 1: ('Electricity around me', 'No board: battery circuits in 3D, then with the kit; unplugged coding games', [
    'U:Safe or not safe? Rules of the robot lab', 'I:Light an LED with a battery', 'I:Which way round? LED polarity', 'I:Torch with a switch',
    'I:Doorbell with a buzzer', 'I:Fan with a switch', 'U:Robot says: follow my steps (sequencing)', 'C:Light up a paper house',
    'I:Conductor or insulator tester', 'I:Lighthouse model', 'U:Arrow-card maze on the floor', 'I:Spinning top with a motor',
    'I:Short circuit: what goes wrong and why', 'U:Repeat the pattern with coloured blocks', 'I:Simple motor car with a switch', 'C:A fan for a hot day',
    'I:Burglar alarm with a door wire', 'I:Electric quiz board', 'U:Grid robot: plan the path before you move', 'I:Colour mixing with three switches',
    'U:Find the broken step (debugging)', 'I:Solar cell lights an LED', 'I:Fruit battery (lemon cells)', 'C:A doorbell for our classroom',
    'I:Steady-hand game (no board)', 'I:Two LEDs in series', 'I:Motor that runs both ways (swap wires)', 'U:Sort the parts: input or output?',
    'U:Robot helpers at home and school (story)'] + CAP),
 2: ('Circuits and my first code', 'Battery circuits, then the BBC micro:bit with blocks', [
    'I:Why the resistor? Save the LED', 'I:Two LEDs in parallel', 'I:Traffic signal by hand (three switches)', 'I:Dimmer with a knob (no board)',
    'I:Morse tapper (no board)', 'I:Battery level by brightness', 'U:An algorithm for brushing teeth', 'C:A traffic signal for a toy road',
    'L:mbmeet', 'I:Name badge' + MB, 'I:Beating heart' + MB, 'I:Smiley buttons' + MB, 'I:Coin flipper' + MB, 'I:Emotion badge' + MB,
    'U:Loops: clap patterns', 'C:A badge that shows how you feel', 'I:Dance steps' + MB, 'I:Music box: play a melody' + BBC, 'I:Countdown timer' + MB,
    'I:Calming breathing LEDs' + MB, 'I:Activity picker' + MB, 'I:Love meter (touch pins)' + MB, 'U:If-then: a game of Simon says',
    'C:A timer for brushing teeth', 'I:Hand-washing timer' + MB, 'I:Night light' + MB, 'I:Banana keyboard (touch pins)' + MB, 'I:Hot potato' + MB,
    'U:Robots that help farmers (story)'] + CAP),
 3: ('Sense and react', 'BBC micro:bit with blocks: its own buttons, lights, compass and motion sensor', [
    'I:Magic 8-ball' + MB, 'I:Guess my number' + MB, 'L:mbcount', 'I:Rock, paper, scissors' + MB, 'I:Reaction time game' + MB, 'L:mbtemp', 'I:Light level meter' + MB,
    'C:A game for the class fair', 'L:mbsteps', 'I:Shake dice' + MB, 'I:Bike light with modes' + MB, 'I:Stopwatch' + MB, 'I:Tug of LED' + MB, 'I:Seven-second game' + MB,
    'I:Morse code tapper' + MB, 'C:A night light for a tent', 'L:mbcompass', 'I:Spirit level' + MB, 'I:Clap lights (V2 microphone)' + MB,
    'I:Noise meter (V2 microphone)' + MB, 'I:Pet hamster (V2)' + MB, 'I:Blow away the LEDs (V2)' + MB, 'I:Poetry generator' + MB,
    'C:A quiet-please gadget for the library', 'I:Catch the falling dot' + MB, 'I:Steady-hand wire game' + BBC, 'I:Trundle wheel' + MB,
    'I:Population trait counter' + MB, 'I:Snap the dot' + MB] + CAP),
 4: ('Talk, move and measure', 'micro:bit radio, servos and plug-in sensors, with blocks', [
    'L:mbrps', 'I:Micro chat by radio' + MB, 'I:Mood radio' + MB, 'I:Red light, green light by radio' + MB, 'I:Multi dice by radio' + MB,
    'I:Teleporting duck by radio' + MB, 'I:Waving arm (servo)' + MB, 'C:A radio game for two teams', 'L:mbgate', 'I:Milk carton robot (servo)' + MB,
    'I:Doorbell: push button and speaker' + BBC, 'I:Night lamp: light sensor and LED' + BBC, 'I:Plant thirst alarm: soil moisture sensor and LED screen' + BBC,
    'L:mbplant', 'I:Automatic curtain: light sensor and servo' + BBC, 'C:A plant helper for the school garden', 'I:Dimmer: knob and LED' + BBC,
    'I:Guitar from the accelerometer' + MB, 'I:Digital balance (tilt)' + MB, 'I:Distance calculator (step length)' + MB,
    'I:Kick strength data logger' + MB, 'I:Traffic survey data logger' + MB, 'I:Fireflies by radio' + MB, 'C:A survey of traffic at the school gate',
    'I:Burglar alarm: motion sensor and tune on a buzzer' + BBC, 'I:Treasure hunt with headings: compass and LED screen' + BBC, 'I:Timing gates for a toy car' + MB,
    'I:Voting machine by radio' + MB, 'I:Hot or cold by radio signal strength' + MB] + CAP),
 5: ('From blocks to the Arduino', 'Arduino Uno with blocks; micro:bit data logging and a first look at AI', [
    'L:meet', 'L:blink', 'L:ledres', 'L:traffic', 'L:button', 'I:Doorbell: push button and tune on a buzzer', 'L:piano',
    'C:A pedestrian crossing for the school gate', 'L:rgb', 'L:night', 'I:Light switch that toggles: push button and LED',
    'I:Quiz buzzer for the first hand up: push button and LED', 'I:Music box: play a melody', 'I:Happy birthday on a buzzer', 'I:Steady-hand wire game',
    'C:A quiz buzzer for the class', 'I:Combination lock with buttons' + MB, 'I:Binary stopwatch' + MB, 'I:Environment data logger' + MB,
    'I:Railway crossing with a servo' + MB, 'I:Inchworm robot (servo)' + MB, 'I:Gesture recognition with machine learning' + MB,
    'I:Simple AI exercise timer' + MB, 'C:A safe box with a secret code', 'I:Flappy bird on 5 by 5 LEDs' + MB,
    'I:Solar panel experiment logger' + MB, 'I:Egg drop impact logger' + MB, 'I:Rocket acceleration logger' + MB, 'I:Infection game by radio' + MB] + CAP),
 6: ('Arduino electronics', 'Arduino Uno in C++ (blocks beside it): Ohm\'s law, PWM, sensors, servos and motors', [
    'L:blink', 'L:ledres', 'I:Resistor colour-code reader', 'I:Diode one-way street', 'L:fade', 'L:knob', 'I:Ohm\'s law tester',
    'C:A dimmable desk lamp', 'L:night', 'I:Automatic street light: light sensor and 10-LED bar graph', 'I:Light meter: light sensor and 10-LED bar graph',
    'L:temp', 'I:Too-hot warning: temperature sensor and colour LED', 'I:Binary counter on 4 LEDs', 'I:Count button presses (state change)',
    'C:A thermometer with a colour warning', 'L:sweep', 'L:servoknob', 'I:Gate opener: push button and servo', 'I:Servo dance', 'L:motor',
    'I:Fan speed regulator: knob and fan motor', 'I:Transistor as a switch', 'C:A fan that runs only when it is hot', 'I:Dice on a 7-segment display',
    'I:Countdown timer on a 7-segment display', 'L:mega_bar', 'I:Simon says memory game', 'I:Whack-a-mole with LEDs'] + CAP),
 7: ('Sensors and robots', 'Arduino Uno: distance, motion, gas and soil sensors, relays, and the robot car', [
    'L:parking', 'L:iralarm', 'I:Distance meter: ultrasonic sensor and 7-segment digit', 'L:smartbin', 'I:Object counter on a conveyor: IR sensor and 7-segment digit',
    'I:Automatic hand sanitiser: IR sensor and water pump', 'I:Railway level crossing: IR sensor and servo', 'C:A parking helper for the school van',
    'L:burglar', 'L:gasalarm', 'I:Automatic room light: motion sensor and 230 V lamp through a relay', 'L:homeauto', 'L:irrigate',
    'I:Plant thirst alarm: soil moisture sensor and beeper', 'L:lcdtemp', 'C:A smart corner for the school garden', 'L:linecar', 'L:avoidcar', 'L:btcar',
    'I:Edge-avoiding table robot', 'I:Light-seeking robot', 'I:Dancing robot (timed moves)', 'I:Lap-counting race car', 'C:Robot race: line, obstacle and finish',
    'L:hydarm', 'I:Solar tracker (two light sensors)', 'I:Automatic car barrier', 'I:Musical stairs', 'I:Ultrasonic radar with a servo sweep'] + CAP),
 8: ('Connected things (IoT)', 'ESP32 with WiFi and Bluetooth, displays, locks; the AI project cycle', [
    'L:esp_meet', 'L:esp_knob', 'L:esp_touch', 'L:esp_hall', 'L:esp_wifi', 'L:esp_bt', 'L:esp_iot', 'C:A classroom thermometer on every phone',
    'L:weather', 'I:Scrolling message on an LCD', 'I:Bouncing ball on an OLED', 'I:Pong on an OLED with a knob', 'L:keylock', 'L:rfidlock',
    'I:Attendance register: RFID card and LCD readout', 'C:A smart lock for the lab cupboard',
    'I:Weather station: temperature & humidity sensor and web page on a phone' + ESP, 'I:Soil moisture dashboard on the school WiFi' + ESP,
    'I:Motion alert on the phone' + ESP, 'I:Four-switch home automation web page' + ESP, 'L:pantilt', 'L:turntable',
    'I:Smart street: dim lights that brighten on motion', 'C:A smart street for our model city', 'I:Smart traffic junction that counts cars',
    'I:Air quality meter: gas sensor and OLED screen', 'I:Smart dustbin that reports when full' + ESP,
    'I:Water tank level meter: ultrasonic sensor and web page on a phone' + ESP, 'I:Teach a computer to recognise gestures (no-code AI)'] + CAP),
 9: ('MicroPython and security systems', 'Raspberry Pi Pico in MicroPython; the 4-servo robot arm; systems with many parts', [
    'L:pico_blink', 'L:pico_led', 'L:pico_button', 'L:pico_fade', 'L:pico_pot', 'L:pico_servo', 'L:pico_sonar', 'C:A distance alarm in MicroPython',
    'L:pico_lamp', 'I:Burglar alarm: motion sensor and beeper' + PICO, 'I:Password door lock: keypad and servo' + PICO, 'I:RFID door lock: RFID card and servo' + PICO,
    'I:Gas leak alarm: gas sensor and beeper' + PICO, 'I:Automatic plant watering: soil moisture sensor and water pump' + PICO,
    'I:Weather station: temperature & humidity sensor and OLED screen' + PICO, 'C:A security system for the school lab', 'L:arm1', 'L:arm2', 'L:arm3', 'L:arm4',
    'L:arm5', 'I:Bank locker: keypad plus RFID plus alarm', 'I:Smart water tank: level, pump and alarm', 'C:An arm that sorts parcels',
    'I:Smart greenhouse: humidity, soil and light', 'I:Line-follower car' + PICO, 'I:Obstacle-avoiding car' + PICO, 'I:Maze-solving robot (left-hand rule)',
    'I:Electronic voting machine model'] + CAP),
 10: ('Python, data and smart systems', 'Raspberry Pi 4 in Python: GPIO, logging and graphs, web control, Pi robot; ESP32 systems', [
    'L:pi_led', 'I:Traffic lights in Python' + PI, 'I:Reaction game in Python' + PI, 'L:pi_pir', 'I:Laser tripwire in Python' + PI, 'L:pi_dht',
    'I:Weather logger to a CSV file' + PI, 'C:A data logger for the school garden', 'I:Distance sensor with GPIO Zero' + PI, 'I:Quiz buzzer for three teams' + PI,
    'I:Morse code translator' + PI, 'I:Plot sensor data with matplotlib' + PI, 'I:Web-controlled lamp with Flask' + PI,
    'I:Temperature-controlled fan in Python' + PI, 'I:Attendance with RFID and a spreadsheet' + PI, 'C:A web dashboard for the classroom', 'L:pi_car',
    'I:Line-follower in Python' + PI, 'I:Obstacle-avoiding car' + PI, 'I:Wall-following robot' + PI, 'I:Smart home: motion light, gas alarm and fan' + ESP,
    'I:Smart farm: soil, rain and pump on the phone' + ESP, 'I:Predict tomorrow\'s temperature from logged data', 'C:A Python robot for the school corridor',
    'I:Kisan weather station for the panchayat' + ESP, 'I:Rainwater harvesting tank monitor', 'I:Smart energy saver for a classroom',
    'I:Driver drowsiness alarm', 'I:Smart parking for a market'] + CAP),
 11: ('Robotics engineering', 'Robot arms and machines, control (PID), wireless robots, energy and the cloud', [
    'I:Robot arm: record and play back moves', 'I:Robot arm: phone control over Bluetooth', 'I:Robot arm: copy a knob arm (master and slave)',
    'I:Robot arm: draw a square', 'I:Conveyor belt with a stepper', 'I:Pick-and-place line: conveyor, sensor and arm', 'I:Camera slider with a stepper',
    'C:An assembly line for the lab', 'I:PID line follower (smooth and fast)', 'I:Wall-following robot', 'I:Sumo robot', 'I:Delivery robot that stops at stations',
    'I:ESP-NOW remote-control car' + ESP, 'I:WiFi robot car with a web joystick' + ESP, 'I:Robot soccer player', 'C:Robot sumo or soccer tournament',
    'I:Dual-axis solar tracker', 'I:Mini lift with floor buttons', 'I:Vending machine model', 'I:Water ATM with RFID', 'I:Pen plotter with two steppers',
    'I:Quadruped spider robot', 'I:Smart energy monitor with a daily graph' + ESP, 'C:A machine for a shop or factory problem', 'I:Gesture-controlled car',
    'I:Mecanum-wheel car (moves sideways)', 'I:Mars rover model with a rocker-bogie', 'I:Bionic hand with flex glove',
    'I:Weather station that posts to a website' + ESP] + CAP),
 12: ('AI and autonomous robots', 'Control, cameras and AI on the Raspberry Pi and ESP32; capstone for competitions', [
    'I:Robot arm: inverse kinematics to reach a point', 'I:Self-balancing robot', 'I:Ball-on-beam balancer (PID)', 'I:Self-stabilising gimbal', 'I:SCARA robot arm',
    'I:Hexapod walking robot', 'I:Drone flight controller basics (simulation)', 'C:Control challenge: balance it or reach it',
    'I:Object detection with a camera (AI)' + PI, 'I:Face-tracking pan-tilt camera', 'I:Line-following with a camera instead of IR',
    'I:Rock-paper-scissors with a camera (AI)', 'I:Smart bin that sorts by AI image class', 'I:Sign-language letter reader (AI)',
    'I:Voice command robot (AI keyword spotting)', 'C:An AI helper for the school', 'I:ESP32 camera robot' + ESP, 'I:Face-count at the door with ESP32-CAM' + ESP,
    'I:Patient monitor: pulse and temperature on a web page' + ESP, 'I:Home server dashboard for all sensors' + PI,
    'I:Autonomous delivery robot: map, path and stop', 'I:Plant disease photo checker (AI)', 'I:Traffic counter that learns rush hours',
    'C:A connected system for a village', 'I:Assistive device for a person with a disability', 'I:Clean-energy monitor for the school',
    'I:Smart walking stick with GPS SOS', 'I:Smart ration shop: RFID card and grain weight', 'I:Competition robot (school, district, ATL Marathon)'] + CAP),
}

# Planned sessions that a live lesson now covers (batch 7 hand-made lessons, the project factory's lessons)
REPL = {
 1: {'I:Solar cell lights an LED': 'L:c_solar', 'I:Fruit battery (lemon cells)': 'L:c_lemon', 'I:Light an LED with a battery': 'L:c_light', 'I:Torch with a switch': 'L:c_torch', 'I:Doorbell with a buzzer': 'L:c_doorbell', 'I:Fan with a switch': 'L:c_fan', 'I:Two LEDs in series': 'L:c_series',
     'I:Which way round? LED polarity': 'L:c_polarity', 'I:Lighthouse model': 'L:c_lighthouse', 'I:Simple motor car with a switch': 'L:c_car', 'I:Burglar alarm with a door wire': 'L:c_burglar',
     'I:Electric quiz board': 'L:c_quiz', 'I:Colour mixing with three switches': 'L:c_rgbmix', 'I:Motor that runs both ways (swap wires)': 'L:c_bothways',
     'I:Short circuit: what goes wrong and why': 'L:c_short', 'I:Conductor or insulator tester': 'L:c_conductor', 'I:Spinning top with a motor': 'L:c_top',
     'I:Steady-hand game (no board)': 'L:c_steady'},
 2: {'I:Why the resistor? Save the LED': 'L:c_resistor', 'I:Two LEDs in parallel': 'L:c_parallel', 'I:Dimmer with a knob (no board)': 'L:c_dimmer',
     'I:Traffic signal by hand (three switches)': 'L:c_traffic', 'I:Morse tapper (no board)': 'L:c_morse', 'I:Battery level by brightness': 'L:c_battlevel',
     'I:Name badge' + MB: 'L:mbbadge', 'I:Beating heart' + MB: 'L:mbheart', 'I:Coin flipper' + MB: 'L:mbcoin', 'I:Night light' + MB: 'L:mbnight',
     'I:Smiley buttons' + MB: 'L:mbsmiley', 'I:Emotion badge' + MB: 'L:mbemotion', 'I:Dance steps' + MB: 'L:mbdance', 'I:Music box: play a melody' + BBC: 'L:mbmusicbox',
     'I:Countdown timer' + MB: 'L:mbcountdown', 'I:Calming breathing LEDs' + MB: 'L:mbbreathe', 'I:Activity picker' + MB: 'L:mbpicker', 'I:Love meter (touch pins)' + MB: 'L:mblove',
     'I:Hand-washing timer' + MB: 'L:mbhandwash', 'I:Banana keyboard (touch pins)' + MB: 'L:mbbanana', 'I:Hot potato' + MB: 'L:mbpotato'},
 3: {'I:Rock, paper, scissors' + MB: 'L:mbrps1', 'I:Reaction time game' + MB: 'L:mbreact', 'I:Light level meter' + MB: 'L:mblight', 'I:Shake dice' + MB: 'L:mbdice',
     'I:Stopwatch' + MB: 'L:mbstop', 'I:Tug of LED' + MB: 'L:mbtug', 'I:Seven-second game' + MB: 'L:mbseven', 'I:Spirit level' + MB: 'L:mblevel',
     'I:Magic 8-ball' + MB: 'L:mb8ball', 'I:Guess my number' + MB: 'L:mbhilo', 'I:Bike light with modes' + MB: 'L:mbbike', 'I:Morse code tapper' + MB: 'L:mbmorse',
     'I:Catch the falling dot' + MB: 'L:mbcatch', 'I:Trundle wheel' + MB: 'L:mbtrundle',
     'I:Clap lights (V2 microphone)' + MB: 'L:mbclap', 'I:Noise meter (V2 microphone)' + MB: 'L:mbnoise', 'I:Pet hamster (V2)' + MB: 'L:mbhamster', 'I:Blow away the LEDs (V2)' + MB: 'L:mbblow',
     'I:Poetry generator' + MB: 'L:mbpoem', 'I:Steady-hand wire game' + BBC: 'L:mbsteady', 'I:Population trait counter' + MB: 'L:mbtraits', 'I:Snap the dot' + MB: 'L:mbsnap'},
 4: {'I:Micro chat by radio' + MB: 'L:mbchat', 'I:Mood radio' + MB: 'L:mbmood', 'I:Red light, green light by radio' + MB: 'L:mbredgreen', 'I:Multi dice by radio' + MB: 'L:mbmdice',
     'I:Teleporting duck by radio' + MB: 'L:mbduck', 'I:Waving arm (servo)' + MB: 'L:mbwave', 'I:Milk carton robot (servo)' + MB: 'L:mbmilk', 'I:Doorbell: push button and speaker' + BBC: 'L:mbbell',
     'I:Night lamp: light sensor and LED' + BBC: 'L:mblamp', 'I:Plant thirst alarm: soil moisture sensor and LED screen' + BBC: 'L:mbthirst', 'I:Automatic curtain: light sensor and servo' + BBC: 'L:mbcurtain',
     'I:Guitar from the accelerometer' + MB: 'L:mbguitar', 'I:Distance calculator (step length)' + MB: 'L:mbstride', 'I:Kick strength data logger' + MB: 'L:mbkick',
     'I:Traffic survey data logger' + MB: 'L:mbtraffic', 'I:Treasure hunt with headings: compass and LED screen' + BBC: 'L:mbtreasure', 'I:Timing gates for a toy car' + MB: 'L:mbgates',
     'I:Voting machine by radio' + MB: 'L:mbvote', 'I:Digital balance (tilt)' + MB: 'L:mbbalance', 'I:Fireflies by radio' + MB: 'L:mbfireflies',
     'I:Burglar alarm: motion sensor and tune on a buzzer' + BBC: 'L:mbburglar', 'I:Dimmer: knob and LED' + BBC: 'L:mbdimmer', 'I:Hot or cold by radio signal strength' + MB: 'L:mbhotcold'},
 5: {'I:Simple AI exercise timer' + MB: 'L:mbcoach', 'I:Inchworm robot (servo)' + MB: 'L:mbinchworm', 'I:Combination lock with buttons' + MB: 'L:mblock', 'I:Binary stopwatch' + MB: 'L:mbbinary', 'I:Environment data logger' + MB: 'L:mbenvlog',
     'I:Railway crossing with a servo' + MB: 'L:mbrail', 'I:Flappy bird on 5 by 5 LEDs' + MB: 'L:mbflappy', 'I:Solar panel experiment logger' + MB: 'L:mbsolar',
     'I:Egg drop impact logger' + MB: 'L:mbeggdrop', 'I:Rocket acceleration logger' + MB: 'L:mbrocket', 'I:Infection game by radio' + MB: 'L:mbinfect', 'I:Gesture recognition with machine learning' + MB: 'L:mblearn',
     'I:Doorbell: push button and tune on a buzzer': 'L:f_doorbell_buzzer', 'I:Light switch that toggles: push button and LED': 'L:f_lightswitch_led',
     'I:Quiz buzzer for the first hand up: push button and LED': 'L:quizbuzz', 'I:Music box: play a melody': 'L:melody', 'I:Happy birthday on a buzzer': 'L:sos',
     'I:Steady-hand wire game': 'L:mathquiz'},
 6: {'I:Binary counter on 4 LEDs': 'L:u_binary', 'I:Diode one-way street': 'L:u_diode', 'I:Transistor as a switch': 'L:u_npn', 'I:Servo dance': 'L:u_servodance',
     'I:Resistor colour-code reader': 'L:u_colourcode', 'I:Ohm\'s law tester': 'L:u_ohm', 'I:Simon says memory game': 'L:u_simon',
     'I:Automatic street light: light sensor and 10-LED bar graph': 'L:f_streetlight_led', 'I:Light meter: light sensor and 10-LED bar graph': 'L:lightmeter',
     'I:Too-hot warning: temperature sensor and colour LED': 'L:rgbtemp', 'I:Count button presses (state change)': 'L:segcount', 'I:Gate opener: push button and servo': 'L:f_gate_servo',
     'I:Dice on a 7-segment display': 'L:dice', 'I:Countdown timer on a 7-segment display': 'L:countdown', 'I:Whack-a-mole with LEDs': 'L:reaction',
     'I:Fan speed regulator: knob and fan motor': 'L:f_fanmark_relay'},
 7: {'I:Distance meter: ultrasonic sensor and 7-segment digit': 'L:lcddist', 'I:Object counter on a conveyor: IR sensor and 7-segment digit': 'L:visitors',
     'I:Automatic hand sanitiser: IR sensor and water pump': 'L:sanitizer', 'I:Railway level crossing: IR sensor and servo': 'L:railgate',
     'I:Automatic room light: motion sensor and 230 V lamp through a relay': 'L:f_roomlight_relay', 'I:Plant thirst alarm: soil moisture sensor and beeper': 'L:f_thirst_buzzer',
     'I:Ultrasonic radar with a servo sweep': 'L:radar', 'I:Automatic car barrier': 'L:f_garage_servo', 'I:Musical stairs': 'L:theremin', 'I:Solar tracker (two light sensors)': 'L:blinds',
     'I:Edge-avoiding table robot': 'L:edgecar', 'I:Light-seeking robot': 'L:lightcar', 'I:Dancing robot (timed moves)': 'L:dancecar', 'I:Lap-counting race car': 'L:lapcar'},
 8: {'I:Scrolling message on an LCD': 'L:lcdnotice', 'I:Smart street: dim lights that brighten on motion': 'L:corridor', 'I:Air quality meter: gas sensor and OLED screen': 'L:f_gasleak_lcd',
     'I:Bouncing ball on an OLED': 'L:sketch', 'I:Smart traffic junction that counts cars': 'L:speedgun', 'I:Motion alert on the phone' + ESP: 'L:esp_alarm',
     'I:Weather station: temperature & humidity sensor and web page on a phone' + ESP: 'L:f_heatwave_web_esp', 'I:Soil moisture dashboard on the school WiFi' + ESP: 'L:f_thirst_web_esp', 'I:Water tank level meter: ultrasonic sensor and web page on a phone' + ESP: 'L:f_tankfull_web_esp',
     'I:Smart dustbin that reports when full' + ESP: 'L:f_binfull_web_esp', 'I:Four-switch home automation web page' + ESP: 'L:smarthome4',
     'I:Attendance register: RFID card and LCD readout': 'L:attendance', 'I:Pong on an OLED with a knob': 'L:pong',
     'I:Teach a computer to recognise gestures (no-code AI)': 'L:mbgestureai'},
 9: {'I:Burglar alarm: motion sensor and beeper' + PICO: 'L:f_corridor_led_pico', 'I:Automatic plant watering: soil moisture sensor and water pump' + PICO: 'L:f_waterplant_pump_pico',
     'I:Electronic voting machine model': 'L:calc', 'I:Password door lock: keypad and servo' + PICO: 'L:pico_keylock',
     'I:Gas leak alarm: gas sensor and beeper' + PICO: 'L:pico_gasalarm', 'I:Bank locker: keypad plus RFID plus alarm': 'L:banklocker',
     'I:Smart water tank: level, pump and alarm': 'L:smarttank', 'I:Line-follower car' + PICO: 'L:pico_linecar', 'I:Obstacle-avoiding car' + PICO: 'L:pico_avoidcar',
     'I:Smart greenhouse: humidity, soil and light': 'L:greenhouse', 'I:RFID door lock: RFID card and servo' + PICO: 'L:pico_rfidlock',
     'I:Weather station: temperature & humidity sensor and OLED screen' + PICO: 'L:pico_weather', 'I:Maze-solving robot (left-hand rule)': 'L:mazecar'},
 10: {'I:Web-controlled lamp with Flask' + PI: 'L:pi_flask', 'I:Attendance with RFID and a spreadsheet' + PI: 'L:pi_rfidsheet', 'I:Laser tripwire in Python' + PI: 'L:pi_tripwire',
      'I:Weather logger to a CSV file' + PI: 'L:pi_csvlog', 'I:Plot sensor data with matplotlib' + PI: 'L:pi_plot',
      'I:Predict tomorrow\'s temperature from logged data': 'L:pi_predict', 'I:Driver drowsiness alarm': 'L:drowsy', 'I:Smart farm: soil, rain and pump on the phone' + ESP: 'L:smartfarm', 'I:Kisan weather station for the panchayat' + ESP: 'L:kisanws', 'I:Line-follower in Python' + PI: 'L:pi_linecar', 'I:Obstacle-avoiding car' + PI: 'L:pi_avoidcar', 'I:Wall-following robot' + PI: 'L:pi_wallcar',
      'I:Temperature-controlled fan in Python' + PI: 'L:f_greenfan_relay_pi', 'I:Traffic lights in Python' + PI: 'L:pi_traffic', 'I:Reaction game in Python' + PI: 'L:pi_reaction',
      'I:Distance sensor with GPIO Zero' + PI: 'L:pi_distance', 'I:Quiz buzzer for three teams' + PI: 'L:pi_quiz', 'I:Morse code translator' + PI: 'L:pi_morse', 'I:Smart home: motion light, gas alarm and fan' + ESP: 'L:f_roomlight_relay_esp', 'I:Rainwater harvesting tank monitor': 'L:f_tankfull_lcd',
      'I:Smart energy saver for a classroom': 'L:f_classfan_relay', 'I:Smart parking for a market': 'L:f_slot_lcd'},
 11: {'I:Water ATM with RFID': 'L:wateratm', 'I:Vending machine model': 'L:vending', 'I:Dual-axis solar tracker': 'L:tracker', 'I:Mini lift with floor buttons': 'L:lift', 'I:Robot arm: copy a knob arm (master and slave)': 'L:armcopy', 'I:Robot arm: record and play back moves': 'L:armrecord', 'I:Robot arm: phone control over Bluetooth': 'L:armbt',
      'I:Delivery robot that stops at stations': 'L:delivery', 'I:Conveyor belt with a stepper': 'L:conveyor', 'I:Robot arm: draw a square': 'L:armsquare', 'I:Camera slider with a stepper': 'L:slider', 'I:PID line follower (smooth and fast)': 'L:pidline', 'I:Pen plotter with two steppers': 'L:plotter', 'I:Pick-and-place line: conveyor, sensor and arm': 'L:pickplace', 'I:Sumo robot': 'L:sumo', 'I:Wall-following robot': 'L:wallp', 'I:WiFi robot car with a web joystick' + ESP: 'L:wificar', 'I:Robot soccer player': 'L:soccer', 'I:Gesture-controlled car': 'L:gesturecar', 'I:Weather station that posts to a website' + ESP: 'L:wxcloud', 'I:Bionic hand with flex glove': 'L:bionichand'},
 12: {'I:Self-balancing robot': 'L:balancebot', 'I:Self-stabilising gimbal': 'L:gimbal'}
}

TERMS = [(1, 8, 'Term 1 (April-July)'), (9, 16, 'Term 2 (July-September)'), (17, 24, 'Term 3 (October-December)'), (25, 32, 'Term 4 (January-February)')]
STRAND_WORDS = [('Pattern recognition', r'blink|chaser|melody|birthday|dancing|pattern|loop|dice|music|melody|dance|binary|counter|count|morse|repeat|clap|heart|breathing|fade|rainbow'),
                ('Decomposition', r'system|smart |station|\block|locker|\barm\b|\bcar\b|robot|line|greenhouse|junction|home automation|dashboard|lift|vending|plotter|capstone|irrigation|dustbin'),
                ('Abstraction', r'sensor|meter|thermo|level|alarm|light|temperature|moisture|distance|gas|logger|data|graph|plot|weather|detect|ai|camera')]

def strand(text):
    t = text.lower()
    for name, rx in STRAND_WORDS:
        if re.search(rx, t):
            return name
    return 'Algorithmic thinking'

BOARD_NAME = {'none': 'Battery circuit', 'microbit': 'micro:bit, blocks', 'uno': 'Arduino Uno', 'esp32': 'ESP32', 'pico': 'Pi Pico, MicroPython', 'pi4': 'Raspberry Pi 4, Python'}

def focus(r):
    f, t, b, p = r['family'], r['title'].lower(), r['board'], set(r.get('parts') or [])
    if f == 'unplugged':
        if 'safe' in t: return 'Lab safety'
        if 'input or output' in t: return 'Inputs and outputs'
        if 'story' in t: return 'Robots in daily life'
        return 'Coding without a screen'
    if f == 'challenge': return 'Apply the term\'s skills'
    if f == 'capstone': return 'Design and build'
    if t.startswith('capstone') or f == 'ai-capstone' and not re.search(r'\bai\b|camera|learn', t): return 'Design and build'
    if 'ai' in re.findall(r'[a-z]+', t) or ('camera' in t and 'slider' not in t) or 'machine learning' in t or 'learns' in t: return 'AI and vision'
    if f == 'circuits' or b == 'none':
        for k, v in (('light an led', 'Closed circuits'), ('series', 'Series circuits'), ('parallel', 'Parallel circuits'), ('polarity', 'Polarity'), ('short', 'Safety: short circuits'),
                     ('resistor', 'Resistors'), ('motor', 'Motors'), ('fan', 'Motors'), ('solar', 'Energy'), ('fruit', 'Energy'), ('battery level', 'Energy'), ('conductor', 'Materials'),
                     ('colour', 'Light and colour'), ('doorbell', 'Sound'), ('morse', 'Sound'), ('switch', 'Switches'), ('alarm', 'Switches'), ('quiz', 'Switches'), ('lighthouse', 'Switches'),
                     ('buzzer', 'Sound'), ('knob', 'Variable resistance')):
            if k in t: return v
        return 'Closed circuits'
    if re.search(r'\bpid\b|balanc|gimbal|kinematic|drone', t): return 'Control systems'
    if f == 'machines': return 'Mechanisms'
    if f == 'smart-system' or f == 'india-problems': return 'Smart systems'
    if re.search(r'\b(arm|scara|plotter|conveyor|lift|vending|hexapod|quadruped|slider|crane|barrier|tracker)\b', t): return 'Mechanisms'
    if 'pwm' in t: return 'PWM outputs'
    if f in ('robot-car',) or re.search(r'\b(car|robot|rover)\b', t): return 'Robots and motors'
    if f == 'iot' or 'web' in t or 'phone' in t or 'wifi' in t or 'dashboard' in t or 'esp-now' in t or 'cloud' in t: return 'IoT'
    if 'python' in t or 'csv' in t or 'matplotlib' in t or 'flask' in t or 'gpio' in t or b == 'pi4': return 'Python'
    if re.search(r'\bradio\b', t): return 'Wireless (radio)'
    if 'logger' in t or 'data' in t or 'plot' in t: return 'Data'
    if p & {'rfid', 'keypad'} or 'lock' in t or 'locker' in t: return 'Security systems'
    if p & {'servo', 'motor', 'stepper', 'mg996r'}: return 'Motors and servos'
    if p & {'lcd16', 'oled', 'seg7', 'bar10'}: return 'Displays'
    if p & {'ldr', 'lm35', 'dht11', 'soil', 'pir', 'ir', 'hcsr04', 'mq2', 'pot', 'touch4'}: return 'Sensors'
    return 'Blocks coding' if b == 'microbit' else 'Coding basics'

def resolve(cls, n, code):
    kind, _, rest = code.partition(':')
    row = {'class': cls, 'n': n, 'kind': kind}
    if kind == 'L':
        i = LIVE.get(rest)
        if not i:
            raise SystemExit(f'Class {cls} session {n}: no live lesson {rest}')
        row.update(title=i['title'], board=i['board'], status='live', ref=rest, newparts=[], family='live-' + (i['theme'] or ''), parts=i['parts'])
    elif kind == 'I':
        i = BY_TITLE.get(rest)
        if not i:
            near = [t for t in BY_TITLE if rest.split(':')[0].lower() in t.lower()][:5]
            raise SystemExit(f'Class {cls} session {n}: no idea titled {rest!r}; near: {near}')
        st = 'live' if i['live'] else ('needs-part' if i['newparts'] else 'planned')
        row.update(title=re.sub(r' \((ESP32|BBC micro:bit|Raspberry Pi Pico|Raspberry Pi 4|micro:bit)\)$', '', i['title']), board=i['board'],
                   status=st, ref=i['id'], newparts=i['newparts'], family=i['family'], parts=i['parts'])
    elif kind == 'U':
        row.update(title=rest, board='unplugged', status='activity', ref=None, newparts=[], family='unplugged', parts=[])
    elif kind == 'C':
        row.update(title='Term challenge: ' + rest, board='challenge', status='activity', ref=None, newparts=[], family='challenge', parts=[])
    elif kind == 'P':
        row.update(title=rest, board='capstone', status='activity', ref=None, newparts=[], family='capstone', parts=[])
    else:
        raise SystemExit('bad code ' + code)
    row['strand'] = strand(row['title']) if kind in ('L', 'I', 'U') else ('Decomposition' if kind == 'P' else 'Algorithmic thinking')
    row['focus'] = focus(row)
    row['term'] = next(t for (a, b, t) in TERMS if a <= n <= b)
    return row

def build():
    out = []
    for cls, (theme, tools, items) in CLASSES.items():
        if len(items) != 32:
            raise SystemExit(f'Class {cls} has {len(items)} sessions, not 32')
        for k in (8, 16, 24):
            if not items[k - 1].startswith('C:'):
                raise SystemExit(f'Class {cls} session {k} should be a challenge')
        live_ids = set(LIVE)
        items = [REPL.get(cls, {}).get(c, c) if REPL.get(cls, {}).get(c, '').split(':', 1)[-1] in live_ids else c for c in items]
        rows = [resolve(cls, n + 1, c) for n, c in enumerate(items)]
        out.append({'class': cls, 'theme': theme, 'tools': tools, 'sessions': rows})
    return out

if __name__ == '__main__':
    cur = build()
    json.dump(cur, open(os.path.join(HERE, 'curriculum.json'), 'w'), ensure_ascii=False, indent=1)
    app = {str(c['class']): [{'id': r['ref'] if r['kind'] == 'L' else LIVE_ID.get(r['ref']), 'n': r['n']} for r in c['sessions'] if r['status'] == 'live'] for c in cur}
    js = ('// DUET Robotics & AI curriculum, Class 1-12: for each class, the lessons that are live in the app, with their session\n'
          '// number (1-32). Made by devtools/curriculum/curriculum.py from curriculum.json; do not edit by hand.\n'
          'export const CURRICULUM = ' + json.dumps(app, ensure_ascii=False) + ';\n')
    open(os.path.join(HERE, '..', '..', 'robotics', 'js', 'curriculum.js'), 'w').write(js)
    allrows = [r for c in cur for r in c['sessions']]
    st = collections.Counter(r['status'] for r in allrows)
    proj = [r for r in allrows if r['kind'] in ('L', 'I')]
    print('sessions', len(allrows), dict(st))
    print('project sessions', len(proj), 'distinct projects', len({r['ref'] for r in proj}), 'live lessons used', len({r['ref'] for r in proj if r['status'] == 'live'}))
    for c in cur:
        s = collections.Counter(r['status'] for r in c['sessions'])
        print(c['class'], c['theme'], dict(s))
    used = {r['ref'] for r in proj if r['kind'] == 'L' or r['status'] == 'live'}
    print('live lessons not in any class:', [l for l in LIVE if l not in used])
