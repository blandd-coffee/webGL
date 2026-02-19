import { mat4, vec3 } from "gl-matrix";

export class Camera {
  static current: Camera;

  name: string;
  public cameraMatrix: mat4 = mat4.create();
  public postition: vec3;
  public grounded: boolean = false;
  public velocity: vec3 = [0, 0, 0];
  public speed: number;
  public sensitivity: number;

  //Camera Lock
  public pitch: number = 0;
  public yaw: number = 0;

  constructor(
    name: string,
    pos: vec3 = [0, 0, 0],
    speed: number = 1,
    sensitivity: number = 1,
  ) {
    Camera.current = this;
    this.name = name;
    this.postition = pos;
    this.speed = speed;
    this.sensitivity = sensitivity * 0.1;
    mat4.translate(this.cameraMatrix, this.cameraMatrix, pos);
  }

  look(deltaX: number, deltaY: number): void {
    this.yaw += deltaX * this.sensitivity * (Math.PI / 180);
    this.pitch += deltaY * this.sensitivity * (Math.PI / 180);

    if (this.pitch < -0.9) this.pitch = -0.9;
    if (this.pitch > 0.9) this.pitch = 0.9; //Radians
  }

  public updateMatrix(): void {
    mat4.identity(this.cameraMatrix);
    mat4.translate(this.cameraMatrix, this.cameraMatrix, this.postition);

    mat4.rotateY(this.cameraMatrix, this.cameraMatrix, this.yaw);
    mat4.rotateX(this.cameraMatrix, this.cameraMatrix, this.pitch);
  }

  public updatePosition(velocities: vec3, dt: number): void {
    //sin: left/right
    //cos: Z - forward/backward
    const yawSin: number = Math.sin(this.yaw);
    const yawCos: number = Math.cos(this.yaw);

    const forwardX: number = yawSin;
    const forwardZ: number = yawCos;

    const rightX: number = yawCos;
    const rightZ: number = -yawSin;

    const vx = rightX * velocities[0] + forwardX * velocities[2];
    const vz = rightZ * velocities[0] + forwardZ * velocities[2];

    vec3.scale(velocities, [vx, velocities[1], vz], this.speed * dt);

    vec3.add(this.postition, this.postition, velocities);
  }

  public predictPosition(velocities: vec3, dt: number): vec3 {
    const newPos: vec3 = vec3.clone(velocities);
    //sin: left/right
    //cos: Z - forward/backward
    const yawSin: number = Math.sin(this.yaw);
    const yawCos: number = Math.cos(this.yaw);

    const forwardX: number = yawSin;
    const forwardZ: number = yawCos;

    const rightX: number = yawCos;
    const rightZ: number = -yawSin;

    const vx = rightX * newPos[0] + forwardX * newPos[2];
    const vz = rightZ * newPos[0] + forwardZ * newPos[2];

    vec3.scale(newPos, [vx, newPos[1], vz], this.speed * dt);

    const predicted: vec3 = vec3.create();
    vec3.add(predicted, this.postition, newPos);
    return predicted;
  }
}
