import React, { useState } from 'react';

// Color system matching your existing app
const AppColors = {
  // Gradient stops
  gradientStart: '#1e3a8a', // blue-900
  gradientMid: '#5b21b6',   // violet-900
  gradientEnd: '#1e1b4b',   // indigo-950
  
  // Surface colors
  surfaceLight: 'rgba(255, 255, 255, 0.1)',
  surfaceMedium: 'rgba(99, 102, 241, 0.2)', // indigo-500/20
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#d8b4fe', // purple-300
  textDark: '#1e1b4b',      // indigo-950
  
  // Accent colors
  accentPurple: '#d8b4fe',  // purple-300
  accentBlue: '#60a5fa',    // blue-400
  successGreen: '#4ade80',  // green-400
  whisperAmber: '#fbbf24',  // amber-400
  errorRose: '#f87171',     // red-400
  
  // Border
  borderColor: 'rgba(129, 140, 248, 0.3)', // indigo-400/30
};

// Icons
const MicIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);

const LanguagesIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 8 6 6"/>
    <path d="m4 14 6-6 2-3"/>
    <path d="M2 5h12"/>
    <path d="M7 2h1"/>
    <path d="m22 22-5-10-5 10"/>
    <path d="M14 18h6"/>
  </svg>
);

const RotateCcwIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);

const SnailIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0"/>
    <circle cx="10" cy="13" r="8"/>
    <path d="M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6"/>
    <path d="M18 3 19.1 5.2"/>
    <path d="M22 3 20.9 5.2"/>
  </svg>
);

const HelpCircleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <path d="M12 17h.01"/>
  </svg>
);

const SettingsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const XIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const CoffeeIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
    <line x1="6" x2="6" y1="2" y2="4"/>
    <line x1="10" x2="10" y1="2" y2="4"/>
    <line x1="14" x2="14" y1="2" y2="4"/>
  </svg>
);

// Icon button styles
const iconButtonStyle = {
  padding: '6px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'rgba(30, 27, 75, 0.2)',
  color: AppColors.textDark,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const iconButtonStyleLight = {
  padding: '6px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'transparent',
  color: AppColors.accentPurple,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// Chat bubble component
const ChatBubble = ({ message, isUser, isWhisper, onTranslate, onReplay, onSlowPlay, translation }) => {
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{
          background: isWhisper 
            ? `linear-gradient(135deg, ${AppColors.whisperAmber} 0%, #f59e0b 100%)`
            : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
          color: AppColors.textDark,
          padding: '12px 16px',
          borderRadius: '20px 20px 4px 20px',
          maxWidth: '80%',
          fontSize: '15px',
          lineHeight: '1.5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {isWhisper && (
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
              🇺🇦 Asked in Ukrainian
            </div>
          )}
          <p style={{ margin: 0 }}>{message}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={onReplay} style={iconButtonStyle}>
              <RotateCcwIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
      <div style={{
        backgroundColor: isWhisper ? 'rgba(251, 191, 36, 0.15)' : AppColors.surfaceMedium,
        borderLeft: `3px solid ${isWhisper ? AppColors.whisperAmber : AppColors.accentPurple}`,
        color: AppColors.textPrimary,
        padding: '12px 16px',
        borderRadius: '4px 20px 20px 20px',
        maxWidth: '80%',
        fontSize: '15px',
        lineHeight: '1.5',
        backdropFilter: 'blur(8px)',
      }}>
        {isWhisper && (
          <div style={{ 
            fontSize: '11px', 
            color: AppColors.whisperAmber, 
            marginBottom: '6px',
            fontWeight: '500'
          }}>
            🇺🇦 Tutor Mode
          </div>
        )}
        <p style={{ margin: 0 }}>{message}</p>
        {translation && (
          <p style={{ 
            margin: '8px 0 0 0', 
            fontSize: '13px', 
            opacity: 0.8, 
            fontStyle: 'italic',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '8px'
          }}>
            {translation}
          </p>
        )}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button onClick={onTranslate} style={iconButtonStyleLight} title="Translate">
            <LanguagesIcon size={16} />
          </button>
          <button onClick={onReplay} style={iconButtonStyleLight} title="Replay">
            <RotateCcwIcon size={16} />
          </button>
          <button onClick={onSlowPlay} style={iconButtonStyleLight} title="Slow playback">
            <SnailIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Scenario header
const ScenarioHeader = ({ scenario, tone, progress }) => (
  <div style={{
    padding: '16px',
    borderBottom: `1px solid ${AppColors.borderColor}`,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: AppColors.accentPurple,
      }}>
        <CoffeeIcon />
      </div>
      <div style={{ flex: 1 }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '18px', 
          fontWeight: '600',
          color: AppColors.textPrimary,
        }}>
          {scenario}
        </h1>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '4px',
          fontSize: '12px',
          color: AppColors.textSecondary,
        }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: AppColors.successGreen 
          }}/>
          {tone} • Level B1
        </div>
      </div>
      <button style={{
        padding: '8px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'transparent',
        color: AppColors.textSecondary,
        cursor: 'pointer',
      }}>
        <SettingsIcon />
      </button>
      <button style={{
        padding: '8px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'transparent',
        color: AppColors.textSecondary,
        cursor: 'pointer',
      }}>
        <XIcon />
      </button>
    </div>
    
    {/* Progress bar */}
    <div style={{
      width: '100%',
      height: '6px',
      backgroundColor: AppColors.surfaceMedium,
      borderRadius: '999px',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        backgroundColor: AppColors.successGreen,
        borderRadius: '999px',
        transition: 'width 0.3s ease',
      }}/>
    </div>
  </div>
);

