import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function AnimatedBackground3D() {
  const { theme } = useTheme()
  const objects = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.15,
    size: Math.random() * 100 + 50,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 80 + 120,
  }))

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        background: theme.bg,
        perspective: '1000px',
      }}
    >
      {/* Base gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${theme.bg} 0%, rgba(13,17,23,0.8) 50%, rgba(6,9,16,0.9) 100%)`,
        }}
      />

      {/* Main 3D rotating sphere */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, rgba(0,212,255,0.4), rgba(0,212,255,0.1) 40%, transparent)`,
          filter: 'blur(60px)',
          animation: 'rotate3d1 200s linear infinite',
          transform: 'translateZ(100px)',
        }}
      />

      {/* Secondary 3D sphere */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 65% 65%, rgba(124,58,237,0.3), rgba(124,58,237,0.05) 50%, transparent)`,
          filter: 'blur(80px)',
          animation: 'rotate3d2 240s linear infinite reverse',
          transform: 'translateZ(150px)',
        }}
      />

      {/* Tertiary accent sphere */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '15%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 70%, rgba(6,182,212,0.25), transparent 60%)`,
          filter: 'blur(40px)',
          animation: 'rotate3d3 220s ease-in-out infinite',
        }}
      />

      {/* Floating 3D cubes */}
      {objects.slice(0, 6).map((obj) => (
        <div
          key={`cube-${obj.id}`}
          style={{
            position: 'absolute',
            left: `${obj.x}%`,
            top: `${obj.y}%`,
            width: `${obj.size}px`,
            height: `${obj.size}px`,
            transformStyle: 'preserve-3d',
            animation: `float3d ${obj.duration}s ease-in-out infinite`,
            animationDelay: `${obj.delay}s`,
            opacity: 0.6,
          }}
        >
          {/* Cube faces */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.05))',
              border: '1px solid rgba(0,212,255,0.3)',
              transform: 'translateZ(' + obj.size / 2 + 'px)',
              backdropFilter: 'blur(10px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.03))',
              border: '1px solid rgba(124,58,237,0.2)',
              transform: 'rotateY(180deg) translateZ(' + obj.size / 2 + 'px)',
              backdropFilter: 'blur(10px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, rgba(6,182,212,0.1), rgba(6,182,212,0.02))',
              border: '1px solid rgba(6,182,212,0.15)',
              transform: 'rotateY(90deg) translateZ(' + obj.size / 2 + 'px)',
              backdropFilter: 'blur(10px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, rgba(6,182,212,0.1), rgba(6,182,212,0.02))',
              border: '1px solid rgba(6,182,212,0.15)',
              transform: 'rotateY(-90deg) translateZ(' + obj.size / 2 + 'px)',
              backdropFilter: 'blur(10px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(0,212,255,0.15), transparent)',
              border: '1px solid rgba(0,212,255,0.25)',
              transform: 'rotateX(90deg) translateZ(' + obj.size / 2 + 'px)',
              backdropFilter: 'blur(10px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent)',
              border: '1px solid rgba(124,58,237,0.15)',
              transform: 'rotateX(-90deg) translateZ(' + obj.size / 2 + 'px)',
              backdropFilter: 'blur(10px)',
            }}
          />
        </div>
      ))}

      {/* Floating 3D particles */}
      {objects.slice(6).map((obj) => (
        <div
          key={`particle-${obj.id}`}
          style={{
            position: 'absolute',
            left: `${obj.x}%`,
            top: `${obj.y}%`,
            width: `${obj.size * 0.4}px`,
            height: `${obj.size * 0.4}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,212,255,0.6), rgba(0,212,255,0.1))`,
            filter: 'blur(20px)',
            boxShadow: `0 0 ${obj.size * 0.3}px rgba(0,212,255,0.4)`,
            animation: `float3d ${obj.duration}s ease-in-out infinite`,
            animationDelay: `${obj.delay}s`,
          }}
        />
      ))}

      {/* Grid overlay (subtle) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(0,212,255,0.02) 25%, rgba(0,212,255,0.02) 26%, transparent 27%, transparent 74%, rgba(0,212,255,0.02) 75%, rgba(0,212,255,0.02) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(0,212,255,0.02) 25%, rgba(0,212,255,0.02) 26%, transparent 27%, transparent 74%, rgba(0,212,255,0.02) 75%, rgba(0,212,255,0.02) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '100px 100px',
          backgroundPosition: '0 0, 0 0',
          animation: 'moveGrid 10s linear infinite',
          opacity: 0.3,
        }}
      />

      <style>{`
        @keyframes rotate3d1 {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateZ(100px); }
          100% { transform: rotateX(180deg) rotateY(180deg) rotateZ(90deg) translateZ(100px); }
        }
        @keyframes rotate3d2 {
          0% { transform: rotateX(0deg) rotateY(0deg) translateZ(150px); }
          100% { transform: rotateX(180deg) rotateY(-180deg) translateZ(150px); }
        }
        @keyframes rotate3d3 {
          0% { transform: rotateX(0deg) rotateZ(0deg); }
          50% { transform: rotateX(90deg) rotateZ(90deg); }
          100% { transform: rotateX(180deg) rotateZ(180deg); }
        }
        @keyframes float3d {
          0%, 100% { transform: translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          25% { transform: translateY(-30px) rotateX(25deg) rotateY(15deg) rotateZ(12deg); }
          50% { transform: translateY(-60px) rotateX(50deg) rotateY(30deg) rotateZ(25deg); }
          75% { transform: translateY(-30px) rotateX(75deg) rotateY(18deg) rotateZ(40deg); }
        }
        @keyframes moveGrid {
          0% { backgroundPosition: 0 0, 0 0; }
          100% { backgroundPosition: 100px 100px, 100px 100px; }
        }
      `}</style>
    </div>
  )
}
