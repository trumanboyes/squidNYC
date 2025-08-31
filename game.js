// C64-style Chiptune Music System
class ChiptunePlayer {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 0.7;
        this.currentSong = 0;
        this.sequencerInterval = null;
        this.tempo = 150; // BPM
        this.stepTime = (60 / this.tempo / 4) * 1000; // 16th notes in ms
        this.currentStep = 0;
        this.channels = [];
        
        // Initialize audio context
        this.initAudioContext();
        
        // Create multiple channels for authentic C64 sound (3 channels like SID chip)
        this.createChannels();
        
        // Define classic C64-style chord progressions and melodies
        this.initSongs();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    createChannels() {
        // Create 3 channels like the SID chip
        for (let i = 0; i < 3; i++) {
            this.channels.push({
                oscillator: null,
                gainNode: null,
                filterNode: null,
                waveform: ['sawtooth', 'square', 'triangle'][i % 3],
                volume: [0.3, 0.25, 0.2][i],
                currentNote: null,
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.2
                }
            });
        }
    }
    
    initSongs() {
        // Multiple creative C64-style songs with complex melodies
        this.songs = [
            {
                name: "Pixel Storm",
                channels: [
                    // Channel 1: Complex lead melody with runs and jumps
                    {
                        notes: [
                            'C4', 'D4', 'E4', 'G4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'E4', 'F4', 'G4', 'A4',
                            'G4', 'F4', 'E4', 'D4', 'G4', 'F4', 'E4', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5',
                            'C5', 'A4', 'F4', 'D4', 'G4', 'E4', 'C4', 'A3', 'C4', 'E4', 'G4', 'C5', 'E5', 'D5', 'C5', 'B4',
                            'A4', 'G4', 'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'F4', 'D4', 'G4', 'C4', 'E4', 'G4', 'C5'
                        ],
                        rhythm: [1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 
                                2, 1, 1, 2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4]
                    },
                    // Channel 2: Syncopated bass with walking patterns
                    {
                        notes: [
                            'C2', 'rest', 'C2', 'D2', 'E2', 'rest', 'G2', 'G2', 'F2', 'rest', 'F2', 'E2', 'D2', 'rest', 'G2', 'C2',
                            'G1', 'rest', 'G2', 'A2', 'B2', 'rest', 'C3', 'B2', 'A2', 'rest', 'G2', 'F2', 'E2', 'rest', 'D2', 'C2',
                            'F2', 'rest', 'A2', 'C3', 'F2', 'rest', 'D2', 'F2', 'G2', 'rest', 'C3', 'B2', 'A2', 'rest', 'G2', 'F2',
                            'A2', 'rest', 'F2', 'D2', 'G2', 'rest', 'B2', 'G2', 'C3', 'rest', 'G2', 'E2', 'C2', 'rest', 'G2', 'C2'
                        ],
                        rhythm: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                                1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                    },
                    // Channel 3: Fast arpeggios and counter-melodies
                    {
                        notes: [
                            'E3', 'G3', 'C4', 'E4', 'G3', 'C4', 'E4', 'G4', 'F3', 'A3', 'C4', 'F4', 'A3', 'C4', 'F4', 'A4',
                            'D3', 'G3', 'B3', 'D4', 'G3', 'B3', 'D4', 'G4', 'C3', 'E3', 'G3', 'C4', 'E3', 'G3', 'C4', 'E4',
                            'F3', 'A3', 'D4', 'F4', 'A3', 'D4', 'F4', 'A4', 'G3', 'B3', 'D4', 'G4', 'B3', 'D4', 'G4', 'B4',
                            'E3', 'A3', 'C4', 'E4', 'A3', 'C4', 'E4', 'A4', 'F3', 'G3', 'B3', 'D4', 'G3', 'B3', 'D4', 'G4'
                        ],
                        rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
                                0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
                                0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
                                0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
                    }
                ]
            },
            {
                name: "Neon Nights",
                channels: [
                    // Channel 1: Melodic phrases with chromatic runs
                    {
                        notes: [
                            'A4', 'C5', 'E5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'G4', 'A4', 'B4',
                            'C5', 'B4', 'A4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'F5', 'E5', 'D5', 'C5', 'D5',
                            'E5', 'D5', 'C5', 'B4', 'C5', 'D5', 'E5', 'C5', 'A4', 'F4', 'D4', 'F4', 'A4', 'C5', 'E5', 'A5',
                            'G5', 'E5', 'C5', 'A4', 'F4', 'D4', 'B3', 'D4', 'F4', 'A4', 'C5', 'E5', 'A5', 'G5', 'E5', 'A4'
                        ],
                        rhythm: [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1,
                                1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 4]
                    },
                    // Channel 2: Funky bass with octave jumps
                    {
                        notes: [
                            'A1', 'A2', 'A1', 'C2', 'E2', 'A2', 'E1', 'E2', 'G1', 'G2', 'G1', 'B1', 'D2', 'G2', 'D1', 'G1',
                            'F1', 'F2', 'F1', 'A1', 'C2', 'F2', 'C1', 'F1', 'G1', 'G2', 'G1', 'B1', 'D2', 'G2', 'D1', 'G1',
                            'C2', 'C3', 'C2', 'E2', 'G2', 'C3', 'G1', 'C2', 'F1', 'F2', 'F1', 'A1', 'C2', 'F2', 'A1', 'F1',
                            'D2', 'D3', 'D2', 'F#2', 'A2', 'D3', 'A1', 'D2', 'G1', 'G2', 'B1', 'D2', 'G2', 'D2', 'G1', 'A1'
                        ],
                        rhythm: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                                1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                    },
                    // Channel 3: Rhythmic stabs and fills
                    {
                        notes: [
                            'C4', 'rest', 'E4', 'rest', 'A4', 'rest', 'C5', 'E5', 'B3', 'rest', 'D4', 'rest', 'G4', 'rest', 'B4', 'D5',
                            'A3', 'rest', 'C4', 'rest', 'F4', 'rest', 'A4', 'C5', 'B3', 'rest', 'D4', 'rest', 'G4', 'rest', 'B4', 'D5',
                            'C4', 'E4', 'G4', 'C5', 'rest', 'rest', 'E5', 'C5', 'F3', 'A3', 'C4', 'F4', 'rest', 'rest', 'A4', 'F4',
                            'D4', 'F#4', 'A4', 'D5', 'rest', 'rest', 'F#5', 'D5', 'G3', 'B3', 'D4', 'G4', 'B4', 'D5', 'G5', 'rest'
                        ],
                        rhythm: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                                1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]
                    }
                ]
            },
            {
                name: "Digital Dreams",
                channels: [
                    // Channel 1: Ethereal melody with wide intervals
                    {
                        notes: [
                            'G4', 'C5', 'rest', 'E5', 'D5', 'rest', 'G5', 'F5', 'E5', 'D5', 'C5', 'rest', 'B4', 'A4', 'G4', 'rest',
                            'F4', 'B4', 'rest', 'D5', 'C5', 'rest', 'F5', 'E5', 'D5', 'C5', 'B4', 'rest', 'A4', 'G4', 'F4', 'rest',
                            'E4', 'A4', 'rest', 'C5', 'B4', 'rest', 'E5', 'D5', 'C5', 'B4', 'A4', 'rest', 'G4', 'F4', 'E4', 'rest',
                            'D4', 'G4', 'C5', 'E5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'
                        ],
                        rhythm: [2, 2, 1, 2, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 2, 1, 2, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1,
                                2, 2, 1, 2, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4]
                    },
                    // Channel 2: Pulsing bass with filter sweeps
                    {
                        notes: [
                            'C2', 'C2', 'C3', 'C2', 'C2', 'C3', 'C2', 'C3', 'G1', 'G1', 'G2', 'G1', 'G1', 'G2', 'G1', 'G2',
                            'F1', 'F1', 'F2', 'F1', 'F1', 'F2', 'F1', 'F2', 'G1', 'G1', 'G2', 'G1', 'G1', 'G2', 'G1', 'G2',
                            'A1', 'A1', 'A2', 'A1', 'A1', 'A2', 'A1', 'A2', 'E1', 'E1', 'E2', 'E1', 'E1', 'E2', 'E1', 'E2',
                            'D1', 'D2', 'D1', 'D2', 'G1', 'G2', 'G1', 'G2', 'C1', 'C2', 'C1', 'C2', 'C1', 'C2', 'C1', 'C1'
                        ],
                        rhythm: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                                1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]
                    },
                    // Channel 3: Sparkling high arpeggios
                    {
                        notes: [
                            'C5', 'E5', 'G5', 'C6', 'E5', 'G5', 'C6', 'E6', 'B4', 'D5', 'G5', 'B5', 'D5', 'G5', 'B5', 'D6',
                            'A4', 'C5', 'F5', 'A5', 'C5', 'F5', 'A5', 'C6', 'B4', 'D5', 'G5', 'B5', 'D5', 'G5', 'B5', 'D6',
                            'C5', 'E5', 'A5', 'C6', 'E5', 'A5', 'C6', 'E6', 'G4', 'B4', 'E5', 'G5', 'B4', 'E5', 'G5', 'B5',
                            'F4', 'A4', 'D5', 'F5', 'G4', 'B4', 'D5', 'G5', 'C4', 'E4', 'G4', 'C5', 'E4', 'G4', 'C5', 'E5'
                        ],
                        rhythm: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
                                0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
                                0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
                                0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
                    }
                ]
            }
        ];
    }
    
    // Convert note names to frequencies (12-tone equal temperament)
    noteToFreq(note) {
        const noteMap = {
            'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6,
            'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1,
            'Ab': -1, 'A': 0, 'A#': 1, 'Bb': 1, 'B': 2
        };
        
        const noteName = note.slice(0, -1);
        const octave = parseInt(note.slice(-1));
        const noteNumber = noteMap[noteName];
        const a4 = 440; // A4 = 440 Hz
        
        // Calculate frequency: f = 440 * 2^((n-69)/12) where n is MIDI note number
        const midiNumber = (octave + 1) * 12 + noteNumber + 9;
        return a4 * Math.pow(2, (midiNumber - 69) / 12);
    }
    
    // Create C64-style oscillator with envelope
    createC64Oscillator(channelIndex, frequency) {
        const channel = this.channels[channelIndex];
        
        // Stop previous note
        this.stopChannelNote(channelIndex);
        
        // Create new oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        // Set up C64-style waveform
        oscillator.type = channel.waveform;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Add subtle detuning for more authentic C64 sound
        const detune = (Math.random() - 0.5) * 10;
        oscillator.detune.setValueAtTime(detune, this.audioContext.currentTime);
        
        // Set up filter (C64 had a low-pass filter)
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(3000 + channelIndex * 1000, this.audioContext.currentTime);
        filterNode.Q.setValueAtTime(2, this.audioContext.currentTime);
        
        // Connect: oscillator -> filter -> gain -> master
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        // Set up ADSR envelope
        const now = this.audioContext.currentTime;
        const env = channel.envelope;
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(channel.volume, now + env.attack);
        gainNode.gain.exponentialRampToValueAtTime(channel.volume * env.sustain, now + env.attack + env.decay);
        
        oscillator.start(now);
        
        // Store references
        channel.oscillator = oscillator;
        channel.gainNode = gainNode;
        channel.filterNode = filterNode;
        
        return { oscillator, gainNode, filterNode };
    }
    
    stopChannelNote(channelIndex) {
        const channel = this.channels[channelIndex];
        
        if (channel.oscillator) {
            const now = this.audioContext.currentTime;
            channel.gainNode.gain.cancelScheduledValues(now);
            channel.gainNode.gain.setValueAtTime(channel.gainNode.gain.value, now);
            channel.gainNode.gain.exponentialRampToValueAtTime(0.001, now + channel.envelope.release);
            
            channel.oscillator.stop(now + channel.envelope.release);
            channel.oscillator = null;
            channel.gainNode = null;
            channel.filterNode = null;
        }
    }
    
    playStep() {
        const song = this.songs[this.currentSong];
        
        song.channels.forEach((channelData, channelIndex) => {
            const noteIndex = this.currentStep % channelData.notes.length;
            const note = channelData.notes[noteIndex];
            const duration = channelData.rhythm[noteIndex] || 1;
            
            if (note && note !== 'rest') {
                const frequency = this.noteToFreq(note);
                this.createC64Oscillator(channelIndex, frequency);
            }
        });
        
        this.currentStep++;
    }
    
    start() {
        if (!this.audioContext || this.isPlaying) return;
        
        // Resume audio context if suspended (required by browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.currentStep = 0;
        
        this.sequencerInterval = setInterval(() => {
            if (this.isPlaying && !this.isMuted) {
                this.playStep();
            }
        }, this.stepTime);
    }
    
    pause() {
        this.isPlaying = false;
        if (this.sequencerInterval) {
            clearInterval(this.sequencerInterval);
            this.sequencerInterval = null;
        }
        
        // Stop all playing notes
        this.channels.forEach((_, index) => {
            this.stopChannelNote(index);
        });
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume / 100));
        if (this.masterGainNode && this.audioContext) {
            this.masterGainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
    
    nextSong() {
        this.pause();
        this.currentSong = (this.currentSong + 1) % this.songs.length;
        setTimeout(() => {
            this.start();
        }, 100);
        return this.songs[this.currentSong].name;
    }
    
    getCurrentSongName() {
        return this.songs[this.currentSong].name;
    }
    
    destroy() {
        this.pause();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

class SoundEffectsPlayer {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.enabled = true;
        this.explosionBuffer = null;
        
        this.initAudioContext();
        this.generateExplosionBuffer();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.setValueAtTime(0.6, this.audioContext.currentTime);
        } catch (e) {
            console.warn('Web Audio API not supported for sound effects:', e);
            this.enabled = false;
        }
    }
    
    generateExplosionBuffer() {
        if (!this.audioContext) return;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 2.5; // 2.5 seconds of explosion
        const bufferSize = sampleRate * duration;
        
        // Create stereo buffer for more realistic sound
        this.explosionBuffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);
        
        const leftChannel = this.explosionBuffer.getChannelData(0);
        const rightChannel = this.explosionBuffer.getChannelData(1);
        
        // Generate realistic explosion waveform that sounds like a WAV file
        for (let i = 0; i < bufferSize; i++) {
            const t = i / sampleRate;
            
            // Multiple layers for realistic explosion sound
            
            // Deep bass rumble (20-80 Hz) - main explosion body
            const bassRumble = Math.sin(2 * Math.PI * 35 * t + Math.sin(2 * Math.PI * 3 * t)) * 
                              Math.exp(-t * 1.2) * 0.6;
            
            // Mid-low rumble (80-200 Hz) - explosion texture
            const midRumble = Math.sin(2 * Math.PI * 120 * t + Math.sin(2 * Math.PI * 7 * t)) * 
                             Math.exp(-t * 1.8) * 0.4;
            
            // Sub-bass thump (10-40 Hz) - initial impact
            const subBass = Math.sin(2 * Math.PI * 25 * t) * 
                           Math.exp(-t * 3.0) * 0.8;
            
            // Crack/snap component (300-800 Hz) - initial explosion
            const crack = Math.sin(2 * Math.PI * 500 * t) * 
                         Math.exp(-t * 8.0) * 0.3;
            
            // Noise component for realistic texture
            const noise = (Math.random() * 2 - 1) * 
                         Math.exp(-t * 2.0) * 0.2;
            
            // Apply realistic amplitude envelope
            const envelope = Math.exp(-t * 0.8) * (1 - Math.exp(-t * 15));
            
            // Combine all components
            let sample = (bassRumble + midRumble + subBass + crack + noise) * envelope;
            
            // Apply soft clipping to prevent harsh distortion
            sample = Math.tanh(sample * 1.5) * 0.7;
            
            // Add slight stereo variation for realism
            leftChannel[i] = sample;
            rightChannel[i] = sample * (0.95 + Math.random() * 0.1);
        }
    }
    
    playCrashSound(buildingType, intensity = 1) {
        if (!this.enabled || !this.audioContext) return;
        
        // Resume audio context if needed
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const now = this.audioContext.currentTime;
        
        // Play deep rumble explosion from buffer
        this.playExplosionBuffer(now, intensity);
        
        switch (buildingType) {
            case 'modern':
            case 'supertall':
                this.playGlassCrash(now, intensity);
                break;
            case 'classic':
            case 'institutional':
                this.playConcreteCrash(now, intensity);
                break;
            case 'residential':
            case 'historic':
                this.playBrickCrash(now, intensity);
                break;
            case 'artdeco':
                this.playMetalCrash(now, intensity);
                break;
            case 'bridge':
                this.playStoneCrash(now, intensity);
                break;
            default:
                this.playGenericCrash(now, intensity);
        }
    }
    
    playExplosionBuffer(startTime, intensity) {
        if (!this.explosionBuffer) return;
        
        // Create buffer source node
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        source.buffer = this.explosionBuffer;
        
        // Add some pitch variation for variety (±10%)
        const pitchVariation = 0.9 + Math.random() * 0.2;
        source.playbackRate.setValueAtTime(pitchVariation, startTime);
        
        // Set up low-pass filter to emphasize the deep rumble
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(300, startTime); // Cut high frequencies for deeper sound
        filterNode.Q.setValueAtTime(0.7, startTime);
        
        // Volume control based on intensity
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(intensity * 0.9, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 2.0);
        
        // Connect the audio graph: source -> filter -> gain -> output
        source.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        // Start playback
        source.start(startTime);
        
        // Optional: Add a subtle reverb-like effect for more realism
        this.addExplosionReverb(startTime, intensity);
    }
    
    addExplosionReverb(startTime, intensity) {
        // Create a simple reverb effect using delayed and filtered copies
        for (let i = 0; i < 3; i++) {
            const delayTime = 0.05 + i * 0.03; // 50ms, 80ms, 110ms delays
            const delayedSource = this.audioContext.createBufferSource();
            const delayGain = this.audioContext.createGain();
            const reverbFilter = this.audioContext.createBiquadFilter();
            
            delayedSource.buffer = this.explosionBuffer;
            delayedSource.playbackRate.setValueAtTime(0.95 - i * 0.02, startTime); // Slightly lower pitch for each reflection
            
            // High-cut filter for each reflection (simulates distant echoes)
            reverbFilter.type = 'lowpass';
            reverbFilter.frequency.setValueAtTime(200 - i * 50, startTime);
            
            // Decreasing volume for each reflection
            const reverbVolume = intensity * 0.2 * Math.pow(0.6, i);
            delayGain.gain.setValueAtTime(0, startTime + delayTime);
            delayGain.gain.linearRampToValueAtTime(reverbVolume, startTime + delayTime + 0.01);
            delayGain.gain.exponentialRampToValueAtTime(0.001, startTime + delayTime + 1.5);
            
            delayedSource.connect(reverbFilter);
            reverbFilter.connect(delayGain);
            delayGain.connect(this.masterGainNode);
            
            delayedSource.start(startTime + delayTime);
        }
    }
    
    playGlassCrash(startTime, intensity) {
        // High-pitched shattering sound with multiple frequencies
        const frequencies = [800, 1200, 1600, 2000, 2400];
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(freq + Math.random() * 200, startTime);
            
            // Sharp attack, quick decay for glass shatter effect
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.7 * intensity, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3 + index * 0.05);
            
            // High-pass filter for crisp glass sound
            filterNode.type = 'highpass';
            filterNode.frequency.setValueAtTime(400, startTime);
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });
        
        // Add white noise for shatter texture
        this.addNoiseComponent(startTime, 0.2, 0.3 * intensity, 'highpass', 800);
    }
    
    playConcreteCrash(startTime, intensity) {
        // Low, rumbling crash with debris sounds
        const baseFreq = 80;
        
        for (let i = 0; i < 4; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(baseFreq * (i + 1) + Math.random() * 50, startTime);
            
            // Heavy, sustained crash
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.7 * intensity, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8 + i * 0.1);
            
            // Low-pass filter for muffled concrete sound
            filterNode.type = 'lowpass';
            filterNode.frequency.setValueAtTime(300 + i * 100, startTime);
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 1.0);
        }
        
        // Add rumble with noise
        this.addNoiseComponent(startTime, 0.6, 0.4 * intensity, 'lowpass', 200);
    }
    
    playBrickCrash(startTime, intensity) {
        // Mid-range crash with crumbling texture
        const frequencies = [200, 400, 600, 300];
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(freq + Math.random() * 100, startTime);
            
            // Crumbly attack and decay
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.6 * intensity, startTime + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5 + index * 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.7);
        });
        
        // Add gritty noise for brick texture
        this.addNoiseComponent(startTime, 0.4, 0.35 * intensity, 'bandpass', 400);
    }
    
    playMetalCrash(startTime, intensity) {
        // Metallic clang with reverb-like sustain
        const frequencies = [440, 660, 880, 1100];
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(freq, startTime);
            
            // Sharp metallic attack with ringing sustain
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.8 * intensity, startTime + 0.005);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
            
            // Resonant filter for metallic quality
            filterNode.type = 'bandpass';
            filterNode.frequency.setValueAtTime(freq, startTime);
            filterNode.Q.setValueAtTime(8, startTime);
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 1.3);
        });
    }
    
    playStoneCrash(startTime, intensity) {
        // Heavy, rocky crash with rolling debris
        const frequencies = [120, 180, 240, 160];
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(freq + Math.random() * 60, startTime);
            
            // Heavy stone impact
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.7 * intensity, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9 + index * 0.15);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 1.2);
        });
        
        // Add rolling stone texture
        this.addNoiseComponent(startTime, 0.7, 0.3 * intensity, 'lowpass', 150);
    }
    
    playGenericCrash(startTime, intensity) {
        // Generic building crash - mix of frequencies
        const frequencies = [200, 400, 800, 600];
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(freq + Math.random() * 100, startTime);
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.6 * intensity, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.7);
        });
    }
    
    addNoiseComponent(startTime, duration, volume, filterType, filterFreq) {
        // Create noise buffer
        const bufferSize = this.audioContext.sampleRate * duration;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        
        noiseFilter.type = filterType;
        noiseFilter.frequency.setValueAtTime(filterFreq, startTime);
        
        noiseGain.gain.setValueAtTime(0, startTime);
        noiseGain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGainNode);
        
        whiteNoise.start(startTime);
        whiteNoise.stop(startTime + duration);
    }
    
    setVolume(volume) {
        if (this.masterGainNode && this.audioContext) {
            const scaledVolume = Math.max(0, Math.min(1, volume / 100)) * 0.8; // Increased to 80% for louder explosions
            this.masterGainNode.gain.setValueAtTime(scaledVolume, this.audioContext.currentTime);
        }
    }
}

class SquidNYCGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        this.buildings = [];
        this.destructionParticles = [];
        this.fallingDebris = [];
        this.squid = null;
        this.catapult = null;
        this.isLaunched = false;
        this.gameEnded = false;
        this.celebrationTime = 0;
        this.dancingSquid = null;
        this.dancingOctopus = null;
        
        // Initialize music player
        this.musicPlayer = new ChiptunePlayer();
        
        // Initialize sound effects
        this.soundEffects = new SoundEffectsPlayer();
        
        this.setupControls();
        this.setupMusicControls();
        this.createSkyline();
        this.createCatapult();
        this.gameLoop();
        
        // Auto-start music after a brief delay
        setTimeout(() => {
            this.musicPlayer.start();
            this.updateMusicButtons();
        }, 1000);
        
        // Add restart functionality
        this.setupRestartControls();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    setupControls() {
        const angleSlider = document.getElementById('angleSlider');
        const powerSlider = document.getElementById('powerSlider');
        const angleValue = document.getElementById('angleValue');
        const powerValue = document.getElementById('powerValue');
        const fireButton = document.getElementById('fireButton');
        
        angleSlider.addEventListener('input', (e) => {
            angleValue.textContent = e.target.value;
        });
        
        powerSlider.addEventListener('input', (e) => {
            powerValue.textContent = e.target.value;
        });
        
        fireButton.addEventListener('click', () => {
            if (!this.isLaunched) {
                this.launchSquid();
            }
        });
    }
    
    setupMusicControls() {
        const playBtn = document.getElementById('playMusicBtn');
        const pauseBtn = document.getElementById('pauseMusicBtn');
        const muteBtn = document.getElementById('muteBtn');
        const nextSongBtn = document.getElementById('nextSongBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const songTitle = document.getElementById('songTitle');
        
        playBtn.addEventListener('click', () => {
            this.musicPlayer.start();
            this.updateMusicButtons();
        });
        
        pauseBtn.addEventListener('click', () => {
            this.musicPlayer.pause();
            this.updateMusicButtons();
        });
        
        muteBtn.addEventListener('click', () => {
            const isMuted = this.musicPlayer.toggleMute();
            muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
            muteBtn.classList.toggle('active', isMuted);
        });
        
        nextSongBtn.addEventListener('click', () => {
            const songName = this.musicPlayer.nextSong();
            this.updateSongTitle();
            this.updateMusicButtons();
        });
        
        volumeSlider.addEventListener('input', (e) => {
            this.musicPlayer.setVolume(e.target.value);
            this.soundEffects.setVolume(e.target.value);
        });
        
        // Set initial volume and song title
        this.musicPlayer.setVolume(volumeSlider.value);
        this.soundEffects.setVolume(volumeSlider.value);
        this.updateSongTitle();
    }
    
    updateMusicButtons() {
        const playBtn = document.getElementById('playMusicBtn');
        const pauseBtn = document.getElementById('pauseMusicBtn');
        
        if (this.musicPlayer.isPlaying) {
            playBtn.classList.remove('active');
            pauseBtn.classList.add('active');
        } else {
            playBtn.classList.add('active');
            pauseBtn.classList.remove('active');
        }
    }
    
    updateSongTitle() {
        const songTitle = document.getElementById('songTitle');
        songTitle.textContent = '♫ ' + this.musicPlayer.getCurrentSongName();
    }
    
    createSkyline() {
        const groundLevel = this.canvas.height - 50;
        const w = this.canvas.width;
        
        // Catapult building (shorter, far left - Brooklyn side)
        this.buildings.push(new Building(50, groundLevel - 180, 120, 180, '#8B7D6B', 'Catapult Base', 'residential'));
        
        // Financial District - Downtown Manhattan
        this.buildings.push(new Building(w * 0.18, groundLevel - 420, 60, 420, '#E6E6FA', 'One World Trade Center', 'supertall'));
        this.buildings.push(new Building(w * 0.22, groundLevel - 290, 45, 290, '#C0C0C0', '4 WTC', 'modern'));
        this.buildings.push(new Building(w * 0.25, groundLevel - 195, 35, 195, '#B8860B', 'Financial Building', 'classic'));
        
        // Tribeca/SoHo area
        this.buildings.push(new Building(w * 0.29, groundLevel - 140, 40, 140, '#DDD', 'Tribeca Loft', 'residential'));
        this.buildings.push(new Building(w * 0.32, groundLevel - 160, 35, 160, '#CD853F', 'Cast Iron Building', 'historic'));
        
        // Flatiron District
        this.buildings.push(new Building(w * 0.38, groundLevel - 285, 25, 285, '#F5DEB3', 'Flatiron Building', 'flatiron'));
        
        // Midtown South
        this.buildings.push(new Building(w * 0.42, groundLevel - 240, 55, 240, '#A9A9A9', 'MetLife Building', 'modern'));
        this.buildings.push(new Building(w * 0.46, groundLevel - 320, 40, 320, '#708090', 'Madison Square', 'classic'));
        
        // Midtown Manhattan - The main skyline
        this.buildings.push(new Building(w * 0.52, groundLevel - 381, 50, 381, '#C0C0C0', 'Chrysler Building', 'artdeco'));
        this.buildings.push(new Building(w * 0.58, groundLevel - 443, 65, 443, '#B8B8B8', 'Empire State Building', 'supertall'));
        this.buildings.push(new Building(w * 0.64, groundLevel - 200, 45, 200, '#F0E68C', 'Grand Central Area', 'classic'));
        
        // Midtown East
        this.buildings.push(new Building(w * 0.68, groundLevel - 260, 38, 260, '#DDA0DD', 'UN Plaza', 'modern'));
        this.buildings.push(new Building(w * 0.72, groundLevel - 290, 42, 290, '#20B2AA', 'Seagram Building', 'modern'));
        
        // Upper East Side
        this.buildings.push(new Building(w * 0.76, groundLevel - 180, 35, 180, '#F4A460', 'Upper East Residential', 'residential'));
        this.buildings.push(new Building(w * 0.8, groundLevel - 220, 40, 220, '#9370DB', 'Museum Mile', 'institutional'));
        
        // Roosevelt Island/East River
        this.buildings.push(new Building(w * 0.85, groundLevel - 160, 30, 160, '#87CEEB', 'Roosevelt Island', 'residential'));
        this.buildings.push(new Building(w * 0.88, groundLevel - 140, 25, 140, '#98FB98', 'Waterfront', 'residential'));
        
        // Central Park West (distant)
        this.buildings.push(new Building(w * 0.92, groundLevel - 200, 35, 200, '#F5F5DC', 'Central Park West', 'residential'));
        
        // Sort buildings by x position for proper rendering
        this.buildings.sort((a, b) => a.x - b.x);
    }
    
    createCatapult() {
        const catapultBuilding = this.buildings[0]; // First building (leftmost)
        this.catapult = new Catapult(
            catapultBuilding.x + catapultBuilding.width / 2,
            catapultBuilding.y - 20
        );
    }
    
    launchSquid() {
        const angle = parseFloat(document.getElementById('angleSlider').value);
        const power = parseFloat(document.getElementById('powerSlider').value);
        
        const velocity = (power / 100) * 25; // Max velocity of 25
        const angleRad = (angle * Math.PI) / 180;
        
        this.squid = new Squid(
            this.catapult.x,
            this.catapult.y,
            velocity * Math.cos(angleRad),
            -velocity * Math.sin(angleRad)
        );
        
        this.isLaunched = true;
        document.getElementById('fireButton').disabled = true;
    }
    
    checkCollisions() {
        if (!this.squid) return;
        
        for (let i = 0; i < this.buildings.length; i++) {
            const building = this.buildings[i];
            if (building.checkCollision(this.squid)) {
                // Don't destroy the catapult building (first building at index 0)
                if (i === 0) {
                    // Just bounce the squid off without damage
                    this.squid.vx *= -0.3; // Reverse and reduce horizontal velocity
                    this.squid.vy *= -0.5; // Reduce vertical velocity
                } else {
                    // Play crash sound based on building type
                    const intensity = 0.8 + (this.squid.vx * this.squid.vx + this.squid.vy * this.squid.vy) * 0.01;
                    this.soundEffects.playCrashSound(building.type, Math.min(intensity, 2.0));
                    
                    // Create destruction effect for other buildings
                    this.createDestruction(building, this.squid);
                    
                    // Remove squid
                    this.squid = null;
                    this.isLaunched = false;
                    document.getElementById('fireButton').disabled = false;
                    break;
                }
            }
        }
        
        // Check ground collision
        if (this.squid && this.squid.y > this.canvas.height - 50) {
            this.squid = null;
            this.isLaunched = false;
            document.getElementById('fireButton').disabled = false;
        }
    }
    
    createDestruction(building, squid) {
        const impactX = squid.x;
        const impactY = squid.y;
        
        // Create falling debris from top of building
        const debrisHeight = Math.min(80, building.height * 0.3);
        const topY = building.y;
        
        // Create 2-4 falling chunks from the top
        const numChunks = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < numChunks; i++) {
            const chunkWidth = building.width / numChunks;
            const chunkX = building.x + i * chunkWidth;
            
            this.fallingDebris.push(new FallingDebris(
                chunkX,
                topY,
                chunkWidth,
                debrisHeight,
                building.color,
                building.type,
                (Math.random() - 0.5) * 8, // horizontal velocity
                -Math.random() * 3 - 2     // upward velocity
            ));
        }
        
        // Increment hit count and check for collapse
        building.hit(impactX, impactY);
        
        // Create particles
        const particleCount = building.isCollapsing ? 100 : 30;
        for (let i = 0; i < particleCount; i++) {
            this.destructionParticles.push(new Particle(
                impactX,
                impactY,
                (Math.random() - 0.5) * (building.isCollapsing ? 20 : 10),
                (Math.random() - 0.5) * (building.isCollapsing ? 20 : 10),
                building.color
            ));
        }
    }
    
    update() {
        if (this.gameEnded) {
            this.updateCelebration();
            return;
        }
        
        if (this.squid) {
            this.squid.update();
        }
        
        this.checkCollisions();
        
        // Update particles
        for (let i = this.destructionParticles.length - 1; i >= 0; i--) {
            const particle = this.destructionParticles[i];
            particle.update();
            
            if (particle.life <= 0) {
                this.destructionParticles.splice(i, 1);
            }
        }
        
        // Update building collapse animations
        for (let building of this.buildings) {
            building.update();
        }
        
        // Update falling debris
        for (let i = this.fallingDebris.length - 1; i >= 0; i--) {
            const debris = this.fallingDebris[i];
            debris.update();
            
            // Remove debris that has fallen off screen or hit ground
            if (debris.y > this.canvas.height || debris.life <= 0) {
                this.fallingDebris.splice(i, 1);
            }
        }
        
        // Check for game end (all buildings except catapult base destroyed)
        this.checkGameEnd();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameEnded) {
            this.renderCelebration();
            return;
        }
        
        // Draw ground
        this.ctx.fillStyle = '#4A5D4A';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Draw buildings
        for (let building of this.buildings) {
            building.render(this.ctx);
        }
        
        // Draw catapult
        this.catapult.render(this.ctx);
        
        // Draw squid
        if (this.squid) {
            this.squid.render(this.ctx);
        }
        
        // Draw falling debris
        for (let debris of this.fallingDebris) {
            debris.render(this.ctx);
        }
        
        // Draw particles
        for (let particle of this.destructionParticles) {
            particle.render(this.ctx);
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    checkGameEnd() {
        // Count buildings that are still standing (excluding catapult base at index 0)
        let standingBuildings = 0;
        for (let i = 1; i < this.buildings.length; i++) {
            if (this.buildings[i].height > 10) { // Building is still standing
                standingBuildings++;
            }
        }
        
        if (standingBuildings === 0 && !this.gameEnded) {
            this.startCelebration();
        }
    }
    
    startCelebration() {
        this.gameEnded = true;
        this.celebrationTime = 0;
        
        // Create dancing characters
        this.dancingSquid = new DancingSquid(this.canvas.width * 0.3, this.canvas.height * 0.4);
        this.dancingOctopus = new DancingOctopus(this.canvas.width * 0.7, this.canvas.height * 0.4);
        
        // Hide controls
        document.getElementById('controls').style.display = 'none';
    }
    
    updateCelebration() {
        this.celebrationTime++;
        
        if (this.dancingSquid) {
            this.dancingSquid.update();
        }
        if (this.dancingOctopus) {
            this.dancingOctopus.update();
        }
    }
    
    renderCelebration() {
        // Render celebration screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animated background effects
        const time = this.celebrationTime * 0.02;
        for (let i = 0; i < 50; i++) {
            const x = (Math.sin(time + i) * 200) + this.canvas.width / 2;
            const y = (Math.cos(time * 0.7 + i) * 150) + this.canvas.height / 2;
            const size = Math.sin(time * 2 + i) * 5 + 8;
            
            this.ctx.fillStyle = `hsl(${(time * 50 + i * 20) % 360}, 70%, 60%)`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Congratulations text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#FF4500';
        this.ctx.lineWidth = 4;
        const pulse = Math.sin(this.celebrationTime * 0.1) * 0.1 + 1;
        this.ctx.save();
        this.ctx.scale(pulse, pulse);
        this.ctx.strokeText('CONGRATULATIONS!', this.canvas.width / 2 / pulse, this.canvas.height * 0.2 / pulse);
        this.ctx.fillText('CONGRATULATIONS!', this.canvas.width / 2 / pulse, this.canvas.height * 0.2 / pulse);
        this.ctx.restore();
        
        // Victory message
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.fillText('NYC HAS BEEN LIBERATED!', this.canvas.width / 2, this.canvas.height * 0.3);
        
        // Render dancing characters
        if (this.dancingSquid) {
            this.dancingSquid.render(this.ctx);
        }
        if (this.dancingOctopus) {
            this.dancingOctopus.render(this.ctx);
        }
        
        // Restart instruction
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height * 0.85);
    }
    
    setupRestartControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r' && this.gameEnded) {
                this.restartGame();
            }
        });
    }
    
    restartGame() {
        // Reset game state
        this.gameEnded = false;
        this.celebrationTime = 0;
        this.dancingSquid = null;
        this.dancingOctopus = null;
        this.squid = null;
        this.isLaunched = false;
        
        // Clear arrays
        this.destructionParticles = [];
        this.fallingDebris = [];
        
        // Show controls again
        document.getElementById('controls').style.display = 'block';
        document.getElementById('fireButton').disabled = false;
        
        // Rebuild skyline
        this.buildings = [];
        this.createSkyline();
        
        // Reset catapult
        this.createCatapult();
    }
}

