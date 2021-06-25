import * as THREE from 'three';
import * as CANNON from 'cannon';
export default class CannonHelper{
    constructor(scene, world){
        this.scene = scene;
        this.world = world;
    }
    
    addLights(renderer){
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        // LIGHTS
        const ambient = new THREE.AmbientLight( 0x888888 );
        this.scene.add( ambient );

        const light = new THREE.DirectionalLight( 0xdddddd );
        light.position.set( 3, 10, 4 );
        light.target.position.set( 0, 0, 0 );

        light.castShadow = true;

        const lightSize = 10;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 50;
        light.shadow.camera.left = light.shadow.camera.bottom = -lightSize;
        light.shadow.camera.right = light.shadow.camera.top = lightSize;

        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;

        this.sun = light;
        this.scene.add(light);    
    }
    
    createCannonTrimesh(geometry){
		if (!geometry.isBufferGeometry) return null;
		
		const posAttr = geometry.attributes.position;
		const vertices = geometry.attributes.position.array;
		let indices = [];
		for(let i=0; i<posAttr.count; i++){
			indices.push(i);
		}
		
		return new CANNON.Trimesh(vertices, indices);
	}
	
	createCannonConvex(geometry){
		if (!geometry.isBufferGeometry) return null;
		
		const posAttr = geometry.attributes.position;
		const floats = geometry.attributes.position.array;
		const vertices = [];
		const faces = [];
		let face = [];
		let index = 0;
		for(let i=0; i<posAttr.count; i+=3){
			vertices.push( new CANNON.Vec3(floats[i], floats[i+1], floats[i+2]) );
			face.push(index++);
			if (face.length==3){
				faces.push(face);
				face = [];
			}
		}
		
		return new CANNON.ConvexPolyhedron(vertices, faces);
	}
    
    addVisual(body, color=0x888888, name="mesh", castShadow=true, receiveShadow=true){
		body.name = name;
		if (this.defaultMaterial===undefined && color==0x888888) this.defaultMaterial = new THREE.MeshLambertMaterial({color:color});
		const material = (color==0x888888) ? this.defaultMaterial : new THREE.MeshLambertMaterial({color:color});
		if (this.settings===undefined){
			this.settings = {
				stepFrequency: 60,
				quatNormalizeSkip: 2,
				quatNormalizeFast: true,
				gx: 0,
				gy: 0,
				gz: 0,
				iterations: 3,
				tolerance: 0.0001,
				k: 1e6,
				d: 3,
				scene: 0,
				paused: false,
				rendermode: "solid",
				constraints: false,
				contacts: false,  // Contact points
				cm2contact: false, // center of mass to contact points
				normals: false, // contact normals
				axes: false, // "local" frame axes
				particleSize: 0.1,
				shadows: false,
				aabbs: false,
				profiling: false,
				maxSubSteps:3
			}
			this.particleGeo = new THREE.SphereGeometry( 1, 16, 8 );
			this.particleMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
		}
		// What geometry should be used?
		let mesh;
		if(body instanceof CANNON.Body) mesh = this.shape2Mesh(body, castShadow, receiveShadow, material);

		if(mesh) {
			// Add body
			body.threemesh = mesh;
            mesh.castShadow = castShadow;
            mesh.receiveShadow = receiveShadow;
			this.scene.add(mesh);
		}
	}
	
