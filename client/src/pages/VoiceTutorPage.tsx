import React from 'react';
import VoiceChat from '../components/VoiceChat';

const VoiceTutorPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white">Voice Tutor</h1>
                <p className="text-gray-400">
                    Ask questions, clear doubts, or just practice speaking.
                </p>
            </div>
            <VoiceChat />
        </div>
    );
};

export default VoiceTutorPage;
