import React from 'react';
import './HoverAvatar.css';

const HoverAvatar: React.FC = () => {
  return (
    <a
      href="https://x.com/nearlydaniel"
      target="_blank"
      rel="noopener noreferrer"
      className="hover-avatar-container"
    >
      <img
        src="/avatar.webp"
        className="hover-avatar"
        alt="Avatar"
      />
    </a>
  );
};

export default HoverAvatar;