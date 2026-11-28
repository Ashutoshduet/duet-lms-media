#!/usr/bin/env python3
"""Render curriculum.json as Markdown tables (for the curriculum doc and the pen-drive pack)."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
cur = json.load(open(os.path.join(HERE, 'curriculum.json')))
BOARD = {'none': 'Battery circuit', 'microbit': 'micro:bit (blocks)', 'uno': 'Arduino Uno', 'esp32': 'ESP32', 'pico': 'Pi Pico (MicroPython)',
         'pi4': 'Raspberry Pi 4 (Python)', 'unplugged': 'Unplugged', 'challenge': 'Kit + 3D', 'capstone': 'Kit + 3D', 'mega': 'Arduino Mega', 'nano': 'Arduino Nano'}
NP = {'rtc': 'clock module', 'sound': 'sound sensor', 'flame': 'flame sensor', 'rain': 'rain sensor', 'mpu6050': 'motion sensor', 'gps': 'GPS', 'gsm': 'GSM',
      'solar': 'solar cell', 'lemon': 'lemon cells', 'flex': 'flex sensor', 'mecanum': 'mecanum wheels', 'esp32cam': 'ESP32-CAM', 'pulse': 'pulse sensor',
      'hx711': 'load cell', 'acs712': 'current sensor', 'anemometer': 'anemometer', 'tcs3200': 'colour sensor', 'bmp180': 'pressure sensor', 'nrf24': 'nRF24'}
def status(r):
    if r['status'] == 'live': return 'Live'
    if r['status'] == 'planned': return 'Planned'
    if r['status'] == 'needs-part': return 'Planned (new part: ' + ', '.join(NP.get(p, p) for p in r['newparts']) + ')'
    return '-'
def table(c):
    ct = 3 <= c['class'] <= 8
    out = ['| # | Project or activity | Board / mode | ' + ('CBSE CT strand' if ct else 'Focus') + ' | In the app |', '| --- | --- | --- | --- | --- |']
    for r in c['sessions']:
        t = r['title'].replace('|', '/')
        if r['kind'] in ('C', 'P'): t = '**' + t + '**'
        out.append(f"| {r['n']} | {t} | {BOARD.get(r['board'], r['board'])} | {r['strand'] if ct else r['focus']} | {status(r)} |")
    return '\n'.join(out)
def section(heading, classes, lead):
    parts = [f'## {heading}', '', lead, '']
    for c in cur:
        if c['class'] in classes:
            live = sum(1 for r in c['sessions'] if r['status'] == 'live'); proj = sum(1 for r in c['sessions'] if r['kind'] in ('L', 'I'))
            parts += [f"### Class {c['class']}: {c['theme']}", '', f"{c["tools"]}. Live in the app today: {live} of its {proj} project sessions.", '', table(c), '']
    return '\n'.join(parts).strip()
if __name__ == '__main__':
    which = sys.argv[1]
    LEAD = 'Sessions 1-8 are Term 1 (April-July), 9-16 Term 2 (July-September), 17-24 Term 3 (October-December) and 25-32 Term 4 (January-February). Bold rows are the term challenges and the capstone.'
    if which == 's4': print(section('Classes 1-2 session plans', (1, 2), 'Classes 1 and 2 learn electricity with safe battery circuits, built in 3D first, plus unplugged coding games. ' + LEAD))
    if which == 's5': print(section('Classes 3-5 session plans', (3, 4, 5), 'Classes 3 to 5 code the BBC micro:bit and then the Arduino with blocks; every project session also counts toward CBSE\'s CT hours. ' + LEAD))
    if which == 's6': print(section('Classes 6-8 session plans', (6, 7, 8), 'Classes 6 to 8 move to Arduino C++ and the ESP32, with the robot car in Class 7 and IoT in Class 8. ' + LEAD))
    if which == 's7': print(section('Classes 9-10 session plans', (9, 10), 'Classes 9 and 10 learn MicroPython and Python, the robot arm, and systems that log and share data. ' + LEAD))
    if which == 's8': print(section('Classes 11-12 session plans', (11, 12), 'Classes 11 and 12 work like engineers: control, wireless robots, cameras and AI, ending in competition-ready capstones. ' + LEAD))
