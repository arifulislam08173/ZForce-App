import api from './api';
import { Platform } from 'react-native';
import { optimizeAttendanceFaceImage } from '../utils/faceImage';

async function uriToFilePart(uri: string, filename: string) {
  if (Platform.OS === 'web') {
    const r = await fetch(uri);
    const blob = await r.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }

  return {
    uri,
    name: filename,
    type: 'image/jpeg',
  } as any;
}

function multipartConfig() {
  if (Platform.OS === 'web') {
    return { timeout: 60000 };
  }

  return {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  };
}

export const FieldAPI = {
  getTodayAttendance() {
    return api.get('/attendance/today');
  },

  punchIn: async ({ lat, lng, photoUri }: any) => {
    const fd = new FormData();
    fd.append('lat', String(lat));
    fd.append('lng', String(lng));

    const optimized = await optimizeAttendanceFaceImage(photoUri);
    const filePart = await uriToFilePart(
      optimized.uri,
      `punchin_${Date.now()}.jpg`
    );

    fd.append('photo', filePart as any);

    return api.post('/attendance/punch-in', fd, multipartConfig() as any);
  },

  punchOut: async ({ lat, lng, photoUri }: any) => {
    const fd = new FormData();
    fd.append('lat', String(lat));
    fd.append('lng', String(lng));

    const optimized = await optimizeAttendanceFaceImage(photoUri);
    const filePart = await uriToFilePart(
      optimized.uri,
      `punchout_${Date.now()}.jpg`
    );

    fd.append('photo', filePart as any);

    return api.post('/attendance/punch-out', fd, multipartConfig() as any);
  },
};