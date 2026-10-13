import { useState } from 'react';
export type MascotMood =
  | 'happy'
  | 'thinking'
  | 'excited'
  | 'sleep'
  | 'working'
  | 'encouraging'
  | 'wink'
  | 'calm'
  | 'sleepy'
  | 'worried';

interface BlueMascotProps {
  size?: number; // rendered width in px
  mood?: MascotMood;
  className?: string;
  float?: boolean;
}

const ASPECT = 543 / 640;

function Sparkle({ x, y, s = 10, delay = 0 }: { x: string; y: string; s?: number; delay?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="absolute animate-twinkle"
      style={{ left: x, top: y, width: s, height: s, animationDelay: `${delay}s` }}
      viewBox="0 0 24 24"
    >
      <path d="M12 0l2.7 9.3L24 12l-9.3 2.7L12 24l-2.7-9.3L0 12l9.3-2.7z" fill="#FDE68A" />
    </svg>
  );
}

function Badge({ children, size }: { children: React.ReactNode; size: number }) {
  const d = Math.max(16, Math.round(size * 0.3));
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-white shadow-card text-blue-500 font-bold"
      style={{ width: d, height: d, fontSize: d * 0.6 }}
    >
      {children}
    </span>
  );
}

const BODY: Record<MascotMood, string> = {
  happy: 'blue-bob',
  wink: 'blue-bob',
  calm: 'blue-breathe',
  excited: 'blue-hop',
  thinking: 'blue-tilt',
  working: 'blue-type',
  encouraging: 'blue-pulse',
  sleep: 'blue-breathe-slow',
  sleepy: 'blue-nod',
  worried: 'blue-shiver',
};

// Eye boxes (top-left, size) as % of the image (measured from blue.png)
const EYES = [
  { l: 28.5, t: 42.5, w: 19.5, h: 24.5, id: 'l' },
  { l: 54.5, t: 35.5, w: 21.5, h: 21.5, id: 'r' },
];

function Eyelids({ mood }: { mood: MascotMood }) {
  const closed = mood === 'sleep';
  return (
    <>
      {EYES.map((e) => {
        const winking = mood === 'wink' && e.id === 'r';
        const droopy = mood === 'sleepy';
        const cls = closed ? '' : droopy ? 'blue-droop' : winking ? 'blue-wink' : mood === 'wink' ? '' : 'blue-blink';
        if (!closed && !cls) return null;
        return (
          <span
            key={e.id}
            aria-hidden="true"
            className={`absolute rounded-[50%] ${cls}`}
            style={{
              left: `${e.l}%`, top: `${e.t}%`, width: `${e.w}%`, height: `${e.h}%`,
              background: 'radial-gradient(circle at 50% 30%, #6C9BF7, #3F73E8)',
              borderBottom: '3px solid #1B2D63', transformOrigin: 'top', transform: closed ? 'scaleY(.9)' : 'scaleY(0)',
            }}
          />
        );
      })}
    </>
  );
}

