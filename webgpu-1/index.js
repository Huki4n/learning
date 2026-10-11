import squareVert from "./square.vert.wgsl";
import squareFrag from "./square.frag.wgsl";
import { Zoom } from "./zoom.js";

function getCenter(vertices) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < vertices.length; i += 2) {
    const x = vertices[i];
    const y = vertices[i + 1];

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  console.log([(minX + maxX) / 2, (minY + maxY) / 2]);

  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

/* eslint-disable array-element-newline, @stylistic/array-element-newline */
// prettier-ignore
let vertices = new Float32Array([
  // Первый треугольник
   0.0,  0.0, // Центр
  -0.4, -0.8, // Слева снизу
   0.4, -0.8, // Справа снизу

  // Второй
   0.0,  0.0,
   0.4, -0.8,
   0.8,  0.0, // Справа

  // Третий
   0.0,  0.0,
   0.8,  0.0,
   0.0,  0.8, // Сверху

  // Четвёртый
  0.0,  0.0,
  0.0,  0.8,
 -0.8,  0.0, // Слева

  // Пятый
   0.0,  0.0,
  -0.8,  0.0,
  -0.4, -0.8,
]);
/* eslint-enable array-element-newline, @stylistic/array-element-newline */

async function main() {
  const zoom = new Zoom();

  const canvas = document.querySelector("canvas");

  // WebGPU device initialization
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }

  const device = await adapter.requestDevice();

  for (let i = 0; i < vertices.length; i += 2) {
    vertices[i] += 0.5; // X
    vertices[i + 1] += 0.2; // Y
  }

  // Canvas configuration
  const context = canvas.getContext("webgpu");
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
  });

  const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  const rotationBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const rotationData = new Float32Array(4);

  const zoomBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const zoomData = new Float32Array(4);

  const centerBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const centerData = new Float32Array(4);
  centerData.set(getCenter(vertices));
  device.queue.writeBuffer(centerBuffer, 0, centerData);

  const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [
      {
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, // Position. Matches @location(0) in the @vertex shader.
      },
    ],
  };

  // Create a pipeline that renders the cell.
  const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: squareVert }),
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: device.createShaderModule({ code: squareFrag }),
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
  });

  const rotationBindGroup = device.createBindGroup({
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: rotationBuffer },
      },
      {
        binding: 1,
        resource: { buffer: zoomBuffer },
      },
      {
        binding: 2,
        resource: { buffer: centerBuffer },
      },
    ],
  });

  let startTime;

  function frame(time) {
    if (startTime === undefined) startTime = time;

    const elapsedSeconds = (time - startTime) / 1000;
    const speed = Math.PI / 2; // 90 градусов в секунду

    rotationData[0] = elapsedSeconds * speed;
    device.queue.writeBuffer(rotationBuffer, 0, rotationData);
    zoomData[0] = zoom.getScale();
    device.queue.writeBuffer(zoomBuffer, 0, zoomData);

    const encoder = device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
          storeOp: "store",
        },
      ],
    });

    pass.setPipeline(cellPipeline);
    pass.setBindGroup(0, rotationBindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2);
    pass.end();

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