// Vocab tracker
const VocabTracker = ({ words }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    flexWrap: 'wrap',
  }}>
    <span style={{ fontSize: '12px', color: AppColors.textSecondary }}>Target vocab:</span>
    {words.map((v, i) => (
      <span key={i} style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: v.used ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.1)',
        color: v.used ? AppColors.successGreen : AppColors.textSecondary,
        border: `1px solid ${v.used ? 'rgba(74, 222, 128, 0.3)' : 'transparent'}`,
      }}>
        {v.word} {v.used && '✓'}
      </span>
    ))}
  </div>
);

// Main mic button (center)
const MicButton = ({ isRecording, isWhisperMode, onPress }) => {
  const activeColor = isWhisperMode ? AppColors.whisperAmber : AppColors.accentPurple;
  
  return (
    <button
      onClick={onPress}
      style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        border: 'none',
        background: isRecording 
          ? `linear-gradient(135deg, ${activeColor} 0%, ${isWhisperMode ? '#f59e0b' : AppColors.accentBlue} 100%)`
          : 'rgba(255,255,255,0.1)',
        color: isRecording ? AppColors.textDark : activeColor,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        boxShadow: isRecording 
          ? `0 0 0 4px ${activeColor}44, 0 0 24px ${activeColor}66` 
          : '0 4px 16px rgba(0,0,0,0.2)',
        animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }}
    >
      <MicIcon size={28} />
    </button>
  );
};

// Whisper button (left) - hold to ask in Ukrainian
const WhisperButton = ({ isActive, onPressStart, onPressEnd }) => (
  <button
    onMouseDown={onPressStart}
    onMouseUp={onPressEnd}
    onMouseLeave={onPressEnd}
    onTouchStart={onPressStart}
    onTouchEnd={onPressEnd}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      width: '72px',
      height: '72px',
      borderRadius: '20px',
      border: `2px solid ${isActive ? AppColors.whisperAmber : 'rgba(251, 191, 36, 0.4)'}`,
      backgroundColor: isActive ? AppColors.whisperAmber : 'rgba(251, 191, 36, 0.1)',
      color: isActive ? AppColors.textDark : AppColors.whisperAmber,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      transform: isActive ? 'scale(0.95)' : 'scale(1)',
      boxShadow: isActive ? `0 0 20px ${AppColors.whisperAmber}44` : 'none',
    }}
  >
    <span style={{ fontSize: '24px', lineHeight: 1 }}>🇺🇦</span>
    <span style={{ 
      fontSize: '9px', 
      fontWeight: '600', 
      letterSpacing: '0.3px',
      textAlign: 'center',
      lineHeight: 1.2,
    }}>
      {isActive ? 'LISTENING' : 'WHISPER'}
    </span>
  </button>
);

// Hint button (right)
const HintButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      width: '72px',
      height: '72px',
      borderRadius: '20px',
      border: `2px solid rgba(216, 180, 254, 0.3)`,
      backgroundColor: 'rgba(216, 180, 254, 0.1)',
      color: AppColors.accentPurple,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}
  >
    <HelpCircleIcon size={24} />
    <span style={{ 
      fontSize: '9px', 
      fontWeight: '600', 
      letterSpacing: '0.3px',
    }}>
      HINT
    </span>
  </button>
);

// Mode indicator pill
const ModeIndicator = ({ isWhisperMode }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 16px',
  }}>
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 14px',
      borderRadius: '20px',
      backgroundColor: isWhisperMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(216, 180, 254, 0.15)',
      color: isWhisperMode ? AppColors.whisperAmber : AppColors.accentPurple,
      fontSize: '12px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
    }}>
      <span style={{ 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%', 
        backgroundColor: isWhisperMode ? AppColors.whisperAmber : AppColors.accentPurple,
      }}/>
      {isWhisperMode ? '🇺🇦 Whisper Mode' : '🎭 Roleplay Mode'}
    </div>
  </div>
);

