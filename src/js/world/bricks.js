import * as THREE from 'three';
import * as CANNON from 'cannon';

export default class Bricks {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.bricks = [];
        this.init();
    }
    init() {
        this.updatePhysics();
        for(let i = -2 ; i < 3 ; i++) 
            for(let j = 0 ; j < 5 ; j++){
                this.createBricks(
                    new THREE.Vector3(2 * i, 1.4 * j, -5),
                    new THREE.Vector3(2, 1.4, 1.6)
                )
            }

        for(let i = -2 ; i < 3 ; i++) 
            for(let j = 0 ; j < 5 ; j++){
                this.createBricks(
                    new THREE.Vector3((Math.random() - 0.5) * 500, 10, (Math.random() - 0.5) * 500),
                    new THREE.Vector3(2, 1.4, 1.6)
                )
            }
    }
    createBricks(position, dimension) {
        const brickGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
        const brickMaterial = new THREE.MeshStandardMaterial({color: 0xffffff});
        const brick = new THREE.Mesh(brickGeometry, brickMaterial);
        brick.castShadow = true;
        brick.scale.copy(dimension);
        brick.position.copy(position);
        this.scene.add(brick);

        const brickShape = new CANNON.Box(new CANNON.Vec3(dimension.x * 0.5, dimension.y * 0.5, dimension.z * 0.5));
        const brickBody = new CANNON.Body({
            mass: 1,
            position,
            shape: brickShape
        });
        brickBody.sleepSpeedLimit = 1.0;

        this.world.addBody(brickBody);

        brick.cannonBody = brickBody

        this.bricks.push(brick)
    }
    updatePhysics() {
        const update = () => {
            if(this.bricks) {
                for(const obj of this.bricks) {
                    obj.position.copy(obj.cannonBody.position);
                    obj.quaternion.copy(obj.cannonBody.quaternion);
                }
            }
        }
        this.world.addEventListener('postStep', update);
    }
}