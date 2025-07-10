import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// Pixelated Confetti Component
interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  speed: number;
  drift: number;
  size: number;
}
const CONFETTI_COLORS = [
  '#fbbf24', // yellow
  '#ef4444', // red
  '#10b981', // green
  '#3b82f6', // blue
  '#a21caf', // purple
  '#f472b6', // pink
  '#f59e42', // orange
  '#fff',    // white
];
function Confetti({ trigger }: { trigger: number }) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  // Only render portal after mount to avoid hydration mismatch
  useEffect(() => { setHasMounted(true); }, []);
  // Launch confetti when trigger changes
  useEffect(() => {
    if (!trigger) return;
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 32; i++) {
      pieces.push({
        id: i + Math.random(),
        x: Math.random() * 100, // percent of viewport width
        y: -4 - Math.random() * 8, // start above
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        speed: 0.25 + Math.random() * 0.35, // much slower
        drift: (Math.random() - 0.5) * 0.7,
        size: 8 + Math.floor(Math.random() * 4),
      });
    }
    setConfetti(pieces);
  }, [trigger]);
  // Animate
  useEffect(() => {
    if (!confetti.length) return;
    let running = true;
    function animate() {
      setConfetti((prev) =>
        prev
          .map((c) => ({ ...c, y: c.y + c.speed, x: c.x + c.drift }))
          .filter((c) => c.y < 110)
      );
      if (running && confetti.length) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => { running = false; };
  }, [confetti.length]);
  if (!hasMounted) return null;
  return createPortal(
    <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 1000 }}>
      {confetti.map((c) => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            left: `calc(${c.x}vw)`,
            top: `calc(${c.y}vh)`,
            width: c.size,
            height: c.size,
            background: c.color,
            border: '2px solid #222',
            borderRadius: 2,
            imageRendering: 'pixelated',
            boxShadow: '0 2px 0 0 #000',
            opacity: 0.95,
          }}
        />
      ))}
    </div>,
    document.body
  );
}

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess("Your message has been sent! Check your email for confirmation.");
        setForm({ name: "", email: "", message: "" });
        setConfettiTrigger(Date.now()); // trigger confetti
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again later.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="w-full max-w-md px-4 py-12 flex flex-col items-center relative"
      id="contact"
      style={{ overflow: 'hidden' }}
    >
      <Confetti trigger={confettiTrigger} />
      <h2 className="text-2xl font-semibold mb-4">Contact Me</h2>
      <form className="w-full flex flex-col gap-4 bg-card border border-border rounded-lg p-6 shadow-sm" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          className="px-3 py-2 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
          value={form.name}
          onChange={handleChange}
          disabled={loading}
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          className="px-3 py-2 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
          value={form.email}
          onChange={handleChange}
          disabled={loading}
        />
        <textarea
          name="message"
          placeholder="Your Message"
          rows={4}
          className="px-3 py-2 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
          value={form.message}
          onChange={handleChange}
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-primary text-background font-semibold py-2 rounded hover:bg-primary/90 transition-colors"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
        {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </form>
    </section>
  );
}
