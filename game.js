'use strict';

const TAU = Math.PI * 2;
const BEST_KEY = 'squidnyc-best';

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function distToRect(px, py, x, y, w, h) {
    const dx = Math.max(x - px, 0, px - (x + w));
    const dy = Math.max(y - py, 0, py - (y + h));
    return Math.hypot(dx, dy);
}

function mulberry32(seed) {
    let a = seed >>> 0;
    return function rand() {
        a |= 0;
        a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function shadeHex(hex, amt) {
    const n = hex.replace('#', '');
    const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16);
    const r = clamp(((num >> 16) & 255) + amt, 0, 255);
    const g = clamp(((num >> 8) & 255) + amt, 0, 255);
    const b = clamp((num & 255) + amt, 0, 255);
    return `rgb(${r | 0},${g | 0},${b | 0})`;
}

class Atmosphere {
    constructor() {
        this.stars = [];
        this.clouds = [];
        this.time = 0;
        this.width = 1;
        this.height = 1;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        const rand = mulberry32(0x51A7);
        const count = Math.floor(width * height / 14000);
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: rand() * width,
                y: rand() * height * 0.55,
                r: rand() * 1.4 + 0.3,
                tw: rand() * TAU,
                speed: 0.6 + rand() * 1.8
            });
        }
        this.clouds = [];
        for (let i = 0; i < 7; i++) {
            this.clouds.push({
                x: rand() * width,
                y: height * (0.08 + rand() * 0.22),
                w: 140 + rand() * 220,
                h: 28 + rand() * 22,
                speed: 3 + rand() * 8,
                alpha: 0.08 + rand() * 0.1
            });
        }
    }

    update(dt) {
        this.time += dt;
        for (const cloud of this.clouds) {
            cloud.x += cloud.speed * dt;
            if (cloud.x - cloud.w > this.width) cloud.x = -cloud.w;
        }
    }

    renderSky(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, this.height);
        g.addColorStop(0, '#070510');
        g.addColorStop(0.28, '#1a0a2e');
        g.addColorStop(0.52, '#4a1848');
        g.addColorStop(0.7, '#c45c26');
        g.addColorStop(0.86, '#ffb347');
        g.addColorStop(1, '#1b2a38');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.width, this.height);

        const glow = ctx.createRadialGradient(this.width * 0.72, this.height * 0.62, 20, this.width * 0.72, this.height * 0.62, this.width * 0.45);
        glow.addColorStop(0, 'rgba(255, 186, 72, 0.42)');
        glow.addColorStop(0.45, 'rgba(255, 120, 60, 0.12)');
        glow.addColorStop(1, 'rgba(255, 120, 60, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    renderStars(ctx) {
        for (const star of this.stars) {
            const twinkle = 0.45 + 0.55 * Math.sin(this.time * star.speed + star.tw);
            ctx.fillStyle = `rgba(255, 246, 220, ${twinkle})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, TAU);
            ctx.fill();
        }
    }

    renderMoon(ctx) {
        const x = this.width * 0.78;
        const y = this.height * 0.16;
        const r = Math.min(42, this.width * 0.028);
        const halo = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 4.2);
        halo.addColorStop(0, 'rgba(255, 230, 180, 0.35)');
        halo.addColorStop(1, 'rgba(255, 230, 180, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, r * 4.2, 0, TAU);
        ctx.fill();
        const moon = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
        moon.addColorStop(0, '#fff4d2');
        moon.addColorStop(0.7, '#e8c98a');
        moon.addColorStop(1, '#c9a05a');
        ctx.fillStyle = moon;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
    }

    renderClouds(ctx) {
        for (const cloud of this.clouds) {
            ctx.fillStyle = `rgba(18, 12, 28, ${cloud.alpha})`;
            ctx.beginPath();
            ctx.ellipse(cloud.x, cloud.y, cloud.w, cloud.h, 0, 0, TAU);
            ctx.ellipse(cloud.x + cloud.w * 0.35, cloud.y + 6, cloud.w * 0.55, cloud.h * 0.75, 0, 0, TAU);
            ctx.fill();
        }
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life, size, kind) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.kind = kind || 'dust';
        this.rot = Math.random() * TAU;
        this.spin = (Math.random() - 0.5) * 0.25;
        this.gravity = kind === 'spark' ? 0.18 : kind === 'smoke' ? -0.02 : 0.16;
    }

    update(scale) {
        const s = scale || 1;
        this.x += this.vx * s;
        this.y += this.vy * s;
        this.vy += this.gravity * s;
        this.vx *= this.kind === 'smoke' ? 0.99 : 0.985;
        this.rot += this.spin * s;
        if (this.kind === 'smoke') this.size += 0.08 * s;
        this.life -= s;
    }

    render(ctx) {
        const a = clamp(this.life / this.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = this.kind === 'smoke' ? a * 0.35 : a;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        if (this.kind === 'spark') {
            ctx.fillStyle = '#ffe39a';
            ctx.fillRect(-this.size * 0.3, -this.size, this.size * 0.6, this.size * 2);
        } else if (this.kind === 'glass') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size, this.size);
            ctx.lineTo(-this.size, this.size);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Shockwave {
    constructor(x, y, maxR) {
        this.x = x;
        this.y = y;
        this.r = 6;
        this.maxR = maxR;
        this.life = 1;
    }

    update(scale) {
        this.r += 7 * (scale || 1);
        this.life -= 0.035 * (scale || 1);
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life) * 0.55;
        ctx.strokeStyle = 'rgba(255, 220, 160, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, TAU);
        ctx.stroke();
        ctx.restore();
    }

    get dead() { return this.life <= 0 || this.r > this.maxR; }
}

class Floater {
    constructor(text, x, y, color, size) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color || '#fff6d8';
        this.size = size || 22;
        this.life = 1;
        this.vy = -38;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.vy += 18 * dt;
        this.life -= dt * 0.85;
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = clamp(this.life, 0, 1);
        ctx.fillStyle = this.color;
        ctx.font = `800 ${this.size}px Trebuchet MS, sans-serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Fire {
    constructor(x, y, intensity) {
        this.x = x;
        this.y = y;
        this.intensity = intensity;
        this.age = 0;
        this.maxAge = 420;
        this.flames = [];
        this.smoke = [];
    }

    update(scale) {
        const s = scale || 1;
        this.age += s;
        if (this.age % 2 < s && this.age < this.maxAge * 0.85) {
            this.flames.push({
                x: this.x + (Math.random() - 0.5) * 22,
                y: this.y,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -1.4 - Math.random() * 1.6,
                size: 5 + Math.random() * 7,
                life: 18 + Math.random() * 16,
                max: 34,
                flick: Math.random() * TAU
            });
        }
        if (this.age % 6 < s && this.age < this.maxAge) {
            this.smoke.push({
                x: this.x + (Math.random() - 0.5) * 18,
                y: this.y - 8,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -0.7,
                size: 7 + Math.random() * 8,
                life: 40,
                max: 40
            });
        }
        for (const f of this.flames) {
            f.x += f.vx * s;
            f.y += f.vy * s;
            f.vy -= 0.03 * s;
            f.life -= s;
            f.flick += 0.35 * s;
        }
        for (const sm of this.smoke) {
            sm.x += sm.vx * s;
            sm.y += sm.vy * s;
            sm.size += 0.12 * s;
            sm.life -= s;
        }
        this.flames = this.flames.filter((f) => f.life > 0);
        this.smoke = this.smoke.filter((sm) => sm.life > 0);
    }

    render(ctx) {
        for (const sm of this.smoke) {
            ctx.globalAlpha = (sm.life / sm.max) * 0.28;
            ctx.fillStyle = '#2a2a2e';
            ctx.beginPath();
            ctx.arc(sm.x, sm.y, sm.size, 0, TAU);
            ctx.fill();
        }
        for (const f of this.flames) {
            const a = (f.life / f.max) * (0.75 + 0.25 * Math.sin(f.flick));
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
            g.addColorStop(0, 'rgba(255,255,210,1)');
            g.addColorStop(0.35, 'rgba(255,170,40,0.95)');
            g.addColorStop(1, 'rgba(255,40,0,0)');
            ctx.globalAlpha = a;
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(f.x, f.y, f.size * 0.55, f.size * 1.35, 0, 0, TAU);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    get dead() {
        return this.age > this.maxAge && this.flames.length === 0 && this.smoke.length === 0;
    }
}

class FallingDebris {
    constructor(x, y, w, h, color, type, vx, vy) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.type = type;
        this.vx = vx;
        this.vy = vy;
        this.rot = Math.random() * TAU;
        this.spin = (Math.random() - 0.5) * 0.18;
        this.life = 240;
    }

    update(ground, scale) {
        const s = scale || 1;
        this.x += this.vx * s;
        this.y += this.vy * s;
        this.vy += 0.38 * s;
        this.vx *= 0.995;
        this.rot += this.spin * s;
        this.life -= s;
        if (this.y + this.h > ground && this.vy > 0) {
            this.y = ground - this.h;
            this.vy *= -0.28;
            this.vx *= 0.6;
            this.spin *= 0.5;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.globalAlpha = clamp(this.life / 80, 0, 1);
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(this.rot);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.fillStyle = 'rgba(255, 214, 120, 0.45)';
        for (let i = 0; i < 2; i++) ctx.fillRect(-this.w / 4 + i * 8, -this.h / 5, 3, 3);
        ctx.restore();
    }
}

class Building {
    constructor(spec) {
        this.name = spec.name;
        this.type = spec.type;
        this.rx = spec.rx;
        this.baseW = spec.w;
        this.baseH = spec.h;
        this.color = spec.color;
        this.accent = spec.accent || '#d8b36a';
        this.protected = !!spec.protected;
        this.x = 0;
        this.y = 0;
        this.width = spec.w;
        this.height = spec.h;
        this.originalHeight = spec.h;
        this.hitCount = 0;
        this.isCollapsing = false;
        this.collapseProgress = 0;
        this.fires = [];
        this.windows = [];
        this.cracks = [];
        this.seed = hashString(spec.name);
        this.buildWindows();
    }

    layout(canvasW, ground) {
        this.x = canvasW * this.rx;
        this.width = this.baseW;
        this.y = ground - this.height;
        this.groundY = ground;
    }

    buildWindows() {
        const rand = mulberry32(this.seed);
        const cols = Math.max(2, Math.floor(this.baseW / 9));
        const rows = Math.max(3, Math.floor(this.baseH / 14));
        this.windows = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (rand() < 0.22) continue;
                const roll = rand();
                this.windows.push({
                    u: (c + 0.22) / cols,
                    v: (r + 0.28) / rows,
                    w: 0.42 / cols,
                    h: 0.42 / rows,
                    lit: rand() > 0.18,
                    phase: rand() * TAU,
                    color: roll > 0.82 ? '#8fd4ff' : roll > 0.7 ? '#fff1c2' : '#ffcf7a'
                });
            }
        }
    }

    checkCollision(squid) {
        if (this.height <= 8) return false;
        return squid.x > this.x && squid.x < this.x + this.width &&
            squid.y > this.y && squid.y < this.y + this.height;
    }

    hit(x, y, force) {
        this.hitCount++;
        this.fires.push(new Fire(x, y, 1 + this.hitCount * 0.35));
        if (Math.random() > 0.4) {
            this.fires.push(new Fire(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 30, 0.7));
        }
        const rand = mulberry32(this.seed + this.hitCount * 17);
        this.cracks.push({
            x: x - this.x,
            y: y - this.y,
            paths: Array.from({ length: 3 }, () => ({ a: rand() * TAU, len: 12 + rand() * 22 }))
        });
        if (this.hitCount >= 2 || force > 1.35) this.startCollapse();
        return this.isCollapsing && this.collapseProgress === 0;
    }

    startCollapse() {
        if (this.isCollapsing) return;
        this.isCollapsing = true;
        this.collapseProgress = 0;
    }

    update(scale) {
        const s = scale || 1;
        for (let i = this.fires.length - 1; i >= 0; i--) {
            this.fires[i].update(s);
            if (this.fires[i].dead) this.fires.splice(i, 1);
        }
        if (!this.isCollapsing) return;
        this.collapseProgress += s;
        if (this.collapseProgress > 28) {
            const drop = 8 * s;
            this.height = Math.max(0, this.height - drop);
            this.y += drop;
        }
    }

    silhouettePath(ctx, shakeX) {
        const x = this.x + shakeX;
        const y = this.y;
        const w = this.width;
        const h = this.height;
        ctx.beginPath();
        if (this.type === 'flatiron') {
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + w * 0.5, y);
            ctx.closePath();
        } else if (this.type === 'supertall' && this.name.includes('World Trade')) {
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + w * 0.78, y + 18);
            ctx.lineTo(x + w * 0.5, y);
            ctx.lineTo(x + w * 0.22, y + 18);
            ctx.closePath();
        } else {
            ctx.rect(x, y, w, h);
        }
    }

    render(ctx, time) {
        if (this.height <= 0) return;
        const shakeX = this.isCollapsing && this.collapseProgress < 28 ? (Math.random() - 0.5) * 6 : 0;
        const x = this.x + shakeX;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = this.color;
        this.silhouettePath(ctx, shakeX);
        ctx.fill();
        ctx.restore();

        const shade = ctx.createLinearGradient(x, this.y, x + this.width, this.y);
        shade.addColorStop(0, 'rgba(255, 190, 110, 0.14)');
        shade.addColorStop(0.45, 'rgba(0,0,0,0)');
        shade.addColorStop(1, 'rgba(8, 6, 20, 0.28)');
        ctx.fillStyle = shade;
        this.silhouettePath(ctx, shakeX);
        ctx.fill();

        this.renderArchitecture(ctx, x);
        this.renderWindows(ctx, x, time);
        this.renderCracks(ctx, x);
        this.renderDamage(ctx, x);
        for (const fire of this.fires) fire.render(ctx);
    }

    renderArchitecture(ctx, x) {
        const y = this.y;
        const w = this.width;
        const h = this.height;
        if (this.type === 'artdeco') {
            const crown = h * 0.28;
            for (let i = 0; i < 5; i++) {
                const sw = w * (0.92 - i * 0.14);
                ctx.fillStyle = shadeHex(this.color, 12 + i * 8);
                ctx.fillRect(x + (w - sw) / 2, y + crown - (i + 1) * (crown / 5), sw, crown / 5);
            }
            ctx.fillStyle = '#e8d48a';
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w * 0.62, y + 16);
            ctx.lineTo(x + w * 0.38, y + 16);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 220, 140, 0.55)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(x + w / 2, y + 26 + i * 7, w * (0.18 + i * 0.05), Math.PI, 0);
                ctx.stroke();
            }
        } else if (this.type === 'supertall' && this.name.includes('Empire')) {
            ctx.fillStyle = shadeHex(this.color, 18);
            ctx.fillRect(x + w * 0.12, y, w * 0.76, h * 0.18);
            ctx.fillStyle = '#c9b37a';
            ctx.fillRect(x + w * 0.46, y - 28, 4, 28);
            ctx.fillStyle = Math.sin(performance.now() / 320) > 0 ? '#ff4d4d' : '#7a1c1c';
            ctx.beginPath();
            ctx.arc(x + w * 0.48, y - 30, 2.4, 0, TAU);
            ctx.fill();
        } else if (this.type === 'supertall' && this.name.includes('World Trade')) {
            ctx.strokeStyle = 'rgba(186, 230, 255, 0.28)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 4 + i * (w / 6), y + h);
                ctx.lineTo(x + w * 0.5, y);
                ctx.stroke();
            }
            ctx.fillStyle = '#dcefff';
            ctx.fillRect(x + w * 0.48, y - 36, 3, 36);
        } else if (this.type === 'bridge') {
            ctx.fillStyle = '#2b2118';
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h * 0.55, w * 0.31, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = this.color;
            ctx.fillRect(x + 6, y + 8, w - 12, 10);
        } else if (this.type === 'residential') {
            ctx.strokeStyle = 'rgba(40, 28, 20, 0.7)';
            ctx.lineWidth = 1.2;
            for (let i = 1; i < Math.floor(h / 18); i++) {
                ctx.strokeRect(x + w - 9, y + h - i * 18, 7, 12);
            }
            ctx.fillStyle = shadeHex(this.color, -20);
            ctx.fillRect(x, y + h - 16, w, 16);
        } else if (this.type === 'historic') {
            ctx.fillStyle = 'rgba(230, 210, 170, 0.35)';
            for (let i = 0; i < Math.floor(h / 22); i++) ctx.fillRect(x, y + h - i * 22 - 3, w, 2);
            ctx.fillRect(x - 3, y + 6, w + 6, 6);
        } else if (this.type === 'modern') {
            ctx.fillStyle = 'rgba(160, 210, 230, 0.12)';
            for (let i = 0; i < w; i += 10) ctx.fillRect(x + i, y, 5, h);
        } else if (this.type === 'classic') {
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.fillRect(x, y + 8, w, 6);
            ctx.fillRect(x + 3, y + h - 18, w - 6, 18);
        }
        ctx.strokeStyle = 'rgba(255, 176, 90, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w - 1, y + 4);
        ctx.lineTo(x + w - 1, y + h);
        ctx.stroke();
    }

    renderWindows(ctx, x, time) {
        const y = this.y;
        const w = this.width;
        const h = this.height;
        for (const win of this.windows) {
            const wx = x + win.u * w;
            const wy = y + win.v * h;
            if (wy < y + 4 || wy > y + h - 8) continue;
            if (this.type === 'flatiron') {
                const rowT = 1 - (wy - y) / h;
                const half = (w * rowT) / 2;
                if (wx < x + w / 2 - half + 2 || wx > x + w / 2 + half - 2) continue;
            }
            const flicker = 0.72 + 0.28 * Math.sin(time * 1.3 + win.phase);
            const damaged = this.hitCount > 0 && ((win.u * 13 + win.v * 7) % 1) < this.hitCount * 0.28;
            if (damaged || !win.lit) ctx.fillStyle = 'rgba(10, 14, 22, 0.65)';
            else {
                ctx.fillStyle = win.color;
                ctx.globalAlpha = flicker;
            }
            ctx.fillRect(wx, wy, Math.max(2, win.w * w), Math.max(2, win.h * h));
            ctx.globalAlpha = 1;
        }
    }

    renderCracks(ctx, x) {
        ctx.strokeStyle = 'rgba(20, 12, 8, 0.7)';
        ctx.lineWidth = 1.2;
        for (const crack of this.cracks) {
            for (const p of crack.paths) {
                ctx.beginPath();
                ctx.moveTo(x + crack.x, this.y + crack.y);
                ctx.lineTo(x + crack.x + Math.cos(p.a) * p.len, this.y + crack.y + Math.sin(p.a) * p.len);
                ctx.stroke();
            }
        }
    }

    renderDamage(ctx, x) {
        if (this.hitCount < 1) return;
        ctx.fillStyle = 'rgba(8, 6, 10, 0.35)';
        ctx.fillRect(x + this.width * 0.15, this.y + this.height * 0.2, this.width * 0.2, 7);
        if (this.hitCount >= 2) ctx.fillRect(x + this.width * 0.55, this.y + this.height * 0.45, this.width * 0.28, 10);
    }

    renderReflection(ctx, waterTop, time) {
        if (this.height <= 12) return;
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.translate(0, waterTop);
        ctx.scale(1, -0.38);
        const wave = Math.sin(time * 1.4 + this.x * 0.02) * 3;
        ctx.translate(wave, -waterTop);
        ctx.fillStyle = this.color;
        this.silhouettePath(ctx, 0);
        ctx.fill();
        ctx.restore();
    }
}

