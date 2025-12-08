# Requirements Document

## Introduction

This feature enhances the Voice Tutor experience by implementing streaming responses with progressive text-to-speech conversion. Currently, students experience significant lag because the system waits for the complete LLM response before converting it to speech and playing it. This creates an unnatural, disjointed conversation flow. The streaming approach will provide near-instantaneous feedback by generating, converting, and playing audio progressively as the AI generates its response.

## Glossary

- **LLM (Large Language Model)**: The AI system that generates text responses (Gemini or Ollama)
- **TTS (Text-to-Speech)**: Service that converts text to audio (ElevenLabs or browser SpeechSynthesis)
- **Streaming**: Progressive delivery of data in chunks rather than waiting for complete response
- **Sentence Boundary**: Natural break points in text (periods, question marks, exclamation marks)
- **Audio Queue**: Buffer system that manages sequential playback of audio chunks
- **SSE (Server-Sent Events)**: HTTP protocol for server-to-client streaming
- **Voice Tutor**: Interactive voice-based AI tutoring feature
- **Latency**: Time delay between user input and system response
- **Progressive Rendering**: Displaying content incrementally as it becomes available

## Requirements

### Requirement 1: LLM Response Streaming

**User Story:** As a student, I want to see the AI's response appear word-by-word as it's being generated, so that I know the system is actively responding to my question.

#### Acceptance Criteria

1. WHEN a student sends a message THEN the system SHALL stream LLM tokens progressively to the client
2. WHEN tokens are received THEN the system SHALL display them in real-time in the chat interface
3. WHEN streaming begins THEN the system SHALL show a visual indicator within 200 milliseconds of the request
4. WHEN the LLM generates tokens THEN the system SHALL buffer them until a sentence boundary is detected
5. WHEN a sentence boundary is detected THEN the system SHALL emit the complete sentence for TTS processing

### Requirement 2: Progressive Text-to-Speech Conversion

**User Story:** As a student, I want to hear the AI's response start playing within 1-2 seconds of asking my question, so that the conversation feels natural and responsive.

#### Acceptance Criteria

1. WHEN a complete sentence is detected in the stream THEN the system SHALL immediately send it to the TTS service
2. WHEN TTS audio is generated for a sentence THEN the system SHALL queue it for playback without waiting for subsequent sentences
3. WHEN the first audio chunk is ready THEN the system SHALL begin playback within 500 milliseconds
4. WHEN multiple sentences are being processed THEN the system SHALL maintain parallel TTS conversion for up to 3 sentences simultaneously
5. WHEN TTS conversion fails for a sentence THEN the system SHALL fall back to browser TTS without interrupting the stream

### Requirement 3: Seamless Audio Playback Queue

**User Story:** As a student, I want to hear the AI's response flow naturally without gaps or overlaps, so that it sounds like a continuous conversation.

#### Acceptance Criteria

1. WHEN audio chunks are received THEN the system SHALL queue them in order of generation
2. WHEN an audio chunk finishes playing THEN the system SHALL immediately start the next queued chunk
3. WHEN the audio queue is empty and streaming continues THEN the system SHALL wait for the next chunk without showing errors
4. WHEN a student interrupts during playback THEN the system SHALL clear the audio queue and stop all playback
5. WHEN network latency causes gaps THEN the system SHALL buffer at least 2 audio chunks before starting playback

### Requirement 4: Sentence Boundary Detection

**User Story:** As a student, I want the AI's speech to break at natural points, so that the audio sounds natural and is easy to understand.

#### Acceptance Criteria

1. WHEN the system detects a period followed by a space THEN it SHALL treat it as a sentence boundary
2. WHEN the system detects a question mark or exclamation point THEN it SHALL treat it as a sentence boundary
3. WHEN a sentence exceeds 200 characters without a boundary THEN the system SHALL split at the nearest comma or conjunction
4. WHEN processing Hinglish text THEN the system SHALL recognize both English and Devanagari punctuation marks
5. WHEN a sentence is less than 10 characters THEN the system SHALL append it to the next sentence to avoid fragmented audio

