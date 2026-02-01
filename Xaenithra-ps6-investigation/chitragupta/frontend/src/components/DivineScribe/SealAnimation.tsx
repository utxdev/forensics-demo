import React from 'react';
import { motion } from 'framer-motion';

const SealAnimation: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    duration: 0.5
                }}
                className="relative"
            >
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-red-600 blur-[80px] rounded-full opacity-30 animate-pulse" />

                {/* The Seal Body */}
                <div className="w-64 h-64 bg-red-700 rounded-full border-8 border-red-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_0_30px_rgba(255,0,0,0.3)] flex items-center justify-center p-8">
                    <div className="w-full h-full border-4 border-red-900/50 rounded-full flex flex-col items-center justify-center text-red-900 border-double">
                        <span className="font-display text-5xl mb-2">KARMA</span>
                        <div className="w-full h-[2px] bg-red-900/30 my-1" />
                        <span className="font-serif italic text-xl">SEALED</span>
                        <span className="text-[10px] mt-2 tracking-widest">CHAIN OFFICE OF CUSTODY</span>
                    </div>
                </div>

                {/* Impact Texture (Simulated) */}
                <motion.div
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.2 }}
                    transition={{ delay: 0.2, duration: 0.1 }}
                    className="absolute inset-x-0 -bottom-10 h-2 bg-black blur-md"
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-20 text-amber-500 font-display text-2xl tracking-[10px] glow-text"
            >
                INTEGRITY PRESERVED
            </motion.div>
        </div>
    );
};

export default SealAnimation;
