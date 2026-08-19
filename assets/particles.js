// Antigravity Interactive WebGL Particle Simulation Engine
// Adapted for The Agentic Service Designer Hero area

// 1D Linear/Hermite Noise Generator
class Noise1D {
  constructor() {
    this.MAX_VERTICES = 256;
    this.MAX_VERTICES_MASK = this.MAX_VERTICES - 1;
    this.amplitude = 1;
    this.scale = 1;
    this.r = [];
    for (let e = 0; e < this.MAX_VERTICES; ++e) {
      this.r.push(Math.random());
    }
  }
  getVal(e) {
    let t = e * this.scale;
    let i = Math.floor(t);
    let r = t - i;
    let o = r * r * (3 - 2 * r);
    let s = i % this.MAX_VERTICES_MASK;
    let a = (s + 1) % this.MAX_VERTICES_MASK;
    let l = this.lerp(this.r[s], this.r[a], o);
    return l * this.amplitude;
  }
  lerp(e, t, i) {
    return e * (1 - i) + t * i;
  }
}

// Bridson's Poisson Disk Sampling in 2D to distribute initial particles
function poissonDiskSampling(width, height, rMin, rMax, maxTries = 30) {
  const activeList = [];
  const points = [];
  const cellSize = rMin / Math.SQRT2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid = new Array(gridWidth * gridHeight).fill(-1);

  function isValid(p, r) {
    const cellX = Math.floor(p.x / cellSize);
    const cellY = Math.floor(p.y / cellSize);
    if (cellX < 0 || cellX >= gridWidth || cellY < 0 || cellY >= gridHeight) return false;

    const startX = Math.max(0, cellX - 2);
    const endX = Math.min(gridWidth - 1, cellX + 2);
    const startY = Math.max(0, cellY - 2);
    const endY = Math.min(gridHeight - 1, cellY + 2);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const idx = grid[x + y * gridWidth];
        if (idx !== -1) {
          const other = points[idx];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < r * r) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function insertPoint(p) {
    points.push(p);
    const cellX = Math.floor(p.x / cellSize);
    const cellY = Math.floor(p.y / cellSize);
    grid[cellX + cellY * gridWidth] = points.length - 1;
    activeList.push(p);
  }

  // Start at grid center
  insertPoint({ x: width / 2, y: height / 2 });

  while (activeList.length > 0) {
    const idx = Math.floor(Math.random() * activeList.length);
    const p = activeList[idx];
    let found = false;

    for (let i = 0; i < maxTries; i++) {
      const r = rMin + Math.random() * (rMax - rMin);
      const angle = Math.random() * Math.PI * 2;
      const newP = {
        x: p.x + Math.cos(angle) * r,
        y: p.y + Math.sin(angle) * r
      };

      if (newP.x >= 0 && newP.x < width && newP.y >= 0 && newP.y < height && isValid(newP, rMin)) {
        insertPoint(newP);
        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(idx, 1);
    }
  }

  return points;
}

// Shared Simplex 3D Noise GLSL Implementation
const simplexNoiseGLSL = `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 =   v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.y;
  vec4 y = y_ *ns.x + ns.y;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix contributions from the four corners
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`;

// Background Shaders
const bgVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const bgFragmentShader = `
precision highp float;
varying vec2 vUv;

uniform vec3 uBgColor1;
uniform vec3 uBgColor2;
uniform vec3 uBgColor3;
uniform vec3 uBgColor4;
uniform float uTime;
uniform float uBgSpeed;
uniform float uBgRibbon;

${simplexNoiseGLSL}

void main() {
  float t = uTime * uBgSpeed * 0.12;
  
  // Distort UV coordinates using low-frequency Simplex noise
  vec2 noiseCoord = vUv * 1.2;
  float nx = snoise(vec3(noiseCoord + vec2(15.42, 38.19), t));
  float ny = snoise(vec3(noiseCoord + vec2(52.81, 71.49), t));
  vec2 distortedUv = vUv + vec2(nx, ny) * 0.22;
  
  // Define 4 animated floating color centers
  vec2 p1 = vec2(0.2, 0.25) + vec2(snoise(vec3(t, 2.5, 1.1)), snoise(vec3(1.1, t, 2.5))) * 0.15;
  vec2 p2 = vec2(0.8, 0.20) + vec2(snoise(vec3(t + 12.0, 3.4, 0.5)), snoise(vec3(0.5, t + 12.0, 3.4))) * 0.15;
  vec2 p3 = vec2(0.25, 0.75) + vec2(snoise(vec3(t + 24.0, 1.8, 4.3)), snoise(vec3(4.3, t + 24.0, 1.8))) * 0.15;
  vec2 p4 = vec2(0.75, 0.80) + vec2(snoise(vec3(t + 36.0, 5.2, 2.9)), snoise(vec3(2.9, t + 36.0, 5.2))) * 0.15;
  
  // Distance-based weights with smooth attenuation
  float d1 = 1.0 / (0.12 + distance(distortedUv, p1));
  float d2 = 1.0 / (0.12 + distance(distortedUv, p2));
  float d3 = 1.0 / (0.12 + distance(distortedUv, p3));
  float d4 = 1.0 / (0.12 + distance(distortedUv, p4));
  
  // Normalize and blend the base 4 colors
  float sum = d1 + d2 + d3 + d4;
  vec3 baseColor = (uBgColor1 * d1 + uBgColor2 * d2 + uBgColor3 * d3 + uBgColor4 * d4) / sum;
  
  // Overlay moving diagonal ribbons (light streaks)
  vec2 diag = normalize(vec2(1.0, 0.75));
  float proj = dot(vUv, diag);
  
  float ribbon1 = sin(proj * 16.0 - uTime * uBgSpeed * 0.7) * 0.5 + 0.5;
  float ribbon2 = sin(proj * 32.0 + uTime * uBgSpeed * 0.3) * 0.5 + 0.5;
  
  // Add noise modulation to make streaks look organic/wispy
  float rNoise = snoise(vec3(vUv * 2.8, uTime * uBgSpeed * 0.15)) * 0.5 + 0.5;
  float ribbonStreak = (ribbon1 * 0.65 + ribbon2 * 0.35) * rNoise;
  
  // Mix streak highlight color with the base
  vec3 ribbonColor = mix(uBgColor3, vec3(1.0), 0.4);
  vec3 finalColor = mix(baseColor, ribbonColor, ribbonStreak * uBgRibbon * 0.40);
  
  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`;

// GPGPU Simulation Shaders
const simVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const simFragmentShader = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uPosition;
uniform sampler2D uPosRefs;
uniform vec2 uRingPos;
uniform float uTime;
uniform float uDeltaTime;
uniform float uRingRadius;
uniform float uRingWidth;
uniform float uRingWidth2;
uniform float uRingDisplacement;
uniform float uNoiseSpeed;
uniform float uNoiseDispersion;

${simplexNoiseGLSL}

void main() {
  vec2 simTexCoords = vUv;
  vec4 pFrame = texture2D(uPosition, simTexCoords);

  float scale = pFrame.z;
  float velocity = pFrame.w;
  vec2 refPos = texture2D(uPosRefs, simTexCoords).xy;

  float time = uTime * uNoiseSpeed;
  vec2 curentPos = refPos;

  vec2 pos = pFrame.xy;
  pos *= .8;

  float dist = distance(curentPos.xy, uRingPos);
  float noise0 = snoise(vec3(curentPos.xy * .2 + vec2(18.4924, 72.9744), time * 1.0));
  float dist1 = distance(curentPos.xy + (noise0 * .005), uRingPos);

  float t = smoothstep(uRingRadius - (uRingWidth * 2.), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth, dist1);
  float t2 = smoothstep(uRingRadius - (uRingWidth2 * 2.), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth2, dist1);
  float t3 = 1.0 - smoothstep(uRingRadius, uRingRadius + uRingWidth2, dist);

  t = pow(max(0.0, t), 2.);
  t2 = pow(max(0.0, t2), 3.);

  t += t2 * 3.;
  t += t3 * .4;
  t += snoise(vec3(curentPos.xy * 30. + vec2(11.4924, 12.9744), time * 1.0)) * t3 * .5;

  float nS = snoise(vec3(curentPos.xy * 2. + vec2(18.4924, 72.9744), time * 1.0));
  t += pow(max(0.0, (nS + 1.5) * .5), 2.) * .6;

  // Mid scale noise
  float noise1 = snoise(vec3(curentPos.xy * 4. + vec2(88.494, 32.4397), time * 0.7));
  float noise2 = snoise(vec3(curentPos.xy * 4. + vec2(50.904, 120.947), time * 0.7));

  // Close scale noise
  float noise3 = snoise(vec3(curentPos.xy * 20. + vec2(18.4924, 72.9744), time * 1.0));
  float noise4 = snoise(vec3(curentPos.xy * 20. + vec2(50.904, 120.947), time * 1.0));

  vec2 disp = vec2(noise1, noise2) * uNoiseDispersion;
  disp += vec2(noise3, noise4) * (uNoiseDispersion * 0.166);

  // Sin wave
  disp.x += sin((refPos.x * 20.) + (time * 8.0)) * (uNoiseDispersion * 0.667) * clamp(dist, 0., 1.);
  disp.y += cos((refPos.y * 20.) + (time * 6.0)) * (uNoiseDispersion * 0.667) * clamp(dist, 0., 1.);

  pos -= (uRingPos - (curentPos + disp)) * pow(max(0.0, t2), .75) * uRingDisplacement;

  // Add scale
  float scaleDiff = t - scale;
  scaleDiff *= .2;
  scale += scaleDiff;

  // Final position
  vec2 finalPos = curentPos + disp + (pos * .25);

  velocity *= .5;
  velocity += scale * .25;

  gl_FragColor = vec4(finalPos, scale, velocity);
}
`;

// Visual Rendering Shaders
const renderVertexShader = `
uniform sampler2D uPosition;
uniform float uPixelRatio;
uniform float uParticleScale;

attribute float charIndex;

varying float vVelocity;
varying float vScale;
varying vec2 vLocalPos;
varying vec2 vScreenPos;
varying float vCharIndex;

void main() {
  vec4 pos = texture2D(uPosition, uv);

  vVelocity = pos.w;
  vScale = pos.z;
  vLocalPos = pos.xy;
  vCharIndex = charIndex;

  vec4 viewSpace = modelViewMatrix * vec4(vec3(pos.xy, 0.0), 1.0);
  gl_Position = projectionMatrix * viewSpace;
  vScreenPos = gl_Position.xy / gl_Position.w;

  gl_PointSize = ((vScale * 7.0) * (uPixelRatio * 0.5) * uParticleScale);
}
`;

const renderFragmentShader = `
precision highp float;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

uniform vec2 uRingPos;
uniform float uTime;
uniform float uAlpha;
uniform int uColorScheme;
uniform vec2 uRez;

uniform sampler2D uCharAtlas;
uniform int uShapeType; // 0 = Capsule, 1 = Character/Text, 2 = Single shape
uniform int uNumChars;
uniform int uRotateParticles; // 0 = Upright, 1 = Rotate radially

varying float vVelocity;
varying float vScale;
varying vec2 vLocalPos;
varying vec2 vScreenPos;
varying float vCharIndex;

${simplexNoiseGLSL}

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

float sdRoundBox(vec2 p, vec2 b, vec4 r) {
  r.xy = (p.x > 0.0) ? r.xy : r.zw;
  r.x  = (p.y > 0.0) ? r.x  : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

void main() {
  float ratio = uRez.x / uRez.y;

  // Noise
  float noiseAngle = snoise(vec3(vLocalPos * 10.0 + vec2(18.4924, 72.9744), uTime * 0.85));
  float noiseColor = snoise(vec3(vLocalPos * 2.0 + vec2(74.664, 91.556), uTime * 0.5));
  noiseColor = (noiseColor + 1.0) * 0.5;

  float angle = atan(vLocalPos.y - uRingPos.y, vLocalPos.x - uRingPos.x);

  vec2 uv = gl_PointCoord.xy;
  uv -= vec2(0.5);
  uv.y *= -1.0;
  uv = rotate(uv, -angle + (noiseAngle * 0.5));

  float rounded = 0.0;
  if (uShapeType == 0) {
    float roundedBox = sdRoundBox(uv, vec2(0.5, 0.2), vec4(0.25));
    rounded = 1.0 - smoothstep(0.0, 0.1, roundedBox);
  } else if (uShapeType == 2) {
    // Single shape texture mapping
    vec2 rotUv = gl_PointCoord.xy - vec2(0.5);
    rotUv.y *= -1.0;
    
    float rotAngle = 0.0;
    if (uRotateParticles == 1) {
      rotAngle = -angle + (noiseAngle * 0.5);
    } else {
      rotAngle = noiseAngle * 0.1;
    }
    rotUv = rotate(rotUv, rotAngle);
    
    vec2 textUv = rotUv;
    textUv.y *= -1.0;
    textUv += vec2(0.5);
    
    if (textUv.x < 0.0 || textUv.x > 1.0 || textUv.y < 0.0 || textUv.y > 1.0) {
      discard;
    } else {
      rounded = texture2D(uCharAtlas, textUv).a;
    }
  } else {
    // Character glyph mapping
    vec2 rotUv = gl_PointCoord.xy - vec2(0.5);
    rotUv.y *= -1.0;
    
    float rotAngle = 0.0;
    if (uRotateParticles == 1) {
      rotAngle = -angle + (noiseAngle * 0.5);
    } else {
      rotAngle = noiseAngle * 0.1;
    }
    rotUv = rotate(rotUv, rotAngle);
    
    vec2 textUv = rotUv;
    textUv.y *= -1.0;
    textUv += vec2(0.5);
    
    if (textUv.x < 0.0 || textUv.x > 1.0 || textUv.y < 0.0 || textUv.y > 1.0) {
      discard;
    } else {
      float numChars = float(uNumChars);
      if (numChars < 1.0) numChars = 1.0;
      float idx = floor(vCharIndex * numChars);
      float col = mod(idx, 8.0);
      float row = floor(idx / 8.0);
      
      vec2 spriteUv = vec2((textUv.x + col) / 8.0, 1.0 - (textUv.y + row) / 8.0);
      rounded = texture2D(uCharAtlas, spriteUv).a;
    }
  }

  float h = 0.8;
  float progress = smoothstep(0.0, 0.75, pow(max(0.0, noiseColor), 2.0));
  
  vec3 col = mix(
    mix(uColor1, uColor2, progress / h),
    mix(uColor2, uColor3, (progress - h) / (1.0 - h)),
    step(h, progress)
  );
  vec3 color = col;

  float a = uAlpha * rounded * smoothstep(0.1, 0.2, vScale);

  if (a < 0.01) {
    discard;
  }

  color = clamp(color, 0.0, 1.0);
  color = mix(color, color * clamp(vVelocity, 0.0, 1.0), float(uColorScheme));

  gl_FragColor = vec4(color, clamp(a, 0.0, 1.0));
}
`;

// Copy Shader Material to populate initial position coordinates
const copyVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const copyFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
void main() {
  gl_FragColor = texture2D(uTexture, vUv);
}
`;

// Application Orchestrator Class
class AntigravityParticles {
  constructor(container, options = {}) {
    this.container = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.container) return;

    this.size = 256;
    this.length = this.size * this.size;
    this.time = 0;
    this.lastTime = 0;

    this.mouse = new THREE.Vector2(-999, -999);
    this.mouseIsOver = false;
    this.isIntersecting = false;
    this.intersectionPoint = new THREE.Vector3(0, 0, 0);

    this.cursorPos = new THREE.Vector2(0, 0);
    this.ringPos = new THREE.Vector2(0, 0);

    this.noise = new Noise1D();

    // Physics parameters
    this.ringRadius = options.ringRadius !== undefined ? options.ringRadius : 0.175;
    this.ringWidth = options.ringWidth !== undefined ? options.ringWidth : 0.011;
    this.ringWidth2 = options.ringWidth2 !== undefined ? options.ringWidth2 : 0.107;
    this.ringDisplacement = options.ringDisplacement !== undefined ? options.ringDisplacement : 0.53;

    // Palette: Google Classic colors by default
    this.color1 = new THREE.Color(options.color1 || "#2c64ed");
    this.color2 = new THREE.Color(options.color2 || "#f84242");
    this.color3 = new THREE.Color(options.color3 || "#ffcf03");
    this.colorScheme = options.colorScheme !== undefined ? options.colorScheme : 1;

    // Custom adjustable settings parameters
    this.mouseSpeedActive = options.mouseSpeedActive !== undefined ? options.mouseSpeedActive : 8.0;
    this.mouseSpeedIdle = options.mouseSpeedIdle !== undefined ? options.mouseSpeedIdle : 4.0;
    this.noiseSpeed = options.noiseSpeed !== undefined ? options.noiseSpeed : 0.50;
    this.noiseDispersion = options.noiseDispersion !== undefined ? options.noiseDispersion : 0.030;
    this.density = options.density !== undefined ? options.density : 230;
    this.uAlpha = options.uAlpha !== undefined ? options.uAlpha : 1.0;
    this.particleScale = options.particleScale !== undefined ? options.particleScale : 0.59;

    this.shapeType = options.shapeType !== undefined ? options.shapeType : 0; // 0 = Capsule (SDF)
    this.shapeName = options.shapeName || "capsule";
    this.rotateParticles = options.rotateParticles !== undefined ? options.rotateParticles : 1;
    this.customText = options.customText || "ANTIGRAVITY";
    this.charAtlasTexture = null;

    // Background gradient configuration (disabled by default for transparent hero background)
    this.showBg = options.showBg !== undefined ? options.showBg : false;
    this.bgSpeed = options.bgSpeed !== undefined ? options.bgSpeed : 0.50;
    this.bgRibbon = options.bgRibbon !== undefined ? options.bgRibbon : 0.40;
    this.bgColor1 = new THREE.Color(options.bgColor1 || "#f472b6");
    this.bgColor2 = new THREE.Color(options.bgColor2 || "#ec4899");
    this.bgColor3 = new THREE.Color(options.bgColor3 || "#38bdf8");
    this.bgColor4 = new THREE.Color(options.bgColor4 || "#818cf8");

    this.init();
  }

  init() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || 400;

    // Main 3D Scene
    this.scene = new THREE.Scene();

    // Perspective Camera
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
    this.camera.position.z = 3.1;

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);

    // Background Quad Scene
    this.bgScene = new THREE.Scene();
    this.bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.bgMaterial = new THREE.ShaderMaterial({
      vertexShader: bgVertexShader,
      fragmentShader: bgFragmentShader,
      uniforms: {
        uBgColor1: { value: new THREE.Color().copy(this.bgColor1) },
        uBgColor2: { value: new THREE.Color().copy(this.bgColor2) },
        uBgColor3: { value: new THREE.Color().copy(this.bgColor3) },
        uBgColor4: { value: new THREE.Color().copy(this.bgColor4) },
        uTime: { value: 0 },
        uBgSpeed: { value: this.bgSpeed },
        uBgRibbon: { value: this.bgRibbon }
      },
      depthWrite: false,
      depthTest: false
    });
    this.bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bgMaterial);
    this.bgScene.add(this.bgMesh);

    // Invisible Raycasting Plane for Mouse Interaction
    this.raycastPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(12.5, 12.5),
      new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false, side: THREE.DoubleSide })
    );
    this.scene.add(this.raycastPlane);
    this.raycaster = new THREE.Raycaster();

    // Poisson Disk Sampling initial positions
    const minDistance = (this.density - 0) * (2 - 10) / 300 + 10;
    const maxDistance = (this.density - 0) * (3 - 11) / 300 + 11;
    const rawPoints = poissonDiskSampling(500, 500, minDistance, maxDistance, 20);

    this.pointsData = [];
    rawPoints.forEach(p => {
      this.pointsData.push(p.x - 250, p.y - 250);
    });

    // GPGPU Initial Position Texture
    const floatArray = new Float32Array(this.length * 4);
    const count = this.pointsData.length / 2;
    for (let i = 0; i < this.length; i++) {
      const idx = i * 4;
      if (i < count) {
        floatArray[idx + 0] = this.pointsData[i * 2 + 0] * (1 / 250);
        floatArray[idx + 1] = this.pointsData[i * 2 + 1] * (1 / 250);
        floatArray[idx + 2] = 0.0;
        floatArray[idx + 3] = 0.0;
      } else {
        floatArray[idx + 0] = 999.0;
        floatArray[idx + 1] = 999.0;
        floatArray[idx + 2] = 0.0;
        floatArray[idx + 3] = 0.0;
      }
    }

    const posTex = new THREE.DataTexture(floatArray, this.size, this.size, THREE.RGBAFormat, THREE.FloatType);
    posTex.minFilter = THREE.NearestFilter;
    posTex.magFilter = THREE.NearestFilter;
    posTex.generateMipmaps = false;
    posTex.needsUpdate = true;

    // GPGPU Render Targets
    const rtOptions = {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false,
      depthBuffer: false
    };

    this.rt1 = new THREE.WebGLRenderTarget(this.size, this.size, rtOptions);
    this.rt2 = new THREE.WebGLRenderTarget(this.size, this.size, rtOptions);

    // Simulation Mesh
    this.simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.simScene = new THREE.Scene();

    this.simMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertexShader,
      fragmentShader: simFragmentShader,
      uniforms: {
        uPosition: { value: null },
        uPosRefs: { value: posTex },
        uRingPos: { value: new THREE.Vector2(0, 0) },
        uRingRadius: { value: this.ringRadius },
        uRingWidth: { value: this.ringWidth },
        uRingWidth2: { value: this.ringWidth2 },
        uRingDisplacement: { value: this.ringDisplacement },
        uTime: { value: 0 },
        uDeltaTime: { value: 0 },
        uNoiseSpeed: { value: this.noiseSpeed },
        uNoiseDispersion: { value: this.noiseDispersion }
      }
    });

    this.simMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.simMaterial);
    this.simScene.add(this.simMesh);

    // Initialize both targets with position texture
    const copyMaterial = new THREE.ShaderMaterial({
      vertexShader: copyVertexShader,
      fragmentShader: copyFragmentShader,
      uniforms: { uTexture: { value: posTex } }
    });

    this.simMesh.material = copyMaterial;
    this.renderer.setRenderTarget(this.rt1);
    this.renderer.render(this.simScene, this.simCamera);
    this.renderer.setRenderTarget(this.rt2);
    this.renderer.render(this.simScene, this.simCamera);

    this.simMesh.material = this.simMaterial;
    this.renderer.setRenderTarget(null);

    // Particle Point Attributes
    const positions = new Float32Array(this.length * 3);
    const uvs = new Float32Array(this.length * 2);
    const charIndices = new Float32Array(this.length);

    for (let i = 0; i < this.length; i++) {
      const u = (i % this.size) / this.size;
      const v = Math.floor(i / this.size) / this.size;
      uvs[i * 2 + 0] = u;
      uvs[i * 2 + 1] = v;
      charIndices[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute("charIndex", new THREE.BufferAttribute(charIndices, 1));

    const particleScale = (w / 2000) * this.particleScale;

    this.renderMaterial = new THREE.ShaderMaterial({
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
      uniforms: {
        uPosition: { value: this.rt1.texture },
        uColor1: { value: this.color1 },
        uColor2: { value: this.color2 },
        uColor3: { value: this.color3 },
        uRingPos: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uAlpha: { value: this.uAlpha },
        uColorScheme: { value: this.colorScheme },
        uRez: { value: new THREE.Vector2(w, h) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uParticleScale: { value: particleScale },
        uCharAtlas: { value: null },
        uShapeType: { value: this.shapeType },
        uNumChars: { value: 0 },
        uRotateParticles: { value: this.rotateParticles }
      },
      transparent: true,
      depthWrite: false,
      depthTest: false
    });

    this.particlesMesh = new THREE.Points(geometry, this.renderMaterial);
    this.particlesMesh.scale.set(5.0, 5.0, 5.0);
    this.scene.add(this.particlesMesh);

    // Texture Atlas for characters or shapes
    if (this.shapeType === 2) {
      this.updateShapeAtlas(this.shapeName);
    } else {
      this.updateCharacterAtlas(this.customText);
    }

    // Global Events
    this._onMouseMove = (e) => this.onMouseMove(e);
    this._onMouseLeave = () => { this.mouseIsOver = false; };
    this._onResize = () => this.onResize();

    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseleave", this._onMouseLeave);
    window.addEventListener("resize", this._onResize);
  }

  updateCharacterAtlas(charsString) {
    if (!charsString) charsString = "ANTIGRAVITY";
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);

    const uniqueChars = Array.from(new Set(charsString.replace(/\s/g, "").split("")));
    if (uniqueChars.length === 0) uniqueChars.push("A");

    const gridSize = 8;
    const cellSize = 512 / gridSize;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 50px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < uniqueChars.length; i++) {
      const col = i % gridSize;
      const row = Math.floor(i / gridSize);
      if (row >= gridSize) break;
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;
      ctx.fillText(uniqueChars[i], x, y);
    }

    if (this.charAtlasTexture) {
      this.charAtlasTexture.dispose();
    }

    this.charAtlasTexture = new THREE.CanvasTexture(canvas);
    this.charAtlasTexture.minFilter = THREE.LinearFilter;
    this.charAtlasTexture.magFilter = THREE.LinearFilter;
    this.charAtlasTexture.generateMipmaps = false;
    this.charAtlasTexture.needsUpdate = true;

    this.renderMaterial.uniforms.uCharAtlas.value = this.charAtlasTexture;
    this.renderMaterial.uniforms.uNumChars.value = uniqueChars.length;
  }

  updateShapeAtlas(shapeName) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = "#ffffff";

    const drawHexagon = () => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3 - Math.PI / 2;
        const x = 256 + Math.cos(angle) * 210;
        const y = 256 + Math.sin(angle) * 210;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };

    const drawTriangle = () => {
      ctx.beginPath();
      ctx.moveTo(256, 46);
      ctx.lineTo(46, 410);
      ctx.lineTo(466, 410);
      ctx.closePath();
      ctx.fill();
    };

    const drawSquare = () => {
      ctx.fillRect(81, 81, 350, 350);
    };

    const drawCircle = () => {
      ctx.beginPath();
      ctx.arc(256, 256, 180, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawCapsule = () => {
      const x = 56, y = 176, w = 400, h = 160, r = 80;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();
    };

    if (shapeName === "circle") drawCircle();
    else if (shapeName === "square") drawSquare();
    else if (shapeName === "triangle") drawTriangle();
    else if (shapeName === "hexagon") drawHexagon();
    else drawCapsule();

    if (this.charAtlasTexture) {
      this.charAtlasTexture.dispose();
    }
    this.charAtlasTexture = new THREE.CanvasTexture(canvas);
    this.charAtlasTexture.minFilter = THREE.LinearFilter;
    this.charAtlasTexture.magFilter = THREE.LinearFilter;
    this.charAtlasTexture.generateMipmaps = false;
    this.charAtlasTexture.needsUpdate = true;
    this.renderMaterial.uniforms.uCharAtlas.value = this.charAtlasTexture;
    this.renderMaterial.uniforms.uNumChars.value = 1;
  }

  onMouseMove(e) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.mouse.x = (x / rect.width) * 2 - 1;
    this.mouse.y = -(y / rect.height) * 2 + 1;

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      this.mouseIsOver = false;
    } else {
      this.mouseIsOver = true;
    }
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.renderMaterial) {
      this.renderMaterial.uniforms.uRez.value.set(w, h);
      this.renderMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
      this.renderMaterial.uniforms.uParticleScale.value = (w / 2000) * this.particleScale;
    }
  }

  update() {
    requestAnimationFrame(() => this.update());

    const currentTime = performance.now() * 0.001;
    const dt = this.lastTime ? currentTime - this.lastTime : 0.016;
    this.lastTime = currentTime;
    this.time += dt;

    // Raycast on plane
    if (this.mouseIsOver) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.raycastPlane);
      if (intersects.length > 0) {
        this.intersectionPoint.copy(intersects[0].point);
        this.isIntersecting = true;
      } else {
        this.isIntersecting = false;
      }
    } else {
      this.isIntersecting = false;
    }

    // Cursor noise and position interpolation
    const t = (this.noise.getVal(this.time * 0.66 + 94.234) - 0.5) * 2;
    const i = (this.noise.getVal(this.time * 0.75 + 21.028) - 0.5) * 2;

    const clampedDt = Math.min(dt, 0.1);
    const speed = this.isIntersecting ? this.mouseSpeedActive : this.mouseSpeedIdle;
    const lerpFactor = 1.0 - Math.exp(-speed * clampedDt);

    if (this.isIntersecting) {
      this.cursorPos.set(this.intersectionPoint.x * 0.175 + t * 0.1, this.intersectionPoint.y * 0.175 + i * 0.1);
    } else {
      this.cursorPos.set(t * 0.2, i * 0.1);
    }

    this.ringPos.x += (this.cursorPos.x - this.ringPos.x) * lerpFactor;
    this.ringPos.y += (this.cursorPos.y - this.ringPos.y) * lerpFactor;

    // Modulate ring radius
    const currentRadius = this.ringRadius + Math.sin(this.time * 1.0) * 0.03 + Math.cos(this.time * 3.0) * 0.02;

    // GPGPU Simulation Step
    const temp = this.rt1;
    this.rt1 = this.rt2;
    this.rt2 = temp;

    this.simMaterial.uniforms.uPosition.value = this.rt2.texture;
    this.simMaterial.uniforms.uRingPos.value.copy(this.ringPos);
    this.simMaterial.uniforms.uRingRadius.value = currentRadius;
    this.simMaterial.uniforms.uTime.value = this.time;
    this.simMaterial.uniforms.uDeltaTime.value = Math.min(dt, 0.1);

    this.renderer.setRenderTarget(this.rt1);
    this.renderer.render(this.simScene, this.simCamera);
    this.renderer.setRenderTarget(null);

    // Clear and render
    this.renderer.clear();

    // Render background gradient quad
    if (this.showBg && this.bgScene && this.bgCamera) {
      this.bgMaterial.uniforms.uTime.value = this.time;
      this.bgMaterial.uniforms.uBgSpeed.value = this.bgSpeed;
      this.bgMaterial.uniforms.uBgRibbon.value = this.bgRibbon;
      this.bgMaterial.uniforms.uBgColor1.value.copy(this.bgColor1);
      this.bgMaterial.uniforms.uBgColor2.value.copy(this.bgColor2);
      this.bgMaterial.uniforms.uBgColor3.value.copy(this.bgColor3);
      this.bgMaterial.uniforms.uBgColor4.value.copy(this.bgColor4);
      this.renderer.render(this.bgScene, this.bgCamera);
    }

    // Render visual points
    this.renderMaterial.uniforms.uPosition.value = this.rt1.texture;
    this.renderMaterial.uniforms.uRingPos.value.copy(this.ringPos);
    this.renderMaterial.uniforms.uTime.value = this.time;

    this.renderer.render(this.scene, this.camera);
  }
}

// Auto-initialize when Three.js is loaded and DOM is ready
function initHeroParticles() {
  const container = document.getElementById("hero-particles") || document.querySelector(".hero-band .particles-container");
  if (!container) return;
  if (!window.THREE) {
    const script = document.createElement("script");
    script.src = "./assets/three.min.js";
    script.onload = () => {
      const particles = new AntigravityParticles(container);
      window.heroParticles = particles;
      particles.update();
    };
    script.onerror = () => {
      const cdnScript = document.createElement("script");
      cdnScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      cdnScript.onload = () => {
        const particles = new AntigravityParticles(container);
        window.heroParticles = particles;
        particles.update();
      };
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(script);
  } else {
    const particles = new AntigravityParticles(container);
    window.heroParticles = particles;
    particles.update();
  }
}

if (document.readyState !== "loading") {
  initHeroParticles();
} else {
  document.addEventListener("DOMContentLoaded", initHeroParticles);
}
