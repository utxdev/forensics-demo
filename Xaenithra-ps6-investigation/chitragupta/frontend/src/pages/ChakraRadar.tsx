import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface ChakraRadarProps {
    threatLevel: 'low' | 'medium' | 'high';
    isScanning: boolean;
}

const ChakraRadar: React.FC<ChakraRadarProps> = ({ threatLevel, isScanning }) => {
    const controls = useAnimation();

    const colors = {
        low: '#00F0FF', // Cyan
        medium: '#FFD700', // Gold
        high: '#FF3333' // Red
    };

    const speed = threatLevel === 'high' ? 0.5 : threatLevel === 'medium' ? 2 : 5;

    useEffect(() => {
        if (isScanning) {
            controls.start({
                rotate: 360,
                transition: { repeat: Infinity, duration: speed, ease: "linear" }
            });
        } else {
            controls.stop();
        }
    }, [isScanning, speed, controls]);

    const currentColor = colors[threatLevel];

    return (
        <div className="relative w-96 h-96 flex items-center justify-center">
            {/* Outer Ring */}
            <motion.div
                className="absolute inset-0 border-4 rounded-full border-dashed"
                style={{ borderColor: currentColor, opacity: 0.3 }}
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: speed * 2, ease: "linear" }}
            />

            {/* Main Chakra */}
            <motion.div
                animate={controls}
                className="w-80 h-80 relative"
            >
                <svg viewBox="0 0 100 100" fill="none" stroke={currentColor} strokeWidth="1.5">
                    {/* Ancient Chakra Pattern Simluated */}
                    <circle cx="50" cy="50" r="45" strokeOpacity="0.8" />
                    <circle cx="50" cy="50" r="10" fill={currentColor} fillOpacity="0.2" />
                    {[...Array(12)].map((_, i) => (
                        <path
                            key={i}
                            d="M50 50 L50 5"
                            transform={`rotate(${i * 30} 50 50)`}
                        />
                    ))}
                    {[...Array(12)].map((_, i) => (
                        <path
                            key={`spike-${i}`}
                            d="M48 5 L50 0 L52 5 Z"
                            fill={currentColor}
                            transform={`rotate(${i * 30} 50 50)`}
                        />
                    ))}
                </svg>
            </motion.div>

            {/* Inner Core */}
            <div className="absolute w-20 h-20 rounded-full bg-black/50 backdrop-blur-md border border-current flex items-center justify-center shadow-[0_0_30px_currentColor]" style={{ color: currentColor }}>
                <span className="font-bold text-lg animate-pulse">{threatLevel.toUpperCase()}</span>
            </div>

            {/* Radar scan line */}
            <motion.div
                className="absolute w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"
                style={{ color: currentColor }}
                animate={{ top: ["0%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
        </div>
    );
};

export default ChakraRadar;