const FACE_PATCH = 'radial-gradient(ellipse at 50% 50%, #6A9CEF 0%, #6A9CEF 62%, rgba(106,156,239,0) 100%)';

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === 'happy' || mood === 'wink' || mood === 'calm' || mood === 'sleep' || mood === 'thinking' || mood === 'working') {
    if (mood !== 'calm' && mood !== 'sleep') return null;
  }
  const stroke = { fill: 'none', stroke: '#1B2D63', strokeWidth: 4, strokeLinecap: 'round' as const };
  let shape: React.ReactNode = null;
  if (mood === 'excited') shape = <><path d="M8 12 Q30 8 52 12 Q50 44 30 44 Q10 44 8 12Z" fill="#1B2D63" /><ellipse cx="30" cy="38" rx="11" ry="6" fill="#FF7FA6" /></>;
  else if (mood === 'encouraging') shape = <path d="M10 18 Q30 40 50 18" {...stroke} />;
  else if (mood === 'worried') shape = <path className="blue-quiver" d="M10 38 Q20 26 30 34 Q40 42 50 30" {...stroke} />;
  else if (mood === 'sleepy') shape = <ellipse className="blue-yawn" cx="30" cy="28" rx="9" ry="11" fill="#1B2D63" />;
  else if (mood === 'calm') shape = <path d="M14 22 Q30 34 46 22" {...stroke} />;
  else if (mood === 'sleep') shape = <path d="M18 26 Q30 32 42 26" {...stroke} strokeWidth={3} />;
  return (
    <>
      <span aria-hidden="true" className="absolute rounded-full" style={{ left: '47.5%', top: '55%', width: '14%', height: '13%', background: FACE_PATCH }} />
      <svg aria-hidden="true" viewBox="0 0 60 50" className="absolute" style={{ left: '48%', top: '55.5%', width: '13%' }}>{shape}</svg>
    </>
  );
}

function Brows({ mood }: { mood: MascotMood }) {
  if (mood !== 'worried' && mood !== 'sleepy' && mood !== 'excited' && mood !== 'encouraging') return null;
  const d = mood === 'worried'
    ? [{ l: 29, t: 37, r: -16 }, { l: 56, t: 30, r: 16 }]
    : mood === 'sleepy'
      ? [{ l: 29, t: 40, r: 8 }, { l: 56, t: 33, r: -8 }]
      : [{ l: 29, t: 36, r: -8 }, { l: 56, t: 29, r: 8 }];
  return (
    <>
      {d.map((b, i) => (
        <span key={i} aria-hidden="true" className={mood === 'excited' ? 'absolute blue-brow-up' : 'absolute'}
          style={{ left: `${b.l}%`, top: `${b.t}%`, width: '16%', height: '3.2%', borderRadius: 99, background: '#1B2D63', transform: `rotate(${b.r}deg)`, ['--r' as string]: `${b.r}deg` } as React.CSSProperties} />
      ))}
    </>
  );
}

function Glints({ show, size }: { show: boolean; size: number }) {
  if (!show) return null;
  const pos = [{ l: 33, t: 52 }, { l: 58, t: 42 }];
  return (
    <>
      {pos.map((p, i) => (
        <svg key={i} aria-hidden="true" viewBox="0 0 24 24" className="absolute animate-twinkle" style={{ left: `${p.l}%`, top: `${p.t}%`, width: Math.max(8, size * 0.1), animationDelay: `${i * .5}s` }}>
          <path d="M12 0l2.7 9.3L24 12l-9.3 2.7L12 24l-2.7-9.3L0 12l9.3-2.7z" fill="#fff" />
        </svg>
      ))}
    </>
  );
}

function Cheeks({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <>
      {[{ l: 33, t: 70 }, { l: 62, t: 62 }].map((c, i) => (
        <span key={i} aria-hidden="true" className="absolute rounded-full blue-blush"
          style={{ left: `${c.l}%`, top: `${c.t}%`, width: '9%', height: '5%', background: '#FF8FB8', filter: 'blur(2px)' }} />
      ))}
    </>
  );
}

