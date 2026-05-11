export const APP_NAME = import.meta.env.VITE_APP_NAME || 'CrimeWatch';

export const API_TIMEOUT_MS = 20000;

export const ROLE_HOME = {
  citizen: '/home',
  officer: '/officer/dashboard',
  admin: '/admin/dashboard',
};

export const CRIME_TYPE_COLORS = {
  theft: '#D97706',
  robbery: '#EA580C',
  assault: '#DC2626',
  murder: '#991B1B',
  kidnapping: '#7C3AED',
  vandalism: '#CA8A04',
  fraud: '#2563EB',
  harassment: '#DB2777',
  drug_related: '#4F46E5',
  accident: '#0891B2',
  fire: '#C2410C',
  other: '#475569',
};

export const SEVERITY_COLORS = {
  1: '#059669',
  2: '#0F766E',
  3: '#D97706',
  4: '#EA580C',
  5: '#DC2626',
};

export const CRIME_TYPE_LABELS = {
  theft: 'Theft',
  robbery: 'Robbery',
  assault: 'Assault',
  murder: 'Murder',
  kidnapping: 'Kidnapping',
  vandalism: 'Vandalism',
  fraud: 'Fraud',
  harassment: 'Harassment',
  drug_related: 'Drug Related',
  accident: 'Accident',
  fire: 'Fire',
  other: 'Other',
};

export const STATUS_COLORS = {
  pending: '#D97706',
  verified: '#2563EB',
  investigating: '#7C3AED',
  resolved: '#059669',
  rejected: '#DC2626',
};

export const DEFAULT_MAP_CENTER = [22.9734, 78.6569];

export const PAGE_SIZE_OPTIONS = [10, 20, 50];
