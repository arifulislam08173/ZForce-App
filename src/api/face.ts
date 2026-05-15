import api from './api';
import { optimizeFaceImage } from '../utils/faceImage';

export type FaceSample = {
  uri: string;
  label: string;
  optimized?: boolean;
  remoteVerified?: boolean;
  embedding?: number[];
  quality?: {
    brightness: number;
    sharpness: number;
  };
  detector?: string | null;
};

export type AnalyzeFaceResult = {
  ok: boolean;
  message: string;
  code?: string;
  optimizedUri?: string;
  quality?: {
    brightness: number;
    sharpness: number;
  };
};

export type EnrollmentSampleResult = AnalyzeFaceResult & {
  sample?: FaceSample;
};

function mapFaceError(err: any) {
  const code = err?.response?.data?.code || err?.response?.data?.error;
  const message = err?.response?.data?.message;

  const humanMap: Record<string, string> = {
    PHOTO_REQUIRED: 'Please capture a face photo first.',
    NO_FACE_DETECTED: 'No face detected. Keep your face inside the circle.',
    IMAGE_TOO_DARK: 'The image is too dark. Move to better light.',
    IMAGE_TOO_BLURRY: 'The image is blurry. Hold the phone steady.',
    FACE_TOO_SMALL: 'Move your face a little closer to the camera.',
    INVALID_IMAGE: 'Invalid face image. Please capture again.',
    IMAGE_TOO_LARGE: 'Image is too large. Please capture again.',
    FACE_PROCESSING_FAILED:
      'Face could not be checked clearly. Keep your face centered with good light and try again.',
    FACE_SAMPLE_FAILED:
      'This face angle was not clear enough. Please keep your face visible and capture again.',
    FACE_SERVICE_TIMEOUT: 'Face checking took too long. Please try again.',
    FACE_ANALYZE_FAILED: 'We could not verify this photo. Please retake it.',
    FACE_SERVICE_UNAVAILABLE: 'Face service is not available right now.',
  };

  return {
    code,
    message:
      humanMap[code] ||
      message ||
      'Could not process this face photo. Please try again.',
  };
}

function appendPhoto(fd: FormData, uri: string, name: string) {
  fd.append('photo', {
    uri,
    name,
    type: 'image/jpeg',
  } as any);
}

export async function analyzeFacePhoto(uri: string): Promise<AnalyzeFaceResult> {
  try {
    const optimized = await optimizeFaceImage(uri);

    const fd = new FormData();
    appendPhoto(fd, optimized.uri, 'face_analyze.jpg');

    const res = await api.post('/face/analyze', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    return {
      ok: true,
      message: 'Good photo captured.',
      code: res?.data?.code,
      optimizedUri: optimized.uri,
      quality: res?.data?.data?.quality,
    };
  } catch (err: any) {
    const mapped = mapFaceError(err);
    return {
      ok: false,
      code: mapped.code,
      message: mapped.message,
    };
  }
}

/**
 * Professional enrollment sample flow.
 * This verifies quality and creates the ArcFace embedding immediately after each
 * capture. The final step only stores already-verified embeddings, so the final
 * enrollment feels instant instead of waiting for 3 images to process at once.
 */
export async function prepareFaceEnrollmentSample(
  uri: string,
  label: string,
): Promise<EnrollmentSampleResult> {
  try {
    const optimized = await optimizeFaceImage(uri);

    const fd = new FormData();
    appendPhoto(fd, optimized.uri, `face_${label}_${Date.now()}.jpg`);
    fd.append('label', label);

    const res = await api.post('/face/enroll-sample', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000,
    });

    const data = res?.data?.data || {};

    return {
      ok: true,
      message: 'Face sample secured.',
      code: res?.data?.code,
      optimizedUri: optimized.uri,
      quality: data.quality,
      sample: {
        uri: optimized.uri,
        label: data.label || label,
        optimized: true,
        remoteVerified: true,
        embedding: data.embedding,
        quality: data.quality,
        detector: data.detector || null,
      },
    };
  } catch (err: any) {
    const mapped = mapFaceError(err);
    return {
      ok: false,
      code: mapped.code,
      message: mapped.message,
    };
  }
}

export async function completeFaceEnrollment(samples: FaceSample[]) {
  const selected = samples.slice(0, 3);

  if (selected.length < 3) {
    throw new Error('Please capture exactly 3 face photos.');
  }

  const readySamples = selected.filter(
    sample => sample.remoteVerified && Array.isArray(sample.embedding),
  );

  if (readySamples.length === 3) {
    const res = await api.post(
      '/face/enroll-complete',
      {
        samples: readySamples.map(sample => ({
          label: sample.label,
          embedding: sample.embedding,
        })),
      },
      { timeout: 30000 },
    );

    return res.data;
  }

  return enrollFaceMulti(selected);
}

// Backward-compatible image upload fallback.
export async function enrollFaceMulti(samples: FaceSample[]) {
  const selected = samples.slice(0, 3);

  if (selected.length < 3) {
    throw new Error('Please capture exactly 3 face photos.');
  }

  const fd = new FormData();

  for (let index = 0; index < selected.length; index++) {
    const sample = selected[index];
    const imageUri = sample.optimized
      ? sample.uri
      : (await optimizeFaceImage(sample.uri)).uri;

    fd.append('photos', {
      uri: imageUri,
      name: `face_${sample.label}_${index}.jpg`,
      type: 'image/jpeg',
    } as any);
  }

  fd.append('labels', JSON.stringify(selected.map(x => x.label)));

  const res = await api.post('/face/enroll-multi', fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000,
  });

  return res.data;
}
