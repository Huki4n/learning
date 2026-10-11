export class Zoom {
  constructor() {
    this.scale = 1;
    document.addEventListener("wheel", this.zoom.bind(this));
  }

  zoom(event) {
    this.scale += event.deltaY / 100;
  }

  getScale() {
    return this.scale;
  }
}
