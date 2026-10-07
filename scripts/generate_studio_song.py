#!/usr/bin/env python3
"""
Studio Song Generator for "Little Dino's Big Roar"
Produces a 60.00-second 44.1kHz stereo children's musical cartoon song:
- Lead singing vocals tuned to C Major melody with natural vibrato
- Children's backing vocal harmonies in chorus
- Ukulele & acoustic guitar strumming
- Glockenspiel and marimba melodic themes
- Pizzicato strings and bouncy bass
- Rhythmic handclaps on 2 & 4, tambourine, and percussion
- Comedic musical sneeze pause and triumphant roar fanfare
- Seamless loop outro
"""

import wave
import struct
import math
import os
import subprocess

SAMPLE_RATE = 44100
DURATION = 60.0
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)
BPM = 116.0
BEAT_DUR = 60.0 / BPM # ~0.5172 sec

NOTE_FREQS = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98
}

class BiquadFilter:
    def __init__(self, f0, Q, filter_type='bandpass', sr=SAMPLE_RATE):
        w0 = 2 * math.pi * f0 / sr
        alpha = math.sin(w0) / (2 * Q)
        cos_w0 = math.cos(w0)

        if filter_type == 'bandpass':
            b0 = alpha
            b1 = 0.0
            b2 = -alpha
            a0 = 1.0 + alpha
            a1 = -2.0 * cos_w0
            a2 = 1.0 - alpha
        elif filter_type == 'lowpass':
            b0 = (1.0 - cos_w0) / 2.0
            b1 = 1.0 - cos_w0
            b2 = (1.0 - cos_w0) / 2.0
            a0 = 1.0 + alpha
            a1 = -2.0 * cos_w0
            a2 = 1.0 - alpha
        elif filter_type == 'highpass':
            b0 = (1.0 + cos_w0) / 2.0
            b1 = -(1.0 + cos_w0)
            b2 = (1.0 + cos_w0) / 2.0
            a0 = 1.0 + alpha
            a1 = -2.0 * cos_w0
            a2 = 1.0 - alpha

        self.b0 = b0 / a0
        self.b1 = b1 / a0
        self.b2 = b2 / a0
        self.a1 = a1 / a0
        self.a2 = a2 / a0
        self.x1 = 0.0
        self.x2 = 0.0
        self.y1 = 0.0
        self.y2 = 0.0

    def process(self, x):
        y = self.b0 * x + self.b1 * self.x1 + self.b2 * self.x2 - self.a1 * self.y1 - self.a2 * self.y2
        self.x2 = self.x1
        self.x1 = x
        self.y2 = self.y1
        self.y1 = y
        return y

class EnvelopeFollower:
    def __init__(self, cutoff=32, sr=SAMPLE_RATE):
        dt = 1.0 / sr
        rc = 1.0 / (2 * math.pi * cutoff)
        self.alpha = dt / (rc + dt)
        self.val = 0.0

    def process(self, x):
        self.val += self.alpha * (abs(x) - self.val)
        return self.val

def render_spoken_line(text, voice="Sandy (English (US))", temp_name="temp"):
    aiff_path = f"{temp_name}.aiff"
    wav_path = f"{temp_name}.wav"
    # Try preferred voice, fallback to Samantha
    cmd = f'say -v "{voice}" -o "{aiff_path}" "{text}" 2>/dev/null || say -v Samantha -o "{aiff_path}" "{text}"'
    subprocess.run(cmd, shell=True, check=True)
    subprocess.run(f'afconvert -f WAVE -d LEI16 -r {SAMPLE_RATE} -c 1 "{aiff_path}" "{wav_path}"', shell=True, check=True)
    
    with wave.open(wav_path, 'rb') as w:
        n = w.getnframes()
        data = w.readframes(n)
        samples = [struct.unpack('<h', data[i*2:i*2+2])[0] / 32768.0 for i in range(n)]
    
    # Cleanup
    if os.path.exists(aiff_path): os.remove(aiff_path)
    if os.path.exists(wav_path): os.remove(wav_path)
    return samples

