import { mat4, vec3 } from "gl-matrix";

/**
 * A class which provides a method of looking around a three dimensional worldspace
 * If there are more then one instance of a camera class, it will default to the most recently genereated one
 */
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

  /**
   *
   * @param name The name of the current camera class
   * @param pos The starting position of the camera
   * @param speed The speed at which the camera moves
   * @param sensitivity The speed at which the camera rotates
   */
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

  /**
   *
   * @param deltaX The change in the mouse's X position
   * @param deltaY The change in the mouse's Y position
   */
  look(deltaX: number, deltaY: number): void {
    this.yaw += deltaX * this.sensitivity * (Math.PI / 180);
    this.pitch += deltaY * this.sensitivity * (Math.PI / 180);

    if (this.pitch < -0.9) this.pitch = -0.9;
    if (this.pitch > 0.9) this.pitch = 0.9; //Radians
  }

  /**Updates the camera matrix */
  public updateMatrix(): void {
    //clean up previous state
    mat4.identity(this.cameraMatrix);
    //update state to the current position
    mat4.translate(this.cameraMatrix, this.cameraMatrix, this.postition);

    //apply rotation (in radians), which determines what people see
    mat4.rotateY(this.cameraMatrix, this.cameraMatrix, this.yaw);
    mat4.rotateX(this.cameraMatrix, this.cameraMatrix, this.pitch);
  }

  /**
   *
   * @param velocities the velocities to move the camera
   * @param dt the change in time
   */
  public updatePosition(velocities: vec3, dt: number): void {
    //sin: left/right
    //cos: Z - forward/backward
    const yawSin: number = Math.sin(this.yaw);
    const yawCos: number = Math.cos(this.yaw);

    //Sin converts the angle into a number that represents X movement forward
    //Cos converts the angle into a number that represents Z movement forward
    const forwardX: number = yawSin;
    const forwardZ: number = yawCos;

    //Cos converts the angle into a number that represents a 90 degree shift from the X forward
    //-Sin converts the angle into a number that represents a 90 degree shift from the Z forward
    const rightX: number = yawCos;
    const rightZ: number = -yawSin;

    //moves the velocities by their direction in X and Z
    const vx = rightX * velocities[0] + forwardX * velocities[2];
    const vz = rightZ * velocities[0] + forwardZ * velocities[2];

    //makes frame independent
    vec3.scale(velocities, [vx, velocities[1], vz], this.speed * dt);

    //finalizes the updade
    vec3.add(this.postition, this.postition, velocities);
  }

  /**
   *
   * @param velocities the velocities to predict
   * @param dt the change in time
   * @returns the new position
   */
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
