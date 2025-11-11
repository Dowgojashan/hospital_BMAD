import React from 'react';
import './HospitalLogo.css';

interface HospitalLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

const HospitalLogo: React.FC<HospitalLogoProps> = ({ 
  size = 40, 
  showText = true,
  className = '' 
}) => {
  const logoSize = size;
  const crossSize = logoSize * 0.4;
  const wreathSize = logoSize * 0.9;

  return (
    <div className={`hospital-logo-container ${className}`}>
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 100 100"
        className="hospital-logo-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 金色月桂花環 - 更精緻的設計 */}
        <g className="wreath">
          {/* 外圈月桂花環 */}
          <ellipse
            cx="50"
            cy="50"
            rx="38"
            ry="38"
            fill="none"
            stroke="#FFD700"
            strokeWidth="3"
            opacity="0.3"
          />
          {/* 主要月桂花環 */}
          <path
            d="M 50 12 
               C 28 12, 12 28, 12 50
               C 12 72, 28 88, 50 88
               C 72 88, 88 72, 88 50
               C 88 28, 72 12, 50 12 Z"
            fill="#FFD700"
            stroke="#DAA520"
            strokeWidth="1.5"
          />
          {/* 月桂葉裝飾 - 左側 */}
          <path
            d="M 20 35 L 22 30 L 25 32 L 23 37 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          <path
            d="M 18 45 L 20 40 L 23 42 L 21 47 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          <path
            d="M 20 55 L 22 50 L 25 52 L 23 57 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          {/* 月桂葉裝飾 - 右側 */}
          <path
            d="M 80 35 L 78 30 L 75 32 L 77 37 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          <path
            d="M 82 45 L 80 40 L 77 42 L 79 47 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          <path
            d="M 80 55 L 78 50 L 75 52 L 77 57 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          {/* 月桂葉裝飾 - 上方 */}
          <path
            d="M 35 20 L 40 18 L 42 21 L 37 23 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          <path
            d="M 50 15 L 52 12 L 55 14 L 53 17 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          <path
            d="M 65 20 L 60 18 L 58 21 L 63 23 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          {/* 月桂葉裝飾 - 下方 */}
          <path
            d="M 35 80 L 40 82 L 42 79 L 37 77 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          <path
            d="M 50 85 L 52 88 L 55 86 L 53 83 Z"
            fill="#FFA500"
            opacity="0.8"
          />
          <path
            d="M 65 80 L 60 82 L 58 79 L 63 77 Z"
            fill="#FFA500"
            opacity="0.8"
          />
        </g>
        
        {/* 紅色十字架 - 更清晰的設計 */}
        <g className="cross">
          {/* 垂直線 */}
          <rect
            x="45"
            y="30"
            width="10"
            height="40"
            fill="#DC143C"
            rx="1"
          />
          {/* 水平線 */}
          <rect
            x="30"
            y="45"
            width="40"
            height="10"
            fill="#DC143C"
            rx="1"
          />
          {/* 中心正方形（讓十字架更立體） */}
          <rect
            x="45"
            y="45"
            width="10"
            height="10"
            fill="#B22222"
            rx="1"
          />
        </g>
      </svg>
      {showText && (
        <span className="hospital-logo-text">智慧醫療系統</span>
      )}
    </div>
  );
};

export default HospitalLogo;