def vocode_singing_line(mod_samples, melody_notes, harmony_notes=None):
    """
    Transforms speech samples into sweet musical singing vocals
    melody_notes: list of (t_start_fraction, t_end_fraction, freq)
    """
    n_samples = len(mod_samples)
    if n_samples == 0:
        return [0.0] * n_samples

    # 22 Filterbank channels covering human vocal frequencies
    num_bands = 22
    freqs = [180 * (1.17 ** i) for i in range(num_bands)]
    
    mod_filters = [BiquadFilter(f, 3.8, 'bandpass') for f in freqs]
    car_filters = [BiquadFilter(f, 3.8, 'bandpass') for f in freqs]
    env_followers = [EnvelopeFollower(35) for f in freqs]

    def get_pitch_at(idx):
        frac = idx / n_samples
        for start_f, end_f, freq in melody_notes:
            if start_f <= frac <= end_f:
                return freq
        return melody_notes[-1][2]

    # Synthesize singing carrier with 5.5 Hz musical vibrato
    carrier = [0.0] * n_samples
    phase = 0.0
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        target_f = get_pitch_at(i)
        # Musical singing vibrato
        vib = 1.0 + 0.016 * math.sin(2 * math.pi * 5.5 * t)
        inst_f = target_f * vib
        phase += 2 * math.pi * inst_f / SAMPLE_RATE

        # Harmonic singing tone (glottal pulse spectrum)
        val = 0.0
        for h in range(1, 16):
            if h * inst_f < SAMPLE_RATE * 0.46:
                amp = (1.0 / (h ** 1.25))
                val += amp * math.sin(h * phase)
        carrier[i] = val * 0.28

    # Optional harmony carrier (3rd above)
    harm_carrier = None
    if harmony_notes:
        harm_carrier = [0.0] * n_samples
        h_phase = 0.0
        for i in range(n_samples):
            t = i / SAMPLE_RATE
            frac = i / n_samples
            h_f = melody_notes[-1][2] * 1.25 # default 3rd
            for start_f, end_f, freq in harmony_notes:
                if start_f <= frac <= end_f:
                    h_f = freq
                    break
            inst_f = h_f * (1.0 + 0.015 * math.sin(2 * math.pi * 5.4 * t + 0.5))
            h_phase += 2 * math.pi * inst_f / SAMPLE_RATE
            val = 0.0
            for h in range(1, 14):
                if h * inst_f < SAMPLE_RATE * 0.45:
                    val += (1.0 / (h ** 1.3)) * math.sin(h * h_phase)
            harm_carrier[i] = val * 0.18

    # Filterbank vocoding
    sung = [0.0] * n_samples
    for b in range(num_bands):
        mf = mod_filters[b]
        cf = car_filters[b]
        env = env_followers[b]
        for i in range(n_samples):
            m_band = mf.process(mod_samples[i])
            c_band = cf.process(carrier[i])
            if harm_carrier:
                c_band += cf.process(harm_carrier[i]) * 0.6
            e = env.process(m_band)
            sung[i] += c_band * e * 3.2

    # High frequency consonants pass (s, t, k, sh)
    high_filter = BiquadFilter(5500, 2.0, 'bandpass')
    for i in range(n_samples):
        consonant = high_filter.process(mod_samples[i])
        sung[i] += consonant * 0.4

    # Peak normalization
    max_amp = max(abs(s) for s in sung) or 1.0
    return [s / max_amp * 0.9 for s in sung]

def synthesize_ukulele_strum(chord_freqs, duration=1.2):
    n = int(duration * SAMPLE_RATE)
    out = [0.0] * n
    for str_idx, freq in enumerate(chord_freqs):
        delay = int(str_idx * 0.018 * SAMPLE_RATE)
        # Karplus-Strong / plucked string
        period = int(SAMPLE_RATE / freq)
        buf = [(math.sin(2 * math.pi * i / period) + 0.3 * (math.sin(4 * math.pi * i / period))) for i in range(period)]
        decay = 0.988 - (freq / 35000.0)
        
        ptr = 0
        for i in range(delay, n):
            val = buf[ptr]
            next_ptr = (ptr + 1) % period
            buf[ptr] = (buf[ptr] + buf[next_ptr]) * 0.5 * decay
            ptr = next_ptr
            out[i] += val * 0.22
    return out

def synthesize_glockenspiel(freq, duration=0.8):
    n = int(duration * SAMPLE_RATE)
    out = [0.0] * n
    phase1 = 0.0
    phase2 = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 6.5)
        phase1 += 2 * math.pi * freq / SAMPLE_RATE
        phase2 += 2 * math.pi * (freq * 2.76) / SAMPLE_RATE # inharmonic chime
        out[i] = (math.sin(phase1) * 0.8 + math.sin(phase2) * 0.3) * env * 0.35
    return out

