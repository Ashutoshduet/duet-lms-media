// Ready-made pieces several stories share: a glass of water, a drinking straw, sunlight caustics, an eye, water
// molecules, the Earth, the Moon and the Sun. Each one is built from geometry (a few hundred triangles) or from the
// repo's own textures, with real-looking materials and no shadow maps.
import { THREE, glassMat, waterMat, canvasTex, causticTex, glowTex, loadTex } from './kit.js';

// ------------------------------------------------------------------ a drinking glass (lathe) with water in it
export function glassOfWater(K, o = {}) {
  const r = o.r ?? 0.036, h = o.h ?? 0.12, wall = 0.0026, base = 0.009, rb = r * 0.86, level = o.level ?? 0.72;
  const g = new THREE.Group();
  // outer and inner skin of the glass, one lathe (outside up, rim, inside down)
  const prof = [[0.0001, 0], [rb, 0], [rb + 0.001, 0.002], [r, h], [r - wall * 0.5, h + 0.0012], [r - wall, h], [rb - wall + 0.0006, base + 0.002], [rb - wall - 0.002, base], [0.0001, base]].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 56), glassMat({ opacity: 0.1, edge: 0.5, side: THREE.DoubleSide })); glass.renderOrder = 6; g.add(glass);
  // the water: a slightly smaller solid with a flat top
  const wy = base + (h - base) * level, wr = (y) => rb - wall + (r - wall - (rb - wall)) * (y / h) - 0.0004;
  const wp = [[0.0001, base + 0.0004], [wr(base) - 0.0008, base + 0.0004], [wr(wy), wy], [0.0001, wy]].map(([x, y]) => new THREE.Vector2(x, y));
  const water = new THREE.Mesh(new THREE.LatheGeometry(wp, 56), waterMat({ opacity: o.opacity ?? 0.3, color: o.color ?? 0x9fd0de })); water.renderOrder = 5; g.add(water);
  // a thin bright line where the water meets the glass (the meniscus catches the light)
  const men = new THREE.Mesh(new THREE.TorusGeometry(wr(wy), 0.0009, 6, 64).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe9f6ff, transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false })); men.position.y = wy; men.renderOrder = 7; g.add(men);
  K.add(g, o.parent);
  return { group: g, glass, water, men, waterY: wy, r, h, rIn: wr(wy) };
}

// ------------------------------------------------------------------ a striped plastic drinking straw
let STRAW = null;
export function straw(K, len = 0.2, r = 0.0034, color = '#d8402f') {
  if (!STRAW) STRAW = canvasTex(64, 256, (x, w, h) => { x.fillStyle = '#f6f3ec'; x.fillRect(0, 0, w, h); x.fillStyle = color; for (let i = -2; i < 10; i++) { x.beginPath(); x.moveTo(0, i * 32); x.lineTo(w, i * 32 + 22); x.lineTo(w, i * 32 + 36); x.lineTo(0, i * 32 + 14); x.fill(); } });
  const t = STRAW.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, len / 0.05);
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.32, metalness: 0, envMapIntensity: 0.8 });
  const geo = new THREE.CylinderGeometry(r, r, len, 20, 24, true); geo.translate(0, len / 2, 0);
  return { geo, mat: m, len, r };
}

