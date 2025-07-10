import React from "react";

export default function ProjectsSection() {
  return (
    <section
      className="w-full min-h-screen px-0 py-12 relative"
      id="projects"
    >
      {/* Background pixel sunny image (behind content) */}
      <img
        src="/pixelsunny.png"
        alt="Pixel Sunny Background"
        className="absolute inset-0 w-full h-full object-cover -z-20 select-none pointer-events-none"
        draggable={false}
        style={{ imageRendering: 'pixelated', objectPosition: 'bottom' }}
      />
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40 -z-10 pointer-events-none" />
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center relative z-10 px-4">
        <h2 className="text-2xl font-semibold mb-10 text-center">Projects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 w-full">
          {/* Project Card 1 */}
          <div className="relative flex flex-col gap-2 border-2 border-primary/30 bg-card/80 p-6 shadow-pixel w-full rounded-none overflow-hidden border-pixel"
            style={{
              boxSizing: 'border-box',
              boxShadow: `4px 4px 0 0 #222, 8px 8px 0 0 #000, 0 0 0 4px #fff inset`,
              imageRendering: 'pixelated',
            }}
          >
            <h3 className="text-xl font-bold">Tape Saturator Plugin</h3>
            <p className="text-sm text-muted-foreground">A Hysteresis Curve saturator DAW plugin written in C++ with the JUCE framework. Features custom pixel art visuals.</p>
            <a href="#" className="mt-2 text-primary hover:underline text-sm font-medium" target="_blank" rel="noopener noreferrer">View Project</a>
          </div>
          {/* Project Card 2 */}
          <div className="relative flex flex-col gap-2 border-2 border-primary/30 bg-card/80 p-6 shadow-pixel w-full rounded-none overflow-hidden border-pixel"
            style={{
              boxSizing: 'border-box',
              boxShadow: `4px 4px 0 0 #222, 8px 8px 0 0 #000, 0 0 0 4px #fff inset`,
              imageRendering: 'pixelated',
            }}
          >
            <h3 className="text-xl font-bold">Project Title 2</h3>
            <p className="text-sm text-muted-foreground">Short project description goes here.</p>
            <a href="#" className="mt-2 text-primary hover:underline text-sm font-medium" target="_blank" rel="noopener noreferrer">View Project</a>
          </div>
          {/* Project Card 3 */}
          <div className="relative flex flex-col gap-2 border-2 border-primary/30 bg-card/80 p-6 shadow-pixel w-full rounded-none overflow-hidden border-pixel"
            style={{
              boxSizing: 'border-box',
              boxShadow: `4px 4px 0 0 #222, 8px 8px 0 0 #000, 0 0 0 4px #fff inset`,
              imageRendering: 'pixelated',
            }}
          >
            <h3 className="text-xl font-bold">Project Title 3</h3>
            <p className="text-sm text-muted-foreground">Short project description goes here.</p>
            <a href="#" className="mt-2 text-primary hover:underline text-sm font-medium" target="_blank" rel="noopener noreferrer">View Project</a>
          </div>
          {/* Project Card 4 */}
          <div className="relative flex flex-col gap-2 border-2 border-primary/30 bg-card/80 p-6 shadow-pixel w-full rounded-none overflow-hidden border-pixel"
            style={{
              boxSizing: 'border-box',
              boxShadow: `4px 4px 0 0 #222, 8px 8px 0 0 #000, 0 0 0 4px #fff inset`,
              imageRendering: 'pixelated',
            }}
          >
            <h3 className="text-xl font-bold">Project Title 4</h3>
            <p className="text-sm text-muted-foreground">Short project description goes here.</p>
            <a href="#" className="mt-2 text-primary hover:underline text-sm font-medium" target="_blank" rel="noopener noreferrer">View Project</a>
          </div>
        </div>
      </div>
    </section>
  );
}