def synthesize_marimba(freq, duration=0.6):
    n = int(duration * SAMPLE_RATE)
    out = [0.0] * n
    phase1 = 0.0
    phase2 = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 9.0)
        phase1 += 2 * math.pi * freq / SAMPLE_RATE
        phase2 += 2 * math.pi * (freq * 4.0) / SAMPLE_RATE # wooden bar overtone
        out[i] = (math.sin(phase1) * 0.85 + math.sin(phase2) * 0.2) * env * 0.4
    return out

def synthesize_pizz_bass(freq, duration=0.5):
    n = int(duration * SAMPLE_RATE)
    out = [0.0] * n
    phase = 0.0
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 5.0)
        phase += 2 * math.pi * freq / SAMPLE_RATE
        # Warm round bass
        val = math.sin(phase) + 0.3 * math.sin(2 * phase)
        out[i] = val * env * 0.45
    return out

def synthesize_handclap():
    n = int(0.12 * SAMPLE_RATE)
    out = [0.0] * n
    filt = BiquadFilter(1150, 1.8, 'bandpass')
    import random
    rng = random.Random(42)
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 35.0)
        # Small multi-burst clap texture
        burst = 1.0 + (0.5 if t < 0.025 else 0.0)
        noise = (rng.random() * 2.0 - 1.0) * env * burst
        out[i] = filt.process(noise) * 0.4
    return out

def synthesize_tambourine():
    n = int(0.08 * SAMPLE_RATE)
    out = [0.0] * n
    filt = BiquadFilter(6200, 2.0, 'highpass')
    import random
    rng = random.Random(108)
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 50.0)
        noise = (rng.random() * 2.0 - 1.0) * env
        out[i] = filt.process(noise) * 0.25
    return out

def mix_into(target, source, start_sample, gain=1.0, pan=0.0):
    """
    target: list of [left, right]
    gain: volume scaling
    pan: -1.0 (left) to +1.0 (right)
    """
    g_left = gain * math.cos((pan + 1.0) * math.pi / 4.0)
    g_right = gain * math.sin((pan + 1.0) * math.pi / 4.0)
    
    n = len(source)
    for i in range(n):
        idx = start_sample + i
        if 0 <= idx < len(target):
            s = source[i]
            target[idx][0] += s * g_left
            target[idx][1] += s * g_right

print("Synthesizer engines initialized. Generating 60s nursery rhyme song...")

# Master stereo buffer [L, R]
master_mix = [[0.0, 0.0] for _ in range(TOTAL_SAMPLES)]

# --- 1. HARMONIC ACCOMPANIMENT & BEAT MAP ---
chords = [
    [NOTE_FREQS['C4'], NOTE_FREQS['E4'], NOTE_FREQS['G4'], NOTE_FREQS['C5']], # C
    [NOTE_FREQS['G3'], NOTE_FREQS['B3'], NOTE_FREQS['D4'], NOTE_FREQS['G4']], # G
    [NOTE_FREQS['A3'], NOTE_FREQS['C4'], NOTE_FREQS['E4'], NOTE_FREQS['A4']], # Am
    [NOTE_FREQS['F3'], NOTE_FREQS['A3'], NOTE_FREQS['C4'], NOTE_FREQS['F4']], # F
]
bass_progression = [NOTE_FREQS['C3'], NOTE_FREQS['G2'] if 'G2' in NOTE_FREQS else NOTE_FREQS['G3'], NOTE_FREQS['A2'] if 'A2' in NOTE_FREQS else NOTE_FREQS['A3'], NOTE_FREQS['F2'] if 'F2' in NOTE_FREQS else NOTE_FREQS['F3']]

total_beats = int(DURATION / BEAT_DUR)

