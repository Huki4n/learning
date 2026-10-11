@fragment
fn fragmentMain(@location(0) position_out: vec2f) -> @location(0) vec4f {
  let uv = position_out * 0.5 + 0.5;
  return vec4f(uv, 0.5, 1.0);
}