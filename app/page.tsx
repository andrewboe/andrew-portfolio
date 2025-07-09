"use client";

import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import "@fontsource/press-start-2p";

// Raindrop type
interface Raindrop {
  id: number;
  x: number; // percent across width
  y: number; // percent down height
  speed: number; // percent per frame
}

// Snowflake type for About section
interface Snowflake {
  id: number;
  x: number; // percent across width
  y: number; // percent down height
  speedY: number; // vertical speed
  speedX: number; // horizontal speed (for fan effect)
}

// Pooled snow type
interface PooledSnow {
  id: number;
  x: number; // percent across width
  created: number; // timestamp
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  // Rain state
  const [raindrops, setRaindrops] = useState<Raindrop[]>([]);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [aboutMouse, setAboutMouse] = useState<{ x: number; y: number } | null>(null);
  const [pooledSnow, setPooledSnow] = useState<PooledSnow[]>([]);
  const umbrellaSize = 170; // px
  const raindropCount = 40;
  const snowflakeCount = 40;
  const pooledSnowLifetime = 2200; // ms

  // Refs for hero text elements
  const nameRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  // Initialize raindrops
  useEffect(() => {
    setRaindrops(
      Array.from({ length: raindropCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * -100, // start above the top
        speed: 0.5 + Math.random() * 1.2,
      }))
    );
  }, []);

  // Initialize snowflakes
  useEffect(() => {
    setSnowflakes(
      Array.from({ length: snowflakeCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * -100,
        speedY: 0.12 + Math.random() * 0.22, // slower snow
        speedX: 0,
      }))
    );
  }, []);

  // Helper to check if a raindrop is inside a DOMRect
  function isInsideRect(dropX: number, dropY: number, rect: DOMRect) {
    return (
      dropX >= rect.left &&
      dropX <= rect.right &&
      dropY >= rect.top &&
      dropY <= rect.bottom
    );
  }

  // Animate raindrops
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setRaindrops((drops) =>
        drops.map((drop) => {
          // Block by umbrella image
          if (mouse && heroRef.current) {
            const dropX = (drop.x / 100) * heroRef.current.offsetWidth + 4;
            const dropY = (drop.y / 100) * heroRef.current.offsetHeight + 4;
            const umbrellaLeft = mouse.x - umbrellaSize / 2;
            const umbrellaTop = mouse.y - umbrellaSize / 2;
            if (
              dropX >= umbrellaLeft &&
              dropX <= umbrellaLeft + umbrellaSize &&
              dropY >= umbrellaTop &&
              dropY <= umbrellaTop + umbrellaSize
            ) {
              return { ...drop, y: 0, x: Math.random() * 100 };
            }
          }
          // Avoid hero text
          if (heroRef.current) {
            const sectionRect = heroRef.current.getBoundingClientRect();
            const dropXAbs = sectionRect.left + (drop.x / 100) * sectionRect.width;
            const dropYAbs = sectionRect.top + (drop.y / 100) * sectionRect.height;
            const textRects = [nameRef, descRef, linksRef, buttonRef]
              .map((r) => r.current?.getBoundingClientRect())
              .filter(Boolean) as DOMRect[];
            if (textRects.some((rect) => isInsideRect(dropXAbs, dropYAbs, rect))) {
              return { ...drop, y: 0, x: Math.random() * 100 };
            }
          }
          // Move drop down
          let newY = drop.y + drop.speed;
          if (newY > 100) {
            // Reset to top
            return { ...drop, y: 0, x: Math.random() * 100 };
          }
          return { ...drop, y: newY };
        })
      );
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [mouse]);

  // Animate snowflakes with fan effect
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setSnowflakes((flakes) =>
        flakes.map((flake) => {
          let { x, y, speedY, speedX } = flake;
          // Fan effect: mouse blows snow horizontally
          if (aboutMouse && aboutRef.current) {
            const section = aboutRef.current.getBoundingClientRect();
            const flakeX = (x / 100) * section.width;
            const flakeY = (y / 100) * section.height;
            const dx = flakeX - aboutMouse.x;
            const dy = flakeY - aboutMouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              // Apply a force away from the mouse, stronger when closer
              const force = (120 - dist) / 120 * 2; // max 2px/frame
              speedX += (dx / (dist + 1)) * force;
            } else {
              speedX *= 0.95;
            }
          } else {
            speedX *= 0.95;
          }
          // Move flake
          const sectionWidth = aboutRef.current?.offsetWidth || 800; // fallback width
          x += (speedX / sectionWidth) * 100;
          y += speedY;
          // Pool snow at bottom
          if (y > 100) {
            setPooledSnow((prev) => [
              ...prev,
              { id: Date.now() + Math.random(), x, created: Date.now() },
            ]);
            return {
              ...flake,
              x: Math.random() * 100,
              y: 0,
              speedY: 0.12 + Math.random() * 0.22,
              speedX: 0,
            };
          }
          // Wrap if out of bounds horizontally
          if (x < -5 || x > 105) {
            return {
              ...flake,
              x: Math.random() * 100,
              y: 0,
              speedY: 0.12 + Math.random() * 0.22,
              speedX: 0,
            };
          }
          return { ...flake, x, y, speedX };
        })
      );
      // Remove old pooled snow
      setPooledSnow((prev) => prev.filter((dot) => Date.now() - dot.created < pooledSnowLifetime));
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [aboutMouse]);

  // Mouse move handler for umbrella
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMouseLeave = () => setMouse(null);

  // Mouse move handler for fan effect
  const handleAboutMouseMove = (e: React.MouseEvent) => {
    const rect = aboutRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAboutMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleAboutMouseLeave = () => setAboutMouse(null);

  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground font-['Press_Start_2P',monospace]">
      {/* Hero Section - Fullscreen with Rain and Umbrella */}
      <header
        ref={heroRef}
        className="w-full min-h-screen flex flex-col items-center justify-center py-16 px-4 relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: 'none',
        }}
      >
        {/* Background pixel art image (behind rain/umbrella) */}
        <img
          src="/pixelart.png"
          alt="Pixel Art Background"
          className="absolute inset-0 w-full h-full object-cover -z-20 select-none pointer-events-none"
          draggable={false}
        />
        {/* Rain Layer */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          {/* Raindrops */}
          {raindrops.map((drop) => (
            <div
              key={drop.id}
              style={{
                position: "absolute",
                left: `${drop.x}%`,
                top: `${drop.y}%`,
                width: 8,
                height: 8,
                background: "#3b82f6",
                border: "2px solid #fff",
                borderRadius: 2,
                boxShadow: "0 2px 0 0 #1e293b",
                imageRendering: "pixelated",
                pointerEvents: "none",
                transition: "none",
              }}
            />
          ))}
          {/* Umbrella image follows mouse */}
          {mouse && (
            <img
              src="/umbrella.png"
              alt="Umbrella"
              width={umbrellaSize}
              height={umbrellaSize}
              style={{
                position: "absolute",
                left: mouse.x - umbrellaSize / 2,
                top: mouse.y - umbrellaSize / 2,
                pointerEvents: "none",
                zIndex: 2,
                userSelect: "none",
              }}
              draggable={false}
            />
          )}
        </div>
        {/* Hero content - pixel art style layout */}
        <div className="relative w-full flex flex-col sm:flex-row items-center justify-between gap-16 z-10 mt-16 mb-8 px-2 sm:px-8">
          {/* Left: Name and tagline */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-shadow-pixel gap-6 sm:gap-8">
            <h1 ref={nameRef} className="text-4xl sm:text-6xl font-bold tracking-tight mb-2 text-center sm:text-left slide-down uppercase">
              Andrew Boe
            </h1>
            <p ref={descRef} className="text-base sm:text-lg max-w-md text-muted-foreground mb-4 slide-left text-center sm:text-left">
              Hi! I'm Andrew, a passionate developer focused on building impactful digital experiences.
            </p>
            <div ref={linksRef} className="flex gap-6 mb-4 slide-right">
              <a
                href="mailto:andrewboe63@gmail.com"
                className="hover:underline text-primary border-2 border-primary px-2 py-1 bg-background/80 shadow-pixel border-pixel"
              >
                Email
              </a>
              <a
                href="https://github.com/andrewboe"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-primary border-2 border-primary px-2 py-1 bg-background/80 shadow-pixel border-pixel"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/andrew-boe-074770142/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-primary border-2 border-primary px-2 py-1 bg-background/80 shadow-pixel border-pixel"
              >
                LinkedIn
              </a>
            </div>
            <a
              ref={buttonRef}
              href="#about"
              className="inline-block bg-primary text-background font-semibold py-3 px-8 shadow-pixel border-2 border-red-600 slide-up mt-4 text-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary border-pixel"
            >
              View My Work
            </a>
          </div>
          {/* Right: Pixel avatar or fun pixel art (optional) */}
          <div className="flex-1 flex items-center justify-center">
            <img
              src="/avatar-pixel.png"
              alt="Pixel Avatar"
              className="w-40 h-40 sm:w-56 sm:h-56 object-contain drop-shadow-pixel"
              draggable={false}
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>
      </header>

      {/* About Section - Pixel Art Layout */}
      <section
        ref={aboutRef}
        className="w-full min-h-screen px-0 py-12 relative"
        id="about"
        onMouseMove={handleAboutMouseMove}
        onMouseLeave={handleAboutMouseLeave}
      >
        {/* Background pixel snow image (behind content and snowflakes) */}
        <img
          src="/pixelsnow.png"
          alt="Pixel Snow Background"
          className="absolute inset-0 w-full h-full object-cover -z-20 select-none pointer-events-none"
          draggable={false}
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Dynamic snowflakes (pixel-art style) */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          {snowflakes.map((flake) => (
            <div
              key={flake.id}
              style={{
                position: 'absolute',
                left: `${flake.x}%`,
                top: `${flake.y}%`,
                width: 10,
                height: 10,
                background: 'white',
                border: '2px solid #e0e7ef',
                borderRadius: 2,
                boxShadow: '0 2px 0 0 #bfc9d9',
                imageRendering: 'pixelated',
                pointerEvents: 'none',
              }}
            />
          ))}
          {/* Pooled snow at bottom */}
          {pooledSnow.map((dot) => (
            <div
              key={dot.id}
              style={{
                position: 'absolute',
                left: `${dot.x}%`,
                bottom: 0,
                width: 10,
                height: 10,
                background: 'white',
                border: '2px solid #e0e7ef',
                borderRadius: 2,
                boxShadow: '0 2px 0 0 #bfc9d9',
                imageRendering: 'pixelated',
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
        <div className="w-full flex flex-col sm:flex-row sm:items-start sm:justify-start gap-44 mt-16 mb-8 px-4 sm:px-12 lg:px-24">
          {/* Left: About text */}
          <div className="flex-1 min-w-[340px] max-w-2xl flex flex-col items-start text-shadow-pixel gap-8">
            <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-left">About Me</h2>
            <p className="text-base sm:text-lg text-left text-muted-foreground mb-2 w-full max-w-2xl">
              I'm a software developer with a love for clean code, creative problem solving, and modern web technologies. I enjoy working on challenging projects and collaborating with others to bring ideas to life.
            </p>
            <p className="text-base sm:text-lg text-left text-muted-foreground mb-2 w-full max-w-2xl">
              My main stack includes React, Next.js, and TypeScript, but I'm always eager to learn new tools and frameworks.
            </p>
          </div>
          {/* Right: Skills & Tools */}
          <div className="flex-1 flex flex-col items-center w-full">
            <div className="flex flex-col items-center mx-auto" style={{ width: 3 * 200 + 2 * 64 }}>
              <h3 className="text-xl font-semibold mb-8 text-center w-full">Skills & Tools</h3>
              <div className="grid grid-cols-3 gap-x-16 gap-y-8">
                {/* 3x3 grid of large skill logos with labels below, each in a bordered card with pixel-art CSS shading */}
                {[
                  { src: "/javascript.png", alt: "JavaScript", label: "JavaScript" },
                  { src: "/typescript.png", alt: "TypeScript", label: "TypeScript" },
                  { src: "/react.png", alt: "React", label: "React" },
                  { src: "/nextjs.png", alt: "Next.js", label: "Next.js" },
                  { src: "/nodejs.png", alt: "Node.js", label: "Node.js" },
                  { src: "/css.png", alt: "CSS", label: "CSS" },
                  { src: "/git.png", alt: "Git", label: "Git" },
                  { src: "/python.png", alt: "Python", label: "Python" },
                  { src: "/cplusplus.png", alt: "C++", label: "C++" },
                ].map(({ src, alt, label }, i) => (
                  <div
                    key={alt}
                    className="relative flex flex-col items-center border-2 border-primary/30 bg-background/80 p-4 shadow-pixel w-[200px] h-[140px] rounded-none overflow-hidden border-pixel"
                    style={{
                      boxSizing: 'border-box',
                      boxShadow: `4px 4px 0 0 #222, 8px 8px 0 0 #000, 0 0 0 4px #fff inset`,
                      imageRendering: 'pixelated',
                    }}
                  >
                    <img
                      src={src}
                      alt={alt}
                      className="w-16 h-16 rounded bg-white border border-primary/20 p-2 mb-2 z-10"
                      style={{ position: 'relative', imageRendering: 'pixelated' }}
                    />
                    <span className="text-primary font-medium text-sm sm:text-base mt-2 w-full text-center break-words z-10" style={{ position: 'relative' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="w-full max-w-3xl px-4 py-12" id="projects">
        <h2 className="text-2xl font-semibold mb-6 text-center">Projects</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Example Project Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm flex flex-col gap-2">
            <h3 className="text-xl font-bold">Project Title</h3>
            <p className="text-sm text-muted-foreground">
              Short project description goes here.
            </p>
            <a
              href="#"
              className="mt-2 text-primary hover:underline text-sm font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Project
            </a>
          </div>
          {/* Add more project cards as needed */}
        </div>
      </section>

      {/* Contact Section */}
      <section
        className="w-full max-w-md px-4 py-12 flex flex-col items-center"
        id="contact"
      >
        <h2 className="text-2xl font-semibold mb-4">Contact Me</h2>
        <form className="w-full flex flex-col gap-4 bg-card border border-border rounded-lg p-6 shadow-sm">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            className="px-3 py-2 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            className="px-3 py-2 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows={4}
            className="px-3 py-2 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <button
            type="submit"
            className="bg-primary text-background font-semibold py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Send Message
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="w-full flex flex-col items-center gap-2 text-xs text-muted-foreground border-t border-border pt-6 pb-4 mt-8">
        <span>© {new Date().getFullYear()} Andrew Boe. All rights reserved.</span>
      </footer>
    </div>
  );
}


