export type EnrollStep = {
  key: 'front' | 'left' | 'right';
  title: string;
  shortTitle: string;
  subtitle: string;
  hint: string;
  buttonText: string;
};

export const ENROLL_STEPS: EnrollStep[] = [
  {
    key: 'front',
    title: 'Look Straight',
    shortTitle: 'Straight',
    subtitle: 'Keep your face centered and look directly at the camera.',
    hint: 'Keep your eyes open, neutral face, and hold steady.',
    buttonText: 'Capture Straight Face',
  },
  {
    key: 'left',
    title: 'Turn Your Left Side',
    shortTitle: 'Left',
    subtitle: 'Turn your face slightly to your left side.',
    hint: 'Do not rotate too much. Keep your full face visible inside the circle.',
    buttonText: 'Capture Left Side',
  },
  {
    key: 'right',
    title: 'Turn Your Right Side',
    shortTitle: 'Right',
    subtitle: 'Turn your face slightly to your right side.',
    hint: 'Do not rotate too much. Keep your full face visible inside the circle.',
    buttonText: 'Capture Right Side',
  },
];