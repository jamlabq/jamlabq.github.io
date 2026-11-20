import * as THREE from './vendor/three.module.min.js';

export function createLab(container, hotspots, { reducedMotion = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 5, -5, .1, 80);
  camera.position.set(11, 10, 14);
  camera.lookAt(0, 1.25, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setClearColor(0xf5f3ed, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);
  const room = new THREE.Group();
  scene.add(room);
  const mats = {
    paper: new THREE.MeshStandardMaterial({color:0xe9e8da,roughness:.9}),
    wall: new THREE.MeshStandardMaterial({color:0xe4e5da,roughness:.95}),
    floor: new THREE.MeshStandardMaterial({color:0xdce0d0,roughness:.8}),
    edge: new THREE.MeshStandardMaterial({color:0xb4bda5,roughness:.75}),
    wood: new THREE.MeshStandardMaterial({color:0xc7a978,roughness:.78}),
    woodlight: new THREE.MeshStandardMaterial({color:0xe2cea7,roughness:.7}),
    orange: new THREE.MeshStandardMaterial({color:0xf26a30,roughness:.45}),
    clay: new THREE.MeshStandardMaterial({color:0xc96d45,roughness:.9}),
    ink: new THREE.MeshStandardMaterial({color:0x2b3534,roughness:.55,metalness:.25}),
    machine: new THREE.MeshStandardMaterial({color:0x34413d,roughness:.5,metalness:.5}),
    black: new THREE.MeshStandardMaterial({color:0x182624,roughness:.65}),
    metal: new THREE.MeshStandardMaterial({color:0x8d9d91,metalness:.65,roughness:.4}),
    leaf: new THREE.MeshStandardMaterial({color:0x718d52,roughness:.8}),
    mint: new THREE.MeshStandardMaterial({color:0xbce593,roughness:.45}),
    blue: new THREE.MeshStandardMaterial({color:0x7eaaa6,roughness:.6}),
    yellow: new THREE.MeshStandardMaterial({color:0xf1c157,roughness:.65}),
    glow: new THREE.MeshStandardMaterial({color:0xccffbb,emissive:0x85efa3,emissiveIntensity:1.3,roughness:.3,metalness:.25}),
    copper: new THREE.MeshStandardMaterial({color:0xcba36b,metalness:.65,roughness:.45}),
  };
  function mesh(geometry, material, x=0,y=0,z=0,parent=room) {
    const m = new THREE.Mesh(geometry,material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  function box(w,h,d,x,y,z,material=mats.paper,parent=room) {return mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,parent);}
  function bevel(w,h,d,x,y,z,material=mats.paper,parent=room,r=.07) {
    const s=new THREE.Shape(); const a=-w/2,b=-h/2; r=Math.min(r,w/4,h/4,d/3);
    s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
    const geometry=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:5});
    geometry.translate(0,0,-d/2+r);return mesh(geometry,material,x,y,z,parent);
  }
  function cyl(rt,rb,h,x,y,z,material=mats.metal,parent=room,segments=24) {return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material,x,y,z,parent);}
  function sphere(r,x,y,z,material=mats.paper,parent=room){return mesh(new THREE.SphereGeometry(r,20,16),material,x,y,z,parent);}
  function tube(points,r,material=mats.ink,parent=room){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))); return mesh(new THREE.TubeGeometry(curve,40,r,8,false),material,0,0,0,parent);}
  function line(points,color=0xa9b69a,opacity=1,parent=room){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));parent.add(m);return m;}
  function label(text,w,h,x,y,z,{bg='#e4e8d8',fg='#4b5845',size=54,parent=room}={}){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(100,Math.round(1024*h/w));const c=canvas.getContext('2d');
    c.fillStyle=bg;c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=fg;c.font=`600 ${size}px monospace`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,canvas.height/2);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:.8});const m=mesh(new THREE.PlaneGeometry(w,h),material,x,y,z,parent);m.castShadow=false;return m;
  }
  function groundShadow(x,z,sx,sz,opacity=.25,parent=room){
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const grad=g.createRadialGradient(64,64,8,64,64,64);grad.addColorStop(0,'rgba(34,48,30,.65)');grad.addColorStop(.45,'rgba(34,48,30,.28)');grad.addColorStop(1,'rgba(34,48,30,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);
    const m=mesh(new THREE.PlaneGeometry(sx,sz),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity,depthWrite:false}),x,.041,z,parent);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;
  }
  // The room is a small physical diorama, including its visible base and open front.
  bevel(9.3,.28,7.4,0,-.18,0,mats.edge,room,.06);
  box(9.1,.13,7.2,0,-.035,0,mats.floor);
  box(9.15,3.8,.16,0,1.9,-3.55,mats.wall);
  box(.16,3.8,7.2,-4.5,1.9,0,mats.paper);
  box(9.14,.11,.12,0,.13,-3.43,mats.edge);box(.12,.11,7.05,-4.37,.13,0,mats.edge);
  box(9.25,.10,.22,0,3.83,-3.55,mats.paper);box(.22,.10,7.22,-4.5,3.83,0,mats.paper);
  for(let x=-4;x<=4;x+=.6)line([[x,.038,-3.4],[x,.038,3.5]],0xc0c9b2,.48);
  for(let z=-3.3;z<=3.3;z+=.6)line([[-4.35,.038,z],[4.5,.038,z]],0xc0c9b2,.48);
  // A workshop window and broad slanted light bring softness to the industrial scene.
  box(.10,1.85,2.6,-4.37,2.38,-.65,mats.woodlight);
  box(.025,1.62,2.36,-4.305,2.38,-.65,new THREE.MeshStandardMaterial({color:0xd2e3d8,emissive:0xc5ddd3,emissiveIntensity:.14,roughness:.8}));
  box(.06,1.68,.06,-4.27,2.38,-.65,mats.paper);box(.07,.06,2.4,-4.27,2.38,-.65,mats.paper);
  box(.38,.09,2.8,-4.27,1.43,-.65,mats.paper);
  // Back-wall pegboard and a slim shelf with miscellaneous objects.
  bevel(3.2,1.38,.08,-1.82,2.75,-3.4,mats.woodlight,room,.02);
  for(let x=-3.25;x<-0.25;x+=.22)for(let y=2.2;y<3.35;y+=.22){const peg=cyl(.017,.017,.02,x,y,-3.345,mats.edge);peg.rotation.x=Math.PI/2;}
  label('KEEP ASKING WHY.',1.6,.25,-1.65,3.07,-3.32,{size:65,bg:'#e2cea7',fg:'#69725b'});
  box(3.6,.10,.63,-1.85,2.05,-3.05,mats.wood);box(.08,.32,.28,-3.2,1.87,-3.22,mats.metal);box(.08,.32,.28,-.52,1.87,-3.22,mats.metal);
  for(let i=0;i<5;i++){const book=box(.15,.36+(.08*(i%3)),.34,-2.8+i*.16,2.28,-3.08,[mats.orange,mats.paper,mats.blue,mats.yellow,mats.mint][i]);book.rotation.z=i===4?-.13:0;}
  // Small brass satellite and specimen jar.
  cyl(.15,.15,.26,-1.3,2.24,-3,mats.paper);sphere(.11,-1.3,2.42,-3,mats.mint);
  sphere(.12,-.65,2.33,-3.04,mats.copper);tube([[-.65,2.38,-3.04],[-.65,2.63,-3.04]],.012,mats.ink);sphere(.035,-.65,2.65,-3.04,mats.orange);
  // A pair of tools hanging from the pegboard.
  box(.05,.48,.04,-3.05,2.68,-3.30,mats.metal);cyl(.07,.07,.23,-3.05,2.42,-3.29,mats.orange);
  const spanner=box(.11,.4,.04,-2.65,2.68,-3.30,mats.metal);spanner.rotation.z=-.35;
  // Workbench, open drawers, stool and things that feel touched and used.
  bevel(4.45,.18,1.55,-1.65,1.52,-1.75,mats.woodlight,room,.045);
  box(4.35,.08,1.50,-1.65,1.39,-1.75,mats.wood);
  for(const x of [-3.55,.22])for(const z of [-2.30,-1.18])box(.09,1.36,.09,x,.7,z,mats.metal);
  box(3.9,.06,.06,-1.65,.32,-2.3,mats.metal);
  bevel(1.20,1.15,1.28,-3.05,.79,-1.72,mats.paper,room,.04);
  for(let i=0;i<3;i++){bevel(1.08,.29,.055,-3.05,.42+i*.33,-1.05,i===1?mats.mint:mats.paper,room,.02);box(.35,.033,.05,-3.05,.46+i*.33,-1.005,mats.metal);}
  const stool=new THREE.Group();room.add(stool);stool.position.set(-2.5,0,.20);
  cyl(.43,.44,.13,0,.85,0,mats.orange,stool);cyl(.07,.07,.7,0,.43,0,mats.metal,stool);
  for(let i=0;i<4;i++){const a=i*Math.PI/2; tube([[0,.3,0],[Math.cos(a)*.37,.13,Math.sin(a)*.37]],.035,mats.ink,stool);}
  groundShadow(-2.5,.2,1.3,1.3,.35);
  // Robot arm: heavy joints, a bright gripper, then a tiny plant waiting to be moved.
  const robot=new THREE.Group();robot.position.set(-2.35,1.64,-1.65);room.add(robot);
  bevel(.62,.12,.65,0,.02,0,mats.ink,robot,.04);cyl(.19,.23,.18,0,.16,0,mats.orange,robot);
  const robotPivot=new THREE.Group();robotPivot.position.y=.24;robot.add(robotPivot);
  const joint1=cyl(.18,.18,.27,0,.12,0,mats.orange,robotPivot);joint1.rotation.x=Math.PI/2;
  const arm=box(.20,.65,.21,.15,.4,0,mats.orange,robotPivot);arm.rotation.z=-.44;
  const joint2=cyl(.15,.15,.28,.29,.70,0,mats.ink,robotPivot);joint2.rotation.x=Math.PI/2;
  const arm2=box(.55,.15,.19,.51,.80,0,mats.orange,robotPivot);arm2.rotation.z=.3;
  sphere(.12,.8,.89,0,mats.metal,robotPivot);box(.07,.23,.07,.84,.73,-.08,mats.ink,robotPivot);box(.07,.23,.07,.84,.73,.08,mats.ink,robotPivot);
  tube([[0,.06,-.17],[.12,.38,-.17],[.31,.69,-.17],[.69,.86,-.13]],.021,mats.black,robotPivot);
  for(let i=0;i<3;i++){sphere(.025,-.19+i*.12,.095,.29,i===0?mats.glow:mats.metal,robot);}
  // Oscilloscope with an actual moving signal display.
  const scope=new THREE.Group();scope.position.set(-.55,1.73,-1.72);scope.rotation.y=.15;room.add(scope);
  bevel(.9,.68,.58,0,.22,0,mats.paper,scope,.065);bevel(.59,.46,.02,-.10,.25,.31,mats.black,scope,.02);
  const displayCanvas=document.createElement('canvas');displayCanvas.width=512;displayCanvas.height=320;const displayContext=displayCanvas.getContext('2d');
  const displayTexture=new THREE.CanvasTexture(displayCanvas);displayTexture.colorSpace=THREE.SRGBColorSpace;
  const display=mesh(new THREE.PlaneGeometry(.53,.37),new THREE.MeshBasicMaterial({map:displayTexture}),-.10,.25,.326,scope);
  for(let i=0;i<3;i++){const knob=cyl(.045,.045,.04,.33,.40-i*.16,.322,mats.ink,scope);knob.rotation.x=Math.PI/2;}
  label('SIG / 01',.40,.07,-.12,-.035,.322,{bg:'#e9e8da',fg:'#56624e',size:80,parent:scope});
  box(.66,.055,.35,0,-.13,.02,mats.metal,scope);
  // Coffee mug, notebook and loose circuit board.
  cyl(.115,.09,.25,-1.15,1.76,-1.11,mats.orange);const handle=mesh(new THREE.TorusGeometry(.09,.022,8,20),mats.orange,-1.01,1.78,-1.11);handle.rotation.y=Math.PI/2;
  cyl(.088,.088,.008,-1.15,1.89,-1.11,mats.black);
  const notebook=box(.65,.035,.43,-1.51,1.64,-2.12,mats.paper);notebook.rotation.y=-.2;
  const pen=box(.035,.033,.49,-1.48,1.69,-2.12,mats.ink);pen.rotation.y=-.3;
  box(.54,.055,.35,-.13,1.65,-1.15,mats.leaf);for(let i=0;i<3;i++)box(.09,.035,.1,-.3+i*.14,1.69,-1.15,mats.black);
  // Desk lamp.
  cyl(.17,.22,.08,-3.48,1.67,-2.08,mats.ink);
  tube([[-3.48,1.71,-2.08],[-3.48,2.3,-2.08],[-3.1,2.65,-1.98]],.027,mats.metal);
  const shade=cyl(.12,.27,.20,-3.1,2.57,-1.98,mats.orange);shade.rotation.z=-.18;
  const lampBulb=sphere(.10,-3.08,2.46,-1.98,new THREE.MeshStandardMaterial({color:0xffe5aa,emissive:0xffd69a,emissiveIntensity:.5}));
  // Big, slightly ungainly core. Its engineering is visible; only the inside feels impossible.
  const core=new THREE.Group();core.position.set(2.42,0,-1.7);room.add(core);
  groundShadow(2.42,-1.7,3.9,3.4,.52);
  bevel(2.45,.30,2.15,0,.23,0,mats.black,core,.07);
  for(const x of [-.87,.87])for(const z of [-.65,.65])cyl(.14,.19,.20,x,.10,z,mats.ink,core);
  bevel(1.94,3.32,1.55,0,2.0,0,mats.machine,core,.11);
  bevel(1.70,2.47,.12,0,2.05,.82,mats.black,core,.07);
  box(.13,3.10,.15,-1.01,2.0,.67,mats.metal,core);box(.13,3.10,.15,1.01,2.0,.67,mats.metal,core);
  bevel(2.06,.28,1.64,0,3.68,0,mats.ink,core,.055);
  for(let i=0;i<7;i++)box(.15,.055,1.13,-.65+i*.215,3.85,0,mats.metal,core);
  for(let i=0;i<11;i++)box(.28,.06,1.29,1.10,.8+i*.235,-.06,mats.ink,core);
  for(let x of [-.93,.93])for(let y of [.65,1.45,2.4,3.45]){const bolt=cyl(.032,.032,.02,x,y,.765,mats.paper,core,8);bolt.rotation.x=Math.PI/2;}
  // Nested rings, mechanical bolts and floating crystal.
  const ringOuter=mesh(new THREE.TorusGeometry(.66,.085,14,64),mats.metal,0,2.23,.955,core);
  const ringGlow=mesh(new THREE.TorusGeometry(.55,.035,12,80),mats.glow,0,2.23,.975,core);
  mesh(new THREE.TorusGeometry(.43,.018,8,64),mats.mint,0,2.23,1.005,core);
  const ringSpin=new THREE.Group();ringSpin.position.set(0,2.23,1.02);core.add(ringSpin);
  const tilted=mesh(new THREE.TorusGeometry(.32,.018,8,56),mats.glow,0,0,0,ringSpin);tilted.rotation.y=.65;tilted.rotation.x=.2;
  const crystal=mesh(new THREE.OctahedronGeometry(.23,0),new THREE.MeshStandardMaterial({color:0xbdfdc4,emissive:0x72efab,emissiveIntensity:.7,metalness:.7,roughness:.15}),0,0,.08,ringSpin);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const bolt=cyl(.025,.025,.04,Math.cos(a)*.67,2.23+Math.sin(a)*.67,1.045,mats.black,core,8);bolt.rotation.x=Math.PI/2;}
  label('JAM / CORE.001',1.31,.17,0,3.37,.91,{bg:'#27322e',fg:'#d9e7ce',size:65,parent:core});
  label('EXPERIMENTAL SYSTEM',1.16,.09,0,3.16,.905,{bg:'#1b2723',fg:'#93a88a',size:44,parent:core});
  bevel(1.20,.36,.035,0,1.20,.91,mats.ink,core,.015);
  label('STANDBY  /  001',1.05,.16,0,1.22,.94,{bg:'#273e32',fg:'#b7e59a',size:63,parent:core});
  for(let i=0;i<3;i++)sphere(.039,-.32+i*.32,.92,.92,i===0?mats.glow:mats.metal,core);
  for(let i=0;i<7;i++)box(.11,.075,.02,-.52+i*.17,.52,1.087,i%2?mats.black:mats.yellow,core);
  // Two stout power conduits, copper details, and equipment on its side.
  tube([[.75,3.64,-.6],[1.37,3.6,-.6],[1.39,.65,-.6],[1.6,.2,-.1]],.075,mats.metal,core);
  for(let i=0;i<6;i++)cyl(.105,.105,.065,1.39,1.0+i*.36,-.6,mats.ink,core);
  bevel(.54,1.35,.53,-1.26,1.12,-.17,mats.ink,core,.04);
  for(let i=0;i<7;i++)box(.58,.037,.59,-1.26,.63+i*.15,-.17,mats.metal,core);
  tube([[2.15,.3,-.62],[2.05,.15,.02],[1.5,.12,.6],[.85,.12,.35],[.55,.12,-.65],[.20,.3,-1.25]],.033,mats.ink);
  tube([[2.47,.32,-.55],[2.36,.12,.5],[1.75,.12,1.0],[.82,.12,.88],[.6,.17,.35]],.02,mats.orange);
  const coreLight=new THREE.PointLight(0x98ffb0,2.5,3.3,2);coreLight.position.set(2.42,2.23,-.5);room.add(coreLight);
  // A tiny rover on the open floor, with a recognisably curious face.
  const rover=new THREE.Group();rover.position.set(.45,.23,1.5);rover.rotation.y=-.30;room.add(rover);
  bevel(.85,.28,1.0,0,.16,0,mats.yellow,rover,.08);bevel(.66,.12,.64,0,.35,-.05,mats.paper,rover,.04);
  for(const x of [-.47,.47])for(const z of [-.34,.34]){const wheel=cyl(.19,.19,.13,x,.08,z,mats.ink,rover);wheel.rotation.z=Math.PI/2;const hub=cyl(.085,.085,.137,x,.08,z,mats.metal,rover);hub.rotation.z=Math.PI/2;}
  bevel(.46,.25,.18,0,.54,.13,mats.orange,rover,.04);for(let x of [-.12,.12])sphere(.06,x,.56,.235,mats.black,rover);
  tube([[.15,.4,-.25],[.17,.95,-.25]],.018,mats.metal,rover);sphere(.05,.17,.98,-.25,mats.orange,rover);
  groundShadow(.45,1.5,1.9,1.9,.48);
  // A plant and few scattered workshop props soften the geometry.
  function plant(x,y,z,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);room.add(g);cyl(.24,.18,.35,0,.18,0,mats.clay,g);cyl(.22,.22,.025,0,.36,0,mats.black,g);
    for(let i=0;i<6;i++){const a=i*2.4;const leaf=mesh(new THREE.SphereGeometry(.20,12,8),mats.leaf,Math.cos(a)*.16,.56+(i%2)*.15,Math.sin(a)*.16,g);leaf.scale.set(.45,1.4,.65);leaf.rotation.z=Math.cos(a)*.65;leaf.rotation.x=Math.sin(a)*.65;}
  }
  plant(-3.72,.05,2.25,1.45);plant(-3.53,1.62,-1.14,.55);
  const box1=bevel(.95,.52,.8,3.4,.31,1.7,mats.paper,room,.035);box1.rotation.y=-.14;
  const box2=box(.70,.08,.59,3.4,.61,1.7,mats.woodlight);box2.rotation.y=-.14;
  label('ODD PARTS',.65,.16,3.41,.35,2.11,{bg:'#e9e8da',fg:'#73836a',size:75});
  const ball=sphere(.17,2.37,.21,2.31,mats.orange);groundShadow(2.37,2.31,.65,.65,.3);
  // Rolled drawings on the wall and a poster.
  bevel(1.09,.77,.015,.69,2.86,-3.45,mats.paper,room,.01);
  label('WHAT IF?',.92,.16,.69,3.05,-3.43,{bg:'#e9e8da',fg:'#da663b',size:100});
  line([[.3,2.61,-3.42],[.5,2.75,-3.42],[.68,2.62,-3.42],[.89,2.80,-3.42],[1.08,2.7,-3.42]],0x889a71,1);
  // Warm overhead pendant suspended in the open room.
  tube([[-.4,4.6,-.5],[-.4,3.95,-.5]],.015,mats.ink);
  const pendant=cyl(.15,.49,.23,-.4,3.86,-.5,mats.orange);sphere(.11,-.4,3.73,-.5,mats.paper);
  const ambient=new THREE.HemisphereLight(0xfff5dd,0x6c856a,2.45);scene.add(ambient);
  const sunlight=new THREE.DirectionalLight(0xfff4d9,3.6);sunlight.position.set(-3,10,6);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-9;sunlight.shadow.camera.right=9;sunlight.shadow.camera.top=9;sunlight.shadow.camera.bottom=-9;sunlight.shadow.normalBias=.025;sunlight.shadow.bias=-.0004;sunlight.shadow.radius=3;scene.add(sunlight);
  const fill=new THREE.DirectionalLight(0xd5e9e0,1.8);fill.position.set(5,4,-2);scene.add(fill);
  const lamp=new THREE.PointLight(0xffc885,0,4);lamp.position.set(-3.1,2.38,-1.8);room.add(lamp);
  const pendantLight=new THREE.PointLight(0xffd393,0,7);pendantLight.position.set(-.4,3.5,-.5);room.add(pendantLight);
  const anchors={robot:new THREE.Vector3(-2.2,2.7,-1.65),signal:new THREE.Vector3(-.55,2.38,-1.72),core:new THREE.Vector3(2.48,3.35,-.75),rover:new THREE.Vector3(.45,.9,1.5)};
  const hotspotButtons=[...hotspots.querySelectorAll('[data-object]')];
  let width=1,height=1,time=0,previous=performance.now(),night=false,active=false,paused=reducedMotion,raf,disposed=false,selected=null,actionUntil=0;
  function drawScope(t){
    const c=displayContext;c.fillStyle='#132b26';c.fillRect(0,0,512,320);c.strokeStyle='#315344';c.lineWidth=1;
    for(let x=0;x<512;x+=51){c.beginPath();c.moveTo(x,0);c.lineTo(x,320);c.stroke();}for(let y=0;y<320;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}
    c.strokeStyle=active?'#dbff91':'#9bc798';c.lineWidth=5;c.shadowBlur=10;c.shadowColor='#a2ff9d';c.beginPath();
    for(let x=0;x<=512;x++){const y=160+Math.sin(x*.027+t*2)*(active?85:48)+Math.sin(x*.059+t)*9; x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.shadowBlur=0;
    c.font='22px monospace';c.fillStyle='#93b596';c.fillText(active?'CORE LINK / ACTIVE':'SIG. 01 / 24.6 kHz',15,30);displayTexture.needsUpdate=true;
  }
  function projectHotspots(){for(const b of hotspotButtons){const id=b.dataset.object;const pos=anchors[id].clone();if(id==='rover'){pos.x=rover.position.x;pos.z=rover.position.z;}pos.applyMatrix4(room.matrixWorld).project(camera);b.style.left=`${(pos.x*.5+.5)*100}%`;b.style.top=`${(-pos.y*.5+.5)*100}%`;}}
  function resize(){width=container.clientWidth;height=container.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);const aspect=width/height;const span=aspect<1?11.8:10.7;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();render();}
  function render(){room.updateMatrixWorld(true);renderer.render(scene,camera);projectHotspots();}
  let visible=true;const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'120px'});visibility.observe(container);
  function frame(now){if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.05);previous=now;if(!visible||document.hidden||paused)return;time+=dt;
    ringSpin.rotation.z=time*(active?.6:.16);crystal.rotation.y=time*.5;crystal.position.y=Math.sin(time*1.5)*.04;
    ringGlow.material.emissiveIntensity=(active?2.3:1.1)+Math.sin(time*1.7)*.12;
    const playing=now<actionUntil;
    robotPivot.rotation.y=Math.sin(time*.6)*(selected==='robot'&&playing?.75:.12);
    robotPivot.rotation.z=Math.sin(time*1.1)*(selected==='robot'&&playing?.12:.025);
    if(selected==='rover'&&playing){rover.position.x=.45+Math.sin(time*2)*.65;rover.position.z=1.5+Math.cos(time*2)*.22;rover.rotation.y=-.3+Math.cos(time*2)*.3;}
    else {rover.position.x+=(.45-rover.position.x)*.05;rover.position.z+=(1.5-rover.position.z)*.05;}
    ball.rotation.x=time*.15;
    drawScope(time*(selected==='signal'&&playing?3:1));render();
  }
  drawScope(0);const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();raf=requestAnimationFrame(frame);
  container.classList.add('has-webgl');
  return {
    setNight(value){night=value;ambient.intensity=night?.75:2.45;sunlight.intensity=night?.55:3.6;fill.intensity=night?.7:1.8;lamp.intensity=night?5:0;pendantLight.intensity=night?8:0;coreLight.intensity=night?(active?9:6):(active?5:2.5);renderer.toneMappingExposure=night?1.1:1.25;render();},
    setActive(value){active=value;mats.glow.emissiveIntensity=active?2.3:1.1;coreLight.intensity=active?night?9:5:night?6:2.5;drawScope(time);render();},
    setPaused(value){paused=value;render();},
    play(id){selected=id;actionUntil=performance.now()+6000;if(paused){robotPivot.rotation.y=id==='robot'?.55:0;if(id==='rover'){rover.position.x=.95;rover.rotation.y=.2;}drawScope(id==='signal'?3:0);render();}},
    capture(){render();return renderer.domElement.toDataURL('image/png');},
    dispose(){disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();visibility.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});renderer.dispose();}
  };
}