	shape2Mesh(body, castShadow, receiveShadow, material=this.defaultMaterial){
		const obj = new THREE.Object3D();
		const game = this;
		let index = 0;
		
		body.shapes.forEach (function(shape){
			let mesh;
			let geometry;
			let v0, v1, v2;

			switch(shape.type){

			case CANNON.Shape.types.SPHERE:
				const sphere_geometry = new THREE.SphereGeometry( shape.radius, 8, 8);
				mesh = new THREE.Mesh( sphere_geometry, material );
				break;

			case CANNON.Shape.types.PARTICLE:
				mesh = new THREE.Mesh( game.particleGeo, game.particleMaterial );
				const s = this.settings;
				mesh.scale.set(s.particleSize,s.particleSize,s.particleSize);
				break;

			case CANNON.Shape.types.PLANE:
				geometry = new THREE.PlaneGeometry(10, 10, 4, 4);
				mesh = new THREE.Object3D();
				const submesh = new THREE.Object3D();
				const ground = new THREE.Mesh( geometry, material );
				ground.scale.set(100, 100, 100);
				submesh.add(ground);

				mesh.add(submesh);
				break;

			case CANNON.Shape.types.BOX:
				const box_geometry = new THREE.BoxGeometry(  shape.halfExtents.x*2,
															shape.halfExtents.y*2,
															shape.halfExtents.z*2 );
				mesh = new THREE.Mesh( box_geometry, material );
				break;

			case CANNON.Shape.types.CONVEXPOLYHEDRON:
				const geo = new THREE.Geometry();

				// Add vertices
				shape.vertices.forEach(function(v){
					geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
				});

				shape.faces.forEach(function(face){
					// add triangles
					const a = face[0];
					for (let j = 1; j < face.length - 1; j++) {
						const b = face[j];
						const c = face[j + 1];
						geo.faces.push(new THREE.Face3(a, b, c));
					}
				});
				geo.computeBoundingSphere();
				geo.computeFaceNormals();
				mesh = new THREE.Mesh( geo, material );
				break;

			case CANNON.Shape.types.HEIGHTFIELD:
				geometry = new THREE.Geometry();

				v0 = new CANNON.Vec3();
				v1 = new CANNON.Vec3();
				v2 = new CANNON.Vec3();
				for (let xi = 0; xi < shape.data.length - 1; xi++) {
					for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
						for (let k = 0; k < 2; k++) {
							shape.getConvexTrianglePillar(xi, yi, k===0);
							v0.copy(shape.pillarConvex.vertices[0]);
							v1.copy(shape.pillarConvex.vertices[1]);
							v2.copy(shape.pillarConvex.vertices[2]);
							v0.vadd(shape.pillarOffset, v0);
							v1.vadd(shape.pillarOffset, v1);
							v2.vadd(shape.pillarOffset, v2);
							geometry.vertices.push(
								new THREE.Vector3(v0.x, v0.y, v0.z),
								new THREE.Vector3(v1.x, v1.y, v1.z),
								new THREE.Vector3(v2.x, v2.y, v2.z)
							);
							var i = geometry.vertices.length - 3;
							geometry.faces.push(new THREE.Face3(i, i+1, i+2));
						}
					}
				}
				geometry.computeBoundingSphere();
				geometry.computeFaceNormals();
				mesh = new THREE.Mesh(geometry, material);
				break;

			case CANNON.Shape.types.TRIMESH:
				geometry = new THREE.Geometry();

				v0 = new CANNON.Vec3();
				v1 = new CANNON.Vec3();
				v2 = new CANNON.Vec3();
				for (let i = 0; i < shape.indices.length / 3; i++) {
					shape.getTriangleVertices(i, v0, v1, v2);
					geometry.vertices.push(
						new THREE.Vector3(v0.x, v0.y, v0.z),
						new THREE.Vector3(v1.x, v1.y, v1.z),
						new THREE.Vector3(v2.x, v2.y, v2.z)
					);
					var j = geometry.vertices.length - 3;
					geometry.faces.push(new THREE.Face3(j, j+1, j+2));
				}
				geometry.computeBoundingSphere();
				geometry.computeFaceNormals();
				mesh = new THREE.Mesh(geometry, MutationRecordaterial);
				break;

			default:
				throw "Visual type not recognized: "+shape.type;
			}

			mesh.receiveShadow = receiveShadow;
			mesh.castShadow = castShadow;
            
            mesh.traverse( function(child){
                if (child.isMesh){
                    child.castShadow = castShadow;
					child.receiveShadow = receiveShadow;
                }
            });

			var o = body.shapeOffsets[index];
			var q = body.shapeOrientations[index++];
			mesh.position.set(o.x, o.y, o.z);
			mesh.quaternion.set(q.x, q.y, q.z, q.w);

			obj.add(mesh);
		});

		return obj;
	}
    
    update(){
        this.world.bodies.forEach( function(body){
            if ( body.threemesh !== undefined){
                body.threemesh.position.copy(body.position);
                body.threemesh.quaternion.copy(body.quaternion);
            }
        });
    }
}