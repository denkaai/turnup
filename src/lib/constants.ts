export const CAMPUSES = [
  'Thika Technical Training Institute (TTTI)',
  'Gretsa University',
  'Imperial Health Medical College',
  'Kenya Medical Training College - Thika (KMTC Thika)',
  'KCA University - Thika Road',
  'Kenyatta University (KU)',
  'Jomo Kenyatta University (JKUAT)',
  'Zetech University',
  'Co-operative University of Kenya',
  'Catholic University of Eastern Africa (CUEA)'
] as const;

export type Campus = typeof CAMPUSES[number];
