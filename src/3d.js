/*
 * @Author: Phillweston 2436559745@qq.com
 * @Date: 2025-01-01 22:00:54
 * @LastEditors: Phillweston
 * @LastEditTime: 2025-01-05 12:27:41
 * @FilePath: \DiceRoller-ChubGame\src\3d.js
 * @Description: 
 * 
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CANNON from 'cannon';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, diceModel;

const initThree = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    renderer.setPixelRatio(window.devicePixelRatio);
    camera.position.set(5, 5, 5);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor('white');
    scene.fog = new THREE.FogExp2('white', 0.014);

    const planeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({
            color: 0xe9e464,
            side: THREE.DoubleSide,
        })
    );
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);

    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024 * 4;
    directionalLight.shadow.mapSize.height = 1024 * 4;
    const scope = 50;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 40;
    directionalLight.shadow.camera.left = -scope;
    directionalLight.shadow.camera.right = scope;
    directionalLight.shadow.camera.top = scope;
    directionalLight.shadow.camera.bottom = -scope;
    scene.add(directionalLight);

    new GLTFLoader().load('./dice.glb', (gltf) => {
        diceModel = gltf.scene;
        diceModel.scale.set(0.25, 0.25, 0.25);
        diceModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
            }
        });

        // Log the orientation of the dice model
        // console.log('Dice rotation:', diceModel.rotation);
        // console.log('Dice position:', diceModel.position);
    });
};

let world;
const initCannon = () => {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
        friction: 0.5,
        restitution: 0.7,
    });
    world.defaultContactMaterial = defaultContactMaterial;

    const planeBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
    });
    planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
    world.addBody(planeBody);
};

const shapeList = [];
export const createDices = (count) => {
    shapeList.forEach(({ mesh, body }) => {
        scene.remove(mesh);
        world.removeBody(body);
    });
    shapeList.splice(0, shapeList.length);

    Array.from({ length: count }).forEach(() => {
        const position = {
            x: (Math.random() - 0.5) * 3,
            y: 3,
            z: (Math.random() - 0.5) * 3,
        };

        const cloneDiceModel = diceModel.clone();
        cloneDiceModel.position.copy(position);
        scene.add(cloneDiceModel);

        const diceBody = new CANNON.Body({
            mass: 1,
            position,
            shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)),
        });

        diceBody.quaternion.setFromEuler(
            Math.random() * 2 * Math.PI,
            Math.random() * 2 * Math.PI,
            Math.random() * 2 * Math.PI
        );
        cloneDiceModel.quaternion.copy(diceBody.quaternion);
        world.addBody(diceBody);

        shapeList.push({
            mesh: cloneDiceModel,
            body: diceBody,
        });
    });

    return new Promise((resolve) => {
        let stableStartTime = null;

        const checkStability = () => {
            const allStable = shapeList.every(
                ({ body }) =>
                    body.velocity.length() < 0.005 && body.angularVelocity.length() < 0.005
            );
            if (allStable) {
                if (stableStartTime === null) {
                    stableStartTime = Date.now();
                } else if (Date.now() - stableStartTime >= 1000) {
                    const points = shapeList.map(({ body }) => {
                        const upVector = new CANNON.Vec3(0, 1, 0);
                        const localUp = body.quaternion.vmult(upVector);
                        const faces = [
                            { value: 5, vector: new CANNON.Vec3(0, 1, 0) },  // Top face
                            { value: 2, vector: new CANNON.Vec3(0, -1, 0) }, // Bottom face
                            { value: 3, vector: new CANNON.Vec3(1, 0, 0) },  // Right face
                            { value: 4, vector: new CANNON.Vec3(-1, 0, 0) }, // Left face
                            { value: 6, vector: new CANNON.Vec3(0, 0, 1) },  // Front face
                            { value: 1, vector: new CANNON.Vec3(0, 0, -1) }  // Back face
                        ];

                        let maxDot = -1;
                        let upperFaceValue = 1;
                        faces.forEach((face) => {
                            const dot = localUp.dot(face.vector);
                            if (dot > maxDot) {
                                maxDot = dot;
                                upperFaceValue = face.value;
                            }
                        });

                        return upperFaceValue;
                    });
                    resolve(points);
                    return;
                }
            } else {
                stableStartTime = null;
            }
            setTimeout(checkStability, 200);
        };
        checkStability();
    });
};

initThree();
initCannon();

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.1;

let oldElapsedTime = 0;
const clock = new THREE.Clock();

const update = () => {
    renderer.render(scene, camera);
    orbitControls.update();

    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;
    world.step(1 / 60, deltaTime, 3);

    shapeList.forEach(({ mesh, body }) => {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    });

    window.requestAnimationFrame(update);
};
update();
