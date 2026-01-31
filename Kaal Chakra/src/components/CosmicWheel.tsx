import React, { useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html } from '@react-three/drei';
import { useTimeStore } from '../store/timeStore';
import type { MasterEvent } from '../types';

const WHEEL_RADIUS = 10;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const TimeController = () => {
    const isPlaying = useTimeStore(s => s.isPlaying);
    const playbackSpeed = useTimeStore(s => s.playbackSpeed);
    const setTime = useTimeStore(s => s.setTime);

    useFrame((_state, delta) => {
        if (isPlaying) {
            const current = useTimeStore.getState().currentTimestamp;
            // 1 Day per second * Speed
            const MS_PER_SEC = 24 * 60 * 60 * 1000;
            const timeToAdd = delta * playbackSpeed * MS_PER_SEC;
            setTime(current + timeToAdd);
        }
    });
    return null;
}

// Vedic Months/Eras for inscription
const VEDIC_INSCRIPTIONS = [
    "CHAITRA", "VAISHAKHA", "JYESHTHA", "ASHADHA",
    "SHRAVANA", "BHADRAPADA", "ASHVIN", "KARTIKA",
    "MARGASHIRSHA", "PAUSHA", "MAGHA", "PHALGUNA"
];

const VedicTextRing = () => {
    return (
        <group rotation={[Math.PI / 2, 0, 0]}>
            {VEDIC_INSCRIPTIONS.map((text, i) => {
                const angle = (i / 12) * Math.PI * 2;
                // Position logic simplifed to ring
                // const R = WHEEL_RADIUS + 1.5; 

                return (
                    <Text
                        key={i}
                        position={[
                            (WHEEL_RADIUS + 1.2) * Math.sin(angle),
                            (WHEEL_RADIUS + 1.2) * Math.cos(angle),
                            0 // Slight offset Z
                        ]}
                        rotation={[0, 0, -angle]} // Face "up" relative to the wheel center
                        fontSize={0.8}
                        color="#FFD700"
                        font="https://fonts.gstatic.com/s/cinzel/v11/8vIJ7ww63mVu7gt78Uk.woff" // Online font or local
                        // Using a standard serif font feel
                        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        fillOpacity={0.6}
                    >
                        {text}
                    </Text>
                );
            })}
        </group>
    );
};

const EventNode = ({ event, angle }: { event: MasterEvent; angle: number }) => {
    const [hovered, setHovered] = React.useState(false);
    const color = useMemo(() => {
        switch (event.eventType) {
            case 'call': return '#FF4444';
            case 'sms': return '#44FF44';
            case 'photo': return '#4444FF';
            case 'location': return '#FFFF00';
            case 'whatsapp': return '#25D366';
            case 'browser': return '#FFA500';
            default: return '#FFFFFF';
        }
    }, [event.eventType]);

    // Position
    const x = WHEEL_RADIUS * Math.sin(angle);
    const y = WHEEL_RADIUS * Math.cos(angle);

    return (
        <group position={[x, y, 0]}>
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[hovered ? 0.3 : 0.15, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 3 : 1}
                    toneMapped={false}
                />
            </mesh>

            {/* Light Source for "Glow" */}
            {hovered && <pointLight color={color} distance={2} intensity={2} />}

            {hovered && (
                <Html distanceFactor={15}>
                    <div className="bg-cosmic-dark/90 text-cosmic-ivory p-3 rounded-xl text-xs w-48 backdrop-blur-xl border border-cosmic-gold/30 shadow-2xl pointer-events-none transform -translate-y-12">
                        <strong className="block text-cosmic-gold tracking-wider mb-1 border-b border-white/10 pb-1">
                            {event.eventType.toUpperCase()}
                        </strong>
                        <div className="text-[10px] opacity-70 mb-1">{new Date(event.timestamp).toLocaleString()}</div>
                        <div className="truncate font-serif italic">"{event.contentPreview}"</div>
                        {event.latitude && (
                            <div className="mt-1 text-[9px] text-blue-300">
                                📍 {event.latitude.toFixed(4)}, {event.longitude?.toFixed(4)}
                            </div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
};

const EventRing = () => {
    const events = useTimeStore((state) => state.events);
    const currentTimestamp = useTimeStore((state) => state.currentTimestamp);

    const visibleEvents = events;

    return (
        <group rotation={[0, 0, 0]}>
            {visibleEvents.map((event) => {
                const diff = event.timestamp - currentTimestamp;
                const angle = (diff / ONE_YEAR_MS) * Math.PI * 2;
                return <EventNode key={event.id} event={event} angle={angle} />;
            })}
        </group>
    );
};

const WheelRing = () => {
    return (
        <group>
            {/* The Golden Rim */}
            <mesh rotation={[0, 0, 0]}>
                <torusGeometry args={[10, 0.1, 16, 100]} />
                <meshStandardMaterial
                    color="#FFD700"
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>
        </group>
    );
};

const CosmicWheel: React.FC = () => {
    return (
        <div className="w-full h-full relative">
            {/* Overlay Controls */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 text-center pointer-events-none">
                <p className="text-yellow-600 text-xs mb-2">SCROLL TO ROTATE TIME</p>
            </div>

            <Canvas camera={{ position: [0, 0, 25], fov: 45 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFD700" />
                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade />

                <TimeController />

                <group rotation={[0, 0, 0]}>
                    <WheelRing />
                    <VedicTextRing />
                    <EventRing />
                </group>

                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                />
            </Canvas>
        </div>
    );
};

export default CosmicWheel;
