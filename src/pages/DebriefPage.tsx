import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import {
  CheckCircleIcon,
  SparklesIcon,
  HeadphonesIcon,
  ArrowRightIcon,
  CoffeeIcon,
  XIcon,
  VolumeIcon,
  TrophyIcon
} from '../theme/icons';

// Types
interface SessionData {
  roleConfig: {
    id: string;
    name: string;
    icon: string;
    scenario: string;
    level: string;
  };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isWhisper?: boolean;
  }>;
  duration: number;
  endTime: string;
}

interface UpgradeData {
  original: string;
  corrected: string;
  explanation: string;
  isFalseFriend: boolean;
}

interface VocabWord {
  word: string;
  used: boolean;
}

// Star rating component
const StarRating = ({ rating, total = 5 }: { rating: number; total?: number }) => (
  <div style={{ display: 'flex', gap: '4px' }}>
    {[...Array(total)].map((_, i) => (
      <span
        key={i}
        style={{
          fontSize: '24px',
          filter: i < rating ? 'none' : 'grayscale(1) opacity(0.3)',
        }}
      >
        ⭐
      </span>
    ))}
  </div>
);

// Outcome header component
const OutcomeHeader = ({ scenario, outcome, stars, icon }: { scenario: string; outcome: string; stars: number; icon?: string }) => (
  <div style={{
    textAlign: 'center',
    padding: 'clamp(20px, 5vw, 32px) clamp(16px, 4vw, 24px)',
    borderBottom: `1px solid ${AppColors.borderColor}`,
  }}>
    {/* Animated icon */}
    <div style={{
      width: 'clamp(70px, 18vw, 100px)',
      height: 'clamp(70px, 18vw, 100px)',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${AppColors.successGreen}33 0%, ${AppColors.accentBlue}22 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      color: AppColors.successGreen,
      animation: 'bounce 1s ease-in-out',
    }}>
      {icon ? <span style={{ fontSize: 'clamp(36px, 10vw, 48px)' }}>{icon}</span> : <CoffeeIcon size={40} />}
    </div>

    {/* Success badge */}
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: 'clamp(5px, 1.5vw, 8px) clamp(10px, 2.5vw, 14px)',
      borderRadius: '20px',
      backgroundColor: 'rgba(74, 222, 128, 0.15)',
      color: AppColors.successGreen,
      fontSize: 'clamp(10px, 2.5vw, 13px)',
      fontWeight: '600',
      marginBottom: '12px',
    }}>
      <CheckCircleIcon size={14} />
      MISSION COMPLETE
    </div>

    {/* Outcome text */}
    <h1 style={{
      margin: '0 0 8px 0',
      fontSize: 'clamp(18px, 5vw, 26px)',
      fontWeight: '700',
      color: AppColors.textPrimary,
      lineHeight: 1.3,
    }}>
      {outcome}
    </h1>

    <p style={{
      margin: '0 0 16px 0',
      fontSize: 'clamp(13px, 3.5vw, 16px)',
      color: AppColors.textSecondary,
    }}>
      {scenario}
    </p>

    {/* Star rating */}
    <StarRating rating={stars} />
  </div>
);

// Golden sentence card
const GoldenSentence = ({ sentence, feedback }: { sentence: string; feedback: string }) => (
  <div style={{
    margin: 'clamp(16px, 4vw, 24px) clamp(12px, 3vw, 20px)',
    padding: 'clamp(16px, 4vw, 24px)',
    borderRadius: '16px',
    background: `linear-gradient(135deg, ${AppColors.accentPurple}22 0%, ${AppColors.accentBlue}22 100%)`,
    border: `1px solid ${AppColors.accentPurple}44`,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
      color: AppColors.whisperAmber,
    }}>
      <SparklesIcon size={18} />
      <span style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '600' }}>Your Best Line</span>
    </div>

    <p style={{
      margin: '0 0 12px 0',
      fontSize: 'clamp(15px, 4vw, 18px)',
      fontWeight: '500',
      color: AppColors.textPrimary,
      lineHeight: 1.5,
    }}>
      "{sentence}"
    </p>

    <p style={{
      margin: 0,
      fontSize: 'clamp(12px, 3vw, 14px)',
      color: AppColors.textSecondary,
      fontStyle: 'italic',
      lineHeight: 1.5,
    }}>
      {feedback}
    </p>

    {/* Play button */}
    <button style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '12px',
      padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 16px)',
      borderRadius: '20px',
      border: 'none',
      backgroundColor: 'rgba(255,255,255,0.1)',
      color: AppColors.accentPurple,
      fontSize: 'clamp(11px, 2.5vw, 13px)',
      fontWeight: '500',
      cursor: 'pointer',
    }}>
      <VolumeIcon size={14} />
      Play Audio
    </button>
  </div>
);

