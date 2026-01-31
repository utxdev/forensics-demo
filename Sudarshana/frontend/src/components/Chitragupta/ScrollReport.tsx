import React from 'react';
import { motion } from 'framer-motion';

interface ScrollReportProps {
    lines: string[];
    onComplete: () => void;
}

const ScrollReport: React.FC<ScrollReportProps> = ({ lines, onComplete }) => {
    React.useEffect(() => {
        const totalDuration = (2 + (lines.length * 0.5) + 1.5) * 1000;
        const timer = setTimeout(() => {
            onComplete();
        }, totalDuration);
        return () => clearTimeout(timer);
    }, [lines, onComplete]);

    return (
        <div className="relative w-full max-w-2xl h-[600px] flex flex-col items-center">
            {/* Top Roll */}
            <div className="w-full h-12 bg-amber-800 rounded-full shadow-lg z-10 border-b-4 border-amber-950 flex items-center justify-center">
                <div className="w-[90%] h-1 bg-amber-500/30"></div>
            </div>

            {/* Paper */}
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="w-[90%] bg-[#F5E6C8] overflow-hidden shadow-2xl relative"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png")' }}
            >
                <div className="p-8 font-serif text-amber-900">
                    <h2 className="text-3xl text-center border-b-2 border-amber-900/20 pb-4 mb-4 font-bold">FORENSIC REPORT</h2>

                    <div className="space-y-2">
                        {lines.map((line, i) => (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 2 + (i * 0.5) }} // Start writing after scroll unfurls
                                className="font-mono text-sm"
                            >
                                <span className="text-amber-700 mx-2">&gt;&gt;</span>
                                {line}
                            </motion.p>
                        ))}
                    </div>

                    {/* Seal appears at the end */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 2 + (lines.length * 0.5) + 0.5, type: 'spring' }}
                        className="absolute bottom-12 right-12 w-32 h-32 rounded-full border-4 border-red-800 flex items-center justify-center rotate-[-12deg] shadow-inner"
                        style={{ background: 'radial-gradient(circle, #ff0000 0%, #990000 100%)', boxShadow: '0 0 10px #ff0000' }}
                    >
                        <div className="text-white text-center font-bold text-xs uppercase tracking-widest p-2 border-2 border-white/50 rounded-full w-28 h-28 flex items-center justify-center">
                            Karma<br />Verified
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Bottom Roll */}
            <motion.div
                initial={{ y: -600 }} // Starts at top
                animate={{ y: 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="w-full h-12 bg-amber-800 rounded-full shadow-lg z-10 border-t-4 border-amber-950 relative -mt-4"
            >
            </motion.div>
        </div>
    );
};

export default ScrollReport;
