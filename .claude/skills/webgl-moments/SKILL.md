---
name: webgl-moments
description: 3D and shader "wow" moments for websites — scroll-driven 3D product (Three.js), animated shader gradient backgrounds, model-viewer and Spline embeds — with strict performance budgets and fallbacks. Use when the direction's signature moment is 3D or a living background.
---

# WebGL moments

WebGL makes a site unforgettable or unusable. The difference is the budget and the fallback. One WebGL moment per page, maximum.

## 1. Choose the tool
| Need | Tool | Cost |
|---|---|---|
| Show a real product in 3D, rotate/zoom, AR on phones | `<model-viewer>` | lowest effort, ~250KB lib |
| Designer-made interactive scene | Spline (`@splinetool/runtime`) | heavy runtime; lazy-load only |
| Product that turns / explodes / moves with scroll, custom lighting | Three.js (section 3) | ~150KB + model |
| Living brand-colored background, grain, glow | raw WebGL shader (section 2) | ~3KB, no library |
| Subtle depth only | CSS 3D transforms / tilt | ~0KB |

Pick the cheapest tool that delivers the direction's idea.

## 2. Shader gradient background (no library)
A slowly flowing gradient in brand colors, with film grain. Renders at reduced resolution, pauses offscreen, draws one frame under reduced motion.

```html
<section class="hero" data-hero>
  <canvas class="hero-bg" aria-hidden="true"></canvas>
  …content…
</section>
```
```css
.hero { position: relative; isolation: isolate; }
.hero-bg { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; z-index: -1;
           background: linear-gradient(135deg, var(--color-bg), var(--color-accent)); } /* no-WebGL fallback */
```
```js
// shader-gradient.js
export function shaderGradient(canvas, { colors = ['#0b1020', '#3b2bd6', '#ff7a45'], speed = 0.12, resolution = 0.5 } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return () => {};
  const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fs = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec3 c0,c1,c2;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int k=0;k<5;k++){v+=a*n(p);p*=2.;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r; vec2 q=uv*vec2(r.x/r.y,1.)*1.6;
 float a=fbm(q+vec2(t*.6,t*.3)); float b=fbm(q+a*1.8-vec2(t*.2,-t*.4));
 vec3 col=mix(c0,c1,smoothstep(.2,.8,a)); col=mix(col,c2,smoothstep(.45,.95,b)*.85);
 col+=(h(gl_FragCoord.xy+fract(t))-.5)*.04;
 gl_FragColor=vec4(col,1.);}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return () => {};
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (name) => gl.getUniformLocation(prog, name);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  colors.forEach((c, i) => gl.uniform3fv(u(`c${i}`), rgb(c)));

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * resolution;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u('r'), canvas.width, canvas.height);
  };
  const draw = (ms) => { gl.uniform1f(u('t'), (ms / 1000) * speed); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, visible = true;
  const loop = (ms) => { draw(ms); raf = requestAnimationFrame(loop); };
  const start = () => { if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  const ro = new ResizeObserver(() => { resize(); draw(performance.now()); });
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); });
  io.observe(canvas);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  resize();
  draw(performance.now());
  start();
  return () => { stop(); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
}
```
Colors come from the direction tokens (read them with `getComputedStyle(document.documentElement).getPropertyValue('--color-…')`). Keep text on top readable: check contrast against the darkest and lightest point of the gradient, or add a subtle scrim.

## 3. Scroll-driven 3D product (Three.js + GSAP ScrollTrigger)
```bash
npm i three gsap
```
```js
// product-3d.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export async function product3D({ canvas, section, url, object, keyframes }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  let model = object;
  if (!model) {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(draco);
    model = (await loader.loadAsync(url)).scene;
  }
  // Center and normalize size
  const box = new THREE.Box3().setFromObject(model);
  model.position.sub(box.getCenter(new THREE.Vector3()));
  const pivot = new THREE.Group();
  pivot.add(model);
  pivot.scale.setScalar(2.2 / box.getSize(new THREE.Vector3()).length());
  scene.add(pivot);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let needsRender = true;
  const render = () => { if (needsRender) { renderer.render(scene, camera); needsRender = false; } };
  gsap.ticker.add(render);                   // one ticker with GSAP/Lenis; renders only on change

  // keyframes: [{ rotY, rotX, x, y, scale }, ...] spread across the section's scroll
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 1 },
    onUpdate: () => { needsRender = true; },
  });
  keyframes.forEach((k) => {
    tl.to(pivot.rotation, { y: k.rotY ?? pivot.rotation.y, x: k.rotX ?? pivot.rotation.x }, '>')
      .to(pivot.position, { x: k.x ?? 0, y: k.y ?? 0 }, '<')
      .to(pivot.scale, { x: k.scale ?? pivot.scale.x, y: k.scale ?? pivot.scale.y, z: k.scale ?? pivot.scale.z }, '<');
  });
  needsRender = true;
  return () => { gsap.ticker.remove(render); tl.scrollTrigger?.kill(); tl.kill(); renderer.dispose(); };
}
```
Usage: a tall section (`block-size: 300vh`) with a sticky full-viewport canvas, text steps scrolling past it. Keyframes map to the steps: e.g. `[{ rotY: Math.PI / 2 }, { rotY: Math.PI, rotX: 0.4, scale: 1.3 }, { rotY: Math.PI * 2, x: -1 }]` (in RTL use `x: 1` so the product moves toward the text).

**Loading**: import this module only when the section is near the viewport (`IntersectionObserver` with `rootMargin: '200px'` → `import('./product-3d.js')`). Show a poster image in the same spot until the first render, then cross-fade.

## 4. model-viewer (fastest real 3D)
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4/dist/model-viewer.min.js"></script>
<model-viewer src="/models/insole.glb" poster="/models/insole-poster.webp" alt="מדרס בתלת-ממד"
  camera-controls auto-rotate auto-rotate-delay="0" rotation-per-second="20deg"
  shadow-intensity="0.8" exposure="1.1" ar ar-modes="webxr scene-viewer quick-look"
  loading="lazy" reveal="auto" style="inline-size:100%;block-size:480px;--poster-color:transparent"></model-viewer>
```

## 5. Spline
Only when a designer built the scene. Lazy-load the runtime on approach, always show the exported poster first, and keep the scene under ~1.5MB. Remove the Spline logo only if the plan allows it.

## 6. Budget and fallbacks (non-negotiable)
- **Model**: ≤ 2MB GLB. Optimize: `npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp --texture-size 1024`.
- **Pixel ratio** ≤ 1.75 (1.5 for shaders); render at 0.5 resolution for soft backgrounds.
- **Render on demand**: only while visible, tab visible, and something changed.
- **Lazy**: WebGL code and models load after the hero's LCP, never block it.
- **Fallbacks**: no WebGL → poster/CSS gradient; reduced motion → single static frame; low-end mobile (`navigator.hardwareConcurrency <= 4` or `deviceMemory <= 4`) → poster + light CSS motion.
- **Accessibility**: canvases are `aria-hidden`; any information shown in 3D also exists as text.
- **Measure**: `node scripts/record-motion.mjs` must show ≥ 55fps desktop / ≥ 45fps mobile and no long tasks > 100ms during scroll.

## 7. Product photography for 3D
If the client has no 3D model: photogrammetry from a phone scan (Polycam, Luma), or a simple model built in Blender from dimensions. Otherwise choose the shader or CSS path; a bad model is worse than none.
