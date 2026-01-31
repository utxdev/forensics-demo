import React from 'react';
import { motion } from 'framer-motion';
import { TimelineEvent } from '@/types/forensic';
import { format } from 'date-fns';

interface TimelineVisualizationProps {
  events: TimelineEvent[];
}

const categoryColors = {
  file: 'bg-blue-500',
  network: 'bg-purple-500',
  system: 'bg-amber-500',
  user: 'bg-emerald-500',
  application: 'bg-rose-500',
};

const significanceStyles = {
  low: 'border-muted-foreground/30',
  medium: 'border-accent/50',
  high: 'border-primary/70',
  critical: 'border-destructive ring-2 ring-destructive/30',
};

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({ events }) => {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="relative">
      {/* Decorative header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <h3 className="font-display text-lg text-primary">Event Timeline</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        {Object.entries(categoryColors).map(([category, color]) => (
          <div key={category} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs font-display text-muted-foreground capitalize">{category}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary" />

        <div className="space-y-4">
          {sortedEvents.map((event, index) => (
            <motion.div
              key={index}
              className={`relative pl-8 pr-4 py-3 bg-card rounded-lg border-l-4 ${significanceStyles[event.significance]}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Timeline node */}
              <div className={`absolute left-[-1.75rem] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${categoryColors[event.category]} ring-4 ring-background`} />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`inline-block px-2 py-0.5 text-xs font-display rounded ${categoryColors[event.category]} text-white mb-1`}>
                    {event.category}
                  </span>
                  <p className="text-sm font-body text-foreground">{event.event}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.artifact}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono text-primary">
                    {format(new Date(event.timestamp), 'HH:mm:ss')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.timestamp), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {/* Significance indicator */}
              {event.significance === 'critical' && (
                <div className="absolute -right-1 -top-1">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
