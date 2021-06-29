import gsap from 'gsap'

export default class Camera {
    constructor(scene, world, car, camera) {
        this.scene = scene;
        this.world = world;
        this.car = car;
        this.camera = camera;
        this.cameraOffset = {
            x: 4,
            y: 20,
            z: 36,
        }
        this.camRotation = {
            x: 0,
            y: 0,
        };
        this.prevCamRotation = {
            x: 0,
            y: -0.5,
        };;
        this.mousePos = {
            x: 0,
            y: 0,
            _start__x: 0,
            _start__y: 0,
        }
        this.isMouseDown = false;
        this.init();
    }
    init() {
        this.updateCamera();
        const clientMove = (e) => {
            this.mousePos.x = e.clientX || e.changedTouches[0].clientX;
            this.mousePos.y = e.clientY || e.changedTouches[0].clientY;
            if(this.isMouseDown) {
                this.camRotation.x = this.prevCamRotation.x - ((this.mousePos.x - this.mousePos._start__x) / window.innerWidth);
                this.cameraOffset.x = Math.sin(this.camRotation.x) * 36;
                this.cameraOffset.z = Math.cos(this.camRotation.x) * 36;
            
                this.camRotation.y = this.prevCamRotation.y - ((this.mousePos.y - this.mousePos._start__y) / window.innerHeight);
                if(this.camRotation.y > -1 && this.camRotation.y < 0) {
                    this.cameraOffset.y = -Math.sin(this.camRotation.y) * 36;
                }
                else { 
                    if(this.camRotation.y < -1) this.camRotation.y = -1;
                    if(this.camRotation.y > 0) this.camRotation.y = 0;
                }
            }
            else {
                this.prevCamRotation.x = this.camRotation.x;
                this.prevCamRotation.y = this.camRotation.y;
            }
        }
        window.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.mousePos._start__x = e.clientX;
            this.mousePos._start__y = e.clientY;
            clientMove(e);
        })
        window.addEventListener('touchstart', (e) => {
            this.isMouseDown = true;
            this.mousePos._start__x = e.changedTouches[0].clientX;
            this.mousePos._start__y = e.changedTouches[0].clientY;
            clientMove(e);
        })
        window.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
            clientMove(e);
        })
        window.addEventListener('touchend', (e) => {
            this.isMouseDown = false;
            clientMove(e);
        })
        window.addEventListener('touchmove', (e) => {
            clientMove(e)
        })
        window.addEventListener('mousemove', (e) => {
            clientMove(e)
        })

        window.addEventListener('wheel', e => {
            let cameraFov = this.camera.fov;
            cameraFov += ((e.wheelDelta < 0) ? 1.5 : -1.5);
            if(cameraFov < 10) {
                cameraFov = 10;
            }
            if(cameraFov > 40) {
                cameraFov = 40;
            }
            this.camera.fov = cameraFov;
            document.querySelector(".zoom-slider").value = cameraFov;
            this.camera.updateProjectionMatrix();
        }) 
        
        document.querySelector(".zoom-slider").addEventListener("input", e => {
            e.preventDefault();
            e.stopPropagation();
            this.camera.fov = parseInt(e.target.value);
            this.camera.updateProjectionMatrix();
        })
    }
    updateCamera() {
        const update = () => {
            if(this.car?.chassis?.position){
                gsap.to(this.camera.position, {
                  duration: 1,
                  x: this.car.chassis.position.x + this.cameraOffset.x, 
                  y: this.car.chassis.position.y + this.cameraOffset.y, 
                  z: this.car.chassis.position.z + this.cameraOffset.z, 
                })
                this.camera.lookAt(this.car.chassis.position)
            }
        }
        this.world.addEventListener('postStep', update);
    }
}