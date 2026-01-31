import { useTimeStore } from '../store/timeStore';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';


const TimelineControls = () => {
    const isPlaying = useTimeStore(s => s.isPlaying);
    const togglePlay = useTimeStore(s => s.togglePlay);
    const playbackSpeed = useTimeStore(s => s.playbackSpeed);
    const setPlaybackSpeed = useTimeStore(s => s.setPlaybackSpeed);
    const currentTimestamp = useTimeStore(s => s.currentTimestamp);

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    };

    return (
        <div className="absolute bottom-6 left-6 z-40 bg-cosmic-dark/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col gap-4 shadow-2xl w-80">
            {/* Date Display */}
            <div className="text-center border-b border-white/10 pb-2">
                <div className="text-cosmic-gold text-2xl font-bold font-serif tracking-widest">
                    {formatTime(currentTimestamp)}
                </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6 text-cosmic-ivory">
                <button className="hover:text-cosmic-gold transition-colors">
                    <Rewind size={24} />
                </button>

                <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-cosmic-gold text-cosmic-dark flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,215,0,0.5)]"
                >
                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" ml-1 />}
                </button>

                <button className="hover:text-cosmic-gold transition-colors">
                    <FastForward size={24} />
                </button>
            </div>

            {/* Speed Slider */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] text-white/50 uppercase tracking-widest">
                    <span>Speed: {playbackSpeed}x</span>
                    <span>Divine Flow</span>
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="w-full accent-cosmic-gold h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
            </div>
        </div>
    );
};

export default TimelineControls;
