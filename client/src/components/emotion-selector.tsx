import happyImg from '../asset/happy.png';
import sadImg from '../asset/sad.png';
import angryImg from '../asset/angry.png';
import peaceImg from '../asset/peace.png';
import sosoImg from '../asset/soso.png';

interface EmotionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const emotions = [
  { id: "happy", label: "행복해요", color: "pink-soft", img: happyImg},
  { id: "sad", label: "슬퍼요", color: "sky-light", img: sadImg },
  { id: "angry", label: "화나요", color: "coral-soft", img: angryImg },
  { id: "peaceful", label: "평온해요", color: "mint-soft", img: peaceImg },
  { id: "excited", label: "그냥 그래", color: "peach-soft", img: sosoImg },
];

export function EmotionSelector({ value, onChange }: EmotionSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {emotions.map((emotion) => (
        <div
          key={emotion.id}
          onClick={() => onChange(emotion.id)}
          className={`
            emotion-card bg-${emotion.color}/20 border-2 border-${emotion.color}/50 
            rounded-2xl p-4 text-center hover:bg-${emotion.color}/30 
            transition-all cursor-pointer hover:scale-105
            ${value === emotion.id ? 'ring-4 ring-sky-400' : ''}
          `}
        >
          <img src={emotion.img}/>
          <p className="text-sm font-medium mt-2" style={{ color: `var(--${emotion.color})` }}>
            {emotion.label}
          </p>
        </div>
      ))}
    </div>
  );
}