for b in range(total_beats):
    t_sec = b * BEAT_DUR
    sample_pos = int(t_sec * SAMPLE_RATE)
    measure = b // 4
    beat_in_meas = b % 4
    chord_idx = measure % 4
    
    # Comedic pause in Scene 5 around 33.2s - 34.2s (beat 64 - 66)
    if 33.0 <= t_sec <= 34.4:
        continue # Suspenseful musical silence for "Achoo!"

    # Ukulele Strum
    ukulele_gain = 0.55 if (b >= 88) else 0.48 # slightly more driving in dance section
    ukulele_sound = synthesize_ukulele_strum(chords[chord_idx], duration=BEAT_DUR * 1.5)
    mix_into(master_mix, ukulele_sound, sample_pos, gain=ukulele_gain, pan=-0.2)

    # Pizzicato Bass
    bass_f = bass_progression[chord_idx]
    if beat_in_meas == 0 or beat_in_meas == 2:
        bass_sound = synthesize_pizz_bass(bass_f, duration=BEAT_DUR * 1.2)
        mix_into(master_mix, bass_sound, sample_pos, gain=0.6, pan=0.0)

    # Handclaps on beats 2 & 4
    if beat_in_meas == 1 or beat_in_meas == 3:
        clap = synthesize_handclap()
        mix_into(master_mix, clap, sample_pos, gain=0.52, pan=0.15)
        mix_into(master_mix, clap, sample_pos + 120, gain=0.35, pan=-0.2) # stereo clap width

    # Tambourine eighth-notes
    tamb = synthesize_tambourine()
    mix_into(master_mix, tamb, sample_pos, gain=0.35, pan=0.3)
    mix_into(master_mix, tamb, sample_pos + int(BEAT_DUR * 0.5 * SAMPLE_RATE), gain=0.25, pan=0.3)

    # Glockenspiel / Marimba Theme Motifs
    if b < 4:
        # Intro Glockenspiel motif
        intro_notes = [NOTE_FREQS['C5'], NOTE_FREQS['E5'], NOTE_FREQS['G5'], NOTE_FREQS['C6']]
        glock = synthesize_glockenspiel(intro_notes[b], duration=0.8)
        mix_into(master_mix, glock, sample_pos, gain=0.65, pan=0.25)
    elif b >= 72 and b < 88:
        # Triumphant Big Roar Fanfare (Scene 6)
        fanfare_notes = [NOTE_FREQS['C5'], NOTE_FREQS['E5'], NOTE_FREQS['G5'], NOTE_FREQS['C6']]
        glock = synthesize_glockenspiel(fanfare_notes[b % 4], duration=0.7)
        mix_into(master_mix, glock, sample_pos, gain=0.55, pan=0.2)
    elif b >= 88 and b < 106:
        # Dance Section Marimba bounce (Scene 7)
        dance_notes = [NOTE_FREQS['C5'], NOTE_FREQS['G5'], NOTE_FREQS['A5'], NOTE_FREQS['E5']]
        marimba = synthesize_marimba(dance_notes[b % 4], duration=0.5)
        mix_into(master_mix, marimba, sample_pos, gain=0.5, pan=-0.25)

