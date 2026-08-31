'use strict';

/**
 * Shared Web Audio engine: SID-inspired music + cinematic SFX.
 * One AudioContext for music and effects so browsers do not create duplicates.
 */
class SquidAudio {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicFilter = null;
        this.compressor = null;

        this.ready = false;
        this.musicOn = false;
        this.muted = false;
        this.volume = 0.72;
        this.currentSong = 0;
        this.step = 0;
        this.timer = null;
        this.channels = [];
        this.whoosh = null;

        this.songs = this.buildSongs();
    }

    init() {
        if (this.ctx) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;

        this.ctx = new Ctx();

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 6;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.18;
        this.compressor.connect(this.ctx.destination);

        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.compressor);

        this.musicFilter = this.ctx.createBiquadFilter();
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.value = 2800;
        this.musicFilter.Q.value = 0.9;

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.55;
        this.musicGain.connect(this.musicFilter);
        this.musicFilter.connect(this.master);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.85;
        this.sfxGain.connect(this.master);

        this.ready = true;
    }

    async unlock() {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            try { await this.ctx.resume(); } catch (e) { /* autoplay blocked */ }
        }
    }

    now() {
        return this.ctx ? this.ctx.currentTime : 0;
    }

    noteFreq(note) {
        if (!note || note === 'rest' || note === '.') return 0;
        const map = {
            C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
            'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
        };
        const name = note.slice(0, -1);
        const oct = parseInt(note.slice(-1), 10);
        if (map[name] === undefined || Number.isNaN(oct)) return 0;
        const midi = (oct + 1) * 12 + map[name];
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    buildSongs() {
        return [
            {
                name: 'Harbor Pulse',
                bpm: 132,
                lead: [
                    ['A4', 2], ['C5', 2], ['E5', 2], ['A5', 4], ['G5', 2], ['E5', 2],
                    ['C5', 2], ['A4', 2], ['B4', 2], ['C5', 2], ['E5', 2], ['D5', 2],
                    ['G4', 2], ['B4', 2], ['D5', 2], ['G5', 4], ['F5', 2], ['D5', 2],
                    ['B4', 2], ['G4', 2], ['A4', 2], ['B4', 2], ['D5', 2], ['C5', 2],
                    ['F4', 2], ['A4', 2], ['C5', 2], ['F5', 4], ['E5', 2], ['C5', 2],
                    ['A4', 2], ['F4', 2], ['G4', 2], ['A4', 2], ['C5', 2], ['B4', 2],
                    ['E4', 2], ['G4', 2], ['B4', 2], ['E5', 4], ['D5', 2], ['B4', 2],
                    ['A4', 2], ['E4', 2], ['A4', 4], ['C5', 2], ['E5', 2], ['A5', 4]
                ],
                bass: [
                    ['A2', 4], ['A2', 2], ['E2', 2], ['A2', 4], ['A3', 2], ['E2', 2],
                    ['G2', 4], ['G2', 2], ['D2', 2], ['G2', 4], ['G3', 2], ['D2', 2],
                    ['F2', 4], ['F2', 2], ['C2', 2], ['F2', 4], ['F3', 2], ['C2', 2],
                    ['E2', 4], ['E2', 2], ['B1', 2], ['A2', 4], ['E2', 2], ['A1', 2]
                ],
                arp: [
                    ['A3', 1], ['C4', 1], ['E4', 1], ['A4', 1], ['C4', 1], ['E4', 1], ['A4', 1], ['C5', 1],
                    ['G3', 1], ['B3', 1], ['D4', 1], ['G4', 1], ['B3', 1], ['D4', 1], ['G4', 1], ['B4', 1],
                    ['F3', 1], ['A3', 1], ['C4', 1], ['F4', 1], ['A3', 1], ['C4', 1], ['F4', 1], ['A4', 1],
                    ['E3', 1], ['G3', 1], ['B3', 1], ['E4', 1], ['A3', 1], ['C4', 1], ['E4', 1], ['A4', 1]
                ]
            },
            {
                name: 'Neon Tide',
                bpm: 144,
                lead: [
                    ['E5', 2], ['G5', 2], ['B5', 2], ['E6', 2], ['D6', 2], ['B5', 2], ['A5', 2], ['G5', 2],
                    ['F#5', 2], ['A5', 2], ['D6', 2], ['F#6', 2], ['E6', 2], ['D6', 2], ['B5', 2], ['A5', 2],
                    ['C6', 2], ['B5', 2], ['A5', 2], ['G5', 2], ['A5', 2], ['B5', 2], ['C6', 2], ['D6', 2],
                    ['E6', 4], ['B5', 2], ['G5', 2], ['E5', 4], ['G5', 2], ['B5', 2]
                ],
                bass: [
                    ['E2', 2], ['E3', 2], ['E2', 2], ['G2', 2], ['A2', 2], ['A3', 2], ['A2', 2], ['C3', 2],
                    ['D2', 2], ['D3', 2], ['D2', 2], ['F#2', 2], ['G2', 2], ['G3', 2], ['B2', 2], ['D3', 2],
                    ['C2', 2], ['C3', 2], ['C2', 2], ['E2', 2], ['D2', 2], ['D3', 2], ['G2', 2], ['B2', 2],
                    ['E2', 2], ['E3', 2], ['B1', 2], ['E2', 2], ['E2', 2], ['B2', 2], ['E3', 2], ['E2', 2]
                ],
                arp: [
                    ['E4', 1], ['G4', 1], ['B4', 1], ['E5', 1], ['G4', 1], ['B4', 1], ['E5', 1], ['G5', 1],
                    ['D4', 1], ['F#4', 1], ['A4', 1], ['D5', 1], ['F#4', 1], ['A4', 1], ['D5', 1], ['F#5', 1],
                    ['C4', 1], ['E4', 1], ['G4', 1], ['C5', 1], ['D4', 1], ['F#4', 1], ['A4', 1], ['D5', 1],
                    ['E4', 1], ['G4', 1], ['B4', 1], ['E5', 1], ['B3', 1], ['E4', 1], ['G4', 1], ['B4', 1]
                ]
            },
            {
                name: 'Midnight Launch',
                bpm: 118,
                lead: [
                    ['D4', 4], ['F4', 2], ['A4', 6], ['G4', 2], ['F4', 2],
                    ['E4', 4], ['G4', 2], ['C5', 6], ['A4', 2], ['G4', 2],
                    ['F4', 4], ['A4', 2], ['D5', 4], ['C5', 2], ['A4', 2], ['G4', 2],
                    ['A4', 4], ['D5', 2], ['F5', 6], ['E5', 4]
                ],
                bass: [
                    ['D2', 4], ['D3', 2], ['D2', 2], ['A1', 4], ['A2', 2], ['D2', 2],
                    ['C2', 4], ['C3', 2], ['C2', 2], ['G1', 4], ['G2', 2], ['C2', 2],
                    ['Bb1', 4], ['Bb2', 2], ['F2', 2], ['C2', 4], ['C3', 2], ['G1', 2],
                    ['D2', 4], ['D3', 2], ['A2', 2], ['D2', 2], ['A1', 2], ['D2', 4]
                ],
                arp: [
                    ['D4', 2], ['F4', 2], ['A4', 2], ['D5', 2], ['F4', 2], ['A4', 2], ['D5', 2], ['F5', 2],
                    ['C4', 2], ['E4', 2], ['G4', 2], ['C5', 2], ['E4', 2], ['G4', 2], ['C5', 2], ['E5', 2],
                    ['Bb3', 2], ['D4', 2], ['F4', 2], ['Bb4', 2], ['C4', 2], ['E4', 2], ['G4', 2], ['C5', 2],
                    ['D4', 2], ['F4', 2], ['A4', 2], ['D5', 2], ['A4', 2], ['F4', 2], ['D4', 2], ['A3', 2]
                ]
            }
        ];
    }

    expandPattern(pairs) {
        const steps = [];
        for (const [note, len] of pairs) {
            steps.push({ note, start: true, len });
            for (let i = 1; i < len; i++) {
                steps.push({ note, start: false, len });
            }
        }
        return steps;
    }

    startMusic() {
        if (!this.ready) this.init();
        if (!this.ctx || this.musicOn) return;
        this.unlock();
        this.musicOn = true;
        this.step = 0;
        this.stopChannelNotes(true);
        this.scheduleTick();
    }

    pauseMusic() {
        this.musicOn = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.stopChannelNotes(false);
    }

    scheduleTick() {
        if (!this.musicOn) return;
        const song = this.songs[this.currentSong];
        const sixteenth = (60 / song.bpm) / 4;
        const swing = (this.step % 2 === 1) ? sixteenth * 0.08 : 0;
        this.playMusicStep();
        this.step++;
        this.timer = setTimeout(() => this.scheduleTick(), (sixteenth + swing) * 1000);
    }

    playMusicStep() {
        if (this.muted || !this.ctx) return;
        const song = this.songs[this.currentSong];
        const voices = [
            { key: 'lead', wave: 'sawtooth', vol: 0.2, cutoff: 2200, q: 1.2, attack: 0.008, decay: 0.09, sustain: 0.4, release: 0.14, vib: 5.5 },
            { key: 'bass', wave: 'square', vol: 0.26, cutoff: 520, q: 0.8, attack: 0.004, decay: 0.12, sustain: 0.55, release: 0.08, vib: 0 },
            { key: 'arp', wave: 'triangle', vol: 0.14, cutoff: 3400, q: 0.7, attack: 0.004, decay: 0.05, sustain: 0.25, release: 0.06, vib: 0 }
        ];

        voices.forEach((voice, i) => {
            const pattern = this.expandPattern(song[voice.key]);
            const ev = pattern[this.step % pattern.length];
            if (!ev) return;
            if (ev.note === 'rest' || ev.note === '.') {
                if (ev.start) this.releaseChannel(i);
                return;
            }
            if (ev.start) {
                this.triggerChannel(i, this.noteFreq(ev.note), voice);
            }
        });

        this.playDrums(this.step);
        this.sweepMusicFilter();
    }

    triggerChannel(index, freq, voice) {
        this.releaseChannel(index);
        if (!freq) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = voice.wave;
        osc.frequency.setValueAtTime(freq, this.now());
        osc.detune.setValueAtTime((Math.random() - 0.5) * 6, this.now());

        if (voice.vib) {
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.value = voice.vib;
            lfoGain.gain.value = 8;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();
            this.channels[index] = this.channels[index] || {};
            this.channels[index].lfo = lfo;
        }

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(voice.cutoff, this.now());
        filter.Q.value = voice.q;

        const t = this.now();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(voice.vol, t + voice.attack);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0008, voice.vol * voice.sustain), t + voice.attack + voice.decay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);

        this.channels[index] = Object.assign(this.channels[index] || {}, {
            osc, gain, filter, release: voice.release
        });
    }

    releaseChannel(index) {
        const ch = this.channels[index];
        if (!ch || !ch.osc) return;
        const t = this.now();
        try {
            ch.gain.gain.cancelScheduledValues(t);
            ch.gain.gain.setValueAtTime(Math.max(0.0008, ch.gain.gain.value), t);
            ch.gain.gain.exponentialRampToValueAtTime(0.0008, t + (ch.release || 0.1));
            ch.osc.stop(t + (ch.release || 0.1) + 0.02);
            if (ch.lfo) ch.lfo.stop(t + 0.05);
        } catch (e) { /* already stopped */ }
        ch.osc = null;
        ch.gain = null;
        ch.lfo = null;
    }

    stopChannelNotes(immediate) {
        this.channels.forEach((_, i) => this.releaseChannel(i));
        if (immediate) this.channels = [];
    }

    playDrums(step) {
        const beat = step % 16;
        if (beat === 0 || beat === 8) this.kick();
        if (beat === 4 || beat === 12) this.snare();
        if (beat % 2 === 0) this.hat(beat % 4 === 0 ? 0.045 : 0.028);
        if (beat === 14 && step % 32 > 16) this.hat(0.07);
    }

    kick() {
        const t = this.now();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    snare() {
        const t = this.now();
        const noise = this.noiseSource(0.16);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 0.9;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start(t);

        const tone = this.ctx.createOscillator();
        const toneGain = this.ctx.createGain();
        tone.type = 'triangle';
        tone.frequency.setValueAtTime(190, t);
        toneGain.gain.setValueAtTime(0.12, t);
        toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        tone.connect(toneGain);
        toneGain.connect(this.musicGain);
        tone.start(t);
        tone.stop(t + 0.12);
    }

    hat(vol) {
        const t = this.now();
        const noise = this.noiseSource(0.05);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        noise.start(t);
    }

    sweepMusicFilter() {
        if (!this.musicFilter) return;
        const t = this.now();
        const base = 1800 + Math.sin(t * 0.15) * 900;
        this.musicFilter.frequency.setTargetAtTime(base, t, 0.2);
    }

    noiseSource(duration) {
        const rate = this.ctx.sampleRate;
        const size = Math.max(1, Math.floor(rate * duration));
        const buffer = this.ctx.createBuffer(1, size, rate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        return src;
    }

    panner(xNorm) {
        const node = this.ctx.createStereoPanner();
        node.pan.setValueAtTime(Math.max(-0.85, Math.min(0.85, xNorm)), this.now());
        return node;
    }

    playLaunch() {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(620, t + 0.18);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.28, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(2800, t + 0.16);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.34);

        const noise = this.noiseSource(0.28);
        const nFilter = this.ctx.createBiquadFilter();
        nFilter.type = 'bandpass';
        nFilter.frequency.setValueAtTime(900, t);
        nFilter.frequency.exponentialRampToValueAtTime(2400, t + 0.2);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.22, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(t);

        this.startWhoosh();
    }

    startWhoosh() {
        this.stopWhoosh();
        if (!this.ctx || this.muted) return;
        const noise = this.noiseSource(8);
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 700;
        filter.Q.value = 0.7;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.0001;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start();
        this.whoosh = { noise, filter, gain };
    }

    updateWhoosh(speed) {
        if (!this.whoosh || !this.ctx) return;
        const t = this.now();
        const amt = Math.min(1, speed / 28);
        this.whoosh.gain.gain.setTargetAtTime(0.04 + amt * 0.12, t, 0.05);
        this.whoosh.filter.frequency.setTargetAtTime(500 + amt * 1800, t, 0.08);
    }

    stopWhoosh() {
        if (!this.whoosh) return;
        try {
            const t = this.now();
            this.whoosh.gain.gain.setTargetAtTime(0.0001, t, 0.04);
            this.whoosh.noise.stop(t + 0.2);
        } catch (e) { /* already stopped */ }
        this.whoosh = null;
    }

    playImpact(type, intensity, xNorm) {
        if (!this.ready || this.muted) return;
        this.unlock();
        this.stopWhoosh();
        const t = this.now();
        const pan = this.panner(xNorm || 0);
        pan.connect(this.sfxGain);
        const force = Math.max(0.45, Math.min(1.6, intensity));

        const thump = this.ctx.createOscillator();
        const thumpGain = this.ctx.createGain();
        thump.type = 'sine';
        thump.frequency.setValueAtTime(70 + force * 20, t);
        thump.frequency.exponentialRampToValueAtTime(28, t + 0.28);
        thumpGain.gain.setValueAtTime(0.85 * force, t);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        thump.connect(thumpGain);
        thumpGain.connect(pan);
        thump.start(t);
        thump.stop(t + 0.45);

        const boom = this.noiseSource(0.7);
        const boomFilter = this.ctx.createBiquadFilter();
        boomFilter.type = 'lowpass';
        boomFilter.frequency.setValueAtTime(240, t);
        boomFilter.frequency.exponentialRampToValueAtTime(80, t + 0.5);
        const boomGain = this.ctx.createGain();
        boomGain.gain.setValueAtTime(0.55 * force, t);
        boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
        boom.connect(boomFilter);
        boomFilter.connect(boomGain);
        boomGain.connect(pan);
        boom.start(t);

        const crack = this.noiseSource(0.18);
        const crackFilter = this.ctx.createBiquadFilter();
        crackFilter.type = 'highpass';
        crackFilter.frequency.value = 1800;
        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(0.28 * force, t);
        crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        crack.connect(crackFilter);
        crackFilter.connect(crackGain);
        crackGain.connect(pan);
        crack.start(t);

        this.playMaterialLayer(type, t, force, pan);
    }

    playMaterialLayer(type, t, force, dest) {
        const specs = {
            modern: { freqs: [1400, 2100, 3200], wave: 'sawtooth', dur: 0.22, vol: 0.12 },
            supertall: { freqs: [1200, 1900, 2800], wave: 'sawtooth', dur: 0.26, vol: 0.12 },
            classic: { freqs: [90, 160, 240], wave: 'square', dur: 0.45, vol: 0.16 },
            institutional: { freqs: [80, 140, 220], wave: 'square', dur: 0.5, vol: 0.16 },
            residential: { freqs: [180, 320, 480], wave: 'triangle', dur: 0.32, vol: 0.14 },
            historic: { freqs: [200, 360, 520], wave: 'triangle', dur: 0.34, vol: 0.14 },
            artdeco: { freqs: [440, 660, 880, 1320], wave: 'square', dur: 0.7, vol: 0.1 },
            flatiron: { freqs: [240, 380, 560], wave: 'triangle', dur: 0.36, vol: 0.13 },
            bridge: { freqs: [110, 170, 230], wave: 'sawtooth', dur: 0.55, vol: 0.18 }
        };
        const spec = specs[type] || specs.classic;
        spec.freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = spec.wave;
            osc.frequency.setValueAtTime(freq + Math.random() * 40, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(spec.vol * force, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + spec.dur + i * 0.04);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + spec.dur + 0.08);
        });
    }

    playCollapse(xNorm) {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();
        const pan = this.panner(xNorm || 0);
        pan.connect(this.sfxGain);

        const rumble = this.noiseSource(1.8);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, t);
        filter.frequency.exponentialRampToValueAtTime(60, t + 1.6);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.5, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.7);
        rumble.connect(filter);
        filter.connect(gain);
        gain.connect(pan);
        rumble.start(t);

        for (let i = 0; i < 6; i++) {
            const clickT = t + 0.08 + i * 0.12 + Math.random() * 0.05;
            const n = this.noiseSource(0.08);
            const f = this.ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.value = 400 + Math.random() * 900;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.16, clickT);
            g.gain.exponentialRampToValueAtTime(0.001, clickT + 0.07);
            n.connect(f);
            f.connect(g);
            g.connect(pan);
            n.start(clickT);
        }
    }

    playSplash(xNorm) {
        if (!this.ready || this.muted) return;
        this.unlock();
        this.stopWhoosh();
        const t = this.now();
        const pan = this.panner(xNorm || 0);
        pan.connect(this.sfxGain);
        const noise = this.noiseSource(0.45);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.35);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(pan);
        noise.start(t);
    }

    playUI(kind) {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        const freq = kind === 'fire' ? 520 : kind === 'next' ? 660 : 340;
        osc.frequency.setValueAtTime(freq, t);
        if (kind === 'fire') osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playVictory() {
        if (!this.ready || this.muted) return;
        this.unlock();
        const notes = ['C5', 'E5', 'G5', 'C6', 'E6', 'G5', 'C6', 'E6', 'G6'];
        notes.forEach((note, i) => {
            const t = this.now() + i * 0.09;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(this.noteFreq(note), t);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.38);
        });
    }

    tone(freq, dur, type, vol, when) {
        if (!this.ctx) return;
        const t = when || this.now();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol || 0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + dur + 0.02);
        return osc;
    }

    playCharge(amount) {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90 + amount * 420, t);
        gain.gain.setValueAtTime(0.04 + amount * 0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
    }

    playBonk() {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();
        this.tone(180, 0.09, 'square', 0.22, t);
        this.tone(90, 0.14, 'triangle', 0.18, t);
        const noise = this.noiseSource(0.08);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        noise.connect(g);
        g.connect(this.sfxGain);
        noise.start(t);
    }

    playNearMiss() {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.38);
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.42);
        this.tone(196, 0.18, 'triangle', 0.1, t + 0.22);
        this.tone(147, 0.22, 'triangle', 0.08, t + 0.32);
    }

    playSplat() {
        if (!this.ready || this.muted) return;
        this.unlock();
        this.stopWhoosh();
        const t = this.now();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.22);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.26);
        const noise = this.noiseSource(0.2);
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 500;
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.22, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        noise.connect(f);
        f.connect(ng);
        ng.connect(this.sfxGain);
        noise.start(t);
    }

    playWhoops() {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();
        [330, 262, 196].forEach((freq, i) => this.tone(freq, 0.14, 'square', 0.1, t + i * 0.07));
    }

    playCombo(n) {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();
        const notes = ['C5', 'E5', 'G5', 'C6', 'E6'];
        const note = notes[Math.min(n, notes.length) - 1] || 'C6';
        this.tone(this.noteFreq(note), 0.16, 'triangle', 0.16, t);
        this.tone(this.noteFreq(note) * 1.5, 0.1, 'square', 0.06, t + 0.04);
    }

    playBest() {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();
        ['G5', 'B5', 'D6', 'G6'].forEach((n, i) => this.tone(this.noteFreq(n), 0.2, 'triangle', 0.18, t + i * 0.07));
    }

    playCrowd() {
        if (!this.ready || this.muted) return;
        this.unlock();
        const t = this.now();
        for (let i = 0; i < 6; i++) {
            const n = this.noiseSource(0.28);
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 400 + Math.random() * 800;
            const g = this.ctx.createGain();
            const when = t + i * 0.03;
            g.gain.setValueAtTime(0.001, when);
            g.gain.linearRampToValueAtTime(0.07, when + 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, when + 0.26);
            n.connect(bp);
            bp.connect(g);
            g.connect(this.sfxGain);
            n.start(when);
        }
        this.tone(523, 0.12, 'triangle', 0.1, t);
        this.tone(784, 0.16, 'triangle', 0.1, t + 0.08);
    }

    setVolume(percent) {
        this.volume = Math.max(0, Math.min(1, percent / 100));
        if (this.master) {
            this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.now(), 0.03);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.master) {
            this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.now(), 0.03);
        }
        if (this.muted) this.stopWhoosh();
        return this.muted;
    }

    nextSong() {
        this.pauseMusic();
        this.currentSong = (this.currentSong + 1) % this.songs.length;
        this.startMusic();
        return this.getCurrentSongName();
    }

    getCurrentSongName() {
        return this.songs[this.currentSong].name;
    }

    get isPlaying() {
        return this.musicOn;
    }
}

window.SquidAudio = SquidAudio;
