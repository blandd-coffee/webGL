import { mat4, vec3 } from "gl-matrix";

class Camera {
  id;
  cameraMatrix;
  pos;
  speed;

  constructor() {
    this.cameraMatrix = mat4.create(0);
    this.pos = vec3(0, 2, 0);
    this.speed = 2;
  }
}