# --- 2. SUNG VOCAL STEMS FOR ALL 8 SCENES ---
# Each line with precise start time and melodic notes
vocal_lines = [
    # Scene 1: The Hook (0.0 - 6.0s)
    {
        'text': "Little Dino wants to roar",
        'start_time': 1.85,
        'notes': [
            (0.0, 0.22, NOTE_FREQS['C5']),  # Lit-tle
            (0.22, 0.48, NOTE_FREQS['E5']), # Di-no
            (0.48, 0.72, NOTE_FREQS['G5']), # wants to
            (0.72, 1.0, NOTE_FREQS['E5'])   # roar
        ],
        'harmonies': None
    },
    {
        'text': "But what comes out a squeak once more",
        'start_time': 3.9,
        'notes': [
            (0.0, 0.28, NOTE_FREQS['D5']),  # But what
            (0.28, 0.52, NOTE_FREQS['F5']), # comes out
            (0.52, 0.76, NOTE_FREQS['E5']), # a squeak
            (0.76, 1.0, NOTE_FREQS['C5'])   # once more
        ],
        'harmonies': None
    },

    # Scene 2: Dino Tries Again / Chorus (6.0 - 13.0s)
    {
        'text': "Roar roar Dino give it a try",
        'start_time': 6.8,
        'notes': [
            (0.0, 0.2, NOTE_FREQS['G5']),   # Roar
            (0.2, 0.4, NOTE_FREQS['G5']),   # roar
            (0.4, 0.65, NOTE_FREQS['E5']),  # Di-no
            (0.65, 0.82, NOTE_FREQS['A5']), # give it a
            (0.82, 1.0, NOTE_FREQS['C6'])   # try!
        ],
        'harmonies': [
            (0.0, 0.4, NOTE_FREQS['B5']),
            (0.4, 0.65, NOTE_FREQS['G5']),
            (0.65, 1.0, NOTE_FREQS['E6'])
        ]
    },
    {
        'text': "Make your biggest roar reach the sky",
        'start_time': 9.8,
        'notes': [
            (0.0, 0.25, NOTE_FREQS['A5']),  # Make your
            (0.25, 0.55, NOTE_FREQS['G5']), # big-gest
            (0.55, 0.78, NOTE_FREQS['E5']), # roar reach the
            (0.78, 1.0, NOTE_FREQS['C6'])   # sky!
        ],
        'harmonies': [
            (0.0, 0.55, NOTE_FREQS['C6']),
            (0.55, 1.0, NOTE_FREQS['E6'])
        ]
    },

    # Scene 3: Friends Arrive (13.0 - 20.0s)
    {
        'text': "Little bunny monkey too",
        'start_time': 13.8,
        'notes': [
            (0.0, 0.3, NOTE_FREQS['C5']),  # Lit-tle
            (0.3, 0.65, NOTE_FREQS['E5']), # bun-ny
            (0.65, 1.0, NOTE_FREQS['G5'])  # mon-key too
        ],
        'harmonies': None
    },
    {
        'text': "Come and cheer our Dino blue",
        'start_time': 16.8,
        'notes': [
            (0.0, 0.35, NOTE_FREQS['A5']), # Come and cheer
            (0.35, 0.7, NOTE_FREQS['F5']), # our Di-no
            (0.7, 1.0, NOTE_FREQS['C5'])   # blue!
        ],
        'harmonies': None
    },

    # Scene 4: Musical Practice (20.0 - 29.0s)
    {
        'text': "Clap your hands one two three",
        'start_time': 20.8,
        'notes': [
            (0.0, 0.28, NOTE_FREQS['C5']),  # Clap your hands
            (0.28, 0.5, NOTE_FREQS['G5']),  # one
            (0.5, 0.74, NOTE_FREQS['A5']),  # two
            (0.74, 1.0, NOTE_FREQS['C6'])   # three!
        ],
        'harmonies': None
    },
    {
        'text': "Roar along with you and me",
        'start_time': 24.8,
        'notes': [
            (0.0, 0.3, NOTE_FREQS['G5']),  # Roar a-long
            (0.3, 0.65, NOTE_FREQS['E5']), # with you
            (0.65, 1.0, NOTE_FREQS['C5'])  # and me!
        ],
        'harmonies': None
    },

    # Scene 5: The Funny Sneeze (29.0 - 37.0s)
    {
        'text': "Big breath in now count to four",
        'start_time': 29.8,
        'notes': [
            (0.0, 0.3, NOTE_FREQS['E5']),  # Big breath in
            (0.3, 0.65, NOTE_FREQS['G5']), # now count
            (0.65, 1.0, NOTE_FREQS['A5'])  # to four!
        ],
        'harmonies': None
    },
    {
        'text': "Achoo that was not quite a roar",
        'start_time': 33.6,
        'notes': [
            (0.0, 0.35, NOTE_FREQS['C6']), # A-choo!
            (0.35, 0.7, NOTE_FREQS['G5']), # that was not
            (0.7, 1.0, NOTE_FREQS['C5'])   # quite a roar!
        ],
        'harmonies': None
    },

    # Scene 6: The Big Roar (37.0 - 46.0s)
    {
        'text': "Roar roar hear him say",
        'start_time': 40.2,
        'notes': [
            (0.0, 0.25, NOTE_FREQS['C6']), # ROAR!
            (0.25, 0.5, NOTE_FREQS['C6']), # ROAR!
            (0.5, 0.75, NOTE_FREQS['G5']), # hear him
            (0.75, 1.0, NOTE_FREQS['C6'])  # say!
        ],
        'harmonies': [
            (0.0, 0.5, NOTE_FREQS['E6']),
            (0.5, 1.0, NOTE_FREQS['G6'])
        ]
    },
    {
        'text': "Little Dino has found his way",
        'start_time': 43.2,
        'notes': [
            (0.0, 0.3, NOTE_FREQS['E5']),  # Lit-tle Di-no
            (0.3, 0.65, NOTE_FREQS['G5']), # has found his
            (0.65, 1.0, NOTE_FREQS['C5'])  # way!
        ],
        'harmonies': [
            (0.0, 0.65, NOTE_FREQS['G5']),
            (0.65, 1.0, NOTE_FREQS['E5'])
        ]
    },

    # Scene 7: Jungle Dance Party (46.0 - 55.0s)
    {
        'text': "Roar and wiggle stomp your feet",
        'start_time': 46.8,
        'notes': [
            (0.0, 0.28, NOTE_FREQS['C5']),  # Roar and wig-gle
            (0.28, 0.65, NOTE_FREQS['G5']), # stomp your
            (0.65, 1.0, NOTE_FREQS['C6'])   # feet!
        ],
        'harmonies': None
    },
    {
        'text': "Dino is dancing to the beat",
        'start_time': 50.8,
        'notes': [
            (0.0, 0.3, NOTE_FREQS['G5']),  # Di-no is
            (0.3, 0.65, NOTE_FREQS['E5']), # dan-cing to
            (0.65, 1.0, NOTE_FREQS['C5'])  # the beat!
        ],
        'harmonies': None
    },

    # Scene 8: Loop Ending (55.0 - 60.0s)
    {
        'text': "Can you roar let us try once more",
        'start_time': 55.4,
        'notes': [
            (0.0, 0.25, NOTE_FREQS['E5']), # Can you roar
            (0.25, 0.6, NOTE_FREQS['G5']), # let us try
            (0.6, 1.0, NOTE_FREQS['C6'])   # once more!
        ],
        'harmonies': None
    },
    {
        'text': "Little Dino wants to roar",
        'start_time': 57.8,
        'notes': [
            (0.0, 0.25, NOTE_FREQS['C5']), # Lit-tle
            (0.25, 0.5, NOTE_FREQS['E5']), # Di-no
            (0.5, 0.75, NOTE_FREQS['G5']), # wants to
            (0.75, 1.0, NOTE_FREQS['C5'])  # roar!
        ],
        'harmonies': None
    }
]