// Upgrade item (correction)
const UpgradeItem = ({ original, corrected, explanation, isFalseFriend }: UpgradeData) => (
  <div style={{
    padding: 'clamp(14px, 3vw, 20px)',
    backgroundColor: AppColors.surfaceMedium,
    borderRadius: '12px',
    marginBottom: '12px',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 'clamp(8px, 2vw, 16px)',
      alignItems: 'flex-start',
      marginBottom: '12px',
    }}>
      {/* Original */}
      <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
        <div style={{
          fontSize: 'clamp(9px, 2.5vw, 11px)',
          fontWeight: '600',
          color: AppColors.errorRose,
          marginBottom: '4px',
          letterSpacing: '0.5px',
        }}>
          YOU SAID
        </div>
        <p style={{
          margin: 0,
          fontSize: 'clamp(13px, 3.5vw, 15px)',
          color: AppColors.textPrimary,
          textDecoration: 'line-through',
          textDecorationColor: AppColors.errorRose,
          opacity: 0.8,
          lineHeight: 1.4,
        }}>
          {original}
        </p>
      </div>

      {/* Arrow - hide on very small screens */}
      <div style={{
        paddingTop: '20px',
        color: AppColors.textSecondary,
        display: 'flex',
        alignItems: 'center',
      }}>
        <ArrowRightIcon />
      </div>

      {/* Corrected */}
      <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
        <div style={{
          fontSize: 'clamp(9px, 2.5vw, 11px)',
          fontWeight: '600',
          color: AppColors.successGreen,
          marginBottom: '4px',
          letterSpacing: '0.5px',
        }}>
          NATIVE SPEAKER
        </div>
        <p style={{
          margin: 0,
          fontSize: 'clamp(13px, 3.5vw, 15px)',
          color: AppColors.successGreen,
          fontWeight: '500',
          lineHeight: 1.4,
        }}>
          {corrected}
        </p>
      </div>
    </div>

    {/* Explanation */}
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: 'clamp(10px, 2.5vw, 14px)',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: '8px',
    }}>
      {isFalseFriend && (
        <span style={{ fontSize: '14px', flexShrink: 0 }}>🇺🇦</span>
      )}
      <p style={{
        margin: 0,
        fontSize: 'clamp(11px, 3vw, 13px)',
        color: AppColors.textSecondary,
        lineHeight: 1.5,
      }}>
        {explanation}
      </p>
    </div>

    {/* Listen button */}
    <button style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '10px',
      padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 14px)',
      borderRadius: '16px',
      border: 'none',
      backgroundColor: 'rgba(255,255,255,0.05)',
      color: AppColors.textSecondary,
      fontSize: 'clamp(10px, 2.5vw, 12px)',
      cursor: 'pointer',
    }}>
      <HeadphonesIcon size={12} />
      Hear Corrected
    </button>
  </div>
);

