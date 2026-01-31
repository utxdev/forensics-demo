import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportGenerationState } from '@/types/forensic';
import { QuillIcon, ScrollIcon, SealIcon, HashIcon } from './icons/DivinityIcons';

interface ReportGeneratorAnimationProps {
  state: ReportGenerationState;
}

const phaseIcons = {
  idle: ScrollIcon,
  hashing: HashIcon,
  analyzing: QuillIcon,
  generating: ScrollIcon,
  signing: SealIcon,
  complete: SealIcon,
};

const phaseMessages = {
  idle: 'Awaiting your command...',
  hashing: 'Computing sacred hashes...',
  analyzing: 'The Divine Scribe analyzes artifacts...',
  generating: 'Inscribing the eternal record...',
  signing: 'Applying the Karma Seal...',
  complete: 'The record has been sealed!',
};

export const ReportGeneratorAnimation: React.FC<ReportGeneratorAnimationProps> = ({ state }) => {
  const Icon = phaseIcons[state.phase];
  const message = state.message || phaseMessages[state.phase];

  return (
    <div className="relative flex flex-col items-center justify-center py-12">
      {/* Glowing background circle */}
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(43 80% 55% / 0.2) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Icon */}
      <motion.div
        className="relative z-10"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Icon className="w-16 h-16 text-primary" />
      </motion.div>

      {/* Message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={state.phase}
          className="mt-6 font-display text-lg text-foreground text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {message}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      {state.phase !== 'idle' && state.phase !== 'complete' && (
        <div className="w-64 mt-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${state.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {state.progress.toFixed(0)}%
          </p>
          {state.currentFile && (
            <p className="text-center text-xs text-muted-foreground mt-1 truncate">
              Processing: {state.currentFile}
            </p>
          )}
        </div>
      )}

      {/* Phase indicators */}
      <div className="flex items-center gap-2 mt-8">
        {(['hashing', 'analyzing', 'generating', 'signing'] as const).map((phase, index) => (
          <React.Fragment key={phase}>
            <motion.div
              className={`w-3 h-3 rounded-full border-2 ${
                state.phase === phase
                  ? 'bg-primary border-primary'
                  : ['hashing', 'analyzing', 'generating', 'signing'].indexOf(state.phase) > index
                  ? 'bg-primary/50 border-primary/50'
                  : 'bg-transparent border-muted-foreground/30'
              }`}
              animate={state.phase === phase ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            {index < 3 && (
              <div className={`w-8 h-0.5 ${
                ['hashing', 'analyzing', 'generating', 'signing'].indexOf(state.phase) > index
                  ? 'bg-primary/50'
                  : 'bg-muted-foreground/20'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
