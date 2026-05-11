import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { CRIME_TYPE_LABELS } from './constants';

dayjs.extend(relativeTime);

export const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return dayjs(value).format('DD MMM YYYY, hh:mm A');
};

export const formatRelativeTime = (value) => {
  if (!value) return 'N/A';
  return dayjs(value).fromNow();
};

export const formatCrimeType = (crimeType) => {
  if (!crimeType) return 'Unknown';
  return CRIME_TYPE_LABELS[crimeType] || crimeType;
};

export const clampText = (text, length = 120) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
};

export const formatNumber = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat('en-IN').format(number);
};

export const formatFileSize = (bytes = 0) => {
  const value = Number(bytes);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(2)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};