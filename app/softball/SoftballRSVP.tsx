import React from 'react';
import RSVPForm from './components/RSVPForm';
import RSVPList from './components/RSVPList';
import { useRSVPs } from './hooks/useRSVPs';
import { AdminProvider } from './context/AdminContext';
import AdminPanel from './components/AdminPanel';

export default function SoftballRSVP() {
  const { rsvps, isLoading, error, refreshRSVPs } = useRSVPs();

  return (
    <AdminProvider>
      <header className="w-full min-h-screen flex flex-col items-center justify-start py-16 px-4 relative overflow-hidden">
        {/* Background softball field image */}
        <img
          src="/softballfield.png"
          alt="Softball Field Background"
          className="absolute inset-0 w-full h-full object-cover -z-20 select-none pointer-events-none"
          draggable={false}
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-black/40 -z-10 pointer-events-none" />

        {/* Content container */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center slide-down uppercase text-white mb-12">
          <span className="inline-block">RSVP for</span>
          <br />
          <span className="inline-block text-[clamp(1rem,5vw,3.75rem)]">S.O.F.T.B.A.L.L.</span>
        </h1>

        {/* Responsive container for form and list */}
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-start lg:gap-8">
          {/* RSVP Form Section */}
          <div className="w-full lg:w-1/2">
            <div className="lg:sticky lg:top-8">
              <RSVPForm onRSVPSubmitted={refreshRSVPs} />
            </div>
          </div>

          {/* RSVP List Section */}
          <div className="w-full lg:w-1/2 mt-8 lg:mt-0">
            <div className="w-full max-w-md mx-auto">
              {isLoading ? (
                <div className="bg-background/80 backdrop-blur-sm p-6 border-2 border-primary/30 shadow-pixel">
                  <p className="text-white text-center text-sm">Loading RSVPs...</p>
                </div>
              ) : error ? (
                <div className="bg-background/80 backdrop-blur-sm p-6 border-2 border-primary/30 shadow-pixel">
                  <p className="text-red-500 text-center text-sm">{error}</p>
                </div>
              ) : (
                <RSVPList rsvps={rsvps} />
              )}
            </div>
          </div>
        </div>

        {/* Admin Panel */}
        <AdminPanel />
      </header>
    </AdminProvider>
  );
} 