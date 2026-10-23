import { prefersReducedMotion } from "./motion";
import { pick, random } from "./random";

const palette = ["#ff2a8a", "#ff4fa8", "#22e3ff", "#ffb38a", "#8b3dff", "#fff35c", "#ffffff"];

type Particle = {
    launchAt: number;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    width: number;
    height: number;
    color: string;
    isRound: boolean;
    spin: number;
    spinSpeed: number;
    sway: number;
    swaySpeed: number;
    swayDistance: number;
    tumble: number;
    tumbleSpeed: number;
    fallSpeed: number;
};

type ConfettiOptions = {
    count?: number;
    spreadMs?: number;
};

function pickApex(height: number) {
    const roll = Math.random();

    if (roll < 0.35) {
        return height * random(0.35, 0.75);
    }

    if (roll < 0.8) {
        return height * random(0.05, 0.35);
    }

    return -height * random(0.02, 0.2);
}

export function launchConfetti(
    canvas: HTMLCanvasElement,
    { count = 420, spreadMs = 500 }: ConfettiOptions = {},
) {
    const context = canvas.getContext("2d");

    if (!context || prefersReducedMotion()) {
        return () => {};
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let scale = 1;

    const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        scale = Math.min(1.4, Math.max(0.7, Math.hypot(width, height) / 1400));
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
    };

    const gravity = () => 0.45 * scale;

    const createParticle = (startTime: number): Particle => {
        const x = random(0, width);
        const y = height + random(5, 30);
        const velocityY = -Math.sqrt(2 * gravity() * (y - pickApex(height)));
        const size = random(7, 13) * scale;
        const isRound = Math.random() < 0.25;

        return {
            launchAt: startTime + Math.pow(Math.random(), 1.6) * spreadMs,
            x,
            y,
            velocityX: random(-1.6, 1.6) * scale,
            velocityY,
            width: size,
            height: isRound ? size : size * random(0.4, 0.6),
            color: pick(palette),
            isRound,
            spin: random(0, Math.PI * 2),
            spinSpeed: random(-0.04, 0.04),
            sway: random(0, Math.PI * 2),
            swaySpeed: random(0.03, 0.06),
            swayDistance: random(0.8, 2.2) * scale,
            tumble: random(0, Math.PI * 2),
            tumbleSpeed: random(0.05, 0.12),
            fallSpeed: random(1.6, 2.8) * scale,
        };
    };

    const step = (particle: Particle, frames: number) => {
        let roll = 0;

        if (particle.velocityY < 0) {
            particle.velocityY += gravity() * frames;
            particle.x += particle.velocityX * frames;
        } else {
            particle.velocityY += (particle.fallSpeed - particle.velocityY) * 0.06 * frames;
            particle.velocityX *= Math.pow(0.96, frames);
            particle.sway += particle.swaySpeed * frames;
            particle.x +=
                (particle.velocityX + Math.sin(particle.sway) * particle.swayDistance) * frames;
            roll = Math.cos(particle.sway) * 0.9;
        }

        particle.y += particle.velocityY * frames;
        particle.spin += particle.spinSpeed * frames;
        particle.tumble += particle.tumbleSpeed * frames;

        return particle.spin + roll;
    };

    const draw = (particle: Particle, angle: number) => {
        const cos = Math.cos(angle) * pixelRatio;
        const sin = Math.sin(angle) * pixelRatio;
        const squash = Math.cos(particle.tumble);

        context.setTransform(
            cos,
            sin,
            -sin * squash,
            cos * squash,
            particle.x * pixelRatio,
            particle.y * pixelRatio,
        );
        context.fillStyle = particle.color;

        if (particle.isRound) {
            context.beginPath();
            context.arc(0, 0, particle.width / 2.4, 0, Math.PI * 2);
            context.fill();
        } else {
            context.fillRect(
                -particle.width / 2,
                -particle.height / 2,
                particle.width,
                particle.height,
            );
        }
    };

    resize();
    window.addEventListener("resize", resize);

    const startTime = performance.now();
    for (let index = 0; index < count; index++) {
        particles.push(createParticle(startTime));
    }

    let frameId = 0;
    let previousTime = startTime;

    const release = () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("resize", resize);
        canvas.width = 0;
        canvas.height = 0;
    };

    frameId = requestAnimationFrame(function render(time) {
        const frames = Math.min(3, (time - previousTime) / 16.667);
        previousTime = time;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (let index = particles.length - 1; index >= 0; index--) {
            const particle = particles[index];

            if (time < particle.launchAt) {
                continue;
            }

            const angle = step(particle, frames);

            if (particle.velocityY > 0 && particle.y > height + 30) {
                particles[index] = particles[particles.length - 1];
                particles.pop();
                continue;
            }

            if (particle.y > -30) {
                draw(particle, angle);
            }
        }

        if (particles.length > 0) {
            frameId = requestAnimationFrame(render);
        } else {
            release();
        }
    });

    return release;
}
