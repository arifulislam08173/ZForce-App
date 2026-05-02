import ImageResizer from 'react-native-image-resizer';

export async function optimizeFaceImage(uri: string) {
  const resized = await ImageResizer.createResizedImage(
    uri,
    720,
    720,
    'JPEG',
    78,
    0,
    undefined,
    false,
    { mode: 'contain', onlyScaleDown: true }
  );

  return {
    uri: resized.uri,
    name: 'face.jpg',
    type: 'image/jpeg',
  };
}