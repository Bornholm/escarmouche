/**
 * Converts a File object to a base64 data URL
 * @param file The image file to convert
 * @returns Promise that resolves to a base64 data URL string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Validates if a file is a valid image and within size limits
 * @param file The file to validate
 * @param maxSizeInMB Maximum file size in megabytes (default: 5MB)
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateImageFile = (file: File, maxSizeInMB: number = 5): { isValid: boolean; error?: string } => {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Le fichier doit être une image' };
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return { isValid: false, error: `L'image doit faire moins de ${maxSizeInMB}MB` };
  }

  // Check for supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return { isValid: false, error: 'Format d\'image non supporté. Utilisez JPG, PNG, GIF ou WebP' };
  }

  return { isValid: true };
};

/**
 * Resizes an image to fit within specified dimensions while maintaining aspect ratio
 * @param base64 The base64 data URL of the image
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @returns Promise that resolves to a resized base64 data URL
 */
export const resizeImage = (base64: string, maxWidth: number = 400, maxHeight: number = 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and resize the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert back to base64
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(resizedBase64);
    };

    img.src = base64;
  });
};