export default function AITutorChatUI() {
  const [isRecording, setIsRecording] = useState(false);
  const [isWhisperActive, setIsWhisperActive] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Good morning! Welcome to The Daily Grind. What can I get for you today?", isUser: false, isWhisper: false },
    { id: 2, text: "Hello! I would like... um... a coffee, please.", isUser: true, isWhisper: false },
    { id: 3, text: "Sure thing! What size would you like? We have small, medium, or large.", isUser: false, isWhisper: false },
    { id: 4, text: "Як сказати 'середній' англійською?", isUser: true, isWhisper: true },
    { id: 5, text: "'Середній' in English is 'medium'. You can say: 'I'd like a medium, please.' Try saying that in English!", isUser: false, isWhisper: true, translation: "«Середній» англійською — це «medium». Ти можеш сказати: «I'd like a medium, please.» Спробуй сказати це англійською!" },
    { id: 6, text: "I would like a medium coffee, please.", isUser: true, isWhisper: false },
    { id: 7, text: "Great choice! Would you like any milk or sugar with that?", isUser: false, isWhisper: false },
  ]);

  const scenario = "Ordering at a busy café";
  const tone = "Friendly barista";
  const progress = 45;
  const vocabWords = [
    { word: "medium", used: true },
    { word: "latte", used: false },
    { word: "receipt", used: false },
  ];

  const handleWhisperStart = () => {
    setIsWhisperActive(true);
    // In real app: start recording in Ukrainian mode
  };

  const handleWhisperEnd = () => {
    setIsWhisperActive(false);
    // In real app: stop recording and process Ukrainian input
  };

  const handleHint = () => {
    // In real app: request a hint from the AI
    console.log('Hint requested');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(to bottom, ${AppColors.gradientStart} 0%, ${AppColors.gradientMid} 50%, ${AppColors.gradientEnd} 100%)`,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '420px',
      margin: '0 auto',
      position: 'relative',
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(216, 180, 254, 0.3); border-radius: 4px; }
      `}</style>

      {/* Header with scenario and progress */}
      <ScenarioHeader scenario={scenario} tone={tone} progress={progress} />
      
      {/* Vocab tracker */}
      <VocabTracker words={vocabWords} />

      {/* Mode indicator */}
      <ModeIndicator isWhisperMode={isWhisperActive} />

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
      }}>
        {messages.map((msg) => (
          <ChatBubble 
            key={msg.id}
            message={msg.text}
            isUser={msg.isUser}
            isWhisper={msg.isWhisper}
            translation={msg.translation}
            onTranslate={() => console.log('translate', msg.id)}
            onReplay={() => console.log('replay', msg.id)}
            onSlowPlay={() => console.log('slow', msg.id)}
          />
        ))}
      </div>

      {/* Recording indicator */}
      {(isRecording || isWhisperActive) && (
        <div style={{
          padding: '12px 16px',
          textAlign: 'center',
          color: isWhisperActive ? AppColors.whisperAmber : AppColors.accentPurple,
          fontSize: '14px',
          fontWeight: '500',
        }}>
          <span style={{ animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }}>
            {isWhisperActive ? '🇺🇦 Listening in Ukrainian...' : '🎤 Listening...'}
          </span>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div style={{
        padding: '16px 24px 32px',
        background: 'linear-gradient(to bottom, rgba(30, 27, 75, 0.95) 0%, rgba(30, 27, 75, 1) 100%)',
        borderTop: `1px solid ${AppColors.borderColor}`,
        borderRadius: '24px 24px 0 0',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          {/* Whisper Button (Left) */}
          <WhisperButton
            isActive={isWhisperActive}
            onPressStart={handleWhisperStart}
            onPressEnd={handleWhisperEnd}
          />

          {/* Main Mic Button (Center) */}
          <MicButton
            isRecording={isRecording}
            isWhisperMode={isWhisperActive}
            onPress={() => setIsRecording(!isRecording)}
          />

          {/* Hint Button (Right) */}
          <HintButton onClick={handleHint} />
        </div>

        {/* Helper text */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '12px',
          color: AppColors.textSecondary,
        }}>
          {isWhisperActive 
            ? 'Release to send your question in Ukrainian'
            : 'Hold 🇺🇦 to ask in Ukrainian • Tap mic to speak English'
          }
        </div>
      </div>
    </div>
  );
}