@fragment
fn fragmentMain(@location(0) position_out: vec2f) -> @location(0) vec4f {
  return vec4f(position_out, position_out.x+position_out.y, 1);
}