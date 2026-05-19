import ImageResizer from 'react-native-image-resizer';

export type OptimizedFaceImage = {
  uri: string;
  name: string;
  type: 'image/jpeg';
  optimized: true;
};

const ENROLL_IMAGE_MAX_SIZE = 640;
const ENROLL_IMAGE_QUALITY = 72;

const ATTENDANCE_IMAGE_MAX_SIZE = 448;
const ATTENDANCE_IMAGE_QUALITY = 64;

async function resizeFaceImage(
  uri: string,
  maxSize: number,
  quality: number,
): Promise<OptimizedFaceImage> {
  const resized = await ImageResizer.createResizedImage(
    uri,
    maxSize,
    maxSize,
    'JPEG',
    quality,
    0,
    undefined,
    false,
    {
      mode: 'contain',
      onlyScaleDown: true,
    }
  );

  return {
    uri: resized.uri,
    name: 'face.jpg',
    type: 'image/jpeg',
    optimized: true,
  };
}

export async function optimizeFaceImage(uri: string): Promise<OptimizedFaceImage> {
  return resizeFaceImage(uri, ENROLL_IMAGE_MAX_SIZE, ENROLL_IMAGE_QUALITY);
}

export async function optimizeAttendanceFaceImage(
  uri: string,
): Promise<OptimizedFaceImage> {
  return resizeFaceImage(uri, ATTENDANCE_IMAGE_MAX_SIZE, ATTENDANCE_IMAGE_QUALITY);
}
