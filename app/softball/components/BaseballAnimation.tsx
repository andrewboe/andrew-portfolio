import React, { useEffect, useState } from 'react';

interface Baseball {
  id: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  rotation: number;
  bounceCount: number;
  size: number;
}

export default function BaseballAnimation() {
  const [baseballs, setBaseballs] = useState<Baseball[]>([]);
  
  useEffect(() => {
    // Constants for physics
    const GRAVITY = 0.15;
    const BOUNCE_DAMPING = 0.7;
    const COLLISION_DAMPING = 0.8;
    const MAX_BOUNCES = 3;
    const BALL_SIZES = [24, 32, 40]; // Different ball sizes in pixels

    // Create 8 baseballs with random positions
    const newBaseballs = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * (window.innerWidth - 40), // Account for ball size
      y: -50 - (Math.random() * 200), // Stagger initial heights
      speedX: (Math.random() - 0.5) * 2, // Random horizontal speed
      speedY: Math.random() * 1, // Initial vertical speed
      rotation: Math.random() * 360,
      bounceCount: 0,
      size: BALL_SIZES[Math.floor(Math.random() * BALL_SIZES.length)]
    }));
    setBaseballs(newBaseballs);

    let animationFrame: number;
    const animate = () => {
      setBaseballs(prev => {
        const updatedBalls = prev.map(ball => {
          let { x, y, speedX, speedY, rotation, bounceCount, size } = ball;

          // Update position
          x += speedX;
          y += speedY;
          speedY += GRAVITY;
          rotation += speedX * 2; // Rotation based on horizontal speed

          // Bounce off bottom
          if (y > window.innerHeight - size) {
            y = window.innerHeight - size;
            speedY = -speedY * BOUNCE_DAMPING;
            bounceCount++;
            // Add some random horizontal movement on bounce
            speedX += (Math.random() - 0.5) * 1;
          }

          // Bounce off sides
          if (x < 0) {
            x = 0;
            speedX = Math.abs(speedX) * BOUNCE_DAMPING;
          }
          if (x > window.innerWidth - size) {
            x = window.innerWidth - size;
            speedX = -Math.abs(speedX) * BOUNCE_DAMPING;
          }

          // Ball-to-ball collisions
          prev.forEach(otherBall => {
            if (ball.id !== otherBall.id) {
              const dx = x - otherBall.x;
              const dy = y - otherBall.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const minDistance = (size + otherBall.size) / 2;

              if (distance < minDistance) {
                // Collision response
                const angle = Math.atan2(dy, dx);
                const targetX = x + Math.cos(angle) * minDistance;
                const targetY = y + Math.sin(angle) * minDistance;

                // Move balls apart
                x = targetX;
                y = targetY;

                // Exchange velocities with damping
                const tempSpeedX = speedX;
                const tempSpeedY = speedY;
                speedX = otherBall.speedX * COLLISION_DAMPING;
                speedY = otherBall.speedY * COLLISION_DAMPING;
                otherBall.speedX = tempSpeedX * COLLISION_DAMPING;
                otherBall.speedY = tempSpeedY * COLLISION_DAMPING;
              }
            }
          });

          // Remove ball if it's bounced too many times and is moving slowly
          if (bounceCount > MAX_BOUNCES && Math.abs(speedY) < 0.5) {
            return null as any;
          }

          return {
            ...ball,
            x,
            y,
            speedX,
            speedY,
            rotation,
            bounceCount
          };
        }).filter(Boolean);

        // Remove all balls if they're all slow or off screen
        if (updatedBalls.length === 0 || 
            updatedBalls.every(ball => 
              ball.bounceCount > MAX_BOUNCES && 
              Math.abs(ball.speedY) < 0.5)) {
          cancelAnimationFrame(animationFrame);
          return [];
        }

        return updatedBalls;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {baseballs.map(ball => (
        <img
          key={ball.id}
          src="/baseball.png"
          alt="Baseball"
          className="absolute"
          style={{
            left: `${ball.x}px`,
            top: `${ball.y}px`,
            width: `${ball.size}px`,
            height: `${ball.size}px`,
            transform: `rotate(${ball.rotation}deg)`,
            imageRendering: 'pixelated',
            transition: 'transform 0.1s ease-out'
          }}
        />
      ))}
    </div>
  );
} 