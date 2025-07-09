import React from "react";

export default function ContactSection() {
  return (
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
  );
}
