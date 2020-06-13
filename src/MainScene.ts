import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";

// @ts-ignore
import waterVertShader from "./shader/water/vertex.glsl";
// @ts-ignore
import PostVert from "./shader/post/vert.glsl";
// @ts-ignore
import AAVert from "./shader/aa/vert.glsl";
// @ts-ignore
import waterFragShader from "./shader/water/fragment.glsl";
// @ts-ignore
import PostFrag from "./shader/post/frag.glsl";
// @ts-ignore
import AAFrag from "./shader/aa/frag.glsl";

class MainScene {
    private scene: THREE.Scene
    private camera: THREE.PerspectiveCamera

    private postScene: THREE.Scene
    private postCamera: THREE.OrthographicCamera

    private AAScene: THREE.Scene

    private renderer: THREE.WebGLRenderer
    private controls: OrbitControls
    private mainTarget:THREE.WebGLRenderTarget
    private maskTarget:THREE.WebGLRenderTarget
    private depthTarget:THREE.WebGLRenderTarget
    private depthTarget2:THREE.WebGLRenderTarget
    private AATarget:THREE.WebGLRenderTarget

    private waterMat:THREE.ShaderMaterial
    private postMat:THREE.ShaderMaterial

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x6CC8FFFF)
    }

    uTime: THREE.IUniform = {value: 0.0}
    uSurfaceTexture: THREE.IUniform = {value: null}
    cameraNear: THREE.IUniform = {value: 0}
    cameraFar: THREE.IUniform = {value: 0}
    uDepthMap: THREE.IUniform = {value: null}
    uDepthMap2: THREE.IUniform = {value: null}
    isMask: THREE.IUniform = {value: false}
    uScreenSize: THREE.IUniform = {value: new THREE.Vector4(window.innerWidth, window.innerHeight, 1 / window.innerWidth, 1 / window.innerHeight)}

    models = [
        // {name: "Tugboat", pos: {x: 0, y: -2, z: 0}},
        // {name: "Octopus", pos: {x: 5, y: -5, z: 5}, scale: 0.2},
        // {name: "Lighthouse", pos: {x: -7, y: -5, z: 7}, scale: 0.6}
    ]

    init() {
        //相机
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        // 设置相机位置
        this.camera.position.z = -10;
        this.camera.position.x = 15;
        this.camera.position.y = 5;
        //渲染器
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        //设置分辨率
        this.renderer.setPixelRatio(window.devicePixelRatio);
        //设置画布大小
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        //加入到body
        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.addEventListener('change', this.render.bind(this)); // remove when using animation loop
        this.controls.enableZoom = true;

        const groundGeometry = new THREE.PlaneGeometry(50, 50, 1);
        const groundMat = new THREE.MeshPhongMaterial({color: 0xFFA457, shininess: 0});
        const ground = new THREE.Mesh(groundGeometry, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        this.scene.add(ground);

        //设置灯光
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(1, 1, -1);
        directionalLight.intensity = 0.7;
        this.scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight();
        this.scene.add(ambientLight);

        this.mainTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight,{
            format: THREE.RGBFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            generateMipmaps:false,
            stencilBuffer:false
        });

        this.maskTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight,{
            format: THREE.RGBFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            generateMipmaps:false,
            stencilBuffer:false
        });

        this.depthTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight,{
            format: THREE.RGBFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            generateMipmaps:false,
            stencilBuffer:false,
            depthBuffer:true,
            type: THREE.UnsignedShortType
        });

        this.depthTarget2 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight,{
            format: THREE.RGBFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            generateMipmaps:false,
            stencilBuffer:false,
            depthBuffer:true,
            type: THREE.UnsignedShortType
        });

        this.SetupPost()

        this.SetupAAEffect()

        // Water
        const water = this.CreateWaterMesh();
        water.rotation.x = -Math.PI / 2;
        water.position.y = -1;
        this.scene.add(water);

        this.LoadObjects()

        // window.addEventListener("resize", this.resize.bind(this));

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

    private SetupPost() {

        this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const postMaterial = new THREE.ShaderMaterial({
            vertexShader: PostVert,
            fragmentShader: PostFrag,
            uniforms: {
                uColorBuffer: {value: this.mainTarget.texture},
                uMaskBuffer: {value: this.maskTarget.texture},
                uTime: {value: 0}
            }
        });

        const postPlane = new THREE.PlaneBufferGeometry(2, 2);
        const postQuad = new THREE.Mesh(postPlane, postMaterial);
        const postScene = new THREE.Scene();
        postScene.add(postQuad);

        this.postMat = postMaterial;
        this.postScene = postScene
    }

    private SetupAAEffect() {

        this.AATarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            format: THREE.RGBFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            generateMipmaps:false,
            stencilBuffer:false
        });

        const AAMaterial = new THREE.ShaderMaterial({
            vertexShader: AAVert,
            fragmentShader: AAFrag,
            uniforms: {
                dataTexture: {value: this.AATarget.texture},
                resolution: {value: new THREE.Vector2(window.innerWidth, window.innerHeight)}
            }
        });
        const AAPlane = new THREE.PlaneBufferGeometry(2, 2);
        const AAQuad = new THREE.Mesh(AAPlane, AAMaterial);
        const AAScene = new THREE.Scene();
        AAScene.add(AAQuad);
        this.AAScene = AAScene;
    }

    private CreateWaterMesh(): THREE.Mesh {
        const waterGeometry = new THREE.PlaneGeometry(50, 50, 50, 50);

        const waterLinesTexture = new THREE.TextureLoader().load('assets/textures/WaterTexture.png');
        waterLinesTexture.wrapS = THREE.RepeatWrapping;
        waterLinesTexture.wrapT = THREE.RepeatWrapping;

        this.uSurfaceTexture.value = waterLinesTexture
        this.cameraNear.value = this.camera.near
        this.cameraFar.value = this.camera.far
        this.uDepthMap.value = this.depthTarget.depthTexture
        this.uDepthMap2.value = this.depthTarget2.depthTexture

        const waterMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: this.uTime,
                uSurfaceTexture: this.uSurfaceTexture,
                cameraNear: this.cameraNear,
                cameraFar: this.cameraFar,
                uDepthMap: this.uDepthMap,
                uDepthMap2: this.uDepthMap2,
                isMask: this.isMask,
                uScreenSize: this.uScreenSize
            },
            vertexShader: waterVertShader,
            fragmentShader: waterFragShader,
            transparent: true,
            depthWrite: false
        });
        const water = new THREE.Mesh(waterGeometry, waterMat);
        water.material = waterMat;
        this.waterMat = waterMat
        return water;
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
        this.postMat.uniforms.uTime.value += 0.1;
        this.render();
        requestAnimationFrame(this.update.bind(this));
    }

    private render() {
        // this.renderer.setRenderTarget(this.mainTarget)
        this.renderer.render(this.scene, this.camera);
        // Render the water mask
        // this.isMask.value = true;
        // this.renderer.setRenderTarget(this.maskTarget)
        // this.renderer.render( this.scene, this.camera);
        // this.isMask.value = false;

        // Render onto depth buffer
        // this.waterMat.depthWrite = false;
        // this.renderer.setRenderTarget(this.depthTarget)
        // this.renderer.render( this.scene, this.camera);
        //
        // this.waterMat.depthWrite = true;
        // this.renderer.setRenderTarget(this.depthTarget2)
        // this.renderer.render( this.scene, this.camera );



        // Render post process FX
        // this.renderer.setRenderTarget(this.AATarget)
        // this.renderer.render( this.postScene, this.postCamera );
        // Final Anti-alias effect
        // this.renderer.render( this.AAScene, this.postCamera );
    }
}

export default MainScene
