import api from './api';

export type FaceSample = {
  uri: string;
  label: string;
};

export async function enrollFaceMulti(samples: FaceSample[]) {
  const fd = new FormData();

  samples.forEach((sample, index) => {
    fd.append('photos', {
      uri: sample.uri,
      name: `face_${sample.label}_${index}.jpg`,
      type: 'image/jpeg',
    } as any);
  });

  fd.append('labels', JSON.stringify(samples.map((x) => x.label)));

  const res = await api.post('/face/enroll-multi', fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}