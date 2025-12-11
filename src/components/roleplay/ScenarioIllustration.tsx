import { AppColors } from '../../theme/colors';

interface ScenarioIllustrationProps {
  type: string;
}

export function ScenarioIllustration({ type }: ScenarioIllustrationProps) {
  // SVG illustrations based on scenario type
  const renderIllustration = () => {
    switch (type) {
      case 'interview':
      case 'skills':
        return (
          <svg viewBox="0 0 300 200" style={{ width: '256px', height: '176px' }}>
            {/* Clipboard */}
            <rect x="140" y="20" width="100" height="130" rx="8" fill={AppColors.accent} />
            <rect x="170" y="10" width="40" height="20" rx="4" fill={AppColors.accentPurple} />
            <rect x="150" y="40" width="80" height="100" rx="4" fill="white" />

            {/* Photo on clipboard */}
            <rect x="160" y="50" width="35" height="40" rx="2" fill={AppColors.accentBlue} opacity="0.3" />
            <circle cx="177" cy="62" r="8" fill={AppColors.warning} />
            <path d="M165 85 Q177 75 190 85 L190 90 L165 90 Z" fill={AppColors.accent} />

            {/* Lines on clipboard */}
            <rect x="200" y="55" width="25" height="4" rx="2" fill={AppColors.borderColor} />
            <rect x="200" y="65" width="20" height="4" rx="2" fill={AppColors.borderColor} />
            <rect x="200" y="75" width="25" height="4" rx="2" fill={AppColors.borderColor} />
            <rect x="160" y="100" width="60" height="4" rx="2" fill={AppColors.borderColor} />
            <rect x="160" y="112" width="50" height="4" rx="2" fill={AppColors.borderColor} />
            <rect x="160" y="124" width="55" height="4" rx="2" fill={AppColors.borderColor} />

            {/* Person figure */}
            <circle cx="100" cy="70" r="20" fill={AppColors.bgElevated} />
            <circle cx="100" cy="72" r="16" fill="#FECACA" />
            <ellipse cx="100" cy="120" rx="25" ry="30" fill={AppColors.accent} />
            <path d="M75 150 L80 180 L90 180 L95 150" fill={AppColors.bgElevated} />
            <path d="M105 150 L110 180 L120 180 L125 150" fill={AppColors.bgElevated} />
            <ellipse cx="80" cy="182" rx="8" ry="4" fill={AppColors.bgElevated} />
            <ellipse cx="120" cy="182" rx="8" ry="4" fill={AppColors.bgElevated} />

            {/* Plant */}
            <rect x="250" y="150" width="30" height="35" rx="4" fill={AppColors.borderColor} />
            <ellipse cx="265" cy="145" rx="20" ry="15" fill={AppColors.success} />
            <ellipse cx="255" cy="135" rx="10" ry="8" fill={AppColors.success} />
            <ellipse cx="275" cy="138" rx="8" ry="6" fill={AppColors.success} />

            {/* Decorative circles */}
            <circle cx="60" cy="100" r="8" fill="none" stroke={AppColors.borderColor} strokeWidth="2" />
            <circle cx="50" cy="130" r="5" fill="none" stroke={AppColors.borderColor} strokeWidth="2" />
          </svg>
        );

      case 'restaurant':
      case 'restaurant-order':
        return (
          <svg viewBox="0 0 300 200" style={{ width: '256px', height: '176px' }}>
            {/* Table */}
            <ellipse cx="150" cy="170" rx="100" ry="20" fill={AppColors.bgElevated} />
            <rect x="60" y="100" width="180" height="70" rx="8" fill={AppColors.bgTertiary} />

            {/* Plate */}
            <ellipse cx="150" cy="110" rx="50" ry="15" fill="white" />
            <ellipse cx="150" cy="108" rx="40" ry="12" fill={AppColors.borderColor} opacity="0.3" />

            {/* Food on plate */}
            <ellipse cx="150" cy="105" rx="25" ry="8" fill={AppColors.warning} />
            <circle cx="140" cy="103" r="5" fill={AppColors.success} />
            <circle cx="160" cy="103" r="5" fill={AppColors.error} />

            {/* Wine glass */}
            <path d="M220 80 L230 80 L228 100 L225 105 L225 130 L220 132 L230 132 L225 130 L225 105 L222 100 Z" fill="white" opacity="0.8" />
            <ellipse cx="225" cy="90" rx="8" ry="5" fill={AppColors.error} opacity="0.5" />

            {/* Menu */}
            <rect x="60" y="60" width="40" height="55" rx="4" fill={AppColors.accent} />
            <rect x="65" y="70" width="30" height="4" rx="2" fill="white" opacity="0.5" />
            <rect x="65" y="80" width="25" height="3" rx="1" fill="white" opacity="0.3" />
            <rect x="65" y="88" width="28" height="3" rx="1" fill="white" opacity="0.3" />

            {/* Decorative elements */}
            <circle cx="250" cy="60" r="15" fill={AppColors.accentMuted} />
            <text x="245" y="66" fontSize="20">🍽️</text>
          </svg>
        );

      case 'travel':
      case 'hotel':
        return (
          <svg viewBox="0 0 300 200" style={{ width: '256px', height: '176px' }}>
            {/* Airplane */}
            <path d="M80 100 L120 80 L200 90 L220 85 L225 90 L200 95 L120 100 L80 120 Z" fill={AppColors.accent} />
            <path d="M160 95 L170 60 L175 60 L170 95" fill={AppColors.accentPurple} />
            <path d="M100 105 L110 125 L115 125 L108 105" fill={AppColors.accentPurple} />
            <circle cx="90" cy="105" r="3" fill={AppColors.bgElevated} />

            {/* Clouds */}
            <ellipse cx="250" cy="50" rx="30" ry="15" fill="white" opacity="0.6" />
            <ellipse cx="270" cy="55" rx="20" ry="10" fill="white" opacity="0.6" />
            <ellipse cx="60" cy="140" rx="25" ry="12" fill="white" opacity="0.4" />
            <ellipse cx="45" cy="145" rx="15" ry="8" fill="white" opacity="0.4" />

            {/* Suitcase */}
            <rect x="200" y="130" width="60" height="50" rx="6" fill={AppColors.accentBlue} />
            <rect x="215" y="125" width="30" height="10" rx="3" fill={AppColors.bgElevated} />
            <rect x="210" y="145" width="40" height="4" rx="2" fill="white" opacity="0.5" />
            <rect x="210" y="155" width="40" height="4" rx="2" fill="white" opacity="0.5" />

            {/* Passport */}
            <rect x="40" y="150" width="35" height="45" rx="3" fill={AppColors.success} />
            <rect x="45" y="160" width="25" height="20" rx="2" fill="white" opacity="0.3" />

            {/* Decorative */}
            <circle cx="150" cy="170" r="8" fill="none" stroke={AppColors.borderColor} strokeWidth="2" />
          </svg>
        );

      case 'shopping':
        return (
          <svg viewBox="0 0 300 200" style={{ width: '256px', height: '176px' }}>
            {/* Shopping bags */}
            <rect x="80" y="80" width="60" height="80" rx="4" fill={AppColors.accent} />
            <path d="M95 80 L95 65 Q110 50 125 65 L125 80" fill="none" stroke={AppColors.accentPurple} strokeWidth="4" />

            <rect x="160" y="100" width="50" height="65" rx="4" fill={AppColors.accentBlue} />
            <path d="M172 100 L172 88 Q185 75 198 88 L198 100" fill="none" stroke={AppColors.bgElevated} strokeWidth="3" />

            {/* Small bag */}
            <rect x="220" y="120" width="35" height="45" rx="3" fill={AppColors.success} />
            <path d="M228 120 L228 112 Q237 105 246 112 L246 120" fill="none" stroke={AppColors.bgElevated} strokeWidth="2" />

            {/* Price tags */}
            <circle cx="140" cy="90" r="12" fill={AppColors.warning} />
            <text x="135" y="95" fontSize="12" fill={AppColors.bgPrimary} fontWeight="bold">$</text>

            {/* Decorative */}
            <circle cx="50" cy="100" r="20" fill={AppColors.accentMuted} />
            <text x="42" y="108" fontSize="24">🛍️</text>
          </svg>
        );

      case 'social':
      case 'neighbour':
      case 'date':
        return (
          <svg viewBox="0 0 300 200" style={{ width: '256px', height: '176px' }}>
            {/* Two people */}
            {/* Person 1 */}
            <circle cx="100" cy="70" r="25" fill={AppColors.bgElevated} />
            <circle cx="100" cy="72" r="20" fill="#FECACA" />
            <ellipse cx="100" cy="130" rx="30" ry="40" fill={AppColors.accent} />

            {/* Person 2 */}
            <circle cx="200" cy="70" r="25" fill={AppColors.bgElevated} />
            <circle cx="200" cy="72" r="20" fill="#FDE68A" />
            <ellipse cx="200" cy="130" rx="30" ry="40" fill={AppColors.accentBlue} />

            {/* Speech bubbles */}
            <ellipse cx="140" cy="40" rx="25" ry="15" fill="white" />
            <path d="M125 50 L115 60 L135 55" fill="white" />

            <ellipse cx="170" cy="50" rx="20" ry="12" fill={AppColors.accentMuted} />
            <path d="M180 58 L190 65 L175 60" fill={AppColors.accentMuted} />

            {/* Coffee cups */}
            <rect x="135" y="140" width="30" height="35" rx="4" fill="white" />
            <ellipse cx="150" cy="145" rx="12" ry="5" fill={AppColors.warning} opacity="0.5" />
            <path d="M165 150 Q175 155 165 165" fill="none" stroke="white" strokeWidth="3" />

            {/* Decorative */}
            <circle cx="50" cy="150" r="15" fill={AppColors.accentMuted} />
            <circle cx="250" cy="100" r="10" fill={AppColors.successMuted} />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 300 200" style={{ width: '256px', height: '176px' }}>
            {/* Generic roleplay illustration */}
            <circle cx="150" cy="100" r="60" fill={AppColors.accentMuted} />
            <text x="125" y="115" fontSize="48">🎭</text>

            {/* Decorative circles */}
            <circle cx="60" cy="60" r="20" fill={AppColors.accent} opacity="0.3" />
            <circle cx="240" cy="140" r="25" fill={AppColors.accentBlue} opacity="0.3" />
            <circle cx="80" cy="160" r="15" fill={AppColors.success} opacity="0.3" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${AppColors.accentMuted} 0%, ${AppColors.bgSecondary} 100%)`,
        padding: '32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {renderIllustration()}
    </div>
  );
}
