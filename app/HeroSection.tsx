import React, { useRef, useState, useEffect } from "react";

// Raindrop type
interface Raindrop {
  id: number;
  x: number; // percent across width
  y: number; // percent down height
  speed: number; // percent per frame
}

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const [raindrops, setRaindrops] = useState<Raindrop[]>([]);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const umbrellaSize = 170; // px
  const raindropCount = 40;

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

  // Mouse move handler for umbrella
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMouseLeave = () => setMouse(null);

  return (
    <header
      ref={heroRef}
      className="w-full min-h-screen flex flex-col items-center justify-center py-16 px-4 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'none' }}
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
            More About Me
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
  );
}
