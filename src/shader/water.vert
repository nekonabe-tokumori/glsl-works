uniform float uTime;
varying vec2 vUV;
varying vec3 WorldPosition;

#define SCALE 10.0
#define STRENGTH 1.0
#define SPEED 0.4

float calculateSurface(float x, float y) {
    float z = 0.0;
    // 多个随机Sin函数的叠加构造随机波形
    z += (sin(x * 1.0 / SCALE + uTime * SPEED * 1.0) + sin(x * 2.3 / SCALE + uTime * SPEED * 1.5) + sin(x * 3.3 / SCALE + uTime * SPEED * 0.4)) / 3.0;
    z += (sin(y * 0.2 / SCALE + uTime * SPEED * 1.8) + sin(y * 1.8 / SCALE + uTime * SPEED * 1.8) + sin(y * 2.8 / SCALE + uTime * SPEED * 0.8)) / 3.0;
    return z;
}

void main() {
    vec3 pos = position;
    pos.z += cos(pos.x * 5.0 + uTime) * 0.1 * sin(pos.y * 5.0 + uTime);
    //pos.z += STRENGTH * calculateSurface(pos.x, pos.y);
    // // 原点高度保持不变
    //pos.z -= STRENGTH * calculateSurface(0.0, 0.0);
    WorldPosition = pos;
    vUV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(WorldPosition, 1.0);
}
