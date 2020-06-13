varying vec2 vUv;
uniform sampler2D uColorBuffer;
uniform sampler2D uMaskBuffer;
uniform float uTime;

void main() {
    vec2 pos = vUv;

    float X = pos.x*15.+uTime*0.5;
    float Y = pos.y*15.+uTime*0.5;
    pos.y += cos(X+Y)*0.01*cos(Y);
    pos.x += sin(X-Y)*0.01*sin(Y);

    // Check original position as well as new distorted position
    vec4 maskColor = texture2D(uMaskBuffer, pos);
    vec4 maskColor2 = texture2D(uMaskBuffer, vUv);

    if(maskColor != vec4(1.0) || maskColor2 != vec4(1.0)){
        pos = vUv;
    }

    vec4 color = texture2D(uColorBuffer, pos);
    gl_FragColor = color;
}