class DancingSquid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.danceTime = 0;
        this.bodySize = 25;
        this.tentacles = [];
        
        // Create tentacles for dancing
        for (let i = 0; i < 8; i++) {
            this.tentacles.push({
                baseAngle: (i / 8) * Math.PI * 2,
                length: 30 + Math.random() * 10,
                danceOffset: Math.random() * Math.PI * 2,
                swayOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    update() {
        this.danceTime += 0.15;
        
        // Bounce up and down
        this.y = this.baseY + Math.sin(this.danceTime * 2) * 20;
        
        // Sway left and right
        this.x += Math.cos(this.danceTime * 1.5) * 1;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Dancing tentacles
        for (let i = 0; i < this.tentacles.length; i++) {
            const tentacle = this.tentacles[i];
            const danceWave = Math.sin(this.danceTime * 3 + tentacle.danceOffset) * 0.8;
            const sway = Math.cos(this.danceTime * 2 + tentacle.swayOffset) * 0.4;
            
            const angle = tentacle.baseAngle + danceWave + sway;
            const endX = Math.cos(angle) * tentacle.length;
            const endY = Math.sin(angle) * tentacle.length;
            
            // Tentacle gradient
            const gradient = ctx.createLinearGradient(0, 0, endX, endY);
            gradient.addColorStop(0, '#FF69B4');
            gradient.addColorStop(1, '#FF1493');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            
            // Curved dancing tentacle
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const controlX = Math.cos(angle) * tentacle.length * 0.6 + Math.sin(this.danceTime * 4 + i) * 15;
            const controlY = Math.sin(angle) * tentacle.length * 0.6 + Math.cos(this.danceTime * 3 + i) * 15;
            ctx.quadraticCurveTo(controlX, controlY, endX, endY);
            ctx.stroke();
            
            // Dancing tentacle tip
            ctx.fillStyle = '#FF1493';
            ctx.beginPath();
            ctx.arc(endX, endY, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main dancing body
        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.bodySize);
        bodyGradient.addColorStop(0, '#FFB6C1');
        bodyGradient.addColorStop(0.6, '#FF69B4');
        bodyGradient.addColorStop(1, '#FF1493');
        ctx.fillStyle = bodyGradient;
        
        // Squash and stretch effect
        const squash = 1 + Math.sin(this.danceTime * 4) * 0.2;
        const stretch = 1 / squash;
        ctx.scale(squash, stretch);
        
        ctx.beginPath();
        ctx.arc(0, 0, this.bodySize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.scale(1/squash, 1/stretch);
        
        // Happy dancing eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-8, -8, 6, 0, Math.PI * 2);
        ctx.arc(8, -8, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils (looking around excitedly)
        const eyeLookX = Math.sin(this.danceTime) * 2;
        const eyeLookY = Math.cos(this.danceTime * 1.3) * 2;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-8 + eyeLookX, -8 + eyeLookY, 2, 0, Math.PI * 2);
        ctx.arc(8 + eyeLookX, -8 + eyeLookY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Big happy smile
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 5, 12, 0, Math.PI);
        ctx.stroke();
        
        // Victory sparkles
        for (let i = 0; i < 8; i++) {
            const sparkleAngle = (this.danceTime * 2 + i * 0.8) % (Math.PI * 2);
            const sparkleRadius = 40 + Math.sin(this.danceTime * 3 + i) * 10;
            const sparkleX = Math.cos(sparkleAngle) * sparkleRadius;
            const sparkleY = Math.sin(sparkleAngle) * sparkleRadius;
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class DancingOctopus {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.danceTime = Math.PI; // Start out of phase with squid
        this.bodySize = 30;
        this.tentacles = [];
        
        // Create 8 tentacles for octopus
        for (let i = 0; i < 8; i++) {
            this.tentacles.push({
                baseAngle: (i / 8) * Math.PI * 2,
                length: 35 + Math.random() * 15,
                segments: 4,
                danceOffset: Math.random() * Math.PI * 2,
                waveOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    update() {
        this.danceTime += 0.12;
        
        // Different dance pattern from squid
        this.y = this.baseY + Math.cos(this.danceTime * 1.8) * 25;
        this.x += Math.sin(this.danceTime * 1.2) * 0.8;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Dancing octopus tentacles (more complex than squid)
        for (let i = 0; i < this.tentacles.length; i++) {
            const tentacle = this.tentacles[i];
            
            // Multi-segment tentacle for more realistic octopus movement
            let currentX = 0;
            let currentY = 0;
            
            for (let segment = 0; segment < tentacle.segments; segment++) {
                const segmentRatio = segment / tentacle.segments;
                const wave1 = Math.sin(this.danceTime * 4 + tentacle.danceOffset + segment * 0.5) * 0.6;
                const wave2 = Math.cos(this.danceTime * 3 + tentacle.waveOffset + segment * 0.3) * 0.4;
                
                const angle = tentacle.baseAngle + wave1 + wave2;
                const segmentLength = tentacle.length / tentacle.segments;
                
                const nextX = currentX + Math.cos(angle) * segmentLength;
                const nextY = currentY + Math.sin(angle) * segmentLength;
                
                // Tentacle color gradient
                const intensity = 1 - segmentRatio * 0.3;
                ctx.strokeStyle = `rgba(138, 43, 226, ${intensity})`;
                ctx.lineWidth = 10 - segmentRatio * 3;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(currentX, currentY);
                ctx.lineTo(nextX, nextY);
                ctx.stroke();
                
                currentX = nextX;
                currentY = nextY;
            }
            
            // Tentacle tip
            ctx.fillStyle = '#8A2BE2';
            ctx.beginPath();
            ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main octopus body (more bulbous than squid)
        const bodyGradient = ctx.createRadialGradient(0, -5, 0, 0, -5, this.bodySize);
        bodyGradient.addColorStop(0, '#DDA0DD');
        bodyGradient.addColorStop(0.6, '#9932CC');
        bodyGradient.addColorStop(1, '#8A2BE2');
        ctx.fillStyle = bodyGradient;
        
        // Octopus body shape (more oval)
        const bodyBounce = 1 + Math.sin(this.danceTime * 5) * 0.15;
        ctx.save();
        ctx.scale(1, bodyBounce);
        ctx.beginPath();
        ctx.ellipse(0, -5, this.bodySize, this.bodySize * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Octopus eyes (larger and more expressive)
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(-10, -15, 8, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(10, -15, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils with excited expression
        const eyeX = Math.cos(this.danceTime * 1.5) * 3;
        const eyeY = Math.sin(this.danceTime * 2) * 2;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-10 + eyeX, -15 + eyeY, 3, 0, Math.PI * 2);
        ctx.arc(10 + eyeX, -15 + eyeY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Happy octopus smile
        ctx.strokeStyle = '#8A2BE2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -5, 10, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        // Victory bubbles around octopus
        for (let i = 0; i < 12; i++) {
            const bubbleAngle = (this.danceTime * 1.5 + i * 0.5) % (Math.PI * 2);
            const bubbleRadius = 45 + Math.cos(this.danceTime * 2 + i) * 15;
            const bubbleX = Math.cos(bubbleAngle) * bubbleRadius;
            const bubbleY = Math.sin(bubbleAngle) * bubbleRadius;
            const bubbleSize = 2 + Math.sin(this.danceTime * 4 + i) * 2;
            
            ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(135, 206, 235, 0.9)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class Fire {
    constructor(x, y, intensity = 1) {
        this.x = x;
        this.y = y;
        this.intensity = intensity;
        this.flames = [];
        this.smokeParticles = [];
        this.age = 0;
        this.maxAge = 600; // Fire lasts 10 seconds at 60fps
        this.spread = false;
        
        // Create initial flame particles
        this.createFlames();
    }
    
    createFlames() {
        const flameCount = 8 + Math.floor(this.intensity * 5);
        for (let i = 0; i < flameCount; i++) {
            this.flames.push({
                x: this.x + (Math.random() - 0.5) * 30,
                y: this.y + Math.random() * 10,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                size: Math.random() * 8 + 4,
                life: Math.random() * 30 + 20,
                maxLife: 50,
                flickerOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Create smoke particles
        const smokeCount = 4 + Math.floor(this.intensity * 2);
        for (let i = 0; i < smokeCount; i++) {
            this.smokeParticles.push({
                x: this.x + (Math.random() - 0.5) * 40,
                y: this.y - Math.random() * 20,
                vx: (Math.random() - 0.5) * 1,
                vy: -Math.random() * 2 - 1,
                size: Math.random() * 12 + 6,
                life: Math.random() * 60 + 40,
                maxLife: 100,
                opacity: 0.7
            });
        }
    }
    
    update() {
        this.age++;
        
        // Update flame particles
        for (let i = this.flames.length - 1; i >= 0; i--) {
            const flame = this.flames[i];
            flame.x += flame.vx;
            flame.y += flame.vy;
            flame.vy -= 0.1; // Float upward
            flame.vx *= 0.98; // Air resistance
            flame.life--;
            flame.flickerOffset += 0.3;
            
            if (flame.life <= 0) {
                this.flames.splice(i, 1);
            }
        }
        
        // Update smoke particles
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const smoke = this.smokeParticles[i];
            smoke.x += smoke.vx;
            smoke.y += smoke.vy;
            smoke.vy -= 0.05; // Float upward slower than flames
            smoke.vx *= 0.99;
            smoke.life--;
            smoke.size += 0.1; // Smoke expands
            smoke.opacity = (smoke.life / smoke.maxLife) * 0.7;
            
            if (smoke.life <= 0) {
                this.smokeParticles.splice(i, 1);
            }
        }
        
        // Continuously create new flames and smoke
        if (this.age % 3 === 0 && this.age < this.maxAge * 0.8) {
            this.flames.push({
                x: this.x + (Math.random() - 0.5) * 25,
                y: this.y + Math.random() * 8,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 2 - 0.5,
                size: Math.random() * 6 + 3,
                life: Math.random() * 25 + 15,
                maxLife: 40,
                flickerOffset: Math.random() * Math.PI * 2
            });
        }
        
        if (this.age % 8 === 0 && this.age < this.maxAge * 0.9) {
            this.smokeParticles.push({
                x: this.x + (Math.random() - 0.5) * 35,
                y: this.y - Math.random() * 15,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -Math.random() * 1.5 - 0.8,
                size: Math.random() * 10 + 5,
                life: Math.random() * 50 + 30,
                maxLife: 80,
                opacity: 0.6
            });
        }
    }
    
    render(ctx) {
        // Render smoke first (behind flames)
        for (let smoke of this.smokeParticles) {
            ctx.save();
            ctx.globalAlpha = smoke.opacity;
            const gradient = ctx.createRadialGradient(smoke.x, smoke.y, 0, smoke.x, smoke.y, smoke.size);
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(0.5, '#444');
            gradient.addColorStop(1, 'rgba(68, 68, 68, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Render flames
        for (let flame of this.flames) {
            const flicker = Math.sin(flame.flickerOffset) * 0.3 + 0.7;
            const alpha = (flame.life / flame.maxLife) * flicker;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Create flame gradient (hot core to cooler edges)
            const gradient = ctx.createRadialGradient(
                flame.x, flame.y, 0,
                flame.x, flame.y, flame.size
            );
            gradient.addColorStop(0, '#FFFF00'); // Hot yellow core
            gradient.addColorStop(0.3, '#FF6600'); // Orange
            gradient.addColorStop(0.6, '#FF0000'); // Red
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)'); // Transparent edge
            
            ctx.fillStyle = gradient;
            
            // Draw flame shape (more organic than circle)
            ctx.beginPath();
            const flameHeight = flame.size * 1.5;
            ctx.ellipse(flame.x, flame.y, flame.size * 0.8, flameHeight, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Add inner bright core
            ctx.globalAlpha = alpha * 0.8;
            const coreGradient = ctx.createRadialGradient(
                flame.x, flame.y + flame.size * 0.2, 0,
                flame.x, flame.y + flame.size * 0.2, flame.size * 0.4
            );
            coreGradient.addColorStop(0, '#FFFFFF');
            coreGradient.addColorStop(0.5, '#FFFF88');
            coreGradient.addColorStop(1, 'rgba(255, 255, 136, 0)');
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(flame.x, flame.y + flame.size * 0.2, flame.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    isExtinguished() {
        return this.age > this.maxAge && this.flames.length === 0 && this.smokeParticles.length === 0;
    }
}

class Building {
    constructor(x, y, width, height, color, name, type = 'classic') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.name = name;
        this.type = type;
        this.fires = [];
        this.hitCount = 0;
        this.isCollapsing = false;
        this.collapseProgress = 0;
        this.originalHeight = height;
        this.debrisParticles = [];
    }
    
    render(ctx) {
        if (this.height <= 0) return;
        
        // Building shake effect during collapse
        let shakeX = 0;
        if (this.isCollapsing && this.collapseProgress < 60) {
            shakeX = (Math.random() - 0.5) * 4;
        }
        
        // Render based on building type
        switch (this.type) {
            case 'flatiron':
                this.renderFlatiron(ctx, shakeX);
                break;
            case 'artdeco':
                this.renderArtDeco(ctx, shakeX);
                break;
            case 'supertall':
                this.renderSupertall(ctx, shakeX);
                break;
            case 'bridge':
                this.renderBridge(ctx, shakeX);
                break;
            case 'modern':
                this.renderModern(ctx, shakeX);
                break;
            case 'residential':
                this.renderResidential(ctx, shakeX);
                break;
            case 'historic':
                this.renderHistoric(ctx, shakeX);
                break;
            default:
                this.renderClassic(ctx, shakeX);
        }
        
        // Draw fires
        for (let fire of this.fires) {
            fire.render(ctx);
        }
        
        // Draw hit counter
        if (this.hitCount > 0 && !this.isCollapsing) {
            ctx.fillStyle = '#FF0000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${this.hitCount}/3`,
                this.x + this.width / 2,
                this.y - 10
            );
        }
    }
    
    renderFlatiron(ctx, shakeX) {
        // Flatiron Building - triangular wedge shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + shakeX, this.y + this.height);
        ctx.lineTo(this.x + this.width + shakeX, this.y + this.height);
        ctx.lineTo(this.x + this.width/2 + shakeX, this.y);
        ctx.closePath();
        ctx.fill();
        
        // Flatiron windows in triangular pattern
        this.drawTriangularWindows(ctx, shakeX);
        
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    renderArtDeco(ctx, shakeX) {
        // Chrysler Building - Art Deco with stepped crown
        ctx.fillStyle = this.color;
        
        // Main body
        const mainHeight = this.height * 0.7;
        ctx.fillRect(this.x + shakeX, this.y + this.height - mainHeight, this.width, mainHeight);
        
        // Stepped crown (4 levels)
        const crownHeight = this.height * 0.3;
        const stepHeight = crownHeight / 4;
        for (let i = 0; i < 4; i++) {
            const stepWidth = this.width * (0.9 - i * 0.15);
            const stepX = this.x + (this.width - stepWidth) / 2;
            const stepY = this.y + this.height - mainHeight - stepHeight * (i + 1);
            ctx.fillRect(stepX + shakeX, stepY, stepWidth, stepHeight);
        }
        
        // Art Deco spire
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 + shakeX, this.y);
        ctx.lineTo(this.x + this.width * 0.6 + shakeX, this.y + 20);
        ctx.lineTo(this.x + this.width * 0.4 + shakeX, this.y + 20);
        ctx.closePath();
        ctx.fill();
        
        this.drawRegularWindows(ctx, shakeX, '#FFD700', 6, 12);
    }
    
    renderSupertall(ctx, shakeX) {
        // Empire State/One WTC - tall with distinctive features
        ctx.fillStyle = this.color;
        
        if (this.name.includes('Empire')) {
            // Empire State Building with setbacks
            const mainHeight = this.height * 0.6;
            ctx.fillRect(this.x + shakeX, this.y + this.height - mainHeight, this.width, mainHeight);
            
            // Setbacks
            const setback1Width = this.width * 0.8;
            const setback1Height = this.height * 0.25;
            ctx.fillRect(this.x + (this.width - setback1Width)/2 + shakeX, this.y + this.height - mainHeight - setback1Height, setback1Width, setback1Height);
            
            const setback2Width = this.width * 0.6;
            const setback2Height = this.height * 0.15;
            ctx.fillRect(this.x + (this.width - setback2Width)/2 + shakeX, this.y, setback2Width, setback2Height);
        } else {
            // One WTC - modern glass tower
            ctx.fillRect(this.x + shakeX, this.y, this.width, this.height);
            
            // Glass panels effect
            ctx.fillStyle = '#B0E0E6';
            for (let i = 0; i < this.width; i += 8) {
                ctx.fillRect(this.x + i + shakeX, this.y, 2, this.height);
            }
        }
        
        this.drawRegularWindows(ctx, shakeX, '#FFD700', 8, 15);
    }
    
    renderBridge(ctx, shakeX) {
        // Brooklyn Bridge Tower
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + shakeX, this.y, this.width, this.height);
        
        // Gothic arches
        ctx.fillStyle = '#333';
        const archWidth = this.width * 0.6;
        const archHeight = this.height * 0.3;
        const archX = this.x + (this.width - archWidth) / 2 + shakeX;
        const archY = this.y + this.height * 0.4;
        
        ctx.beginPath();
        ctx.arc(archX + archWidth/2, archY + archHeight, archWidth/2, Math.PI, 0);
        ctx.fill();
        
        // Bridge cables (simplified)
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2 + shakeX, this.y + 20);
            ctx.lineTo(this.x + this.width + 50 + shakeX, this.y + this.height + 30);
            ctx.stroke();
        }
    }
    
    renderModern(ctx, shakeX) {
        // Modern glass/steel buildings
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + shakeX, this.y, this.width, this.height);
        
        // Glass panels
        ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
        for (let i = 0; i < this.width; i += 12) {
            ctx.fillRect(this.x + i + shakeX, this.y, 8, this.height);
        }
        
        this.drawRegularWindows(ctx, shakeX, '#87CEEB', 10, 18);
    }
    
    renderResidential(ctx, shakeX) {
        // Residential buildings - brownstones, apartments
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + shakeX, this.y, this.width, this.height);
        
        // Fire escapes
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        for (let floor = 1; floor < Math.floor(this.height / 20); floor++) {
            const y = this.y + this.height - floor * 20;
            ctx.strokeRect(this.x + this.width - 8 + shakeX, y, 6, 15);
        }
        
        this.drawRegularWindows(ctx, shakeX, '#FFFFE0', 6, 15);
    }
    
    renderHistoric(ctx, shakeX) {
        // Historic buildings - cast iron, old commercial
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + shakeX, this.y, this.width, this.height);
        
        // Ornate facade details
        ctx.fillStyle = '#F5DEB3';
        for (let floor = 0; floor < Math.floor(this.height / 20); floor++) {
            const y = this.y + this.height - floor * 20 - 2;
            ctx.fillRect(this.x + shakeX, y, this.width, 2);
        }
        
        this.drawRegularWindows(ctx, shakeX, '#FFD700', 8, 18);
    }
    
    renderClassic(ctx, shakeX) {
        // Default classic building
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + shakeX, this.y, this.width, this.height);
        
        this.drawRegularWindows(ctx, shakeX, '#FFD700', 8, 15);
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + shakeX, this.y, this.width, this.height);
    }
    
    drawRegularWindows(ctx, shakeX, windowColor, windowSize, windowSpacing) {
        ctx.fillStyle = windowColor;
        
        for (let row = 0; row < Math.floor(this.height / windowSpacing); row++) {
            for (let col = 0; col < Math.floor(this.width / windowSpacing); col++) {
                const windowX = this.x + col * windowSpacing + 5 + shakeX;
                const windowY = this.y + row * windowSpacing + 10;
                
                if (this.isWindowVisible(windowX, windowY) && Math.random() > 0.3) {
                    ctx.fillRect(windowX, windowY, windowSize, windowSize);
                }
            }
        }
    }
    
    drawTriangularWindows(ctx, shakeX) {
        ctx.fillStyle = '#FFD700';
        const windowSize = 6;
        
        // Windows arranged in triangular pattern for Flatiron
        for (let row = 0; row < Math.floor(this.height / 15); row++) {
            const rowY = this.y + row * 15 + 10;
            const rowWidth = this.width * (1 - row / Math.floor(this.height / 15));
            const startX = this.x + (this.width - rowWidth) / 2;
            
            for (let col = 0; col < Math.floor(rowWidth / 12); col++) {
                const windowX = startX + col * 12 + 3 + shakeX;
                
                if (this.isWindowVisible(windowX, rowY) && Math.random() > 0.4) {
                    ctx.fillRect(windowX, rowY, windowSize, windowSize);
                }
            }
        }
    }
    
    isWindowVisible(windowX, windowY) {
        // Check if window is in fire area (windows should still show behind fire)
        return true;
    }
    
    checkCollision(squid) {
        if (this.height <= 0) return false;
        return squid.x > this.x &&
               squid.x < this.x + this.width &&
               squid.y > this.y &&
               squid.y < this.y + this.height;
    }
    
    hit(x, y) {
        this.hitCount++;
        this.createFire(x, y, 1.0 + this.hitCount * 0.3);
        
        if (this.hitCount >= 3) {
            this.startCollapse();
        }
    }
    
    createFire(x, y, intensity) {
        // Create fire at impact location
        this.fires.push(new Fire(x, y, intensity));
        
        // Chance to spread fire to nearby areas
        if (Math.random() > 0.6) {
            const spreadX = x + (Math.random() - 0.5) * 80;
            const spreadY = y + (Math.random() - 0.5) * 40;
            this.fires.push(new Fire(spreadX, spreadY, intensity * 0.7));
        }
    }
    
    startCollapse() {
        this.isCollapsing = true;
        this.collapseProgress = 0;
    }
    
    update() {
        // Update fires
        for (let i = this.fires.length - 1; i >= 0; i--) {
            const fire = this.fires[i];
            fire.update();
            
            if (fire.isExtinguished()) {
                this.fires.splice(i, 1);
            }
        }
        
        if (this.isCollapsing) {
            this.collapseProgress++;
            
            if (this.collapseProgress > 60) {
                const collapseSpeed = 5;
                this.height = Math.max(0, this.height - collapseSpeed);
                this.y += collapseSpeed;
                
                if (this.height <= 0) {
                    this.y = this.y + this.originalHeight;
                }
            }
        }
    }
}

class Catapult {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    render(ctx) {
        // Base
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - 20, this.y, 40, 20);
        
        // Arm (angle based on current setting)
        const angle = parseFloat(document.getElementById('angleSlider').value);
        const angleRad = (angle * Math.PI) / 180;
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x + Math.cos(angleRad) * 40,
            this.y - Math.sin(angleRad) * 40
        );
        ctx.stroke();
        
        // Bucket
        const bucketX = this.x + Math.cos(angleRad) * 35;
        const bucketY = this.y - Math.sin(angleRad) * 35;
        
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(bucketX, bucketY, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Squid {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.gravity = 0.3;
        this.rotation = 0;
        this.tentacleWave = 0;
        this.bodySize = 18;
        this.headSize = 16;
        this.sparkles = [];
        this.blinkTimer = 0;
        this.isBlinking = false;
        
        // Initialize cute anime tentacles (8 total)
        this.tentacles = [];
        for (let i = 0; i < 8; i++) {
            this.tentacles.push({
                baseAngle: (i / 8) * Math.PI * 2,
                length: 20 + Math.random() * 8,
                waveOffset: Math.random() * Math.PI * 2,
                bounceOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Initialize sparkle effects
        this.createSparkles();
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += 0.12;
        this.tentacleWave += 0.25;
        
        // Anime blink animation
        this.blinkTimer++;
        if (this.blinkTimer > 120) { // Blink every 2 seconds
            this.isBlinking = true;
            if (this.blinkTimer > 130) {
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        }
        
        // Update sparkles
        this.updateSparkles();
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw sparkles first (behind squid)
        this.drawSparkles(ctx);
        
        // Draw tentacles (kawaii style)
        this.drawAnimeTentacles(ctx);
        
        // Main cute body
        this.drawAnimeBody(ctx);
        
        // Kawaii face
        this.drawAnimeFace(ctx);
        
        // Motion trail effect
        this.drawMotionTrail(ctx);
        
        ctx.restore();
    }
    
    drawAnimeBody(ctx) {
        // Kawaii squid body - round and cute
        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.bodySize);
        bodyGradient.addColorStop(0, '#FFB6C1'); // Light pink
        bodyGradient.addColorStop(0.6, '#FF69B4'); // Hot pink  
        bodyGradient.addColorStop(1, '#FF1493');   // Deep pink
        ctx.fillStyle = bodyGradient;
        
        // Main round body
        ctx.beginPath();
        ctx.arc(0, 0, this.bodySize, 0, Math.PI * 2);
        ctx.fill();
        
        // Cute highlight on body
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-6, -6, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Kawaii body pattern - heart shapes
        ctx.fillStyle = 'rgba(255, 20, 147, 0.3)';
        for (let i = 0; i < 3; i++) {
            const heartX = -8 + i * 8;
            const heartY = -4 + (i % 2) * 8;
            this.drawHeart(ctx, heartX, heartY, 3);
        }
        
        // Anime-style body outline
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.bodySize, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawAnimeFace(ctx) {
        // Big anime eyes
        const eyeSize = 8;
        const eyeOffsetY = 4;
        
        // Left eye background
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(-6, -eyeOffsetY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye background  
        ctx.beginPath();
        ctx.ellipse(6, -eyeOffsetY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (!this.isBlinking) {
            // Left eye iris
            const irisGradient = ctx.createRadialGradient(-6, -eyeOffsetY-1, 0, -6, -eyeOffsetY-1, 5);
            irisGradient.addColorStop(0, '#87CEEB');  // Sky blue
            irisGradient.addColorStop(0.8, '#4169E1'); // Royal blue
            irisGradient.addColorStop(1, '#191970');   // Midnight blue
            ctx.fillStyle = irisGradient;
            ctx.beginPath();
            ctx.arc(-6, -eyeOffsetY, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Right eye iris
            ctx.fillStyle = irisGradient;
            ctx.beginPath();
            ctx.arc(6, -eyeOffsetY, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-6, -eyeOffsetY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(6, -eyeOffsetY, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Anime eye highlights
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(-4, -eyeOffsetY-2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, -eyeOffsetY-2, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Small highlight dots
            ctx.beginPath();
            ctx.arc(-7, -eyeOffsetY+1, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(5, -eyeOffsetY+1, 1, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Blinking - draw closed eyes as lines
            ctx.strokeStyle = '#FF1493';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-10, -eyeOffsetY);
            ctx.lineTo(-2, -eyeOffsetY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2, -eyeOffsetY);
            ctx.lineTo(10, -eyeOffsetY);
            ctx.stroke();
        }
        
        // Eye outlines
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-6, -eyeOffsetY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(6, -eyeOffsetY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Kawaii mouth
        if (!this.isBlinking) {
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(0, 6, 3, 0, Math.PI);
            ctx.fill();
        }
        
        // Cute cheek blush
        ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-12, 2, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(12, 2, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawHeart(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(-size/3, 0, size/3, 0, Math.PI * 2);
        ctx.arc(size/3, 0, size/3, 0, Math.PI * 2);
        ctx.moveTo(0, size/2);
        ctx.lineTo(-size/2, -size/4);
        ctx.lineTo(size/2, -size/4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    drawMotionTrail(ctx) {
        // Anime-style motion lines
        ctx.strokeStyle = 'rgba(255, 105, 180, 0.3)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 5; i++) {
            const lineLength = 15 + i * 3;
            const angle = this.rotation + Math.PI + (i * 0.2);
            ctx.beginPath();
            ctx.moveTo(
                Math.cos(angle) * (this.bodySize + 5),
                Math.sin(angle) * (this.bodySize + 5)
            );
            ctx.lineTo(
                Math.cos(angle) * (this.bodySize + 5 + lineLength),
                Math.sin(angle) * (this.bodySize + 5 + lineLength)
            );
            ctx.stroke();
        }
    }
    
    drawAnimeTentacles(ctx) {
        for (let i = 0; i < this.tentacles.length; i++) {
            const tentacle = this.tentacles[i];
            this.drawKawaiiTentacle(ctx, tentacle, i);
        }
    }
    
    drawKawaiiTentacle(ctx, tentacle, index) {
        // Kawaii tentacle gradient
        const tentacleGradient = ctx.createLinearGradient(0, 0, 
            Math.cos(tentacle.baseAngle) * tentacle.length,
            Math.sin(tentacle.baseAngle) * tentacle.length);
        tentacleGradient.addColorStop(0, '#FF69B4');
        tentacleGradient.addColorStop(0.5, '#FFB6C1');
        tentacleGradient.addColorStop(1, '#FF1493');
        
        ctx.strokeStyle = tentacleGradient;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        // Bouncy anime movement
        const bounce = Math.sin(this.tentacleWave + tentacle.bounceOffset) * 0.5;
        const wave = Math.sin(this.tentacleWave * 1.5 + tentacle.waveOffset) * 0.3;
        
        const angle = tentacle.baseAngle + bounce + wave;
        const endX = Math.cos(angle) * tentacle.length;
        const endY = Math.sin(angle) * tentacle.length;
        
        // Draw main tentacle
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        // Curved tentacle with control points for bouncy effect
        const controlX = Math.cos(angle) * tentacle.length * 0.6 + Math.cos(angle + Math.PI/2) * bounce * 10;
        const controlY = Math.sin(angle) * tentacle.length * 0.6 + Math.sin(angle + Math.PI/2) * bounce * 10;
        
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.stroke();
        
        // Cute tentacle tip with heart
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Mini heart at tip
        ctx.fillStyle = '#FFB6C1';
        this.drawHeart(ctx, endX, endY, 2);
        
        // Kawaii outline
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.stroke();
    }
    
    createSparkles() {
        // Create magical sparkles around the squid
        for (let i = 0; i < 8; i++) {
            this.sparkles.push({
                x: (Math.random() - 0.5) * 60,
                y: (Math.random() - 0.5) * 60,
                size: 1 + Math.random() * 3,
                life: Math.random() * 60 + 30,
                maxLife: 60,
                twinkle: Math.random() * Math.PI * 2,
                color: Math.random() > 0.5 ? '#FFD700' : '#FFF'
            });
        }
    }
    
    updateSparkles() {
        for (let sparkle of this.sparkles) {
            sparkle.life--;
            sparkle.twinkle += 0.2;
            
            if (sparkle.life <= 0) {
                // Respawn sparkle
                sparkle.x = (Math.random() - 0.5) * 60;
                sparkle.y = (Math.random() - 0.5) * 60;
                sparkle.life = sparkle.maxLife;
                sparkle.twinkle = 0;
            }
        }
    }
    
    drawSparkles(ctx) {
        for (let sparkle of this.sparkles) {
            const alpha = sparkle.life / sparkle.maxLife;
            const twinkleSize = sparkle.size * (1 + Math.sin(sparkle.twinkle) * 0.5);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = sparkle.color;
            
            // Draw star shape
            ctx.translate(sparkle.x, sparkle.y);
            ctx.rotate(sparkle.twinkle);
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const x = Math.cos(angle) * twinkleSize;
                const y = Math.sin(angle) * twinkleSize;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Cross sparkle
            ctx.strokeStyle = sparkle.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-twinkleSize*1.5, 0);
            ctx.lineTo(twinkleSize*1.5, 0);
            ctx.moveTo(0, -twinkleSize*1.5);
            ctx.lineTo(0, twinkleSize*1.5);
            ctx.stroke();
            
            ctx.restore();
        }
    }
}

class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = 60;
        this.maxLife = 60;
        this.gravity = 0.1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.98;
        this.life--;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
}

class FallingDebris {
    constructor(x, y, width, height, color, buildingType, vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.buildingType = buildingType;
        this.vx = vx;
        this.vy = vy;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
        this.gravity = 0.4;
        this.life = 300; // Long enough to fall off screen
        this.maxLife = 300;
        this.airResistance = 0.995;
    }
    
    update() {
        // Apply physics
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        // Air resistance
        this.vx *= this.airResistance;
        
        // Rotation
        this.rotation += this.rotationSpeed;
        
        // Life countdown
        this.life--;
        
        // Bounce slightly off ground
        const groundLevel = window.innerHeight - 50;
        if (this.y + this.height > groundLevel && this.vy > 0) {
            this.y = groundLevel - this.height;
            this.vy *= -0.3; // Small bounce
            this.vx *= 0.7;  // Friction
            this.rotationSpeed *= 0.5;
        }
    }
    
    render(ctx) {
        const alpha = Math.min(1, this.life / this.maxLife);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // Draw the debris piece based on building type
        switch (this.buildingType) {
            case 'flatiron':
                this.renderFlatironDebris(ctx);
                break;
            case 'artdeco':
                this.renderArtDecoDebris(ctx);
                break;
            case 'supertall':
                this.renderSupertallDebris(ctx);
                break;
            case 'bridge':
                this.renderBridgeDebris(ctx);
                break;
            case 'modern':
                this.renderModernDebris(ctx);
                break;
            case 'residential':
                this.renderResidentialDebris(ctx);
                break;
            case 'historic':
                this.renderHistoricDebris(ctx);
                break;
            default:
                this.renderClassicDebris(ctx);
        }
        
        ctx.restore();
    }
    
    renderFlatironDebris(ctx) {
        // Triangular debris piece
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-this.width/2, this.height/2);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.lineTo(0, -this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Small window details
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-4 + i * 4, -this.height/4, 2, 2);
        }
    }
    
    renderArtDecoDebris(ctx) {
        // Stepped debris piece
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Art Deco step detail
        ctx.fillStyle = '#A0A0A0';
        ctx.fillRect(-this.width/3, -this.height/2, this.width/3*2, this.height/3);
        
        // Metallic sheen
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 2; i++) {
            ctx.fillRect(-this.width/4 + i * 8, -this.height/3, 2, 3);
        }
    }
    
    renderSupertallDebris(ctx) {
        // Rectangular glass/concrete debris
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Glass panel effect
        ctx.fillStyle = '#B0E0E6';
        for (let i = 0; i < this.width/6; i++) {
            ctx.fillRect(-this.width/2 + i * 6, -this.height/2, 2, this.height);
        }
        
        // Windows
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-6 + i * 6, -this.height/4, 2, 2);
        }
    }
    
    renderBridgeDebris(ctx) {
        // Stone masonry debris
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Stone texture lines
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-this.width/2, -this.height/2 + i * (this.height/3));
            ctx.lineTo(this.width/2, -this.height/2 + i * (this.height/3));
            ctx.stroke();
        }
    }
    
    renderModernDebris(ctx) {
        // Glass and steel debris
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Glass reflection
        ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
        ctx.fillRect(-this.width/2, -this.height/2, this.width/2, this.height);
        
        // Steel frame
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
    }
    
    renderResidentialDebris(ctx) {
        // Brick/brownstone debris
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Brick pattern
        ctx.fillStyle = '#8B0000';
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 2; col++) {
                ctx.fillRect(-this.width/2 + col * 8, -this.height/2 + row * 6, 6, 4);
            }
        }
        
        // Window fragment
        ctx.fillStyle = '#FFFFE0';
        ctx.fillRect(-3, 0, 4, 4);
    }
    
    renderHistoricDebris(ctx) {
        // Ornate historic debris
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Ornate details
        ctx.fillStyle = '#F5DEB3';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, 3);
        ctx.fillRect(-this.width/2, this.height/2 - 3, this.width, 3);
        
        // Decorative window
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-4, -2, 6, 4);
    }
    
    renderClassicDebris(ctx) {
        // Standard building debris
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Simple windows
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 2; i++) {
            ctx.fillRect(-4 + i * 6, -this.height/4, 3, 3);
        }
        
        // Building outline
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new SquidNYCGame();
});