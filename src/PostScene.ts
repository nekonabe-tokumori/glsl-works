import * as THREE from "three";

// @ts-ignore
import PostVert from "./shader/post/post.vert";
// @ts-ignore
import PostFrag from "./shader/post/post.frag";

class PostScene {
    private scene: THREE.Scene
    private camera: THREE.OrthographicCamera
    private uTime: THREE.IUniform
    public uColorBuffer: THREE.IUniform = {value:null}
    public uMaskBuffer: THREE.IUniform = {value:null}

    constructor(renderer: THREE.WebGLRenderer) {
        this.scene = new THREE.Scene()
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.uTime = {value: 0}
        this.init(renderer)
    }

    private init(renderer: THREE.WebGLRenderer) {
        const material = new THREE.ShaderMaterial({
            vertexShader: PostVert,
            fragmentShader: PostFrag,
            uniforms: {
                uColorBuffer: this.uColorBuffer,
                uMaskBuffer: this.uMaskBuffer,
                uTime: this.uTime
            }
        });

        const planeGeometry = new THREE.PlaneBufferGeometry(2, 2);
        const planeMesh = new THREE.Mesh(planeGeometry, material);
        this.scene.add(planeMesh);
    }

    update() {
        this.uTime.value += 0.1;
    }

    render(renderer: THREE.WebGLRenderer, target?: THREE.WebGLRenderTarget) {
        renderer.setRenderTarget(target||null)
        renderer.render(this.scene, this.camera)
    }
}

export default PostScene