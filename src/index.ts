import * as THREE from "three";

import MainScene from "./MainScene";
import PostScene from "./PostScene";
import AAScene from "./AAScene";

function main(){
    const width = window.innerWidth, height = window.innerHeight, dpr = window.devicePixelRatio
    const renderer = new THREE.WebGLRenderer({antialias: true})
    if ( ! renderer.extensions.get( 'WEBGL_depth_texture' ) ) {
        console.error("not support depth texture")
        return;
    }
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height)


    document.body.appendChild(renderer.domElement)

    let scene = new MainScene(renderer)
    let postScene = new PostScene(renderer)
    let aaScene = new AAScene(renderer)

    const mainTarget = new THREE.WebGLRenderTarget(width, height,{
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps:false,
        stencilBuffer:false
    });

    const maskTarget = new THREE.WebGLRenderTarget(width, height,{
        format: THREE.RGBFormat,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps:false,
        stencilBuffer:false
    });

    const depthTarget = new THREE.WebGLRenderTarget(width, height,{
        // format: THREE.RGBFormat,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps:false,
        stencilBuffer:false,
        depthBuffer:true
    });

    depthTarget.depthTexture = new THREE.DepthTexture(width, height)

    const depthTarget2 = new THREE.WebGLRenderTarget(width, height,{
        // format: THREE.RGBFormat,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps:false,
        stencilBuffer:false,
        depthBuffer:true
    });

    depthTarget2.depthTexture = new THREE.DepthTexture(width, height)

    const AATarget = new THREE.WebGLRenderTarget(width, height, {
        format: THREE.RGBFormat,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps:false,
        stencilBuffer:false
    });

    postScene.uColorBuffer.value = mainTarget.texture;
    postScene.uMaskBuffer.value = maskTarget.texture;
    aaScene.dataTexture.value = AATarget.texture;

    const preview:any = document.getElementById('preview');
    preview.width = width;
    preview.height = height;
    preview.style.width = 200 + "px";
    preview.style.height = 200/width*height + "px";
    const ctx = preview.getContext('2d');
    const buffer = new Uint8Array(width * height * 4);
    const clamped = new Uint8ClampedArray(buffer.buffer);
    function update(){
        requestAnimationFrame(update)
        scene.update()
        scene.render(renderer, mainTarget)
        // 调试输出纹理

        postScene.update();
        // Render the water mask
        scene.isMask.value = true;
        scene.render(renderer, maskTarget)
        scene.isMask.value = false;

        // Render onto depth buffer
        scene.uDepthMap.value = null
        scene.uDepthMap2.value = null

        scene.isDepth.value = true;
        scene.waterMat.depthWrite = false;
        scene.render(renderer, depthTarget)
        scene.waterMat.depthWrite = true
        scene.render(renderer, depthTarget2)
        scene.isDepth.value = false;

        scene.uDepthMap2.value = depthTarget2.depthTexture
        scene.uDepthMap.value = depthTarget.depthTexture

        // renderer.readRenderTargetPixels(depthTarget, 0, 0, width, height, buffer);
        // const imageData = new ImageData(clamped, width, height);
        // ctx.putImageData(imageData, 0, 0);

        // postScene.uColorBuffer.value = depthTarget.texture
        // return postScene.render(renderer)

        postScene.render(renderer, AATarget)
        aaScene.render(renderer)
    }

    update();

    // window.addEventListener("resize", this.resize.bind(this));
}

main()