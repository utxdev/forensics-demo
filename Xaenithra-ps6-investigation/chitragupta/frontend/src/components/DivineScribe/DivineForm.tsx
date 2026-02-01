import React from 'react';
import { User, Clipboard, Shield, UserX, MessageSquare, Lock } from 'lucide-react';

interface DivineFormProps {
    metadata: any;
    setMetadata: (data: any) => void;
}

const DivineForm: React.FC<DivineFormProps> = ({ metadata, setMetadata }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setMetadata({ ...metadata, [e.target.name]: e.target.value });
    };

    return (
        <div className="w-full space-y-6">
            <h3 className="text-amber-500 text-lg font-sans border-b border-amber-500/20 pb-2 flex items-center gap-2">
                <Clipboard size={18} /> INVESTIGATION METADATA
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs text-amber-200/50 uppercase tracking-widest flex items-center gap-1">
                        <Lock size={12} /> Case ID
                    </label>
                    <input
                        name="case_id"
                        value={metadata.case_id}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-amber-500/20 rounded p-2 text-amber-100 focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="e.g. CASE-2025-X99"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-amber-200/50 uppercase tracking-widest flex items-center gap-1">
                        <User size={12} /> Investigator
                    </label>
                    <input
                        name="investigator"
                        value={metadata.investigator}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-amber-500/20 rounded p-2 text-amber-100 focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="e.g. Det. Utkarsh"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-amber-200/50 uppercase tracking-widest flex items-center gap-1">
                        <Shield size={12} /> Agency Name
                    </label>
                    <input
                        name="agency"
                        value={metadata.agency}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-amber-500/20 rounded p-2 text-amber-100 focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="e.g. Cyber Cell Unit 1"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-amber-200/50 uppercase tracking-widest flex items-center gap-1">
                        <UserX size={12} /> Suspect Name
                    </label>
                    <input
                        name="suspect"
                        value={metadata.suspect}
                        onChange={handleChange}
                        className="w-full bg-black/40 border border-amber-500/20 rounded p-2 text-amber-100 focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="e.g. John Doe"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs text-amber-200/50 uppercase tracking-widest flex items-center gap-1">
                    <MessageSquare size={12} /> Remarks/Notes
                </label>
                <textarea
                    name="remarks"
                    value={metadata.remarks}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-black/40 border border-amber-500/20 rounded p-2 text-amber-100 focus:border-amber-500 focus:outline-none transition-colors resize-none"
                    placeholder="Case background, observations..."
                />
            </div>
        </div>
    );
};

export default DivineForm;