export default function BlueMascot({ size = 56, mood = 'happy', className = '', float = false }: BlueMascotProps) {
  const h = Math.round(size * ASPECT);
  const sleeping = mood === 'sleep';
  const [hearts, setHearts] = useState<number[]>([]);
  const [tick, setTick] = useState(0);
  const pet = () => {
    if (sleeping) return;
    const id = Date.now();
    setTick((t) => t + 1);
    setHearts((hs) => [...hs.slice(-4), id]);
    setTimeout(() => setHearts((hs) => hs.filter((x) => x !== id)), 1200);
  };
  const label = mood === 'wink' || mood === 'calm' ? 'happy' : mood;

  return (
    <span
      className={`relative inline-block flex-shrink-0 ${float ? 'animate-float' : ''} ${className}`}
      style={{ width: size, height: h }}
      role="img"
      aria-label={`Blue mascot, ${label}`}
      onMouseEnter={pet}
    >
      <span key={tick} className={`absolute inset-0 blue-body ${BODY[mood]} ${tick ? 'blue-wiggle' : ''}`}>
      <span className="blue-glow absolute inset-0" style={{ filter: sleeping ? undefined : undefined }}>
      <img
        src="/blue.png"
        alt=""
        draggable={false}
        width={size}
        height={h}
        className="block w-full h-full select-none"
        style={sleeping ? { filter: 'saturate(0.55) brightness(0.82)' } : undefined}
      />
      <Eyelids mood={mood} />
      <Mouth mood={mood} />
      <Brows mood={mood} />
      <Glints show={mood === 'excited'} size={size} />
      <Cheeks show={mood !== 'sleep' && mood !== 'thinking' && mood !== 'worried'} />
      </span>
      </span>
      {hearts.map((id, i) => (
        <span key={id} aria-hidden="true" className="absolute blue-heart pointer-events-none"
          style={{ left: `${30 + ((i * 23) % 40)}%`, top: '10%', fontSize: Math.max(10, size * 0.2) }}>💙</span>
      ))}
      {mood === 'worried' && <span aria-hidden="true" className="absolute blue-sweat" style={{ right: '4%', top: '18%', fontSize: Math.max(10, size * 0.2) }}>💧</span>}
      {mood === 'sleepy' && <span aria-hidden="true" className="absolute font-bold text-blue-500 blue-zzz" style={{ top: -size * 0.06, right: 0, fontSize: Math.max(10, size * 0.18) }}>z</span>}
      {mood === 'encouraging' && [0, 1, 2].map((k) => <span key={k} aria-hidden="true" className="absolute blue-heart pointer-events-none" style={{ left: `${25 + k * 25}%`, top: '8%', fontSize: Math.max(9, size * 0.15), animationDelay: `${k * .8}s`, animationIterationCount: 'infinite' }}>💙</span>)}
      {mood === 'thinking' && (
        <span aria-hidden="true" className="absolute flex gap-0.5" style={{ left: '2%', top: '2%' }}>
          {[0, 1, 2].map((d) => <span key={d} className="blue-dot rounded-full bg-blue-500" style={{ width: Math.max(3, size * 0.06), height: Math.max(3, size * 0.06), animationDelay: `${d * 0.2}s` }} />)}
        </span>
      )}

      {mood === 'thinking' && <Badge size={size}>?</Badge>}
      {mood === 'encouraging' && <Badge size={size}>💙</Badge>}
      {sleeping && (
        <span
          aria-hidden="true"
          className="absolute -top-2 right-0 font-bold text-blue-500 blue-zzz"
          style={{ fontSize: Math.max(10, size * 0.2) }}
        >
          zZz
        </span>
      )}
      {mood === 'excited' && (
        <>
          <Sparkle x="-6%" y="8%" s={Math.max(10, size * 0.16)} />
          <Sparkle x="92%" y="2%" s={Math.max(8, size * 0.12)} delay={0.4} />
          <Sparkle x="96%" y="62%" s={Math.max(8, size * 0.14)} delay={0.8} />
          <Sparkle x="-4%" y="68%" s={Math.max(8, size * 0.1)} delay={1.2} />
        </>
      )}
      {mood === 'working' && (
        <svg
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: -size * 0.04, width: size * 0.5 }}
          viewBox="0 0 60 36"
        >
          <rect x="8" y="2" width="44" height="24" rx="3" fill="#1B2D63" />
          <rect x="11" y="5" width="38" height="18" rx="2" fill="#6FA0FF" />
          <rect x="2" y="26" width="56" height="5" rx="2.5" fill="#CBD5F5" />
        </svg>
      )}
    </span>
  );
}
