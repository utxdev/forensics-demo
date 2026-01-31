import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useTimeStore } from '../store/timeStore';
import type { MasterEvent } from '../types';

// Constants
const WHEEL_RADIUS = 15; // Increased radius
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Material Resources
const GLOW_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.1 });
const LINE_MATERIAL = new THREE.LineBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.3 });
const VERTICAL_LINE_GEOMETRY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2, 0), new THREE.Vector3(0, 2, 0)]);

// --- Sub-Components ---

const StarField = () => {
    return <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />;
};

const WheelStructure = () => {
    return (
        <group>
            {/* Main Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[WHEEL_RADIUS, 0.05, 16, 100]} />
                <meshStandardMaterial color="#333" emissive="#555" emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Month Markers (Vedic) */}
            {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const x = (WHEEL_RADIUS + 2) * Math.sin(angle);
                const z = (WHEEL_RADIUS + 2) * Math.cos(angle);
                return (
                    <Billboard key={i} position={[x, 0, z]}>
                        <Text fontSize={0.6} color="#444" outlineColor="#111" outlineWidth={0.02}>
                            {['CHAITRA', 'VAISHAKHA', 'JYESHTHA', 'ASHADHA', 'SHRAVANA', 'BHADRAPADA', 'ASHVIN', 'KARTIKA', 'MARGASHIRSHA', 'PAUSHA', 'MAGHA', 'PHALGUNA'][i]}
                        </Text>
                    </Billboard>
                );
            })}
        </group>
    );
};

const EventParticle = ({ event, currentTimestamp }: { event: MasterEvent, currentTimestamp: number }) => {
    const [hovered, setHovered] = React.useState(false);

    // Calculate Position based on Time Difference from "Now" (currentTimestamp)
    // We map 1 Year to one full circle (2 PI)
    const timeDiff = event.timestamp - currentTimestamp;
    const angle = (timeDiff / YEAR_MS) * Math.PI * 2;

    // Position on the ring
    // We place older events to the "left" (counter-clockwise) or similar, handled by sin/cos
    const x = WHEEL_RADIUS * Math.sin(angle);
    const z = WHEEL_RADIUS * Math.cos(angle);

    // Visual filtering: If event is too far (e.g. > 6 months), fade it out or hide
    // For now we show all but fade opacity
    const isVisible = Math.abs(timeDiff) < YEAR_MS / 2; // Show only 6 months window? Or wrapping?
    // Let's allow wrapping but spiral out? No, simple ring.

    // Color Coding
    const color = useMemo(() => {
        if (event.eventType === 'call') return '#ff4444';
        if (event.eventType === 'sms') return '#44ff44';
        if (event.eventType === 'log') return '#00aaff';
        if (event.eventType === 'file_event') return '#ffcc00';
        return '#ffffff';
    }, [event.eventType]);

    // Scale based on proximity to "now" (angle 0 => position [0, 0, WHEEL_RADIUS] if we assume start at bottom?)
    // Actually [0, 0, R] is cos(0). 

    return (
        <group position={[x, 0, z]}>
            <mesh
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                onPointerOut={(e) => setHovered(false)}
            >
                <sphereGeometry args={[hovered ? 0.4 : 0.2, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 2 : 0.5}
                />
            </mesh>

            {/* Vertical Marker Line to visualize it better on the plane */}
            <lineSegments geometry={VERTICAL_LINE_GEOMETRY}>
                <lineBasicMaterial color={color} opacity={0.2} transparent />
            </lineSegments>

            {hovered && (
                <Html distanceFactor={20} zIndexRange={[100, 0]}>
                    <div className="bg-black/80 border border-white/20 p-2 rounded text-[10px] w-40 text-white backdrop-blur-md">
                        <div className="font-bold text-yellow-500 mb-1">{event.eventType.toUpperCase()}</div>
                        <div>{new Date(event.timestamp).toLocaleString()}</div>
                        <div className="opacity-75 italic truncate">{event.contentPreview}</div>
                    </div>
                </Html>
            )}
        </group>
    );
};

const DataCloud = () => {
    const events = useTimeStore(s => s.events);
    const currentTimestamp = useTimeStore(s => s.currentTimestamp);

    // Memoize visible events to prevent churn? 
    // Actually React handles this well for <1000 items. 

    return (
        <group>
            {events.map((ev) => (
                <EventParticle key={ev.id} event={ev} currentTimestamp={currentTimestamp} />
            ))}
        </group>
    );
}

const CurrentTimeIndicator = () => {
    // A visual indicator of "Now" (The camera looks at this, or this stays static while wheel spins?)
    // In this design, the WHEEL spins (events move) relative to a static marker, OR the logic moves events.
    // My EventParticle logic calculates position based on (event.ts - current.ts).
    // So changing current.ts moves the events.
    // The "Observation Point" is Angle 0. which is [0, 0, RADIUS] (sin0=0, cos0=1).

    return (
        <group position={[0, 0, WHEEL_RADIUS]}>
            <mesh>
                <coneGeometry args={[0.5, 1.5, 4]} />
                <meshStandardMaterial color="white" emissive="white" />
            </mesh>
            <pointLight distance={5} intensity={2} color="white" />

            <Html center position={[0, 2, 0]}>
                <div className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded border border-white/30">
                    FOCUS POINT
                </div>
            </Html>
        </group>
    )
}

const AutoCenterLogic = () => {
    const events = useTimeStore(s => s.events);
    const setTime = useTimeStore(s => s.setTime);
    const hasCentered = useRef(false);

    useEffect(() => {
        if (events.length > 0 && !hasCentered.current) {
            // Find the most recent event or average? 
            // Recent is better for logs.
            const latest = events.reduce((prev, curr) => (curr.timestamp > prev ? curr.timestamp : prev), 0);

            // Or maybe the middle?
            // If we have 2024 and 2020, latest is 2024.
            const earliest = events.reduce((prev, curr) => (curr.timestamp < prev ? curr.timestamp : prev), events[0].timestamp);

            // Set time to the middle of the range to show "some" context? 
            // Or Set to Latest to show "What happened just now?". 
            // User likely wants to see the data.

            console.log("Auto-centering Cosmic Wheel to:", new Date(latest).toLocaleString());
            setTime(latest);
            hasCentered.current = true;
        }
    }, [events, setTime]);

    return null;
}

// --- Main Component ---
const CosmicWheel = () => {
    const eventCount = useTimeStore(s => s.events.length);
    const setTime = useTimeStore(s => s.setTime);
    const currentTimestamp = useTimeStore(s => s.currentTimestamp);

    // Mouse Wheel Handler to scrub time
    const handleWheel = (e: React.WheelEvent) => {
        // e.deltaY
        const SPEED = YEAR_MS / 1000; // Scrub speed
        const delta = e.deltaY;
        setTime(currentTimestamp + (delta * SPEED * 0.05));
    };

    return (
        <div className="w-full h-full relative bg-slate-900" onWheel={handleWheel}>
            <div className="absolute top-4 left-4 z-10 text-white/50 text-xs font-mono">
                <div>COSMIC WHEEL v2.0</div>
                <div>EVENTS: {eventCount}</div>
                <div>FOCUS: {new Date(currentTimestamp).toLocaleString()}</div>
            </div>

            <Canvas camera={{ position: [0, 15, 25], fov: 50 }}>
                <color attach="background" args={['#050510']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 20, 0]} intensity={2} />

                <StarField />
                <WheelStructure />
                <DataCloud />
                <CurrentTimeIndicator />
                <AutoCenterLogic />

                <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2} minDistance={5} maxDistance={50} />
            </Canvas>
        </div>
    );
};

export default CosmicWheel;
