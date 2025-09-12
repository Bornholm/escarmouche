import { Squad } from './types';

const STORAGE_KEY = 'escarmouche-squads';

export const loadSquads = (): Squad[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load squads from localStorage:', error);
    return [];
  }
};

export const saveSquads = (squads: Squad[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(squads));
  } catch (error) {
    console.error('Failed to save squads to localStorage:', error);
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};