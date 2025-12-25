import React, { useState } from 'react';
import { nativeSTTService, type STTResult } from '../services/nativeSTTService';
import { Mic, MicOff } from 'lucide-react';

const STTTestPage: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startListening = async () => {
    addLog('🎤 Starting STT test...');
    setError('');
    setTranscript('');
    setInterimTranscript('');

    // Check browser compatibility
    const compatibility = nativeSTTService.getBrowserCompatibility();
    addLog(`🌐 Browser: ${compatibility.browserName}, Supported: ${compatibility.isSupported}, WebKit: ${compatibility.hasWebkitPrefix}`);

    if (!nativeSTTService.isSTTSupported()) {
      const errorMsg = 'Speech recognition not supported in this browser';
      setError(errorMsg);
      addLog(`❌ ${errorMsg}`);
      return;
    }

    // Check microphone permission
    const hasPermission = await nativeSTTService.requestMicrophonePermission();
    if (!hasPermission) {
      const errorMsg = 'Microphone permission denied';
      setError(errorMsg);
      addLog(`❌ ${errorMsg}`);
      return;
    }

    addLog('✅ Microphone permission granted');

    const options = {
      language: 'en-IN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    };

    const callbacks = {
      onResult: (result: STTResult) => {
        addLog(`✅ Final result: "${result.transcript}" (confidence: ${result.confidence})`);
        setTranscript(prev => {
          const newText = prev.trim() + (prev.trim() ? ' ' : '') + result.transcript.trim();
          console.log('📝 Updated transcript:', newText);
          return newText;
        });
        setInterimTranscript('');
      },
      onInterimResult: (text: string) => {
        addLog(`⏳ Interim result: "${text}"`);
        setInterimTranscript(text);
      },
      onStart: () => {
        addLog('✅ STT started');
        setIsListening(true);
      },
      onEnd: () => {
        addLog('🔚 STT ended');
        setIsListening(false);
      },
      onError: (errorMsg: string) => {
        addLog(`❌ STT error: ${errorMsg}`);
        setError(errorMsg);
        setIsListening(false);
      },
      onNoMatch: () => {
        addLog('⚠️ No speech detected');
      }
    };

    const success = nativeSTTService.startListening(options, callbacks);
    if (!success) {
      const errorMsg = 'Failed to start speech recognition';
      setError(errorMsg);
      addLog(`❌ ${errorMsg}`);
    } else {
      addLog('✅ STT start command sent');
    }
  };

  const stopListening = () => {
    addLog('🛑 Stopping STT...');
    nativeSTTService.stopListening();
    setIsListening(false);
  };

  const clearLogs = () => {
    setLogs([]);
    setTranscript('');
    setInterimTranscript('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">STT Test Page</h1>
        
        {/* Controls */}
        <div className="bg-surface p-6 rounded-lg mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={false}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
            
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Clear Logs
            </button>
          </div>

          {/* Status */}
          <div className="text-sm text-gray-300">
            Status: {isListening ? '🎤 Listening...' : '⏸️ Stopped'}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg mb-6">
            <h3 className="text-red-400 font-medium mb-2">Error:</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Transcription Display */}
        <div className="bg-surface p-6 rounded-lg mb-6">
          <h3 className="text-white font-medium mb-4">Transcription:</h3>
          <div className="bg-gray-800 p-4 rounded-lg min-h-[100px]">
            <p className="text-white">
              {transcript}
              {interimTranscript && (
                <span className="text-gray-400 italic"> {interimTranscript}</span>
              )}
            </p>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-surface p-6 rounded-lg">
          <h3 className="text-white font-medium mb-4">Debug Logs:</h3>
          <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm text-gray-300 mb-1 font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default STTTestPage;