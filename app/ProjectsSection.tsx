import React from "react";

export default function ProjectsSection() {
  return (
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
  );
}
