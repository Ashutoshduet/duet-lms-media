// Red-cyan 3D glasses (anaglyph). Each eye's picture is drawn into its own buffer, then one pass mixes them with the
// least-squares colour matrices of E. Dubois ("A projection method to generate anaglyph stereo images", ICASSP 2001):
// far less ghosting and better colour than just taking red from one eye and green+blue from the other.
//
//   const ana = new Anaglyph(renderer);  ana.setSize(w, h);
//   every frame: ana.render(scene, camera)     (camera.focus = distance that should look level with the screen)
//
// Our own code (three.js r170 API). Works with any scene, including the camera video as scene.background (pad AR).
import * as THREE from 'three';

// rows = output red, green, blue; columns = the left / right eye's red, green, blue (linear light)
export const DUBOIS_RED_CYAN = {
  left: [0.4561, 0.500484, 0.176381, -0.0400822, -0.0378246, -0.0157589, -0.0152161, -0.0205971, -0.00546856],
  right: [-0.0434706, -0.0879388, -0.00155529, 0.378476, 0.73364, -0.0184503, -0.0721527, -0.112961, 1.2264],
};
// the simple split, for comparison and for very cheap glasses whose filters are far from the usual ones
export const SIMPLE_RED_CYAN = { left: [1, 0, 0, 0, 0, 0, 0, 0, 0], right: [0, 0, 0, 0, 1, 0, 0, 0, 1] };

export class Anaglyph {
  constructor(renderer, o = {}) {
    this.renderer = renderer;
    this.stereo = new THREE.StereoCamera();
    this.eyeSep = o.eyeSep || null;          // scene units; null: focus / 30 (gentle depth, easy on children's eyes)
    const opt = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, samples: o.samples ?? 0 };
    this.rtL = new THREE.WebGLRenderTarget(2, 2, opt);
    this.rtR = new THREE.WebGLRenderTarget(2, 2, opt);
    const m = o.matrices || DUBOIS_RED_CYAN;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { mapLeft: { value: this.rtL.texture }, mapRight: { value: this.rtR.texture }, mL: { value: new THREE.Matrix3().set(...m.left) }, mR: { value: new THREE.Matrix3().set(...m.right) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform sampler2D mapLeft; uniform sampler2D mapRight; uniform mat3 mL; uniform mat3 mR; varying vec2 vUv;
        vec3 tm(vec3 c){
        #ifdef TONE_MAPPING
          return toneMapping(c);
        #else
          return c;
        #endif
        }
        void main(){
          vec3 a = clamp(tm(texture2D(mapLeft, vUv).rgb), 0.0, 1.0), b = clamp(tm(texture2D(mapRight, vUv).rgb), 0.0, 1.0);
          gl_FragColor = linearToOutputTexel(vec4(clamp(mL * a + mR * b, 0.0, 1.0), 1.0));
        }`,
      depthTest: false, depthWrite: false, toneMapped: true,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat); this.quad.frustumCulled = false;
    this.qscene = new THREE.Scene(); this.qscene.add(this.quad);
    this.qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  setMatrices(m) { this.mat.uniforms.mL.value.set(...m.left); this.mat.uniforms.mR.value.set(...m.right); }
  setSize(w, h) {
    const pr = this.renderer.getPixelRatio();
    this.rtL.setSize(Math.round(w * pr), Math.round(h * pr)); this.rtR.setSize(Math.round(w * pr), Math.round(h * pr));
  }
  render(scene, camera) {
    const r = this.renderer, old = r.getRenderTarget();
    scene.updateMatrixWorld(); if (camera.parent === null) camera.updateMatrixWorld();
    this.stereo.eyeSep = this.eyeSep || (camera.focus || 1) / 30;
    this.stereo.update(camera);
    r.setRenderTarget(this.rtL); r.clear(); r.render(scene, this.stereo.cameraL);
    r.setRenderTarget(this.rtR); r.clear(); r.render(scene, this.stereo.cameraR);
    r.setRenderTarget(old); r.render(this.qscene, this.qcam);
  }
  dispose() { this.rtL.dispose(); this.rtR.dispose(); this.mat.dispose(); this.quad.geometry.dispose(); }
}
