import * as THREE from 'three'
import * as CANNON from 'cannon'

export default class Buildings {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.buildings = [];
        this.init();
    }

    init() {
        this.updatePhysics();
        for(let i = 0 ; i < 250 ; i++) {
            this.createBuilding( 
                new THREE.Vector3((Math.random() - 0.5) * 500, 0, (Math.random() - 0.5) * 500),
                new THREE.Vector3(Math.random() * 30, Math.random() * 30, Math.random() * 30),
                0xffffff
            );
        }
    }

    createBuilding(position, dimension, color) {
        const buildingGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
        const buildingMaterial = new THREE.MeshStandardMaterial({color});
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.castShadow = true;
        building.receiveShadow = true;
        building.scale.copy(dimension);
        building.position.copy(position);
        this.scene.add(building);
    
        const wheelMaterial = new CANNON.Material("wheelMaterial");
        const buildingShape = new CANNON.Box(new CANNON.Vec3(dimension.x * 0.5, dimension.y * 0.5, dimension.z * 0.5));
        const buildingBody = new CANNON.Body({
            mass: 0,
            position,
            shape: buildingShape,
            material: wheelMaterial
        });
    
        this.world.addBody(buildingBody);
    
        building.cannonBody = buildingBody;

        this.buildings.push(building);
    }

    updatePhysics() {
        const update = () => {
            if(this.buildings) {
                for(const obj of this.buildings) {
                    obj.position.copy(obj.cannonBody.position);
                    obj.quaternion.copy(obj.cannonBody.quaternion);
                }
            }
        }
        this.world.addEventListener('postStep', update);
    }
}