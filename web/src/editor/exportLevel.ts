import type { LevelConfig } from '../drop/types';

export function exportLevelAsTs(level: LevelConfig): string {
  const json = JSON.stringify(level, null, 2);
  return `import type { LevelConfig } from './types';\n\nexport const testLevel: LevelConfig = ${json};\n`;
}
