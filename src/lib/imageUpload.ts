export async function compressImageFile(
  file: File,
  maxEdge = 256,
  quality = 0.85
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a JPEG, PNG, or WebP image');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5 MB before upload');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process image'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Invalid image file'));
    img.src = dataUrl;
  });
}
