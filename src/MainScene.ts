import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";

// @ts-ignore
import waterVertShader from "./shader/water.vert";
// @ts-ignore
import waterFragShader from "./shader/water.frag";

class MainScene {
    private readonly scene: THREE.Scene
    private readonly camera: THREE.PerspectiveCamera
    private controls: OrbitControls

    private uTime: THREE.IUniform = {value: 0.0}
    private cameraNear: THREE.IUniform = {value: 0}
    private cameraFar: THREE.IUniform = {value: 0}

    public uDepthMap: THREE.IUniform = {value: null}
    public uDepthMap2: THREE.IUniform = {value: null}
    public isMask: THREE.IUniform = {value: false}
    public isDepth: THREE.IUniform = {value: false}
    public waterMat: THREE.ShaderMaterial

    uScreenSize: THREE.IUniform = {value: new THREE.Vector4(window.innerWidth, window.innerHeight, 1 / window.innerWidth, 1 / window.innerHeight)}

    models = [
        {name: "Tugboat", pos: {x: 0, y: -2, z: 0}},
        {name: "Octopus", pos: {x: 5, y: -5, z: 5}, scale: 0.2},
        {name: "Lighthouse", pos: {x: -7, y: -5, z: 7}, scale: 0.6}
    ]

    constructor(renderer:THREE.WebGLRenderer) {
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x6CC8FFFF)
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.z = -10;
        this.camera.position.x = 15;
        this.camera.position.y = 5;
        this.cameraNear.value = this.camera.near
        this.cameraFar.value = this.camera.far
        this.init(renderer)
    }

    private init(renderer:THREE.WebGLRenderer) {
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.controls.enableZoom = true;

        //设置灯光
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(1, 1, -1);
        directionalLight.intensity = 0.7;
        this.scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight();
        this.scene.add(ambientLight);

        // 地面
        const groundGeometry = new THREE.PlaneGeometry(50, 50, 1);
        const groundMat = new THREE.MeshPhongMaterial({color: 0xFFA457, shininess: 0});
        const ground = new THREE.Mesh(groundGeometry, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        this.scene.add(ground);

        // 海面
        const water = this.CreateWater();
        water.rotation.x = -Math.PI / 2;
        water.position.y = -1;
        this.scene.add(water);

        // 其他物体
        this.LoadObjects()
    }

    private LoadObjects() {
        const mtLoader = new MTLLoader()
        mtLoader.setPath('assets/materials/');
        mtLoader.setResourcePath('assets/textures/');
        for (let option of this.models) {
            //@ts-ignore
            const {name, pos, scale = 1} = option
            mtLoader.load(`${name}.mtl`, (materials) => {
                materials.preload();
                const objLoader = new OBJLoader()
                objLoader.setMaterials(materials)
                objLoader.setPath('assets/models/');
                objLoader.load(`${name}.obj`, (object) => {
                    object.name = name
                    this.scene.add(object);
                    //@ts-ignore
                    object.material = materials.materials[name + "_mat"];
                    //@ts-ignore
                    object.material.color.r = 1;
                    //@ts-ignore
                    object.material.color.g = 1;
                    //@ts-ignore
                    object.material.color.b = 1;
                    // objects[model.name] = object;
                    object.position.set(pos.x, pos.y, pos.z);
                    object.scale.set(scale, scale, scale);
                })
            })
        }
    }

    private CreateWater(): THREE.Mesh {
        const waterLinesTexture = new THREE.TextureLoader().load('assets/textures/WaterTexture.png');
        waterLinesTexture.wrapS = THREE.RepeatWrapping;
        waterLinesTexture.wrapT = THREE.RepeatWrapping;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: this.uTime,
                uSurfaceTexture: {value: waterLinesTexture},
                cameraNear: this.cameraNear,
                cameraFar: this.cameraFar,
                uDepthMap: this.uDepthMap,
                uDepthMap2: this.uDepthMap2,
                isMask: this.isMask,
                isDepth: this.isDepth,
                uScreenSize: this.uScreenSize
            },
            vertexShader: waterVertShader,
            fragmentShader: waterFragShader,
            transparent: true,
            depthWrite: false
        });

        this.waterMat = material;

        const waterGeometry = new THREE.PlaneGeometry(50, 50, 50, 50);
        return new THREE.Mesh(waterGeometry, material);
    }

    // resize() {
    //     this.camera.aspect = window.innerWidth / window.innerHeight;
    //     this.camera.updateProjectionMatrix();
    //     this.renderer.setSize(window.innerWidth, window.innerHeight);
    //     // @ts-ignore
    //     //this.water.uniforms.uScreenSize =  new THREE.Vector4(window.innerWidth,window.innerHeight,1/window.innerWidth,1/window.innerHeight);
    //     this.update()
    // }

    update() {
        this.controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true
        this.uTime.value += 0.1;

        const BuoyantObjects = [this.scene.getObjectByName("Tugboat")]

        for (let i = 0; i < BuoyantObjects.length; i++) {
            let obj = BuoyantObjects[i];
            if (obj == undefined) continue;
            //@ts-ignore
            if (obj.time == undefined) {
                //@ts-ignore
                obj.time = Math.random() * Math.PI * 2;
                //@ts-ignore
                obj.initialPosition = obj.position.clone();
                //@ts-ignore
                obj.initialRotation = obj.rotation.clone();
            }

            //@ts-ignore
            obj.time += 0.05;
            // Move object up and down
            //@ts-ignore
            obj.position.y = obj.initialPosition.y + Math.cos(obj.time) * 0.07;

            // Rotate object slightly
            //@ts-ignore
            obj.rotation.x = obj.initialRotation.x + Math.cos(obj.time * 0.25) * 0.02;
            //@ts-ignore
            obj.rotation.z = obj.initialRotation.z + Math.sin(obj.time * 0.5) * 2 * 0.02;
        }
    }

    render(renderer:THREE.WebGLRenderer, target?:THREE.WebGLRenderTarget) {
        renderer.setRenderTarget(target||null)
        renderer.render(this.scene, this.camera)
    }
}

export default MainScene
