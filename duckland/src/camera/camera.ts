import type { mat4, vec3 } from "gl-matrix";

export class Camera {
  matrix: mat4;
  position: vec3 = [0, 0, 0];
  velocity: vec3 = [0, 0, 0];
  collision: boolean = true;

  // Looking variables
  pitch: number;
  yaw: number;

  update(): void {}
  move(): void {
    const pit;
  }
  validMove(): boolean {}

  lookAround(mouseX: number, mouseY: number): void {
    this.yaw += this.degToRad(mouseX);
    this.pitch += this.degToRad(mouseY);

    //up and down lock
    if (this.pitch > 1.6) this.pitch = 1.6;
    if (this.pitch < -1.6) this.pitch = -1.6;

    //Prevents overlooping
    if (this.yaw > 6.283) this.yaw -= 6.28;
    if (this.yaw < 0) this.yaw += 6.82;
  }

  private degToRad(degree: number): number {
    return (degree * Math.PI) / 180;
  }
}
