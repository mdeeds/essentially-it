export class Shaders {
  static sinplex = `
  float noise3to1(in vec3 p) {
    const mat3 m = mat3(
      1.0, 0.0, 0.0,
      0.5, 1.2, 0.0,
      0.0, 0.0, 1.0);
  
    vec3 s = m * p;
  
    return sin(s.x) * sin(s.y) * sin(s.z);
  }
  
  vec3 noise3to3(in vec3 p) {
    return vec3(
      noise3to1(p.xyz + vec3(1, 2, 3) * vec3(0.9, 0.7, 1.3)),
      noise3to1(p.zyx + vec3(7, 9, 8) * vec3(0.5, 1.2, 1.1)),
      noise3to1(p.yxz + vec3(3, 2, 5) * vec3(0.8, 0.3, 1.5)));
  }
  
  vec3 brown(in vec3 p) {
    return 0.5 * noise3to3(p) + 0.2 * noise3to3(p * 3.0) + 0.1 * noise3to3(p * 5.0);
  
  }
  
  vec3 grey(in vec3 p) {
    return brown(brown(p * 0.1) * 5.0);
  }
`;
}