import React, { useRef, useState, useEffect } from "react";

// Types for snow
interface Snowflake {
  id: number;
  x: number; // percent across width
  y: number; // percent down height
  speedY: number; // vertical speed
  speedX: number; // horizontal speed (for fan effect)
}
interface PooledSnow {
  id: number;
  x: number; // percent across width
  created: number; // timestamp
}

const SNOWFLAKE_COUNT = 40;
const POOLED_SNOW_LIFETIME = 2200; // ms

export default function AboutSection() {
  const aboutRef = useRef<HTMLElement>(null);
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [aboutMouse, setAboutMouse] = useState<{ x: number; y: number } | null>(null);
  const [pooledSnow, setPooledSnow] = useState<PooledSnow[]>([]);

  // Initialize snowflakes
  useEffect(() => {
    setSnowflakes(
      Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * -100,
        speedY: 0.12 + Math.random() * 0.22,
        speedX: 0,
      }))
    );
  }, []);

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
      setPooledSnow((prev) => prev.filter((dot) => Date.now() - dot.created < POOLED_SNOW_LIFETIME));
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [aboutMouse]);

  // Mouse move handler for fan effect
  const handleAboutMouseMove = (e: React.MouseEvent) => {
    const rect = aboutRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAboutMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleAboutMouseLeave = () => setAboutMouse(null);

  return (
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
  );
}
