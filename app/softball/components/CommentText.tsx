import React, { useRef, useState, useEffect } from 'react';

interface CommentTextProps {
  text: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function CommentText({ text, isExpanded, onToggle }: CommentTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        // Get the height of two lines of text
        const lineHeight = parseInt(window.getComputedStyle(textRef.current).lineHeight);
        const twoLinesHeight = lineHeight * 2;
        
        // Compare with actual content height
        const isTextOverflowing = textRef.current.scrollHeight > twoLinesHeight;
        setIsOverflowing(isTextOverflowing);
      }
    };

    // Initial check
    checkOverflow();

    // Check after content might have changed
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [text]);

  return (
    <div>
      <p 
        ref={textRef}
        className={`italic break-words whitespace-pre-wrap transition-all duration-300
          ${!isExpanded ? 'line-clamp-2' : ''}`}
      >
        "{text}"
      </p>
      {isOverflowing && (
        <button 
          onClick={onToggle}
          className="text-xs text-primary/70 hover:text-primary mt-1 block"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
} 