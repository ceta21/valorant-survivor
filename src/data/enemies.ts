import { EnemyDef } from '../game/types';

export const ENEMIES: Record<string, EnemyDef> = {
  grunt:   { id: 'grunt', name: 'Recluta', hp: 14, speed: 64, dmg: 6, r: 11, xp: 1, color: '#c9d1d9', shape: 'circle', behavior: 'chase', minTime: 0, weight: 10 },
  runner:  { id: 'runner', name: 'Corredor', hp: 9, speed: 118, dmg: 7, r: 9, xp: 1.4, color: '#ffb347', shape: 'tri', behavior: 'chase', minTime: 55, weight: 5 },
  tank:    { id: 'tank', name: 'Tanque', hp: 95, speed: 44, dmg: 14, r: 19, xp: 6, color: '#6f7d92', shape: 'square', behavior: 'chase', minTime: 110, weight: 2.5 },
  shooter: { id: 'shooter', name: 'Tirador', hp: 16, speed: 56, dmg: 7, r: 11, xp: 2.2, color: '#4dc3ff', shape: 'diamond', behavior: 'shooter', minTime: 85, weight: 3.5 },
  exploder:{ id: 'exploder', name: 'Explosivo', hp: 12, speed: 92, dmg: 26, r: 11, xp: 2, color: '#ff5a36', shape: 'spike', behavior: 'exploder', minTime: 140, weight: 3 },
  elite:   { id: 'elite', name: 'Élite', hp: 260, speed: 62, dmg: 20, r: 17, xp: 22, color: '#ff4655', shape: 'hex', behavior: 'elite', minTime: 200, weight: 0 },
  boss1: {
    id: 'boss1', name: 'Centinela', hp: 1500, speed: 52, dmg: 24, r: 34, xp: 120, color: '#ff4655', shape: 'boss',
    behavior: 'boss', minTime: 150, weight: 0, patterns: ['slam', 'ring'],
  },
  boss2: {
    id: 'boss2', name: 'Cazador', hp: 3600, speed: 58, dmg: 28, r: 38, xp: 220, color: '#ff9f3d', shape: 'boss',
    behavior: 'boss', minTime: 300, weight: 0, patterns: ['charge', 'ring', 'summon', 'slam'],
  },
  boss3: {
    id: 'boss3', name: 'Titán', hp: 7000, speed: 54, dmg: 32, r: 44, xp: 360, color: '#b05cff', shape: 'boss',
    behavior: 'boss', minTime: 450, weight: 0, patterns: ['spiral', 'slam', 'charge', 'summon'],
  },
  final: {
    id: 'final', name: 'Cabecilla del Protocolo', hp: 13000, speed: 60, dmg: 36, r: 52, xp: 1000, color: '#ffffff', shape: 'boss',
    behavior: 'boss', minTime: 540, weight: 0, patterns: ['ring', 'spiral', 'slam', 'charge', 'summon'],
  },
};
export const SPAWNABLE = ['grunt', 'runner', 'tank', 'shooter', 'exploder'];
export const BOSS_SCHEDULE: { time: number; id: string }[] = [
  { time: 150, id: 'boss1' }, { time: 300, id: 'boss2' }, { time: 450, id: 'boss3' }, { time: 540, id: 'final' },
];
export const WAVE_TIMES = [100, 190, 260, 345, 420, 490];
export const GAME_DURATION = 600;
