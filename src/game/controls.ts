// Controles de teclado reasignables. Se guardan como KeyboardEvent.code (independiente de la
// distribución del teclado). Las flechas mueven y Esc pausa siempre, además de lo asignado.
import { t } from '../i18n';

export type Action = 'up' | 'down' | 'left' | 'right' | 'special' | 'secondary' | 'ultimate' | 'pause' | 'reroll' | 'map';
export type KeyMap = Record<Action, string>;

export const DEFAULT_KEYS: KeyMap = {
  up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
  special: 'Space', secondary: 'KeyE', ultimate: 'KeyQ', pause: 'KeyP', reroll: 'KeyR', map: 'KeyM',
};
export const ACTIONS: { id: Action; label: string; group: 'move' | 'ability' | 'other' }[] = [
  { id: 'up', label: 'Arriba', group: 'move' },
  { id: 'down', label: 'Abajo', group: 'move' },
  { id: 'left', label: 'Izquierda', group: 'move' },
  { id: 'right', label: 'Derecha', group: 'move' },
  { id: 'special', label: 'Habilidad principal', group: 'ability' },
  { id: 'secondary', label: 'Habilidad secundaria', group: 'ability' },
  { id: 'ultimate', label: 'Definitiva', group: 'ability' },
  { id: 'pause', label: 'Pausa', group: 'other' },
  { id: 'reroll', label: 'Relanzar mejoras', group: 'other' },
  { id: 'map', label: 'Mapa', group: 'other' },
];
/** Teclas que no se pueden asignar (las usa el propio juego). */
export const RESERVED = ['Escape', 'Digit1', 'Digit2', 'Digit3', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'F5', 'F11', 'F12'];

/** Completa un mapa guardado con los valores por defecto. */
export const normalizeKeys = (k?: Partial<KeyMap>): KeyMap => ({ ...DEFAULT_KEYS, ...(k ?? {}) });

/** Nombre corto de una tecla para mostrar en pantalla. */
export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  const names: Record<string, string> = {
    Space: t('Espacio'), ShiftLeft: 'Shift', ShiftRight: 'Shift D', ControlLeft: 'Ctrl', ControlRight: 'Ctrl D', AltLeft: 'Alt', AltRight: 'Alt Gr',
    Enter: 'Enter', Backspace: '⌫', CapsLock: 'Bloq', Comma: ',', Period: '.', Slash: '/', Semicolon: 'Ñ', Quote: "'", BracketLeft: '[', BracketRight: ']',
    Minus: '-', Equal: '=', Backquote: 'º', Backslash: '\\', IntlBackslash: '<', MetaLeft: 'Win',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  };
  return names[code] ?? code;
}
