import * as THREE from "three";

// @ts-ignore
import AAVert from "./shader/post/aa.vert";
// @ts-ignore
import AAFrag from "./shader/post/aa.frag";

class AAScene {
    private scene: THREE.Scene
    private camera: THREE.OrthographicCamera
    public dataTexture:THREE.IUniform = {value:null}

    constructor(renderer:THREE.WebGLRenderer) {
        this.scene = new THREE.Scene()
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.init(renderer)
    }

    private init(renderer:THREE.WebGLRenderer){
        const material = new THREE.ShaderMaterial({
            vertexShader: AAVert,
            fragmentShader: AAFrag,
            uniforms: {
                dataTexture:this.dataTexture,
                resolution: {value: new THREE.Vector2(window.innerWidth, window.innerHeight)}
            }
        });

        const planeGeometry = new THREE.PlaneBufferGeometry(2, 2);
        const planeMesh = new THREE.Mesh(planeGeometry, material);
        this.scene.add(planeMesh);
    }

    update(){

    }

    render(renderer:THREE.WebGLRenderer, target?:THREE.WebGLRenderTarget){
        renderer.setRenderTarget(target||null)
        renderer.render(this.scene, this.camera)
    }
}

export default AAScene