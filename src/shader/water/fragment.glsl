#include <packing>

varying vec2 vUV;
varying vec3 WorldPosition;

uniform sampler2D uSurfaceTexture;
uniform sampler2D uDepthMap;
uniform sampler2D uDepthMap2;
uniform float uTime;
uniform float cameraNear;
uniform float cameraFar;
uniform vec4 uScreenSize;
uniform bool isMask;

float readDepth (sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

float getLinearDepth(vec3 pos) {
    return -(viewMatrix * vec4(pos, 1.0)).z;
}

float getLinearScreenDepth(sampler2D map) {
    vec2 uv = gl_FragCoord.xy * uScreenSize.zw;
    return readDepth(map,uv);
}

void main(){
    vec4 color = vec4(0.0,0.7,1.0,0.5);

    vec2 pos = vUV * 2.0;
    pos.y -= uTime * 0.002;
    vec4 WaterLines = texture2D(uSurfaceTexture,pos);
    color.rgba += WaterLines.r * 0.1;

    //float worldDepth = getLinearDepth(WorldPosition);
    float worldDepth = getLinearScreenDepth(uDepthMap2);
    float screenDepth = getLinearScreenDepth(uDepthMap);
    float foamLine = clamp((screenDepth - worldDepth),0.0,1.0) ;

    if(foamLine < 0.001){
        color.rgba += 0.2;
    }

    if(isMask){
        color = vec4(1.0);
    }

    gl_FragColor = color;
}
