export type AccessLevel = 1 | 2 | 3;

export const accessLevelLabels: Record<AccessLevel, string> = {
  1: 'Admin',
  2: 'Editor',
  3: 'Viewer',
};
