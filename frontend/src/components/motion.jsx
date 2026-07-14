import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

// Orthodox cross SVG separator
export function Cross({ className = "w-4 h-4", color = "#DAA520" }) {
  return (
    <svg viewBox="0 0 24 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="12" y1="2" x2="12" y2="38" stroke={color} strokeWidth="1.5" />
      <line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth="1.5" />
      <line x1="2" y1="16" x2="22" y2="16" stroke={color} strokeWidth="1.5" />
      <line x1="7" y1="26" x2="17" y2="22" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function Reveal({ children, delay = 0, y = 30, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Line-by-line masked reveal for hero
export function LineReveal({ lines, className = "", delayBase = 0.2 }) {
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: delayBase + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Marquee({ items }) {
  const seq = [...items, ...items];
  return (
    <div className="overflow-hidden py-5 bg-inkbrown text-cream" data-testid="marquee">
      <div className="marquee-track">
        {seq.map((it, i) => (
          <span key={i} className="mx-8 inline-flex items-center gap-8 text-2xl font-serif tracking-wide">
            {it}
            <Cross className="w-3 h-6" />
          </span>
        ))}
      </div>
    </div>
  );
}

export function Parallax({ children, offset = 80, className = "" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
