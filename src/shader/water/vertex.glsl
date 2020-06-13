uniform float uTime;
varying vec2 vUV;
varying vec3 WorldPosition;

void main() {
    vec3 pos = position;
    pos.z += cos(pos.x*5.0+uTime) * 0.1 * sin(pos.y * 5.0 + uTime);
    WorldPosition = pos;
    vUV = uv;

    //gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
}
