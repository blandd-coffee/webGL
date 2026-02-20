import { mat4, vec3 } from "gl-matrix";

export class Camera {
  static current: Camera;

  name: string;
  public cameraMatrix: mat4 = mat4.create();
  public position: vec3;
  public speed: number;
  public sensitivity: number;

  public pitch: number = 0;
  public yaw: number = 0;

  constructor(
    name: string,
    pos: vec3 = [0, 0, 0],
    speed: number = 6,
    sensitivity: number = 0.2,
  ) {
    Camera.current = this;
    this.name = name;
    this.position = vec3.clone(pos);
    this.speed = speed;
    this.sensitivity = sensitivity * 0.01;
    this.updateMatrix();
  }

  look(deltaX: number, deltaY: number): void {
    this.yaw += deltaX * this.sensitivity;
    this.pitch += deltaY * this.sensitivity;

    if (this.pitch < -1.5) this.pitch = -1.5;
    if (this.pitch > 1.5) this.pitch = 1.5;
  }

  public updateMatrix(): void {
    mat4.identity(this.cameraMatrix);
    mat4.translate(this.cameraMatrix, this.cameraMatrix, this.position);

    mat4.rotateY(this.cameraMatrix, this.cameraMatrix, this.yaw);
    mat4.rotateX(this.cameraMatrix, this.cameraMatrix, this.pitch);
  }

  public updatePosition(input: vec3, dt: number, speedScale: number = 1): void {
    const yawSin: number = Math.sin(this.yaw);
    const yawCos: number = Math.cos(this.yaw);

    const forwardX: number = yawSin * input[2];
    const forwardZ: number = yawCos * input[2];

    const rightX: number = yawCos * input[0];
    const rightZ: number = -yawSin * input[0];

    const velocity = vec3.fromValues(
      rightX + forwardX,
      input[1],
      rightZ + forwardZ,
    );

    if (vec3.length(velocity) > 0) {
      vec3.normalize(velocity, velocity);
      vec3.scale(velocity, velocity, this.speed * speedScale * dt);
      vec3.add(this.position, this.position, velocity);
    }
  }
}
