export async function compressAndStripExif(file: File, maxWidthOrHeight = 1280): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2d context"));
          return;
        }

        // Draw image without EXIF (browser naturally discards EXIF when drawing to canvas)
        ctx.drawImage(img, 0, 0, width, height);

        // Convert back to blob, defaulting to webp/jpeg to keep size small
        canvas.toBlob(
          (blob) => {
            if (blob) {
              if (blob.size > 2 * 1024 * 1024) {
                // If still over 2MB, maybe try a lower quality, though at 1280px it rarely hits 2MB.
                // Re-export with lower quality
                canvas.toBlob(
                  (smallerBlob) => {
                    if (smallerBlob) resolve(smallerBlob);
                    else reject(new Error("Failed to compress image"));
                  },
                  "image/jpeg",
                  0.7,
                );
              } else {
                resolve(blob);
              }
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          "image/jpeg",
          0.9,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
