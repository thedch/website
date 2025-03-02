import React, { useState } from 'react';

const HoverAvatar: React.FC = () => {
  const [effectIndex, setEffectIndex] = useState(0);

  const effects = [
    { transform: 'rotate(0deg)' }, // Normal
    { transform: 'rotate(180deg)' }, // Upside down
  ];

  const handleClick = () => {
    const newIndex = (effectIndex + 1) % effects.length;
    setEffectIndex(newIndex);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '25%',
        float: 'right',
        marginLeft: '1rem',
        marginBottom: '1.5rem',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      <img
        src="/avatar.webp"
        style={{
          borderRadius: '50%',
          width: '100%',
          transition: 'transform 0.3s ease',
          ...effects[effectIndex]
        }}
        alt="Avatar"
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: '#666',
          whiteSpace: 'nowrap',
        }}
      >
        click me!
      </div>
    </div>
  );
};

export default HoverAvatar;