import * as THREE from 'three';

const P = {
  cream: 0xf4f0e8, offwhite: 0xe7e1d7, plaster: 0xeae7e0,
  black: 0x202622, charcoal: 0x393b3b, steel: 0x272b2a,
  wood: 0x966c49, honey: 0xc69b68, woodDark: 0x604a37,
  green: 0x496348, leaf: 0x315343, rust: 0xad5f3e,
  glass: 0xcfe5dc, gold: 0xc4a279,
};
const mats = {};
function material(hex, roughness = 0.76, metalness = 0) {
  const key = [hex, roughness, metalness].join('-');
  return mats[key] ||= new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
}
function box(root, name, x, y, z, w, h, d, hex, roughness = 0.76, metalness = 0, extras={}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(hex,roughness,metalness));
  mesh.name = name; mesh.position.set(x,y,z);
  mesh.castShadow = h > 0.09 && h < 7;
  mesh.receiveShadow = true;
  if (extras.rotationY) mesh.rotation.y = extras.rotationY;
  root.add(mesh);
  return mesh;
}
function cylinder(root, name, x,y,z, radius, height, hex, radius2=radius, segments=12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius2,radius,height,segments),material(hex));
  m.name=name; m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; root.add(m); return m;
}
function sphere(root, name, x,y,z, r,hex,scale=[1,1,1]) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),material(hex));
  m.name=name; m.position.set(x,y,z); m.scale.set(...scale); m.castShadow=true; root.add(m); return m;
}
function paintTexture(kind='tiles') {
  const c=document.createElement('canvas');c.width=512;c.height=512;
  const ctx=c.getContext('2d');
  if(kind==='tiles') {
    ctx.fillStyle='#dfded8';ctx.fillRect(0,0,512,512);
    ctx.lineWidth=3;ctx.strokeStyle='#bebbb4';ctx.strokeRect(1,1,510,510);
    ctx.strokeStyle='rgba(165,160,150,.13)';ctx.lineWidth=2;
    for(let i=0;i<18;i++){const a=(i*71)%512,b=(i*117)%512;ctx.beginPath();ctx.moveTo(a,b);ctx.bezierCurveTo(a+40,b+20,a+60,b-20,a+160,b+65);ctx.stroke();}
  } else {
    ctx.fillStyle='#875c3e';ctx.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=36){ctx.fillStyle=y%72===0?'#946c4b':'#805639';ctx.fillRect(0,y,512,33);ctx.fillStyle='rgba(24,14,9,.22)';ctx.fillRect(0,y+33,512,3)}
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function signTexture(title, subtitle='', options={}) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const g=canvas.getContext('2d');
  if(options.background){g.fillStyle=options.background;g.fillRect(0,0,1024,256);}
  g.fillStyle=options.foreground||'#f5f1e9';
  g.textAlign='center';g.textBaseline='middle';g.font=options.font||'600 100px Arial, sans-serif';
  g.fillText(title,512,subtitle?110:130,960);
  if(subtitle){g.font='normal 35px Arial,sans-serif';g.fillText(subtitle,512,195,940)}
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function signage(root,x,y,z,w,h,title,subtitle='',rot=0,opts={}){
  const t=signTexture(title,subtitle,opts);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  m.position.set(x,y,z);m.rotation.y=rot;m.name='sign: '+title;root.add(m);return m;
}
function floorSurface(root,name,w,d,x,y,z,type='tiles') {
  const texture=paintTexture(type); texture.repeat.set(w/(type==='tiles'?1.45:2),d/(type==='tiles'?1.45:2));
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map:texture,roughness:type==='tiles'?.41:.82}));
  mesh.name=name;mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;root.add(mesh);
  return mesh;
}
function stool(root,x,z,rotation=0,upper=false) {
  const g=new THREE.Group();g.name='Деревянное кресло';
  box(g,'сиденье',0,.53,0,.70,.13,.64,P.wood);
  box(g,'подушка',0,.63,0,.61,.08,.54,0x272927);
  box(g,'спинка',0,1.02,-.31,.70,.65,.10,P.wood);
  for(const sx of [-.27,.27])for(const sz of [-.23,.23])box(g,'ножка',sx,.28,sz,.085,.55,.08,P.woodDark);
  for(const sx of [-.36,.36]){box(g,'подлокотник',sx,.83,-.01,.09,.10,.73,P.wood);box(g,'стойка подлокотника',sx,.68,.22,.09,.29,.08,P.wood);}
  g.position.set(x,upper?4.02:0,z);g.rotation.y=rotation;root.add(g);
  return g;
}
function metalChair(root,x,z,angle=0){
  const g=new THREE.Group();g.name='Террасное кресло';
  box(g,'сиденье',0,.5,0,.85,.10,.69,0xbfc2b9);
  box(g,'спинка',0,.93,-.34,.85,.69,.08,0xbfc2b9);
  for(const px of [-.33,.33])for(const pz of [-.25,.25])box(g,'ножка',px,.25,pz,.055,.52,.055,0x7a817e);
  for(const px of [-.43,.43]){box(g,'подлокотник',px,.78,-.06,.055,.07,.63,0x888d8a);box(g,'опора',px,.62,.17,.055,.35,.06,0x888d8a);}
  g.rotation.y=angle;g.position.set(x,0,z);root.add(g);
}
function table(root,x,z,opts={}){
  const upper=opts.upper??false;const y=upper?4.02:0;const wood=opts.wood??P.wood;
  const w=opts.w??1.25;const d=opts.d??1.15;
  box(root,'Стол деревянный',x,y+.78,z,w,.09,d,wood,.6);
  cylinder(root,'Подстолье',x,y+.37,z,.075,.7,P.black);
  box(root,'Основание стола',x,y+.06,z,.78,.08,.16,P.black);
  box(root,'Основание стола',x,y+.06,z,.16,.08,.65,P.black);
}
function plant(root,x,z,scale=1,y=0){
  const potHeight=.55*scale;
  cylinder(root,'Кашпо',x,y+potHeight/2,z,.23*scale,potHeight,0x87654d,.31*scale,9);
  cylinder(root,'Земля',x,y+potHeight,z,.21*scale,.03,0x342a22);
  cylinder(root,'Стебель',x,y+potHeight+.44*scale,z,.045*scale,.8*scale,P.woodDark,.027*scale,8);
  const shifts=[[.1,.9,0],[-.25,.84,.08],[.21,.55,.19],[-.16,.7,-.18],[.0,1.12,-.14],[.34,.99,-.1]];
  shifts.forEach(([dx,dy,dz],i)=>sphere(root,'Листва',x+dx*scale,y+(potHeight+dy)*scale,z+dz*scale,.27*scale,i%2?P.green:P.leaf,[1.3,.62,1]));
}
function pendant(root,x,z,y=5.8){
  cylinder(root,'Провод подвеса',x,(y+3.3)/2,z,.014,y-3.3,P.black,.014,6);
  const s=new THREE.Mesh(new THREE.ConeGeometry(.31,.28,12),material(P.black,.45));s.position.set(x,3.4,z);s.rotation.x=Math.PI;root.add(s);
  sphere(root,'Лампа',x,3.25,z,.105,0xffd7a1);
}
function upstairsPendant(root,x,z){
  cylinder(root,'Провод верхней лампы',x,6.1,z,.012,.75,P.black,.012,6);
  const c=new THREE.Mesh(new THREE.ConeGeometry(.27,.28,12),material(P.black));c.rotation.x=Math.PI;c.position.set(x,5.72,z);root.add(c);
  sphere(root,'Тёплая лампа',x,5.57,z,.11,0xffc98c);
}
function frame(root,x,y,z,w,h,rot=0,color=0x9b7155){
  const g=new THREE.Group();g.rotation.y=rot;g.position.set(x,y,z);
  box(g,'Рама',0,0,0,w,h,.08,P.woodDark);
  box(g,'Паспарту',0,0,.045,w-.12,h-.12,.012,0xf0ede5);
  box(g,'Постер',0,0,.055,w-.32,h-.33,.01,color);
  root.add(g);
}
function rail(root, x1,z1,x2,z2,y=4.1){
  const distance=Math.hypot(x2-x1,z2-z1);
  const steps=Math.max(2,Math.floor(distance/1.3));
  const angle=Math.atan2(z2-z1,x2-x1);
  for(let i=0;i<=steps;i++){
    const t=i/steps;box(root,'Стойка ограждения',x1+(x2-x1)*t,y+.46,z1+(z2-z1)*t,.045,.96,.045,P.black);
  }
  const cross=(level)=>{const b=box(root,'Металлическое ограждение',(x1+x2)/2,y+level,(z1+z2)/2,distance,.045,.045,P.black);b.rotation.y=-angle;};
  cross(.94);cross(.51);
}
function desserts(root){
  const g=new THREE.Group();g.position.set(3.9,0,1.05);g.name='Десертная витрина';root.add(g);
  box(g,'Нижняя панель',0,.43,0,3.7,.88,1.0,P.black);
  for(let i=-1;i<=1;i++)box(g,'Дубовая панель',i*1.17,.40,.505,1.08,.69,.025,0xae8456);
  const glass=new THREE.MeshPhysicalMaterial({color:0xd8e8e2,transparent:true,opacity:.23,roughness:.1,metalness:.06,side:THREE.DoubleSide,depthWrite:false});
  box(g,'Основание стекла',0,1.08,0,3.7,.07,1.05,P.black);
  const glazing=(x,y,z,w,h,d)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glass);m.position.set(x,y,z);g.add(m)};
  glazing(0,1.6,.52,3.66,1,.025);glazing(0,1.6,-.50,3.66,1,.025);glazing(-1.83,1.6,0,.025,1,1);glazing(1.83,1.6,0,.025,1,1);
  box(g,'Верхняя планка',0,2.12,0,3.72,.08,1.08,P.black);
  for (const y of [1.23,1.73]){
    box(g,'Полка',0,y,0,3.5,.035,.84,0xcfc5a8);
    for(let k=0;k<7;k++){
      cylinder(g,'Десерт на тарелке',-1.42+k*.47,y+.09,.03,.135,.14,k%3===0?0x704a39:k%3===1?0xe7b57a:0xe8ded0,.135,12);
      cylinder(g,'Глазурь',-1.42+k*.47,y+.17,.03,.14,.025,k%3===1?0x704c36:0xe5d0a6,.14,12);
    }
  }
  return {x:3.9,z:1.05,w:3.85,d:1.4,floor:0};
}
function espressoBar(root){
  box(root,'Барная стойка',4.8,.63,-2.2,3.7,1.25,1.5,0x9e7754);
  box(root,'Столешница',4.8,1.30,-2.2,3.96,.12,1.75,P.charcoal,.28);
  box(root,'Кофемашина',4.75,1.74,-2.6,.95,.7,.65,0x535957,.24,.5);
  for(const x of [4.4,4.78,5.15])cylinder(root,'Группа эспрессо',x,1.38,-1.93,.09,.12,P.black);
  for(const x of [3.3,3.65,3.95])cylinder(root,'Стакан',x,1.49,-2.2,.065,.22,0xd9cec1,.08);
  signage(root,4.6,2.8,-3.0,2.5,.62,'COFFEE & MORE','',0,{});
}
function outdoor(root){
  box(root,'Терраса',0,-.17,13.85,15,.30,12,0x805b40);
  floorSurface(root,'Деревянное покрытие',15,12,0,.005,13.85,'wood');
  for(const z of [9.5,16.4])for(const x of [-5.2,-1.7,1.7,5.1]){
    table(root,x,z,{w:1.55,d:.92,wood:0xe4e1d8});
    metalChair(root,x-.98,z,.95);metalChair(root,x+.98,z,-.95);
  }
  for(const [x,z] of [[-6.7,9.4],[-6.8,14],[6.8,9.3],[6.8,15],[-2.9,13.1],[3.1,12.7]])plant(root,x,z,1.0);
  // Awnings sit in front of the entrance, as in the photographed facade.
  for(const x of [-3.65,3.65]){
    box(root,'Чёрная маркиза',x,3.54,10.34,7.16,.19,3.38,P.black);
    box(root,'Кромка маркизы',x,3.42,12,7.16,.28,.18,0x111514);
    signage(root,x,3.38,12.105,5.5,.47,"ROBY'S COFFEE HOUSE",'',0,{font:'normal 70px Arial',foreground:'#faf8f5'});
  }
  for(const x of [-6.9,6.9])box(root,'Колонна террасы',x,1.7,10.9,.15,3.4,.15,P.black);
  box(root,'Фриз фасада',0,5.07,8.3,14.5,1.47,.58,P.black);
  signage(root,0,5.1,8.62,12.25,1.22,"ROBY'S COFFEE HOUSE",'',0,{font:'normal 88px Arial',foreground:'#fffdf9'});
  box(root,'Кирпичный тротуар',0,-.09,21.1,15.4,.11,2.8,0xcac8c1);
}
function indoor(root,colliders) {
  box(root,'Цоколь первого этажа',0,-.21,-2.8,14.35,.42,22.2,0xc7c5c0);
  floorSurface(root,'Керамогранит',14.05,22,0,.011,-2.8);
  // Structural shell. Open front and right-front for visibility.
  box(root,'Левая стена',-7.05,3,-3.0,.28,6.0,22.2,P.cream);
  box(root,'Задняя стена',0,3,-13.87,14.3,6.0,.27,P.cream);
  box(root,'Правая стена',7.05,3,-8.3,.28,6,11.0,P.cream);
  box(root,'Потолочная балка',0,6.5,-2.8,14.15,.18,22.4,P.offwhite);
  box(root,'Потолок над задней частью',0,7.35,-10.5,14.25,.18,6.7,P.offwhite);
  // Front glazing, carefully translucent so visitors can see through it.
  const glassMat=new THREE.MeshPhysicalMaterial({color:0x9dd0c8,roughness:.12,transparent:true,opacity:.12,metalness:.0,depthWrite:false,side:THREE.DoubleSide});
  for(const x of [-4.7,-.3,4.45]){
    const pane=new THREE.Mesh(new THREE.PlaneGeometry(4.14,3.2),glassMat);pane.position.set(x,1.83,8.18);root.add(pane);
  }
  for(const x of [-6.93,-2.65,1.65,6.95])box(root,'Стойка остекления',x,1.9,8.2,.075,3.3,.07,P.black);
  box(root,'Верхняя рама витрин',0,3.58,8.2,14.2,.10,.10,P.black);
  // Signature tall charcoal block visible in one reference photograph.
  box(root,'Высокий серый объём',1.65,3.32,-.6,2.65,6.64,3.4,P.charcoal);
  box(root,'Белая обводка блока',1.65,.94,1.12,2.25,1.86,.10,P.cream);
  const caseColl= desserts(root);colliders.push(caseColl);
  espressoBar(root);colliders.push({x:4.8,z:-2.2,w:4.0,d:1.9,floor:0});
  // Wall quotation and leaves.
  signage(root,-6.82,5.08,-4.2,4.7,.98,'BUT FIRST COFFEE','',Math.PI/2,{font:'bold 91px Arial',foreground:'#1e2623'});
  for(const [x,z] of [[-5.8,-3.1],[-5.8,-5.7],[-4.4,-6.6]])plant(root,x,z,.85);
  for(const z of [-4.6,-7.1]){
    frame(root,-6.85,2.5,z,.7,.82,Math.PI/2,z===-4.6?0xa08a72:0x5f7771);
  }
  // Seating below the open space and on the left.
  for(const [x,z] of [[-3.4,3.7],[-4.35,-1.05],[-3.5,-8.35]]){
    table(root,x,z,{w:1.55,d:1.15});
    stool(root,x-.9,z,.95);stool(root,x+.9,z,-.95);
    colliders.push({x,z,w:1.48,d:1.08,floor:0});
  }
  // Shelving + circular mirrors from third photo.
  box(root,'Стеллаж горизонтальная полка',-4.0,1.5,-13.3,3.4,.11,.4,P.wood);
  for(const h of [.55,1.35,2.15])box(root,'Стеллаж',-4.1,h,-13.46,3.5,.1,.52,P.woodDark);
  for(const x of [-5.8,-2.4])box(root,'Стойка стеллажа',x,1.2,-13.46,.08,2.4,.08,P.black);
  for(const [x,y,r] of [[2.6,2.5,.46],[4.65,1.95,.35],[5.4,3.0,.3]]){
    const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.055,7,32),material(P.honey));rim.position.set(x,y,-13.64);root.add(rim);
    const mirror=new THREE.Mesh(new THREE.CircleGeometry(r-.085,32),new THREE.MeshStandardMaterial({color:0xb3bdba,metalness:.67,roughness:.16}));mirror.position.set(x,y,-13.625);root.add(mirror);
  }
  plant(root,5.55,-12.85,.83);
  // Steel mezzanine underside and upper seating (partial second level).
  box(root,'Антресоль правая',3.7,3.95,-6.15,6.65,.28,8.4,P.charcoal);
  box(root,'Второй этаж задний',-.20,4.02,-11.4,14,.25,4.75,P.charcoal);
  floorSurface(root,'Пол антресоли',6.65,8.35,3.7,4.102,-6.15,'wood');
  floorSurface(root,'Пол второго этажа',14,4.74,-.2,4.153,-11.4,'wood');
  for(const x of [.55,3.0,5.8])box(root,'Стальная балка',x,3.69,-6.2,.19,.36,8.6,P.black);
  for(const z of [-9.85,-6.5,-3.15])box(root,'Стальная поперечная балка',3.5,3.68,z,6.8,.34,.18,P.black);
  for(const [x,z] of [[.55,-9.5],[6.7,-9.5],[.55,-3.6],[6.7,-3.6]])box(root,'Металлическая опора',x,1.9,z,.16,3.8,.16,P.black);
  rail(root,.36,-2.25,.36,-9.0,4.12);
  rail(root,-6.63,-8.9,.36,-8.9,4.17);
  rail(root,6.75,-2.5,6.75,-9.0,4.12);
  // Small connecting stairway is diagrammatic, not a measured recreation.
  for(let i=0;i<14;i++){
    const stepY=.16+(i*.273);
    const stepZ=-1.4-i*.58;
    box(root,'Лестница (условная)',6.19,stepY,stepZ,1.48,.12,.55,P.wood);
  }
  for(const [x,z] of [[4.28,-5.3],[4.5,-8.15],[-3.9,-11.7],[0,-11.75]]){
    table(root,x,z,{upper:true,w:1.32,d:1.1,wood:P.honey});
    stool(root,x-.88,z,.9,true);stool(root,x+.88,z,-.9,true);
    colliders.push({x,z,w:1.3,d:1.05,floor:1});
  }
  for(const [x,z] of [[2.1,-11.8],[5.5,-11.4]])plant(root,x,z,.6,4.18);
  for(const z of [-4.7,-7.15])pendant(root,-3.2,z);
  for(const [x,z] of [[-3,-11.5],[1.9,-11.4],[4.2,-5.2]])upstairsPendant(root,x,z);
  frame(root,6.85,5.5,-10.4,.9,.87,Math.PI/2,0x859f8a);
  frame(root,6.85,5.5,-7.8,.9,.87,Math.PI/2,0xb26c4f);
  // Cascading greenery along the parapet.
  for (let i=0;i<11;i++) {
    const x=0.7+i*.54;
    sphere(root,'Свисающая зелень',x,4.65,-9.0,.18,P.green,[.9,1.6,.95]);
  }
  // Entrance door hint.
  box(root,'Ручка входной двери',.12,1.2,8.28,.06,.51,.06,P.gold,.3,.6);
  return colliders;
}
export function createCafeScene(scene) {
  const root=new THREE.Group();root.name="ROBY'S — фотореференсный 3D-концепт";scene.add(root);
  const colliders=[];
  const outdoorRoot=new THREE.Group();const indoorRoot=new THREE.Group();root.add(outdoorRoot,indoorRoot);
  outdoor(outdoorRoot);indoor(indoorRoot,colliders);
  scene.background=new THREE.Color(0xb4c6bc);
  scene.fog=new THREE.FogExp2(0xb4c6bc,.013);
  const sunlight=new THREE.DirectionalLight(0xffefd5,3.1);sunlight.position.set(-9,18,17);sunlight.castShadow=true;
  sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-28;sunlight.shadow.camera.right=28;sunlight.shadow.camera.top=28;sunlight.shadow.camera.bottom=-28;
  sunlight.shadow.camera.near=.5;sunlight.shadow.camera.far=75;sunlight.shadow.bias=-.00015;
  scene.add(sunlight);
  const ambient=new THREE.HemisphereLight(0xe8f7ff,0xa0937e,2.6);scene.add(ambient);
  const warm=[];
  for(const [x,y,z] of [[-3.2,3.8,-6],[3,5,-8.2],[4.0,3.0,.2],[-4,5.8,-10]]){
    const p=new THREE.PointLight(0xffba73,2.2,10,2.0);p.position.set(x,y,z);scene.add(p);warm.push(p);
  }
  const street=box(root,'Земля под кафе',0,-.34,4,80,.12,80,0xb5b7ad);
  street.receiveShadow=true;
  return {root,colliders, setNight(night){
    sunlight.intensity=night?.38:3.1;
    ambient.intensity=night?.9:2.6;
    warm.forEach(l=>l.intensity=night?5.3:1.4);
    scene.background.set(night?0x182728:0xb4c6bc);
    scene.fog.color.set(night?0x182728:0xb4c6bc);
  }};
}