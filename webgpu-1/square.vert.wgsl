@group(0) @binding(0)
var<uniform> angle: f32;

@group(0) @binding(1)
var<uniform> scale: f32;

@group(0) @binding(2)
var<uniform> center: vec2f;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) position_out: vec2f,
};

@vertex
fn vertexMain(@location(0) position: vec2f) -> VertexOutput {
    let local = position - center;

    let c = cos(angle);
    let s = sin(angle);

    let rotated = vec2f(
        local.x * c + local.y * s,
        -local.x * s + local.y * c
    );

    let zoom = exp2(scale * 0.1);
    let finalPosition = center + rotated * (0.5 * zoom);

    return VertexOutput(vec4f(finalPosition, 0.0, 1.0), finalPosition);
}