import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuillIcon } from './icons/DivinityIcons';

interface ScrollEntry {
  id: string;
  text: string;
  timestamp: Date;
  category?: string;
}

interface AnimatedScrollProps {
  entries: ScrollEntry[];
  isUnfurling?: boolean;
  onComplete?: () => void;
}

export const AnimatedScroll: React.FC<AnimatedScrollProps> = ({
  entries,
  isUnfurling = false,
  onComplete,
}) => {
  const [visibleEntries, setVisibleEntries] = useState<string[]>([]);
  const [currentWritingIndex, setCurrentWritingIndex] = useState(-1);

  useEffect(() => {
    if (isUnfurling && entries.length > 0) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < entries.length) {
          setCurrentWritingIndex(index);
          setTimeout(() => {
            setVisibleEntries(prev => [...prev, entries[index - 1]?.id || entries[0].id]);
          }, 800);
          index++;
        } else {
          clearInterval(interval);
          onComplete?.();
        }
      }, 1200);

      return () => clearInterval(interval);
    }
  }, [isUnfurling, entries, onComplete]);

  return (
    <div className="relative scroll-container rounded-lg border border-primary/20 overflow-hidden">
      {/* Scroll decorative top */}
      <div className="h-8 bg-gradient-to-b from-primary/20 to-transparent flex items-center justify-center">
        <div className="w-32 h-2 bg-primary/30 rounded-full" />
      </div>

      {/* Scroll content area */}
      <motion.div
        className="relative min-h-[300px] p-6"
        initial={{ clipPath: 'inset(0 0 100% 0)' }}
        animate={{ clipPath: isUnfurling ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)' }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        {/* Parchment texture overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        </div>

        {/* Writing quill */}
        <AnimatePresence>
          {currentWritingIndex >= 0 && currentWritingIndex < entries.length && (
            <motion.div
              className="absolute right-4 z-10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                y: currentWritingIndex * 60 + 20,
              }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <QuillIcon className="w-8 h-8 text-primary animate-quill-write" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll entries */}
        <div className="space-y-4 relative">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: visibleEntries.includes(entry.id) || index < currentWritingIndex ? 1 : 0,
                x: visibleEntries.includes(entry.id) || index < currentWritingIndex ? 0 : -20,
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-start gap-4"
            >
              {/* Ornate bullet */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary/50 flex items-center justify-center mt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>

              <div className="flex-1">
                {entry.category && (
                  <span className="text-xs font-display text-primary/70 uppercase tracking-wider">
                    {entry.category}
                  </span>
                )}
                <p className="text-foreground font-body text-lg leading-relaxed">
                  {index === currentWritingIndex ? (
                    <span className="quill-cursor">{entry.text}</span>
                  ) : (
                    entry.text
                  )}
                </p>
                <span className="text-xs text-muted-foreground font-mono">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Scroll decorative bottom */}
      <div className="h-8 bg-gradient-to-t from-primary/20 to-transparent flex items-center justify-center">
        <div className="w-32 h-2 bg-primary/30 rounded-full" />
      </div>
    </div>
  );
};