class Catapult {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.kick = 0;
    }

    tip(angleDeg, pull) {
        const a = (angleDeg * Math.PI) / 180;
        const len = 54 + (pull || 0) * 18;
        return { x: this.x + Math.cos(a) * len, y: this.y - Math.sin(a) * len, a, len };
    }

    render(ctx, angleDeg, pull) {
        const a = (angleDeg * Math.PI) / 180;
        const extra = (pull || 0) * 16;
        ctx.save();
        ctx.translate(this.x, this.y + this.kick);

        ctx.fillStyle = '#3d2a1a';
        ctx.fillRect(-28, 8, 56, 14);
        ctx.fillStyle = '#5a3b22';
        ctx.fillRect(-32, 18, 64, 10);
        ctx.fillStyle = '#2b1c12';
        ctx.beginPath();
        ctx.arc(-22, 28, 8, 0, TAU);
        ctx.arc(22, 28, 8, 0, TAU);
        ctx.fill();

        ctx.strokeStyle = '#7a5230';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(Math.cos(a) * (52 + extra), -Math.sin(a) * (52 + extra));
        ctx.stroke();

        ctx.strokeStyle = 'rgba(230, 210, 170, 0.7)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-16, 10);
        ctx.lineTo(Math.cos(a) * (40 + extra), -Math.sin(a) * (40 + extra));
        ctx.lineTo(16, 10);
        ctx.stroke();

        const bx = Math.cos(a) * (54 + extra);
        const by = -Math.sin(a) * (54 + extra);
        ctx.fillStyle = '#2c241c';
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#d4b483';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

class Squid {
    constructor(x, y, vx, vy, pose) {
        this.x = x;
        this.y = y;
        this.vx = vx || 0;
        this.vy = vy || 0;
        this.gravity = 0.3;
        this.rotation = 0;
        this.spin = 0;
        this.wave = 0;
        this.trail = [];
        this.pose = pose || 'fly';
        this.stretch = 1;
        this.squash = 1;
        this.blink = 0;
        this.closed = false;
        this.dizzy = 0;
        this.panic = 0;
        this.splat = 0;
        this.facePlant = false;
        this.bounces = 0;
        this.tentacles = Array.from({ length: 8 }, (_, i) => ({
            a: (i / 8) * TAU,
            len: 18 + (i % 3) * 3,
            off: i * 0.7
        }));
    }

    get speed() { return Math.hypot(this.vx, this.vy); }

    update(scale) {
        const s = scale || 1;
        if (this.pose === 'fly' || this.pose === 'dizzy') {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 16) this.trail.shift();
            this.x += this.vx * s;
            this.y += this.vy * s;
            this.vy += this.gravity * s;
            this.spin = lerp(this.spin, (this.vx * 0.02 + this.bounces * 0.15), 0.2);
            this.rotation += this.spin * s;
        } else if (this.pose === 'idle' || this.pose === 'charge') {
            this.wave += 0.12 * s;
            this.rotation = Math.sin(this.wave * 1.4) * 0.12;
            this.spin = 0;
        }
        this.wave += 0.22 * s;
        this.blink += s;
        if (this.blink > 90) {
            this.closed = true;
            if (this.blink > 98) { this.closed = false; this.blink = 0; }
        }
        this.dizzy = Math.max(0, this.dizzy - s);
        this.panic = Math.max(0, this.panic - s);
        this.splat = Math.max(0, this.splat - s);
        const spd = this.speed;
        if (this.pose === 'fly') {
            this.stretch = clamp(1 + spd * 0.035, 1, 1.85);
            this.squash = 1 / Math.sqrt(this.stretch);
        } else if (this.pose === 'charge') {
            this.stretch = 1.15 + this.squash * 0.01;
            this.squash = 0.78;
        } else if (this.pose === 'splat' || this.facePlant) {
            this.stretch = 1.45;
            this.squash = 0.45;
        } else {
            this.stretch = 1 + Math.sin(this.wave * 2) * 0.06;
            this.squash = 1 / this.stretch;
        }
    }

    render(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
            const p = this.trail[i];
            ctx.fillStyle = `rgba(255, 105, 180, ${i / this.trail.length * 0.24})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6 + i * 0.35, 0, TAU);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.pose === 'fly' || this.pose === 'dizzy') {
            ctx.rotate(Math.atan2(this.vy, this.vx) + this.rotation * 0.35);
        } else {
            ctx.rotate(this.rotation);
        }
        ctx.scale(this.stretch, this.squash);

        const flail = this.pose === 'fly' ? 0.85 : this.pose === 'dizzy' ? 1.2 : this.pose === 'charge' ? 0.25 : 0.2;
        for (const t of this.tentacles) {
            const wobble = Math.sin(this.wave * 2.2 + t.off) * flail;
            const ang = t.a + wobble + (this.pose === 'fly' ? Math.PI : 0);
            const ex = Math.cos(ang) * t.len;
            const ey = Math.sin(ang) * t.len;
            const g = ctx.createLinearGradient(0, 0, ex, ey);
            g.addColorStop(0, '#ff7ac3');
            g.addColorStop(1, '#ff2d8f');
            ctx.strokeStyle = g;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(Math.cos(ang) * t.len * 0.5, Math.sin(ang) * t.len * 0.5 + wobble * 10, ex, ey);
            ctx.stroke();
            ctx.fillStyle = '#ff4da6';
            ctx.beginPath();
            ctx.arc(ex, ey, 3, 0, TAU);
            ctx.fill();
        }

        const body = ctx.createRadialGradient(-4, -4, 2, 0, 0, 17);
        body.addColorStop(0, '#ffd0e6');
        body.addColorStop(0.55, '#ff6bb3');
        body.addColorStop(1, '#e0147a');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#c40d66';
        ctx.lineWidth = 2;
        ctx.stroke();

        this.drawFace(ctx);
        ctx.restore();
    }

    drawFace(ctx) {
        const panic = this.panic > 0 || this.pose === 'dizzy';
        const splat = this.facePlant || this.pose === 'splat';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-5.5, -3, panic ? 6.2 : 5.2, panic ? 7.2 : 6.2, 0, 0, TAU);
        ctx.ellipse(5.5, -3, panic ? 6.2 : 5.2, panic ? 7.2 : 6.2, 0, 0, TAU);
        ctx.fill();

        if (splat) {
            ctx.strokeStyle = '#1a0d18';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(-8, -6); ctx.lineTo(-3, 0); ctx.moveTo(-8, 0); ctx.lineTo(-3, -6);
            ctx.moveTo(3, -6); ctx.lineTo(8, 0); ctx.moveTo(3, 0); ctx.lineTo(8, -6);
            ctx.stroke();
            ctx.fillStyle = '#ff4d88';
            ctx.beginPath();
            ctx.ellipse(0, 9, 4, 5, 0, 0, TAU);
            ctx.fill();
            return;
        }

        if (this.closed && !panic) {
            ctx.strokeStyle = '#c40d66';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-9, -3); ctx.lineTo(-2, -3);
            ctx.moveTo(2, -3); ctx.lineTo(9, -3);
            ctx.stroke();
        } else {
            ctx.fillStyle = panic ? '#1a2040' : '#143a8a';
            ctx.beginPath();
            ctx.arc(-5.5, -3, panic ? 3.6 : 3.2, 0, TAU);
            ctx.arc(5.5, -3, panic ? 3.6 : 3.2, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#071226';
            ctx.beginPath();
            ctx.arc(-5.5, -3, panic ? 2 : 1.4, 0, TAU);
            ctx.arc(5.5, -3, panic ? 2 : 1.4, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-4, -4.6, 1.3, 0, TAU);
            ctx.arc(7, -4.6, 1.3, 0, TAU);
            ctx.fill();
        }

        if (this.dizzy > 0) {
            ctx.strokeStyle = '#ffd36a';
            ctx.lineWidth = 1.6;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.arc(0, -16, 6 + i * 4, this.wave + i, this.wave + i + 2);
                ctx.stroke();
            }
        }

        ctx.fillStyle = 'rgba(255, 150, 180, 0.55)';
        ctx.beginPath();
        ctx.ellipse(-11, 4, 3.2, 1.6, 0, 0, TAU);
        ctx.ellipse(11, 4, 3.2, 1.6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ff4d88';
        ctx.beginPath();
        if (panic) ctx.ellipse(0, 7, 3, 3.4, 0, 0, TAU);
        else ctx.arc(0, 6, 2.6, 0, Math.PI);
        ctx.fill();
    }
}

class Dancer {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.hue = hue;
        this.t = hue === 320 ? 0 : Math.PI;
    }

    update() {
        this.t += 0.14;
        this.y = this.baseY + Math.sin(this.t * 2) * 18;
        this.x += Math.cos(this.t * 1.1) * 0.6;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU + Math.sin(this.t * 3 + i) * 0.5;
            ctx.strokeStyle = `hsl(${this.hue}, 80%, 62%)`;
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(Math.cos(a) * 18, Math.sin(a) * 18, Math.cos(a) * 34, Math.sin(a) * 34);
            ctx.stroke();
        }
        ctx.fillStyle = `hsl(${this.hue}, 85%, 70%)`;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-8, -6, 6, 0, TAU);
        ctx.arc(8, -6, 6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-8 + Math.sin(this.t) * 2, -6, 2.4, 0, TAU);
        ctx.arc(8 + Math.sin(this.t) * 2, -6, 2.4, 0, TAU);
        ctx.fill();
        ctx.restore();
    }
}

class SquidNYCGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new window.SquidAudio();
        this.atmosphere = new Atmosphere();
        this.buildings = [];
        this.particles = [];
        this.debris = [];
        this.shockwaves = [];
        this.floaters = [];
        this.squid = null;
        this.bucket = null;
        this.catapult = null;
        this.launched = false;
        this.ended = false;
        this.celebrateT = 0;
        this.dancers = [];
        this.shake = 0;
        this.flash = 0;
        this.time = 0;
        this.last = performance.now();
        this.audioUnlocked = false;
        this.score = 0;
        this.combo = 1;
        this.comboLeft = 0;
        this.best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
        this.timeScale = 1;
        this.slowMo = 0;
        this.cam = { x: 0, y: 0, zoom: 1 };
        this.charging = false;
        this.charge = 0;
        this.spaceHeld = false;
        this.nearFlags = new Set();
        this.stamp = null;
        this.readyIn = 0;
        this.shotCount = 0;
        this.newBest = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindControls();
        this.resetWorld(true);
        this.loop();
        this.showCoach(true);
    }

    get ground() { return this.canvas.height - 78; }
    get waterTop() { return this.canvas.height - 78; }
    get angle() { return parseFloat(document.getElementById('angleSlider').value); }
    get power() { return parseFloat(document.getElementById('powerSlider').value); }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.atmosphere.resize(this.canvas.width, this.canvas.height);
        for (const b of this.buildings) b.layout(this.canvas.width, this.ground);
        if (this.buildings[0]) {
            this.catapult = new Catapult(this.buildings[0].x + this.buildings[0].width * 0.55, this.buildings[0].y - 6);
        }
        this.seatBucket();
    }

    resetWorld(first) {
        this.buildings = this.createSkyline();
        for (const b of this.buildings) b.layout(this.canvas.width, this.ground);
        this.catapult = new Catapult(this.buildings[0].x + this.buildings[0].width * 0.55, this.buildings[0].y - 6);
        this.particles = [];
        this.debris = [];
        this.shockwaves = [];
        this.floaters = [];
        this.squid = null;
        this.launched = false;
        this.ended = false;
        this.score = 0;
        this.combo = 1;
        this.comboLeft = 0;
        this.shake = 0;
        this.flash = 0;
        this.dancers = [];
        this.timeScale = 1;
        this.slowMo = 0;
        this.nearFlags.clear();
        this.stamp = null;
        this.readyIn = 0;
        this.shotCount = 0;
        this.newBest = false;
        this.charging = false;
        this.charge = 0;
        document.getElementById('controls').style.display = 'block';
        document.getElementById('retryHint').style.display = 'none';
        document.getElementById('fireButton').classList.add('ready');
        this.seatBucket();
        this.updateHud();
        if (!first && this.best > 0) {
            this.pop(this.canvas.width / 2, this.canvas.height * 0.28, `BEAT ${this.best}`, '#9ad7ff', 34);
        }
    }

    createSkyline() {
        return [
            new Building({ name: 'Squid Co. Warehouse', type: 'residential', rx: 0.035, w: 118, h: 168, color: '#6b4a36', accent: '#c9a06a', protected: true }),
            new Building({ name: 'Brooklyn Bridge', type: 'bridge', rx: 0.145, w: 46, h: 210, color: '#8d7355', accent: '#3b2a1c' }),
            new Building({ name: 'One World Trade Center', type: 'supertall', rx: 0.22, w: 58, h: 430, color: '#d7e4ef', accent: '#9ad0ea' }),
            new Building({ name: '4 WTC', type: 'modern', rx: 0.27, w: 42, h: 292, color: '#9aa7b5', accent: '#c5d8e6' }),
            new Building({ name: 'Woolworth Building', type: 'classic', rx: 0.31, w: 36, h: 248, color: '#8d7a4e', accent: '#d6c089' }),
            new Building({ name: 'Tribeca Loft', type: 'residential', rx: 0.35, w: 40, h: 148, color: '#7d5a45', accent: '#e6d3b2' }),
            new Building({ name: 'Cast Iron SoHo', type: 'historic', rx: 0.385, w: 38, h: 172, color: '#b8874c', accent: '#f0d9a8' }),
            new Building({ name: 'Flatiron Building', type: 'flatiron', rx: 0.44, w: 28, h: 286, color: '#d9c39a', accent: '#f3e2c0' }),
            new Building({ name: 'MetLife Tower', type: 'classic', rx: 0.49, w: 50, h: 236, color: '#8e8e8e', accent: '#d0d0d0' }),
            new Building({ name: 'Chrysler Building', type: 'artdeco', rx: 0.555, w: 48, h: 392, color: '#c5cdd6', accent: '#f0d57a' }),
            new Building({ name: 'Empire State Building', type: 'supertall', rx: 0.62, w: 62, h: 448, color: '#b7b1a6', accent: '#e5d7a8' }),
            new Building({ name: 'Grand Central', type: 'classic', rx: 0.69, w: 54, h: 188, color: '#cbb56a', accent: '#f3e3a6' }),
            new Building({ name: 'UN Secretariat', type: 'modern', rx: 0.75, w: 36, h: 268, color: '#6f8f9a', accent: '#b7d4dd' }),
            new Building({ name: 'Seagram Building', type: 'modern', rx: 0.79, w: 40, h: 300, color: '#3f4a3a', accent: '#c2a45a' }),
            new Building({ name: 'Upper East Brownstone', type: 'residential', rx: 0.84, w: 34, h: 172, color: '#9a5a38', accent: '#e8c39a' }),
            new Building({ name: 'Museum Mile', type: 'institutional', rx: 0.88, w: 40, h: 210, color: '#6a5080', accent: '#d7b3ff' }),
            new Building({ name: 'Central Park West', type: 'residential', rx: 0.93, w: 36, h: 196, color: '#d8d1bc', accent: '#fff6d7' })
        ];
    }

    seatBucket() {
        if (!this.catapult) return;
        const tip = this.catapult.tip(this.angle, this.charging ? this.charge : 0);
        if (!this.bucket) this.bucket = new Squid(tip.x, tip.y, 0, 0, 'idle');
        this.bucket.x = tip.x;
        this.bucket.y = tip.y;
        this.bucket.pose = this.charging ? 'charge' : 'idle';
        this.bucket.squash = this.charging ? 0.72 : 1;
    }

    bindControls() {
        const angle = document.getElementById('angleSlider');
        const power = document.getElementById('powerSlider');
        const sync = () => {
            document.getElementById('angleValue').textContent = angle.value;
            document.getElementById('powerValue').textContent = power.value;
            this.seatBucket();
        };
        angle.addEventListener('input', sync);
        power.addEventListener('input', sync);
        document.getElementById('fireButton').addEventListener('click', (e) => {
            e.stopPropagation();
            this.tryLaunch();
        });
        document.getElementById('muteBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.unlockAudio();
            const muted = this.audio.toggleMute();
            e.currentTarget.textContent = muted ? 'Unmute' : 'Mute';
            e.currentTarget.classList.toggle('active', muted);
        });
        document.getElementById('nextSongBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.unlockAudio();
            this.audio.nextSong();
            this.audio.playUI('next');
        });
        ['controls', 'radio', 'hud'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('pointerdown', (e) => e.stopPropagation());
        });

        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));

        window.addEventListener('keydown', (e) => {
            this.unlockAudio();
            const key = e.key.toLowerCase();
            if (key === 'arrowleft' || key === 'a') this.nudge('angle', -1);
            if (key === 'arrowright' || key === 'd') this.nudge('angle', 1);
            if (key === 'arrowup' || key === 'w') this.nudge('power', 1);
            if (key === 'arrowdown' || key === 's') this.nudge('power', -1);
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.ended) { this.resetWorld(false); return; }
                if (this.launched || this.readyIn > 0) return;
                if (!this.spaceHeld) {
                    this.spaceHeld = true;
                    this.charging = true;
                    this.charge = Math.max(0.15, (this.power - 18) / 82);
                    this.canvas.classList.add('charging');
                }
            }
            if (key === 'r') this.resetWorld(false);
            if (key === 'm') document.getElementById('muteBtn').click();
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.spaceHeld) {
                this.spaceHeld = false;
                if (this.charging && !this.launched) {
                    this.setPowerFromCharge();
                    this.tryLaunch();
                }
                this.charging = false;
                this.canvas.classList.remove('charging');
            }
        });
    }

    nudge(which, dir) {
        const el = document.getElementById(which === 'angle' ? 'angleSlider' : 'powerSlider');
        el.value = String(clamp(parseInt(el.value, 10) + dir * 2, parseInt(el.min, 10), parseInt(el.max, 10)));
        el.dispatchEvent(new Event('input'));
    }

    pointerInGame(e) {
        const r = this.canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (this.canvas.width / r.width), y: (e.clientY - r.top) * (this.canvas.height / r.height) };
    }

    onPointerDown(e) {
        this.unlockAudio();
        if (this.ended) { this.resetWorld(false); return; }
        if (this.launched || this.readyIn > 0) return;
        this.charging = true;
        this.charge = 0.2;
        this.canvas.classList.add('charging');
        this.aimFromPointer(this.pointerInGame(e));
    }

    onPointerMove(e) {
        if (!this.charging || this.launched) return;
        this.aimFromPointer(this.pointerInGame(e));
    }

    onPointerUp() {
        if (!this.charging || this.spaceHeld) return;
        if (!this.launched && this.readyIn <= 0 && !this.ended) {
            this.setPowerFromCharge();
            this.tryLaunch();
        }
        this.charging = false;
        this.canvas.classList.remove('charging');
    }

    aimFromPointer(p) {
        if (!this.catapult) return;
        const dx = p.x - this.catapult.x;
        const dy = this.catapult.y - p.y;
        let deg = Math.atan2(dy, dx) * 180 / Math.PI;
        if (dx < 0) deg = clamp(90 + (p.y - this.catapult.y) * 0.08, 12, 82);
        document.getElementById('angleSlider').value = String(Math.round(clamp(deg, 12, 82)));
        const pull = clamp(Math.hypot(dx, dy) / 420, 0.12, 1);
        this.charge = pull;
        this.setPowerFromCharge();
        document.getElementById('angleSlider').dispatchEvent(new Event('input'));
    }

    setPowerFromCharge() {
        const p = Math.round(18 + this.charge * 82);
        document.getElementById('powerSlider').value = String(clamp(p, 18, 100));
        document.getElementById('powerValue').textContent = document.getElementById('powerSlider').value;
    }

    unlockAudio() {
        if (this.audioUnlocked) return;
        this.audioUnlocked = true;
        this.audio.unlock().then(() => this.audio.startMusic());
    }

    showCoach(on) {
        document.getElementById('coach').style.display = on ? 'block' : 'none';
    }

    tryLaunch() {
        if (this.ended) { this.resetWorld(false); return; }
        if (this.launched || this.readyIn > 0) return;
        this.launch();
    }

    launch() {
        this.unlockAudio();
        this.showCoach(false);
        const pull = this.charging ? this.charge : (this.power - 18) / 82;
        const tip = this.catapult.tip(this.angle, pull);
        const speed = (this.power / 100) * 27;
        const rad = (this.angle * Math.PI) / 180;
        this.squid = new Squid(tip.x, tip.y, speed * Math.cos(rad), -speed * Math.sin(rad), 'fly');
        this.launched = true;
        this.shotCount++;
        this.charging = false;
        this.spaceHeld = false;
        this.canvas.classList.remove('charging');
        this.catapult.kick = 10;
        this.shake = 4;
        this.audio.playLaunch();
        document.getElementById('fireButton').classList.remove('ready');
        this.nearFlags.clear();
    }

    readyAgain(delay) {
        this.launched = false;
        this.readyIn = delay || 0.12;
        this.audio.stopWhoosh();
        if (this.squid) {
            this.squid.vx = 0;
            this.squid.vy = 0;
            this.squid.pose = 'splat';
        }
        this.seatBucket();
    }

    predictPath() {
        if (this.launched || this.ended) return [];
        const speed = (this.power / 100) * 27;
        const rad = (this.angle * Math.PI) / 180;
        const tip = this.catapult.tip(this.angle, this.charging ? this.charge : 0);
        let x = tip.x;
        let y = tip.y;
        let vx = speed * Math.cos(rad);
        let vy = -speed * Math.sin(rad);
        const pts = [];
        for (let i = 0; i < 90; i++) {
            pts.push({ x, y });
            x += vx;
            y += vy;
            vy += 0.3;
            if (y > this.ground) break;
        }
        return pts;
    }

    pop(x, y, text, color, size) {
        this.floaters.push(new Floater(text, x, y, color, size));
    }

    flashStamp(text, color) {
        this.stamp = { text, color: color || '#fff6d8', life: 1 };
    }

    addScore(n, x, y, label) {
        const gained = Math.round(n * this.combo);
        this.score += gained;
        if (gained > 0) this.pop(x, y - 18, `${label ? label + ' ' : ''}+${gained}`, '#ffe08a', 20 + Math.min(16, this.combo * 3));
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem(BEST_KEY, String(this.best));
            if (!this.newBest && this.shotCount > 0) {
                this.newBest = true;
                this.audio.playBest();
                this.pop(this.canvas.width / 2, this.canvas.height * 0.2, 'NEW BEST', '#f0c14b', 40);
            }
        }
        this.updateHud();
    }

    bumpCombo() {
        this.combo += 1;
        this.comboLeft = 2.4;
        this.audio.playCombo(this.combo);
        this.updateHud();
    }

    checkNearMiss() {
        if (!this.squid || this.squid.pose !== 'fly') return;
        for (let i = 1; i < this.buildings.length; i++) {
            const b = this.buildings[i];
            if (b.height <= 10 || this.nearFlags.has(b)) continue;
            const d = distToRect(this.squid.x, this.squid.y, b.x, b.y, b.width, b.height);
            if (d > 0 && d < 38) {
                this.nearFlags.add(b);
                this.slowMo = 0.42;
                this.timeScale = 0.28;
                this.squid.panic = 40;
                this.audio.playNearMiss();
                this.flashStamp('SO CLOSE', '#ffd36a');
                this.pop(this.squid.x, this.squid.y - 24, 'so close', '#ffd36a', 26);
            }
        }
    }

    bounceOff(building) {
        const fromLeft = this.squid.x - building.x;
        const fromRight = building.x + building.width - this.squid.x;
        const fromTop = this.squid.y - building.y;
        const fromBottom = building.y + building.height - this.squid.y;
        const m = Math.min(fromLeft, fromRight, fromTop, fromBottom);
        if (m === fromTop) {
            this.squid.vy = -Math.abs(this.squid.vy) * 0.82 - 2;
            this.squid.y = building.y - 12;
        } else if (m === fromBottom) {
            this.squid.vy = Math.abs(this.squid.vy) * 0.55;
            this.squid.y = building.y + building.height + 12;
        } else if (m === fromLeft) {
            this.squid.vx = -Math.abs(this.squid.vx) * 0.78;
            this.squid.x = building.x - 12;
        } else {
            this.squid.vx = Math.abs(this.squid.vx) * 0.78;
            this.squid.x = building.x + building.width + 12;
        }
        this.squid.bounces += 1;
        this.squid.dizzy = 50;
        this.squid.pose = 'dizzy';
        this.squid.splat = 10;
    }

    checkCollisions() {
        if (!this.squid || this.squid.pose === 'splat') return;
        for (let i = 0; i < this.buildings.length; i++) {
            const building = this.buildings[i];
            if (!building.checkCollision(this.squid)) continue;
            if (building.protected) {
                this.audio.playBonk();
                this.flashStamp('BONK', '#ffb4a2');
                this.bounceOff(building);
                this.squid.vx *= 0.7;
                this.pop(this.squid.x, this.squid.y, 'warehouse says no', '#ffb4a2', 18);
                continue;
            }
            this.smash(building);
            return;
        }

        if (this.squid.y > this.ground) this.kerSploosh();
        else if (this.squid.x > this.canvas.width + 40 || this.squid.x < -80) {
            this.audio.playWhoops();
            this.flashStamp('GONE', '#9ad7ff');
            this.combo = 1;
            this.updateHud();
            this.readyAgain(0.18);
        }
    }

    smash(building) {
        const intensity = 0.7 + this.squid.speed * 0.035;
        const pan = (this.squid.x / this.canvas.width) * 2 - 1;
        const force = Math.min(2, intensity);
        const collapsing = building.hit(this.squid.x, this.squid.y, force);
        this.audio.playImpact(building.type, intensity, pan);
        this.audio.playSplat();
        if (this.combo > 1) this.audio.playCrowd();
        this.shake = Math.min(22, 8 + this.squid.speed * 0.4);
        this.flash = 0.7;
        this.shockwaves.push(new Shockwave(this.squid.x, this.squid.y, 100 + this.squid.speed * 3));
        this.spawnJunk(building, this.squid, collapsing);
        const distBonus = 1 + building.rx;
        const heightBonus = 1 + building.originalHeight / 400;
        this.addScore(120 * distBonus * heightBonus * (1 + this.squid.speed * 0.04), this.squid.x, this.squid.y, collapsing ? 'DOWN' : 'WHACK');
        this.bumpCombo();
        if (collapsing) {
            this.audio.playCollapse(pan);
            this.addScore(420 * heightBonus, building.x + building.width / 2, building.y, 'COLLAPSE');
            this.flashStamp(building.name.split(' ')[0].toUpperCase() + '!', '#ff8ad4');
        } else {
            this.flashStamp(this.combo > 2 ? `x${this.combo}` : 'SLAP', '#ffd36a');
        }

        const canChain = this.squid.speed > 9 && this.squid.bounces < 3 && !collapsing;
        if (canChain) {
            this.bounceOff(building);
            this.squid.pose = 'dizzy';
            this.pop(this.squid.x, this.squid.y + 20, 'rico!', '#ff8ad4', 22);
            return;
        }

        this.squid.pose = 'splat';
        this.squid.facePlant = false;
        this.squid.vx = 0;
        this.squid.vy = 0;
        this.readyAgain(0.22);
    }

    kerSploosh() {
        const pan = (this.squid.x / this.canvas.width) * 2 - 1;
        this.audio.playSplash(pan);
        this.audio.playWhoops();
        this.audio.playSplat();
        this.squid.y = this.ground - 4;
        this.squid.pose = 'splat';
        this.squid.facePlant = true;
        this.spawnSplash(this.squid.x, this.ground);
        this.flashStamp('KER-SPLOOSH', '#9ad7ff');
        this.pop(this.squid.x, this.ground - 30, 'face-plant', '#9ad7ff', 24);
        this.shake = 6;
        this.combo = 1;
        this.updateHud();
        this.readyAgain(0.28);
    }

    spawnJunk(building, squid, collapsing) {
        const chunks = collapsing ? 5 : 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < chunks; i++) {
            this.debris.push(new FallingDebris(
                building.x + (building.width / chunks) * i,
                building.y,
                building.width / chunks,
                Math.min(54, building.height * 0.18),
                building.color,
                building.type,
                (Math.random() - 0.5) * 8,
                -2 - Math.random() * 4
            ));
        }
        const n = collapsing ? 80 : 34;
        for (let i = 0; i < n; i++) {
            const kind = Math.random() > 0.65 ? 'spark' : (building.type === 'modern' || building.type === 'supertall') && Math.random() > 0.5 ? 'glass' : 'dust';
            this.particles.push(new Particle(
                squid.x, squid.y,
                (Math.random() - 0.5) * (collapsing ? 18 : 10),
                (Math.random() - 0.5) * (collapsing ? 16 : 9) - 2,
                kind === 'glass' ? '#b7ecff' : kind === 'spark' ? '#ffd36a' : building.color,
                30 + Math.random() * 30,
                2 + Math.random() * 3.5,
                kind
            ));
        }
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(squid.x, squid.y, (Math.random() - 0.5) * 2, -1 - Math.random(), '#3a3a40', 50, 8, 'smoke'));
        }
    }

    spawnSplash(x, y) {
        for (let i = 0; i < 26; i++) {
            this.particles.push(new Particle(x, y, (Math.random() - 0.5) * 8, -3 - Math.random() * 7, '#9ad4ff', 32, 2.6, 'dust'));
        }
    }

    standingCount() {
        let n = 0;
        for (let i = 1; i < this.buildings.length; i++) {
            if (this.buildings[i].height > 10) n++;
        }
        return n;
    }

    updateHud() {
        document.getElementById('scoreValue').textContent = String(this.score);
        document.getElementById('bestValue').textContent = String(this.best);
        document.getElementById('comboValue').textContent = `x${this.combo}`;
    }

    startCelebration() {
        this.ended = true;
        this.celebrateT = 0;
        this.dancers = [
            new Dancer(this.canvas.width * 0.32, this.canvas.height * 0.52, 330),
            new Dancer(this.canvas.width * 0.68, this.canvas.height * 0.52, 275)
        ];
        document.getElementById('controls').style.display = 'none';
        document.getElementById('retryHint').style.display = 'block';
        this.audio.playVictory();
        if (this.score >= this.best) this.audio.playBest();
    }

    update(dt) {
        this.time += dt;
        this.atmosphere.update(dt);
        if (this.slowMo > 0) {
            this.slowMo -= dt;
            if (this.slowMo <= 0) this.timeScale = 1;
        }
        const s = this.timeScale;
        this.shake *= 0.86;
        this.flash *= 0.9;
        if (this.catapult) this.catapult.kick *= 0.8;
        if (this.readyIn > 0) {
            this.readyIn -= dt;
            if (this.readyIn <= 0) {
                this.squid = null;
                document.getElementById('fireButton').classList.add('ready');
            }
        }
        if (this.comboLeft > 0) {
            this.comboLeft -= dt;
            if (this.comboLeft <= 0 && this.combo > 1) {
                this.combo = 1;
                this.updateHud();
            }
        }
        if (this.stamp) {
            this.stamp.life -= dt * 1.6;
            if (this.stamp.life <= 0) this.stamp = null;
        }
        if (this.charging && this.spaceHeld) {
            this.charge = clamp(this.charge + dt * 0.85, 0.12, 1);
            this.setPowerFromCharge();
            if (Math.random() < 0.25) this.audio.playCharge(this.charge);
        }

        this.cam.zoom = lerp(this.cam.zoom, this.slowMo > 0 ? 1.08 : this.charging ? 1.03 : 1, 0.12);
        this.cam.x = lerp(this.cam.x, this.squid && this.launched ? (this.squid.x - this.canvas.width * 0.42) * 0.12 : 0, 0.08);
        this.cam.y = lerp(this.cam.y, this.squid && this.launched ? (this.squid.y - this.canvas.height * 0.45) * 0.08 : 0, 0.08);

        if (this.ended) {
            this.celebrateT++;
            for (const d of this.dancers) d.update();
            return;
        }

        this.seatBucket();
        if (this.bucket) this.bucket.update(1);

        if (this.squid && this.launched) {
            this.squid.update(s);
            this.audio.updateWhoosh(this.squid.speed);
            this.checkNearMiss();
            this.checkCollisions();
        }

        for (const b of this.buildings) b.update(s);
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(s);
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
        for (let i = this.debris.length - 1; i >= 0; i--) {
            this.debris[i].update(this.ground, s);
            if (this.debris[i].life <= 0) this.debris.splice(i, 1);
        }
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            this.shockwaves[i].update(s);
            if (this.shockwaves[i].dead) this.shockwaves.splice(i, 1);
        }
        for (let i = this.floaters.length - 1; i >= 0; i--) {
            this.floaters[i].update(dt);
            if (this.floaters[i].life <= 0) this.floaters.splice(i, 1);
        }

        if (this.standingCount() === 0) this.startCelebration();
    }

    renderWater() {
        const y = this.waterTop;
        const h = this.canvas.height - y;
        const g = this.ctx.createLinearGradient(0, y, 0, this.canvas.height);
        g.addColorStop(0, '#163044');
        g.addColorStop(0.4, '#0d2133');
        g.addColorStop(1, '#071018');
        this.ctx.fillStyle = g;
        this.ctx.fillRect(0, y, this.canvas.width, h);
        for (const b of this.buildings) b.renderReflection(this.ctx, y, this.time);
        this.ctx.save();
        this.ctx.globalAlpha = 0.22;
        this.ctx.strokeStyle = '#d7f3ff';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 18; i++) {
            const yy = y + 8 + i * 4;
            this.ctx.beginPath();
            for (let x = 0; x < this.canvas.width; x += 10) {
                const wobble = Math.sin(this.time * 2 + x * 0.03 + i) * 1.6;
                if (x === 0) this.ctx.moveTo(x, yy + wobble);
                else this.ctx.lineTo(x, yy + wobble);
            }
            this.ctx.stroke();
        }
        this.ctx.restore();
        const sheen = this.ctx.createLinearGradient(0, y, 0, y + 16);
        sheen.addColorStop(0, 'rgba(255, 200, 130, 0.28)');
        sheen.addColorStop(1, 'rgba(255, 200, 130, 0)');
        this.ctx.fillStyle = sheen;
        this.ctx.fillRect(0, y, this.canvas.width, 16);
    }

    renderPier() {
        const y = this.ground;
        this.ctx.fillStyle = '#2a241c';
        this.ctx.fillRect(0, y, this.canvas.width * 0.13, 18);
        this.ctx.fillStyle = '#3b3226';
        for (let i = 0; i < 6; i++) this.ctx.fillRect(18 + i * 28, y + 16, 7, this.canvas.height - y);
        if (this.buildings[0]) {
            this.ctx.fillStyle = '#d9b56a';
            this.ctx.font = 'bold 11px Trebuchet MS, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('SQUID CO.', this.buildings[0].x + 14, this.buildings[0].y + 28);
        }
    }

    renderCables() {
        const a = this.buildings[1];
        const b = this.buildings[2];
        if (!a || !b || a.height < 20) return;
        this.ctx.strokeStyle = 'rgba(210, 190, 150, 0.35)';
        this.ctx.lineWidth = 1.4;
        const ax = a.x + a.width / 2;
        const ay = a.y + 16;
        const bx = b.x + 8;
        const by = this.ground - 8;
        this.ctx.beginPath();
        this.ctx.moveTo(ax, ay);
        this.ctx.quadraticCurveTo((ax + bx) / 2, this.ground - 40, bx, by);
        this.ctx.stroke();
        for (let i = 1; i < 8; i++) {
            const t = i / 8;
            const x = lerp(ax, bx, t);
            const y = lerp(ay, by, t) + Math.sin(t * Math.PI) * -30;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, this.ground);
            this.ctx.stroke();
        }
    }

    renderTrajectory() {
        const pts = this.predictPath();
        if (pts.length < 2) return;
        this.ctx.save();
        this.ctx.strokeStyle = this.charging ? 'rgba(255, 140, 200, 0.75)' : 'rgba(255, 214, 120, 0.55)';
        this.ctx.setLineDash([5, 7]);
        this.ctx.lineWidth = this.charging ? 3 : 2;
        this.ctx.beginPath();
        pts.forEach((p, i) => i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y));
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    renderStamp() {
        if (!this.stamp) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = clamp(this.stamp.life * 1.4, 0, 1);
        ctx.translate(this.canvas.width / 2, this.canvas.height * 0.36);
        ctx.rotate(-0.08);
        ctx.font = '800 64px Trebuchet MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 8;
        ctx.strokeText(this.stamp.text, 0, 0);
        ctx.fillStyle = this.stamp.color;
        ctx.fillText(this.stamp.text, 0, 0);
        ctx.restore();
    }

    renderVignette() {
        const g = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.25,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.72
        );
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.42)');
        this.ctx.fillStyle = g;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderScene() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();
        ctx.translate(-this.cam.x, -this.cam.y);
        if (this.cam.zoom !== 1) {
            ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            ctx.scale(this.cam.zoom, this.cam.zoom);
            ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        }
        if (this.shake > 0.4) {
            ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        this.atmosphere.renderSky(ctx);
        this.atmosphere.renderStars(ctx);
        this.atmosphere.renderMoon(ctx);
        this.atmosphere.renderClouds(ctx);
        this.renderWater();
        this.renderPier();
        this.renderCables();

        for (const b of this.buildings) b.render(ctx, this.time);
        if (this.catapult) this.catapult.render(ctx, this.angle, this.charging ? this.charge : 0);
        this.renderTrajectory();
        if (!this.launched && this.bucket) this.bucket.render(ctx);
        if (this.squid) this.squid.render(ctx);
        for (const d of this.debris) d.render(ctx);
        for (const p of this.particles) p.render(ctx);
        for (const s of this.shockwaves) s.render(ctx);
        for (const f of this.floaters) f.render(ctx);

        this.renderVignette();
        if (this.flash > 0.02) {
            ctx.fillStyle = `rgba(255, 210, 140, ${this.flash * 0.45})`;
            ctx.fillRect(-40, -40, this.canvas.width + 80, this.canvas.height + 80);
        }
        ctx.restore();
        this.renderStamp();
    }

    renderCelebration() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(6, 4, 12, 0.78)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < 40; i++) {
            const x = this.canvas.width / 2 + Math.sin(this.celebrateT * 0.03 + i) * 240;
            const y = this.canvas.height / 2 + Math.cos(this.celebrateT * 0.02 + i * 0.7) * 140;
            ctx.fillStyle = `hsla(${(this.celebrateT + i * 12) % 360}, 80%, 62%, 0.8)`;
            ctx.beginPath();
            ctx.arc(x, y, 4 + (i % 5), 0, TAU);
            ctx.fill();
        }
        ctx.textAlign = 'center';
        ctx.font = 'bold 58px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#f0c14b';
        ctx.shadowColor = '#ff6b35';
        ctx.shadowBlur = 18;
        ctx.fillText(this.newBest ? 'NEW BEST' : 'HARBOR CLEARED', this.canvas.width / 2, this.canvas.height * 0.2);
        ctx.shadowBlur = 0;
        ctx.font = '28px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#fff6d8';
        ctx.fillText(`${this.score}`, this.canvas.width / 2, this.canvas.height * 0.3);
        ctx.font = '18px Trebuchet MS, sans-serif';
        ctx.fillStyle = '#9ad7ff';
        ctx.fillText(this.best ? `beat this: ${this.best}` : 'first clear — now do it louder', this.canvas.width / 2, this.canvas.height * 0.36);
        for (const d of this.dancers) d.render(ctx);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Trebuchet MS, sans-serif';
        ctx.fillText('Space / click — one more', this.canvas.width / 2, this.canvas.height * 0.86);
    }

    loop() {
        const now = performance.now();
        const dt = clamp((now - this.last) / 1000, 0, 0.05);
        this.last = now;
        this.update(dt);
        this.renderScene();
        if (this.ended) this.renderCelebration();
        requestAnimationFrame(() => this.loop());
    }
}

window.addEventListener('load', () => {
    new SquidNYCGame();
});
