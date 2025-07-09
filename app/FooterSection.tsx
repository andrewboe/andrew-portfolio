import React from "react";

export default function FooterSection() {
  return (
    <footer className="w-full flex flex-col items-center gap-2 text-xs text-muted-foreground border-t border-border pt-6 pb-4 mt-8">
      <span>© {new Date().getFullYear()} Andrew Boe. All rights reserved.</span>
    </footer>
  );
}
