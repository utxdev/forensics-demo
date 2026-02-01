import type { MasterEvent, EventType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const EVENT_TYPES: EventType[] = ['location', 'call', 'sms', 'photo', 'app', 'whatsapp', 'browser'];

// Utils
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomHash = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Delhi Coordinates
const DELHI_LAT = 28.6139;
const DELHI_LNG = 77.2090;

const SAMPLE_CONTENT = {
    call: ['Incoming Call from +91-98765XXXXX', 'Outgoing Call to Home', 'Missed Call from Unknown'],
    sms: ['OTP: 123456', 'Hey, where are you?', 'Your account has been debited...'],
    whatsapp: ['(Encrypted) Message from Rahul', 'Image received', 'Location shared'],
    browser: ['Visited google.com', 'Searched for "time travel"', 'Accessed gmail.com'],
    photo: ['IMG_20240101.jpg', 'DCIM/Camera/IMG_002.jpg'],
    app: ['Opened WhatsApp', 'Calculator used', 'Maps running in background']
};

export const generateMockEvents = (count: number = 700): MasterEvent[] => {
    const events: MasterEvent[] = [];
    const now = Date.now();
    const range = 365 * 24 * 60 * 60 * 1000; // 1 Year

    for (let i = 0; i < count; i++) {
        const timeOffset = randomInt(0, range);
        const timestamp = now - timeOffset;
        const type = randomItem(EVENT_TYPES);

        let content = 'Data Point';
        if (type !== 'location' && type !== 'app' && SAMPLE_CONTENT[type as keyof typeof SAMPLE_CONTENT]) {
            content = randomItem(SAMPLE_CONTENT[type as keyof typeof SAMPLE_CONTENT]);
        } else if (type === 'location') {
            content = 'Lat/Lng recorded';
        }

        const hasLocation = type === 'location' || type === 'photo' || Math.random() > 0.7;

        events.push({
            id: uuidv4(),
            timestamp, // Primary Key
            eventType: type,
            sourceArtifact: `${type}_db.sqlite`,
            contentPreview: content,
            latitude: hasLocation ? DELHI_LAT + (Math.random() - 0.5) * 0.1 : undefined,
            longitude: hasLocation ? DELHI_LNG + (Math.random() - 0.5) * 0.1 : undefined,
            metadata: {
                accuracy: randomInt(10, 100),
                device: 'Pixel 7 Pro'
            },
            hashSignature: randomHash()
        });
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
};
