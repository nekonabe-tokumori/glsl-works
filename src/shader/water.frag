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
uniform bool isDepth;

float readDepth (sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}
/**
uScreenSize  vec4(screenWidth, screenHeight, 1/screenWidth, 1/screenHeight)
gl_FragCoord.xy * uScreenSize.zw = (sx/sw, sy/sh) == vUV?
*/

float getLinearScreenDepth(sampler2D map) {
    vec2 uv = gl_FragCoord.xy * uScreenSize.zw;
    return readDepth(map, uv);
}


/**

// MVP变换
vec4 projectedPosition =
		projectionMatrix *
		viewMatrix *
		modelMatrix *
		vec4( finalPosition, 1.0 );

// 透视除法（perspective division）
vec4 normalizedPosition = projectedPosition / projectedPosition.w;

// NDC坐标映射
const mat4 ndcBiasMatrix = mat4( 0.5, 0.0, 0.0, 0.0,
								 0.0, 0.5, 0.0, 0.0,
								 0.0, 0.0, 0.5, 0.0,
								 0.5, 0.5, 0.5, 1.0 );

vec4 ndcPosition = ndcBiasMatrix * normalizedPosition

ndcPosition等价gl_FragCoord
*/

void main(){
    vec4 color = vec4(0.0,0.7,1.0,0.5);

    vec2 pos = vUV * 4.0;
    pos.y -= uTime * 0.005;
    // 表面
    vec4 WaterLines = texture2D(uSurfaceTexture, pos);
    // 水下投影
    vec4 WaterLinesDeep = texture2D(uSurfaceTexture, pos + vec2(-0.1, -0.1));
    color.rgba += WaterLines.r * 0.7 + WaterLinesDeep.r * vec4(0.0, 0.0, 0.9, 0.3);

    // 遮挡深度
    float worldDepth = getLinearScreenDepth(uDepthMap2);
    // 水面全部深度
    float screenDepth = getLinearScreenDepth(uDepthMap);
    float foamLine = clamp((screenDepth - worldDepth),0.0,1.0) ;

    if(foamLine < 0.0005){
        color.rgba += 0.8;
    }

    if(isMask){
        color = vec4(1.0);
    }

    if(isDepth){
        float depth = gl_FragCoord.w * 10.0;
        gl_FragColor = vec4(depth, depth, depth, 1.0);
    }else{
        gl_FragColor = color;
    }
}
