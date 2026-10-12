import React from 'react';

interface BlueMascotProps {
  size?: number;
  mood?: 'happy' | 'wink' | 'calm';
  className?: string;
}

export default function BlueMascot({ size = 56, mood = 'happy', className = '' }: BlueMascotProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Wink: right eye is a curve instead of an oval
  const rightEye = mood === 'wink' ? (
    <path
      d={`M ${cx + 7} ${cy - 3} Q ${cx + 10} ${cy - 7} ${cx + 13} ${cy - 3}`}
      stroke="#1B2547"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  ) : (
    <ellipse cx={cx + 10} cy={cy - 4} rx="3.5" ry={mood === 'calm' ? 2 : 4} fill="#1B2547" />
  );

  const moodColor = mood === 'happy' ? '#3B6CF6' : mood === 'calm' ? '#6FA0FF' : '#3B6CF6';

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Blue mascot"
    >
      <defs>
        <linearGradient id={`bg-${size}-${mood}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6FA0FF" />
          <stop offset="100%" stopColor={moodColor} />
        </linearGradient>
      </defs>

      {/* Leaf/antenna on top */}
      <ellipse
        cx={cx}
        cy={cy * 0.22}
        rx={s * 0.08}
        ry={s * 0.12}
        fill="#2BB673"
        transform={`rotate(-20, ${cx}, ${cy * 0.22})`}
      />
      <line
        x1={cx}
        y1={cy * 0.35}
        x2={cx}
        y2={cy * 0.22}
        stroke="#2BB673"
        strokeWidth="1.5"
      />

      {/* Body blob */}
      <ellipse
        cx={cx}
        cy={cy + s * 0.08}
        rx={s * 0.4}
        ry={s * 0.38}
        fill={`url(#bg-${size}-${mood})`}
      />

      {/* White face area */}
      <ellipse
        cx={cx}
        cy={cy + s * 0.06}
        rx={s * 0.28}
        ry={s * 0.26}
        fill="white"
        opacity="0.92"
      />

      {/* Left eye */}
      <ellipse cx={cx - 10} cy={cy - 4} rx="3.5" ry={mood === 'calm' ? 2 : 4} fill="#1B2547" />

      {/* Left eye highlight */}
      <circle cx={cx - 8.5} cy={cy - 6} r="1" fill="white" />

      {/* Right eye */}
      {rightEye}

      {/* Right eye highlight (when not winking) */}
      {mood !== 'wink' && <circle cx={cx + 11.5} cy={cy - 6} r="1" fill="white" />}

      {/* Pink cheeks */}
      <ellipse cx={cx - 14} cy={cy + 4} rx="4" ry="2.5" fill="#FFB3BA" opacity="0.6" />
      <ellipse cx={cx + 14} cy={cy + 4} rx="4" ry="2.5" fill="#FFB3BA" opacity="0.6" />

      {/* Smile */}
      {mood !== 'calm' && (
        <path
          d={`M ${cx - 7} ${cy + 6} Q ${cx} ${cy + 11} ${cx + 7} ${cy + 6}`}
          stroke="#1B2547"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
