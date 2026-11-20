// DUET Robotics Lab 360, batch 31: the app's side of the SIM800L (parts31.js): its live line (looking for the network,
// registered, or browning out on the Arduino's 5V).
import { PARTS31 } from './parts31.js';
export function install31(app) {
  const o = app.partLive.bind(app); app.partLive = (p) => o(p) || (PARTS31[p.type] ? PARTS31[p.type].live(p, app.lab) : '');
}
