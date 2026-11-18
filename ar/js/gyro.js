// Look around by moving the phone (gyro 360). The phone's orientation sensor turns the 3D camera, as if the screen
// were a window into the scene. Without a sensor (a laptop, a phone that has none) you drag to look around instead.
// iPhone/iPad need a tap before the sensor can be read: needsPermission() → show a button that calls permit().
// On Android (and in the DUET app) there is nothing to ask, so permit() just returns true.
//
//   const look = new GyroLook(camera, canvas);  await look.permit();  look.start();
//   every frame: look.update();     look.recenter()  (what you face now becomes "straight ahead")
import * as THREE from 'three';

const ZEE = new THREE.Vector3(0, 0, 1), Q_BACK = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2); // camera looks out of the back
const euler = new THREE.Euler(), q0 = new THREE.Quaternion(), qYaw = new THREE.Quaternion(), qt = new THREE.Quaternion();

export function needsPermission() {
  return typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
}

export class GyroLook {
  constructor(camera, dom, o = {}) {
    this.camera = camera; this.dom = dom; this.o = o;
    this.ori = null; this.yaw0 = 0; this.on = false; this.sensor = false; this.smooth = o.smooth ?? 0.35;
    this.drag = { yaw: 0, pitch: 0, x: 0, y: 0, down: false };
    this._ori = (e) => { if (e.alpha == null && e.beta == null && e.gamma == null) return; this.ori = e; if (!this.sensor) { this.sensor = true; this.recenter(); } };
    this._down = (e) => { if (e.pointerType === 'touch' && e.isPrimary === false) return; this.drag.down = true; this.drag.x = e.clientX; this.drag.y = e.clientY; };
    this._move = (e) => {
      if (!this.drag.down || this.sensor || (this.o.allowDrag && !this.o.allowDrag())) return;
      const k = (this.camera.fov * Math.PI / 180) / (this.dom.clientHeight || 600);
      this.drag.yaw += (e.clientX - this.drag.x) * k; this.drag.pitch = Math.max(-1.4, Math.min(1.4, this.drag.pitch + (e.clientY - this.drag.y) * k));
      this.drag.x = e.clientX; this.drag.y = e.clientY;
    };
    this._up = () => { this.drag.down = false; };
  }
  /** iOS: ask for the sensor (must be called from a tap). Elsewhere: true at once. */
  async permit() {
    if (!needsPermission()) return true;
    try { return (await DeviceOrientationEvent.requestPermission()) === 'granted'; } catch (e) { return false; }
  }
  start() {
    if (this.on) return; this.on = true;
    addEventListener('deviceorientation', this._ori, true);
    this.dom.addEventListener('pointerdown', this._down); addEventListener('pointermove', this._move); addEventListener('pointerup', this._up); addEventListener('pointercancel', this._up);
  }
  stop() {
    this.on = false;
    removeEventListener('deviceorientation', this._ori, true);
    this.dom.removeEventListener('pointerdown', this._down); removeEventListener('pointermove', this._move); removeEventListener('pointerup', this._up); removeEventListener('pointercancel', this._up);
  }
  screenAngle() { const a = (screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0; return THREE.MathUtils.degToRad(+a || 0); }
  /** the sensor's orientation as a quaternion (W3C device-orientation maths), without the recentring */
  sensorQuat(out) {
    const e = this.ori, d = THREE.MathUtils.degToRad;
    euler.set(d(e.beta || 0), d(e.alpha || 0), -d(e.gamma || 0), 'YXZ');
    out.setFromEuler(euler); out.multiply(Q_BACK); out.multiply(q0.setFromAxisAngle(ZEE, -this.screenAngle()));
    return out;
  }
  recenter() {
    if (this.sensor && this.ori) {
      const v = new THREE.Vector3(0, 0, -1).applyQuaternion(this.sensorQuat(qt));
      this.yaw0 = Math.atan2(-v.x, -v.z);
    }
    this.drag.yaw = 0; this.drag.pitch = 0;
  }
  update() {
    const cam = this.camera;
    if (this.sensor && this.ori) {
      this.sensorQuat(qt); qYaw.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, -this.yaw0); qt.premultiply(qYaw);
      cam.quaternion.slerp(qt, this.smooth >= 1 ? 1 : 1 - this.smooth);
    } else {
      euler.set(this.drag.pitch, this.drag.yaw, 0, 'YXZ'); qt.setFromEuler(euler); cam.quaternion.slerp(qt, 0.5);
    }
  }
}
