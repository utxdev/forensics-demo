import { create } from 'zustand';
import type { MasterEvent, GeoFence, ViewMode } from '../types';

interface TimeState {
    currentTimestamp: number;
    zoomLevel: number; // 1 = Year, 10 = Day
    isPlaying: boolean;
    playbackSpeed: number;
    viewMode: ViewMode; // New View State
    events: MasterEvent[];
    geoFences: GeoFence[];

    // Actions
    setTime: (timestamp: number) => void;
    setZoom: (zoom: number) => void;
    togglePlay: () => void;
    setPlaybackSpeed: (speed: number) => void;
    setViewMode: (mode: ViewMode) => void;
    setEvents: (events: MasterEvent[]) => void;
    addGeoFence: (fence: GeoFence) => void;
    removeGeoFence: (id: string) => void;
}

export const useTimeStore = create<TimeState>((set) => ({
    currentTimestamp: Date.now(),
    zoomLevel: 1,
    isPlaying: false,
    playbackSpeed: 1,
    viewMode: 'circular', // Default
    events: [],
    geoFences: [],

    setTime: (timestamp) => set({ currentTimestamp: timestamp }),
    setZoom: (zoom) => set({ zoomLevel: zoom }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setEvents: (events) => set({ events }),
    addGeoFence: (fence) => set((state) => ({ geoFences: [...state.geoFences, fence] })),
    removeGeoFence: (id) => set((state) => ({ geoFences: state.geoFences.filter(f => f.id !== id) })),
}));