// ------------------------------------------------------------------ sunlight caustics on a table (the bright net under a glass)
export function caustics(K, size = 0.16, o = {}) {
  const u = { map: { value: causticTex() }, t: { value: 0 }, amt: { value: o.amount ?? 1 }, tint: { value: new THREE.Color(o.tint ?? 0xfff2cf) } };
  const mat = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float t, amt; uniform vec3 tint; varying vec2 vUv;
      void main(){ vec2 c = vUv - 0.5; float fall = smoothstep(0.5, 0.1, length(c * vec2(1.0, 1.25)));
        float a = texture2D(map, vUv * 1.3 + vec2(t * 0.021, t * 0.013)).r; float b = texture2D(map, vUv * 1.7 - vec2(t * 0.017, -t * 0.024)).r;
        float k = pow(a * b, 0.8) * 2.2 + 0.12 * fall; gl_FragColor = vec4(tint * k * fall * amt, 1.0);
        #include <colorspace_fragment>
      }` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.8).rotateX(-Math.PI / 2), mat); m.renderOrder = 2; K.add(m, o.parent);
  K.tick((T) => { u.t.value = T; });
  return m;
}

// ------------------------------------------------------------------ a drawn eye (where the light ends up)
let EYE = null;
export function eye(K, size = 0.25, parent) {
  if (!EYE) EYE = canvasTex(256, 160, (x, w, h) => {
    x.translate(w / 2, h / 2); x.fillStyle = '#fbf7ef'; x.beginPath(); x.moveTo(-118, 0); x.quadraticCurveTo(0, -92, 118, 0); x.quadraticCurveTo(0, 92, -118, 0); x.fill();
    x.lineWidth = 7; x.strokeStyle = '#2b2620'; x.stroke(); const g = x.createRadialGradient(0, 0, 4, 0, 0, 44); g.addColorStop(0, '#5a3a1e'); g.addColorStop(0.6, '#8a5a2c'); g.addColorStop(1, '#3a2512');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 44, 0, 7); x.fill(); x.fillStyle = '#0d0a08'; x.beginPath(); x.arc(0, 0, 20, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(-12, -14, 9, 0, 7); x.fill();
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: EYE, transparent: true, depthWrite: false, toneMapped: false })); s.scale.set(size, size * 160 / 256, 1); (parent || K.world).add(s); return s;
}

// ------------------------------------------------------------------ water molecules (one oxygen, two hydrogens), as two instanced draws
export function waterMolecules(K, n, place, parent, o = {}) {
  const rO = o.rO ?? 0.06, rH = rO * 0.62, d = rO * 1.05, ang = THREE.MathUtils.degToRad(104.5) / 2;
  const geoO = new THREE.SphereGeometry(rO, 20, 14), geoH = new THREE.SphereGeometry(rH, 14, 10);
  const mO = new THREE.MeshStandardMaterial({ color: 0xe5333a, roughness: 0.35, metalness: 0.05 }), mH = new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.4 });
  const P = new THREE.Vector3(), Qq = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1);
  const hA = new THREE.Vector3(Math.sin(ang) * d, -Math.cos(ang) * d, 0), hB = new THREE.Vector3(-Math.sin(ang) * d, -Math.cos(ang) * d, 0), tmp = new THREE.Vector3();
  const O = K.swarm(n, geoO, mO, (i, T, v, s, q) => { place(i, T, P, Qq); v.copy(P); q.copy(Qq); }, parent, o);
  const H = K.swarm(n * 2, geoH, mH, (j, T, v, s, q) => { const i = j >> 1; place(i, T, P, Qq); v.copy(P).add(tmp.copy(j & 1 ? hA : hB).applyQuaternion(Qq)); }, parent, o);
  // both follow one "amount"
  H.userData.follow = O; K.tick(() => { H.userData.amount = O.userData.amount; });
  return { O, H, rO };
}

// ------------------------------------------------------------------ the Earth: real day map, city lights on the night side, clouds, a thin blue edge
export async function earth(K, r = 1, o = {}) {
  const [day, night, clouds] = await Promise.all([loadTex('../space/tex/earth.jpg'), loadTex('../space/tex/earth_night.jpg'), loadTex('../space/tex/earth_clouds.jpg', false)]);
  const u = { day: { value: day }, night: { value: night }, clouds: { value: clouds }, sunDir: { value: K.sunDir.clone() }, lights: { value: o.lights ?? 1 }, cloudShift: { value: 0 }, mark: { value: new THREE.Vector3(0, 0, 0) }, markOn: { value: 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms: u,
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D day, night, clouds; uniform vec3 sunDir, mark; uniform float lights, cloudShift, markOn; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 n = normalize(vN); float l = dot(n, normalize(sunDir)); float dayK = smoothstep(-0.12, 0.18, l);
        vec3 d = texture2D(day, vUv).rgb; float cl = texture2D(clouds, vUv + vec2(cloudShift, 0.0)).r;
        vec3 lit = mix(d, vec3(1.0), cl * 0.85) * (0.06 + 1.05 * max(l, 0.0));
        vec3 nl = texture2D(night, vUv).rgb * vec3(1.0, 0.82, 0.55) * 1.6 * (1.0 - cl * 0.8) * lights;
        vec3 c = mix(nl + d * 0.012, lit, dayK);
        // the thin edge of air: blue on the day side, a red line at sunrise and sunset
        vec3 v = normalize(cameraPosition - vW); float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        c += rim * mix(vec3(0.02, 0.03, 0.06), vec3(0.25, 0.5, 1.0), dayK) * 0.9 + rim * vec3(1.0, 0.4, 0.15) * (1.0 - abs(dayK * 2.0 - 1.0)) * 0.6;
        // a marked place (India)
        float mk = smoothstep(0.035, 0.025, distance(normalize(vW - (modelMatrix * vec4(0.0,0.0,0.0,1.0)).xyz), mark)); float ring = mk * (1.0 - smoothstep(0.018, 0.012, distance(normalize(vW - (modelMatrix * vec4(0.0,0.0,0.0,1.0)).xyz), mark)));
        c = mix(c, vec3(1.0, 0.75, 0.25), ring * markOn);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 72, 48), mat); K.add(m, o.parent);
  return { mesh: m, u };
}
// the Moon: the real Moon map, lit only by the Sun (sharp edge between day and night)
export async function moon(K, r = 0.27, o = {}) {
  const map = await loadTex('../space/tex/moon.jpg');
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 56, 36), new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0, envMapIntensity: 0 }));
  K.add(m, o.parent); return m;
}
// the Sun far away: a bright disc with a soft glow
export function sunGlow(K, pos, size = 3, parent) {
  const g = new THREE.Group(); g.position.set(...pos);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xfff1d6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); core.scale.setScalar(size);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffb35a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); halo.scale.setScalar(size * 3.2);
  g.add(halo, core); (parent || K.world).add(g); return g;
}