// Upgrade zone section
const UpgradeZone = ({ upgrades }: { upgrades: UpgradeData[] }) => (
  <div style={{ padding: '0 clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)' }}>
    <h2 style={{
      fontSize: '14px',
      fontWeight: '600',
      color: AppColors.textSecondary,
      margin: '0 0 12px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <TrophyIcon size={16} />
      Upgrades ({upgrades.length})
    </h2>

    {upgrades.map((upgrade, i) => (
      <UpgradeItem
        key={i}
        original={upgrade.original}
        corrected={upgrade.corrected}
        explanation={upgrade.explanation}
        isFalseFriend={upgrade.isFalseFriend}
      />
    ))}
  </div>
);

// Vocabulary tracker
const VocabTracker = ({ words }: { words: VocabWord[] }) => (
  <div style={{
    padding: 'clamp(14px, 3vw, 20px)',
    margin: '0 clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)',
    backgroundColor: AppColors.surfaceMedium,
    borderRadius: '12px',
  }}>
    <h2 style={{
      fontSize: '14px',
      fontWeight: '600',
      color: AppColors.textSecondary,
      margin: '0 0 12px 0',
    }}>
      Target Vocabulary
    </h2>

    <div style={{
      display: 'flex',
      gap: 'clamp(6px, 2vw, 10px)',
      flexWrap: 'wrap',
    }}>
      {words.map((word, i) => (
        <div
          key={i}
          style={{
            padding: 'clamp(6px, 1.5vw, 10px) clamp(10px, 2.5vw, 16px)',
            borderRadius: '20px',
            backgroundColor: word.used ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.05)',
            color: word.used ? AppColors.successGreen : AppColors.textSecondary,
            fontSize: 'clamp(12px, 3vw, 14px)',
            fontWeight: '500',
            border: `1px solid ${word.used ? 'rgba(74, 222, 128, 0.3)' : 'transparent'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {word.used ? '✓' : '○'} {word.word}
        </div>
      ))}
    </div>

    <p style={{
      margin: '12px 0 0 0',
      fontSize: 'clamp(11px, 2.5vw, 13px)',
      color: AppColors.textSecondary,
    }}>
      {words.filter(w => w.used).length} of {words.length} words used
    </p>
  </div>
);

// Hear the Ideal You button
const HearIdealYouButton = () => (
  <button style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: 'calc(100% - clamp(24px, 6vw, 40px))',
    margin: '0 auto clamp(16px, 4vw, 24px)',
    padding: 'clamp(14px, 3vw, 18px) clamp(16px, 4vw, 24px)',
    borderRadius: '16px',
    border: 'none',
    background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
    color: AppColors.textDark,
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(100, 108, 255, 0.3)',
  }}>
    <HeadphonesIcon size={20} />
    Hear My Response Fixed
  </button>
);

// Continue button
const ContinueButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: 'calc(100% - clamp(24px, 6vw, 40px))',
      margin: '0 auto clamp(24px, 5vw, 40px)',
      padding: 'clamp(14px, 3vw, 18px) clamp(16px, 4vw, 24px)',
      borderRadius: '16px',
      border: `2px solid ${AppColors.borderColor}`,
      backgroundColor: 'transparent',
      color: AppColors.textPrimary,
      fontSize: 'clamp(14px, 3.5vw, 16px)',
      fontWeight: '600',
      cursor: 'pointer',
    }}
  >
    Continue Learning
    <ArrowRightIcon size={18} />
  </button>
);

// Stats row
const StatsRow = ({ wordsSpoken, duration, accuracy }: { wordsSpoken: number; duration: string; accuracy: number }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-around',
    padding: 'clamp(14px, 3vw, 20px)',
    margin: '0 clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)',
    backgroundColor: AppColors.surfaceMedium,
    borderRadius: '12px',
  }}>
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: '700', color: AppColors.textPrimary }}>
        {wordsSpoken}
      </div>
      <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: AppColors.textSecondary, marginTop: '4px' }}>
        Words Spoken
      </div>
    </div>
    <div style={{ width: '1px', backgroundColor: AppColors.borderColor }} />
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: '700', color: AppColors.textPrimary }}>
        {duration}
      </div>
      <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: AppColors.textSecondary, marginTop: '4px' }}>
        Duration
      </div>
    </div>
    <div style={{ width: '1px', backgroundColor: AppColors.borderColor }} />
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: '700', color: AppColors.successGreen }}>
        {accuracy}%
      </div>
      <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: AppColors.textSecondary, marginTop: '4px' }}>
        Accuracy
      </div>
    </div>
  </div>
);

export default function DebriefPage() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('lastSession');
    if (stored) {
      setSessionData(JSON.parse(stored));
    }
  }, []);

  // Generate debrief data from session or use defaults
  const getDebriefData = () => {
    if (sessionData) {
      const userMessages = sessionData.messages.filter(m => m.role === 'user');
      const whisperCount = userMessages.filter(m => m.isWhisper).length;
      const wordsSpoken = userMessages.reduce((acc, m) => acc + m.content.split(' ').length, 0);
      const accuracy = Math.max(60, Math.min(98, 100 - (whisperCount * 5)));
      const stars = whisperCount <= 1 ? 5 : whisperCount <= 2 ? 4 : whisperCount <= 3 ? 3 : 2;

      const mins = Math.floor(sessionData.duration / 60);
      const secs = sessionData.duration % 60;
      const duration = `${mins}:${secs.toString().padStart(2, '0')}`;

      return {
        scenario: sessionData.roleConfig.scenario,
        outcome: `You completed: ${sessionData.roleConfig.name}!`,
        icon: sessionData.roleConfig.icon,
        stars,
        wordsSpoken,
        duration,
        accuracy,
        goldenSentence: {
          text: "I would like a medium coffee with oat milk, please.",
          feedback: "Great use of polite language and specific details! You sounded very natural.",
        },
        upgrades: [
          {
            original: "I need to buy a ticket on the train.",
            corrected: "I need to buy a ticket for the train.",
            explanation: "In English, we use 'for' when talking about the purpose or destination. 'On the train' means you're already inside it.",
            isFalseFriend: false,
          },
          {
            original: "Give me the menu.",
            corrected: "Could I please have the menu?",
            explanation: "While grammatically correct, this sounds quite direct. In English-speaking cafés, we typically use softer requests with 'Could I' or 'May I'.",
            isFalseFriend: false,
          },
          {
            original: "I go to magazine after this.",
            corrected: "I'm going to the shop after this.",
            explanation: "False friend alert! 'Магазин' in Ukrainian sounds like 'magazine', but in English 'magazine' is a publication. Use 'shop' or 'store' instead.",
            isFalseFriend: true,
          },
        ],
        vocabulary: [
          { word: "medium", used: true },
          { word: "latte", used: true },
          { word: "receipt", used: false },
          { word: "oat milk", used: true },
        ],
      };
    }

    // Default data when no session
    return {
      scenario: "Ordering at a busy café",
      outcome: "You got the coffee! ☕",
      icon: "☕",
      stars: 4,
      wordsSpoken: 47,
      duration: "2:34",
      accuracy: 87,
      goldenSentence: {
        text: "I would like a medium coffee with oat milk, please.",
        feedback: "Great use of polite language and specific details! You sounded very natural.",
      },
      upgrades: [
        {
          original: "I need to buy a ticket on the train.",
          corrected: "I need to buy a ticket for the train.",
          explanation: "In English, we use 'for' when talking about the purpose or destination. 'On the train' means you're already inside it.",
          isFalseFriend: false,
        },
        {
          original: "Give me the menu.",
          corrected: "Could I please have the menu?",
          explanation: "While grammatically correct, this sounds quite direct. In English-speaking cafés, we typically use softer requests with 'Could I' or 'May I'.",
          isFalseFriend: false,
        },
        {
          original: "I go to magazine after this.",
          corrected: "I'm going to the shop after this.",
          explanation: "False friend alert! 'Магазин' in Ukrainian sounds like 'magazine', but in English 'magazine' is a publication. Use 'shop' or 'store' instead.",
          isFalseFriend: true,
        },
      ],
      vocabulary: [
        { word: "medium", used: true },
        { word: "latte", used: true },
        { word: "receipt", used: false },
        { word: "oat milk", used: true },
      ],
    };
  };

  const debriefData = getDebriefData();

  const handleClose = () => {
    navigate('/roles');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: gradientBackground,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(216, 180, 254, 0.3); border-radius: 4px; }
        @media (min-width: 768px) {
          .debrief-content { max-width: 600px !important; }
          .stats-row { padding: 20px !important; }
          .upgrade-item { padding: 20px !important; }
        }
      `}</style>

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '10px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(255,255,255,0.1)',
          color: AppColors.textSecondary,
          cursor: 'pointer',
          zIndex: 10,
          backdropFilter: 'blur(10px)',
        }}
      >
        <XIcon />
      </button>

      {/* Scrollable content */}
      <div
        className="debrief-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
          paddingBottom: '20px',
        }}>
        {/* Outcome Header */}
        <OutcomeHeader
          scenario={debriefData.scenario}
          outcome={debriefData.outcome}
          stars={debriefData.stars}
          icon={debriefData.icon}
        />

        {/* Stats Row */}
        <StatsRow
          wordsSpoken={debriefData.wordsSpoken}
          duration={debriefData.duration}
          accuracy={debriefData.accuracy}
        />

        {/* Golden Sentence */}
        <GoldenSentence
          sentence={debriefData.goldenSentence.text}
          feedback={debriefData.goldenSentence.feedback}
        />

        {/* Hear the Ideal You */}
        <HearIdealYouButton />

        {/* Upgrade Zone */}
        <UpgradeZone upgrades={debriefData.upgrades} />

        {/* Vocabulary Tracker */}
        <VocabTracker words={debriefData.vocabulary} />

        {/* Continue Button */}
        <ContinueButton onClick={handleClose} />
      </div>
    </div>
  );
}