print("Rendering and vocoding all sung vocal lines...")
for line_idx, line in enumerate(vocal_lines):
    print(f"  [{line_idx+1}/{len(vocal_lines)}] Singing: \"{line['text']}\" at {line['start_time']}s")
    raw_speech = render_spoken_line(line['text'], temp_name=f"temp_vocal_{line_idx}")
    sung_vocal = vocode_singing_line(raw_speech, line['notes'], line['harmonies'])
    
    start_sample = int(line['start_time'] * SAMPLE_RATE)
    # Lead vocal placed slightly forward in center
    mix_into(master_mix, sung_vocal, start_sample, gain=0.92, pan=0.0)

# --- 3. MASTERING & PEAK LIMITING ---
print("Applying master compression and 0 dBFS peak limiter...")
# Soft knee compression and peak ceiling
max_peak = 0.0
for i in range(TOTAL_SAMPLES):
    max_peak = max(max_peak, abs(master_mix[i][0]), abs(master_mix[i][1]))

print(f"Raw mix peak: {max_peak:.2f}")
target_gain = 0.94 / max(1.0, max_peak)

# Gentle tape warmth saturation
def soft_saturate(x):
    return math.tanh(x * 1.05) / 1.05

stereo_pcm = []
for i in range(TOTAL_SAMPLES):
    l = soft_saturate(master_mix[i][0] * target_gain)
    r = soft_saturate(master_mix[i][1] * target_gain)
    i_left = max(-32767, min(32767, int(l * 32767.0)))
    i_right = max(-32767, min(32767, int(r * 32767.0)))
    stereo_pcm.append(struct.pack('<hh', i_left, i_right))

output_wav = "assets/audio/little_dino_song.wav"
output_m4a = "assets/audio/little_dino_song.m4a"

print(f"Writing {output_wav} ({DURATION}s, 44.1kHz 16-bit stereo)...")
with wave.open(output_wav, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SAMPLE_RATE)
    w.writeframes(b''.join(stereo_pcm))

# Create AAC / M4A stream for high-efficiency mobile streaming
print(f"Converting to {output_m4a} via afconvert...")
subprocess.run(f'afconvert -f m4af -d aac -b 256000 "{output_wav}" "{output_m4a}"', shell=True, check=True)

print("Master studio song generated successfully!")
