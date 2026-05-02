import api from './api';
import { optimizeFaceImage } from '../utils/faceImage';

export type FaceSample = {
  uri: string;
  label: string;
};

export async function enrollFaceMulti(samples: FaceSample[]) {
  const selected = samples.slice(0, 3);

  if (selected.length < 3) {
    throw new Error('Please capture exactly 3 face photos.');
  }

  const fd = new FormData();

  for (let index = 0; index < selected.length; index++) {
    const sample = selected[index];
    const optimized = await optimizeFaceImage(sample.uri);

    fd.append('photos', {
      uri: optimized.uri,
      name: `face_${sample.label}_${index}.jpg`,
      type: 'image/jpeg',
    } as any);
  }

  fd.append('labels', JSON.stringify(selected.map(x => x.label)));

  const res = await api.post('/face/enroll-multi', fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 45000,
  });

  return res.data;
}