import { Squad, Unit } from '../types';

const SQUADS_STORAGE_KEY = 'escarmouche-squads';
const UNITS_STORAGE_KEY = 'escarmouche-units'

export const loadUnits = (): Unit[] => {
  try {
    const stored = localStorage.getItem(UNITS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load units from localStorage:', error);
    return [];
  }
};

export const saveUnits = (units: Unit[]): void => {
  try {
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));
  } catch (error) {
    console.error('Failed to save units to localStorage:', error);
  }
};

export const loadSquads = (): Squad[] => {
  try {
    const stored = localStorage.getItem(SQUADS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load squads from localStorage:', error);
    return [];
  }
};

export const saveSquads = (squads: Squad[]): void => {
  try {
    localStorage.setItem(SQUADS_STORAGE_KEY, JSON.stringify(squads));
  } catch (error) {
    console.error('Failed to save squads to localStorage:', error);
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};