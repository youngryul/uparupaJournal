interface AxolotlCharacterProps {
  emotion: string;
  size?: "sm" | "md" | "lg";
}

export function AxolotlCharacter({ emotion, size = "md" }: AxolotlCharacterProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  const getEmotionColor = (emotion: string) => {
    const colors = {
      'happy': 'pink-soft',
      'sad': 'sky-light',
      'angry': 'coral-soft',
      'peaceful': 'mint-soft',
      'excited': 'peach-soft'
    };
    return colors[emotion as keyof typeof colors] || 'sky-light';
  };

  const getAxolotlSvg = (emotion: string) => {
    const baseColor = getEmotionColor(emotion);
    
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Body */}
        <ellipse cx="50" cy="60" rx="35" ry="25" className={`fill-${baseColor}`} />
        
        {/* Head */}
        <circle cx="50" cy="35" r="25" className={`fill-${baseColor}`} />
        
        {/* Gills */}
        <path d="M20 25 L10 20 L15 30 Z" className={`fill-${baseColor}`} />
        <path d="M20 35 L10 40 L15 30 Z" className={`fill-${baseColor}`} />
        <path d="M80 25 L90 20 L85 30 Z" className={`fill-${baseColor}`} />
        <path d="M80 35 L90 40 L85 30 Z" className={`fill-${baseColor}`} />
        
        {/* Eyes */}
        <circle cx="42" cy="30" r="3" fill="black" />
        <circle cx="58" cy="30" r="3" fill="black" />
        
        {/* Mouth based on emotion */}
        {emotion === 'happy' && (
          <path d="M42 40 Q50 48 58 40" stroke="black" strokeWidth="2" fill="none" />
        )}
        {emotion === 'sad' && (
          <path d="M42 45 Q50 37 58 45" stroke="black" strokeWidth="2" fill="none" />
        )}
        {emotion === 'angry' && (
          <path d="M42 42 L58 42" stroke="black" strokeWidth="2" />
        )}
        {emotion === 'peaceful' && (
          <path d="M42 42 Q50 45 58 42" stroke="black" strokeWidth="2" fill="none" />
        )}
        {emotion === 'excited' && (
          <ellipse cx="50" cy="42" rx="8" ry="4" fill="black" />
        )}
        
        {/* Legs */}
        <ellipse cx="35" cy="75" rx="8" ry="12" className={`fill-${baseColor}`} />
        <ellipse cx="65" cy="75" rx="8" ry="12" className={`fill-${baseColor}`} />
        
        {/* Arms */}
        <ellipse cx="25" cy="55" rx="12" ry="8" className={`fill-${baseColor}`} />
        <ellipse cx="75" cy="55" rx="12" ry="8" className={`fill-${baseColor}`} />
        
        {/* Tail */}
        <ellipse cx="50" cy="85" rx="15" ry="8" className={`fill-${baseColor}`} />
      </svg>
    );
  };

  return (
    <div className={`${sizeClasses[size]} mx-auto mb-2 bg-${getEmotionColor(emotion)}/30 rounded-full flex items-center justify-center`}>
      {getAxolotlSvg(emotion)}
    </div>
  );
}
