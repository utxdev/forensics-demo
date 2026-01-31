export type EventType =
    | 'location'
    | 'call'
    | 'sms'
    | 'photo'
    | 'app'
    | 'whatsapp'
    | 'browser'
    | 'log'
    | 'file_event';

export interface MasterEvent {
    timestamp: number; // INTEGER PRIMARY KEY
    eventType: EventType;
    sourceArtifact: string; // Original file path
    contentPreview: string; // First 200 chars or thumbnail
    latitude?: number; // REAL
    longitude?: number; // REAL
    metadata: Record<string, any>; // JSON
    hashSignature: string; // SHA-256

    // Frontend specific
    id: string; // Derived from hash or generated for UI keys
}

export type ViewMode = 'circular' | 'linear' | 'heatmap' | 'map' | 'datalog';

export interface GeoFence {
    id: string;
    type: 'radius' | 'polygon';
    center?: [number, number];
    radius?: number; // meters
    boundary?: [number, number][]; // Polygon points
    name: string;
}
