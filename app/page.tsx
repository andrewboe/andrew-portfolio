"use client";

import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";
import "@fontsource/press-start-2p";
import AboutSection from "./AboutSection";
import HeroSection from "./HeroSection";
import ProjectsSection from "./ProjectsSection";
import ContactSection from "./ContactSection";
import FooterSection from "./FooterSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground font-['Press_Start_2P',monospace]">
      {/* Hero Section - Fullscreen with Rain and Umbrella */}
      <HeroSection />

      {/* About Section - Pixel Art Layout */}
      <AboutSection />

      {/* Projects Section */}
      <ProjectsSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}