### Requirement 5: Client-Side Stream Handling

**User Story:** As a student, I want the interface to remain responsive while the AI is speaking, so that I can interrupt or ask follow-up questions at any time.

#### Acceptance Criteria

1. WHEN streaming is active THEN the system SHALL allow the student to send a new message
2. WHEN a new message is sent during streaming THEN the system SHALL cancel the current stream and audio playback
3. WHEN streaming is active THEN the system SHALL display a visual indicator showing progress
4. WHEN the stream completes THEN the system SHALL update the UI to show the complete message
5. WHEN a network error occurs during streaming THEN the system SHALL display the partial response and show an error indicator

### Requirement 6: Server-Side Streaming Architecture

**User Story:** As a developer, I want the server to efficiently stream responses, so that the system can handle multiple concurrent voice conversations.

#### Acceptance Criteria

1. WHEN the server receives a chat request THEN it SHALL establish an SSE connection for streaming
2. WHEN the LLM generates tokens THEN the server SHALL emit them as SSE events
3. WHEN a sentence boundary is detected THEN the server SHALL emit a sentence-complete event
4. WHEN the LLM completes generation THEN the server SHALL emit a stream-end event and close the connection
5. WHEN an error occurs during streaming THEN the server SHALL emit an error event with details

### Requirement 7: Fallback and Error Handling

**User Story:** As a student, I want the system to gracefully handle errors, so that I can continue my learning session even if some features fail.

#### Acceptance Criteria

1. WHEN ElevenLabs TTS fails THEN the system SHALL fall back to browser TTS without interrupting the conversation
2. WHEN streaming fails THEN the system SHALL fall back to non-streaming mode and display the complete response
3. WHEN the audio queue encounters an error THEN the system SHALL skip the failed chunk and continue with the next
4. WHEN network connectivity is lost THEN the system SHALL display the last received content and show a reconnection indicator
5. WHEN the LLM stream times out THEN the system SHALL display partial content and allow the student to retry

### Requirement 8: Performance Optimization

**User Story:** As a student on a slow network, I want the voice tutor to work smoothly, so that I can learn effectively regardless of my internet speed.

#### Acceptance Criteria

1. WHEN the first sentence is complete THEN the system SHALL have audio playing within 2 seconds of the request
2. WHEN streaming is active THEN the system SHALL use less than 50MB of memory for buffering
3. WHEN multiple audio chunks are queued THEN the system SHALL limit the queue to 5 chunks maximum
4. WHEN TTS conversion is slow THEN the system SHALL continue displaying text without waiting for audio
5. WHEN the network is slow THEN the system SHALL prioritize text streaming over audio delivery

### Requirement 9: User Experience Indicators

**User Story:** As a student, I want to see clear indicators of what the system is doing, so that I understand the state of my conversation.

#### Acceptance Criteria

1. WHEN streaming begins THEN the system SHALL display a "thinking" indicator
2. WHEN text is streaming THEN the system SHALL show a typing animation
3. WHEN audio is playing THEN the system SHALL display a speaking indicator with the current sentence highlighted
4. WHEN audio is queued THEN the system SHALL show a subtle indicator of buffered content
5. WHEN the response is complete THEN the system SHALL remove all progress indicators

### Requirement 10: Conversation Continuity

**User Story:** As a student, I want to interrupt the AI and ask follow-up questions naturally, so that the conversation feels like talking to a real teacher.

#### Acceptance Criteria

1. WHEN a student sends a new message during streaming THEN the system SHALL preserve the partial response in the chat history
2. WHEN a student interrupts audio playback THEN the system SHALL save the full text response even if audio was incomplete
3. WHEN a new conversation starts THEN the system SHALL include previous partial responses in the context
4. WHEN the student clicks on a previous message THEN the system SHALL offer to replay the audio
5. WHEN the conversation history is long THEN the system SHALL maintain context for the last 10 messages
