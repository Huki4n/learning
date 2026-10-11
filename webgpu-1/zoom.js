export class Zoom {
  constructor(canvas) {
    this.scale = 1;
  }

  zoom(event) {
    this.scale += event.deltaY / 100;
  }

  getScale() {
    return this.scale;
  }
}
