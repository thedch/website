import React, { useState, useEffect, useRef } from 'react';

const HoverAvatar: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarRef.current || !isHovering) return;

      const rect = avatarRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const tiltX = (y - 0.5) * 90;
      const tiltY = (x - 0.5) * -90;

      avatarRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = () => {
      if (avatarRef.current) {
        avatarRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      handleMouseLeave();
    };
  }, [isHovering]);

  return (
    <div
      ref={avatarRef}
      style={{
        position: 'relative',
        width: '25%',
        float: 'right',
        marginLeft: '1rem',
        marginBottom: isTouchDevice ? '2.5rem' : '1.5rem',
        transition: 'transform 0.1s ease',
        transformStyle: 'preserve-3d',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (avatarRef.current) {
          avatarRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        }
      }}
    >
      <img
        src="/avatar.jpeg"
        style={{
          borderRadius: '50%',
          width: '100%',
          boxShadow: isHovering ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none',
          transition: 'box-shadow 0.3s ease',
        }}
        alt="Avatar"
      />
      <div
        style={{
          position: 'absolute',
          bottom: isTouchDevice ? '-25px' : '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: '#666',
          opacity: isHovering ? 0 : 1,
          transition: 'opacity 0.3s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {isTouchDevice ? 'tap me!' : 'hover me!'}
      </div>
    </div>
  );
};

export default HoverAvatar;