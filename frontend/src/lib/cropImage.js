function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

const MAX_AVATAR_DIMENSION = 512;

export async function getCroppedImage(imageSrc, pixelCrop, mimeType = "image/jpeg") {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  const scale = Math.min(
    1,
    MAX_AVATAR_DIMENSION / pixelCrop.width,
    MAX_AVATAR_DIMENSION / pixelCrop.height
  );
  const outputWidth = Math.round(pixelCrop.width * scale);
  const outputHeight = Math.round(pixelCrop.height * scale);

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to crop image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      0.92
    );
  });
}
