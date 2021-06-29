import './style.css'
import * as THREE from 'three'
import * as CANNON from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import Car from './js/world/car';
import Camera from './js/world/camera';
import Buildings from './js/world/buildings';
import Bricks from './js/world/bricks';
import CannonHelper from './js/lib/cannonhelper';
import gsap from 'gsap';

var scene, camera, renderer, world, helper, car, light, light2;

const loaderManager = new THREE.LoadingManager(
  () => {
    //Loaded
    console.log("Everything Loaded")
    gsap.to(".loader", {
      delay: 1,
      duration: 2,
      translateY: "-100%",
      ease: "ease-in-out",
      pointerEvents: "none",
    })
  },
  (x,y,z) => { 
    //Progress
    document.querySelector(".loader span").textContent = `${Math.floor(y/z*100)}% Loading...`;
    gsap.to(".loading-bar", {
      scaleY: y/z
    })
  }
);
const gltfLoader = new GLTFLoader(loaderManager);

init();
function init(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x6e8db9 );
  
  camera = new THREE.PerspectiveCamera( 40, window.innerWidth/window.innerHeight, 0.1, 1000 );
  camera.position.set(10, 10, 10);
  
  const ambient = new THREE.AmbientLight(0xFFFFFF, 0.6);
  scene.add(ambient);


  light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(1,2,-2);
  
  light2 = new THREE.DirectionalLight(0xffffff, 0.4);
  light2.position.set(-1,2,2);

  scene.add(light, light2);

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize( window.innerWidth, window.innerHeight );
  // renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild( renderer.domElement );

  // new OrbitControls(camera, renderer.domElement);
  
  initPhysics();
  
  onWindowResize();

  window.addEventListener( 'resize', onWindowResize, false );
  
  update();
}

function initPhysics(){
    
    world = new CANNON.World();
    world.broadphase = new CANNON.SAPBroadphase(world);
    helper = new CannonHelper( scene, world );    
    
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.gravity.set(0, -10, 0);
    // world.defaultContactMaterial.friction = 0;
    
    const groundMaterial = new CANNON.Material("groundMaterial");
    const wheelMaterial = new CANNON.Material("wheelMaterial");
    const wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
        friction: 0.1,
        restitution: 0.7,
        contactEquationStiffness: 1000
    });
    
    // We must add the contact materials to the world
    world.addContactMaterial(wheelGroundContactMaterial);
    car = new Car(scene, world, gltfLoader);
    new Buildings(scene, world);
    new Camera(scene, world, car, camera);
    new Bricks(scene, world);
    
    const hfShape = new CANNON.Plane();
    const hfBody = new CANNON.Body({ mass: 0 });
    hfBody.addShape(hfShape);
    hfBody.quaternion.setFromAxisAngle( new CANNON.Vec3(1,0,0), -Math.PI/2);
    world.add(hfBody);
    const floorGeo = new THREE.PlaneBufferGeometry(10000,10000);
    const floorMat = new THREE.MeshStandardMaterial({color: 0x999999});
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor); 
}       
    

function onWindowResize( event ) {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function update() {
  requestAnimationFrame( update );
  world.step(1/60);
  helper.update();
  renderer.render( scene, camera );
}

document.querySelector(".info-icon").addEventListener('click', () => {
  document.querySelector(".info").classList.add("open");
})
document.querySelector(".info b u").addEventListener('click', () => {
  document.querySelector(".info").classList.remove("open");
})
