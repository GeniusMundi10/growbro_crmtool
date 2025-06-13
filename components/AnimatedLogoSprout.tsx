import React from "react";
import { motion } from "framer-motion";

// Animated Sprout/Leaf inside a modern rounded-corner chat/circuit frame
type AnimatedLogoSproutProps = {
  size?: number;
  colorScheme?: 'light' | 'dark'; // 'light' for dark backgrounds, 'dark' for light backgrounds
};

export default function AnimatedLogoSprout({ size = 64, colorScheme = 'dark' }: AnimatedLogoSproutProps) {
  // Colors for each scheme
  const colors = colorScheme === 'light'
    ? {
        frame: '#fff',
        stem: '#fff',
        leaf: '#B9F5C3',
        node: '#7FFFB2',
      }
    : {
        frame: '#39543A',
        stem: '#39543A',
        leaf: '#39543A',
        node: '#6BBF59',
      };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* Outer rounded-corner frame (inspired by chat/circuit, but generic) */}
      <motion.path
        d="M12 9C12 13.4183 12 16 16 16H48C52 16 52 18.5817 52 23V41C52 45.4183 52 48 48 48H22L12 55V9Z"
        stroke={colors.frame}
        strokeWidth="3.5"
        fill="none"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      />
      {/* Sprout stem */}
      <motion.path
        d="M32 42V32"
        stroke={colors.stem}
        strokeWidth="2.2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: 0.8, ease: "easeInOut" }}
      />
      {/* Center leaf */}
      <motion.path
        d="M32 32C32 25 36.5 23 36.5 23C36.5 23 32 21 32 32Z"
        fill={colors.leaf}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2, type: "spring" }}
      />
      {/* Left leaf */}
      <motion.path
        d="M32 32C32 27 27 27 27 27C27 27 29 33 32 32Z"
        fill={colors.leaf}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.35, type: "spring" }}
      />
      {/* Right leaf */}
      <motion.path
        d="M32 32C32 27 37 27 37 27C37 27 35 33 32 32Z"
        fill={colors.leaf}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5, type: "spring" }}
      />
      {/* Circuit/AI nodes on leaves */}
      <motion.circle
        cx="36.5"
        cy="23"
        r="1.1"
        fill={colors.node}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.6, duration: 0.4, type: "spring" }}
      />
      <motion.circle
        cx="27"
        cy="27"
        r="1.1"
        fill={colors.node}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.7, duration: 0.4, type: "spring" }}
      />
      <motion.circle
        cx="37"
        cy="27"
        r="1.1"
        fill={colors.node}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.8, duration: 0.4, type: "spring" }}
      />
    </motion.svg>
  );
}
