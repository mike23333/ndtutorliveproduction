import { useEffect } from 'react';
import { AppColors, radius, spacing } from '../../theme/colors';

// === Types ===
interface LessonTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface LessonDetailData {
  id: string;
  title: string;
  level: string;
  imageUrl?: string;
  imageCropPosition?: number;
  description: string; // Required lesson description
  tasks?: LessonTask[]; // Optional - only shown if lesson has tasks
  // Additional fields for sessionStorage setup when starting chat
  systemPrompt?: string;
  durationMinutes?: number;
  tone?: string;
  functionCallingEnabled?: boolean;
  functionCallingInstructions?: string;
  teacherId?: string;
  allowTranslation?: boolean; // Whether students can use translate button
}

interface LessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (lessonId: string) => void;
  lesson: LessonDetailData | null;
}

// === Brand-aligned Modal Colors (Purple/Indigo theme) ===
const ModalColors = {
  bgPrimary: AppColors.bgSecondary,
  bgCard: AppColors.bgTertiary,
  bgHero: AppColors.bgPrimary,
  textPrimary: AppColors.textPrimary,
  textSecondary: AppColors.textSecondary,
  textMuted: AppColors.textMuted,
  borderLight: AppColors.borderColor,
  accent: AppColors.accent,
  accentMuted: AppColors.accentMuted,
};

// === Get Level Color (brand-aligned) ===
const getLevelStyle = (level: string): { bg: string; text: string; border: string } => {
  const levelLower = level.toLowerCase();
  if (levelLower.includes('upper')) {
    return { bg: AppColors.successMuted, text: AppColors.success, border: 'rgba(74, 222, 128, 0.3)' };
  }
  if (levelLower.includes('intermediate') && !levelLower.includes('pre')) {
    return { bg: AppColors.warningMuted, text: AppColors.warning, border: 'rgba(251, 191, 36, 0.3)' };
  }
  // Beginner & Pre-intermediate
  return { bg: AppColors.accentMuted, text: AppColors.accent, border: AppColors.borderAccent };
};

// === Clock Icon for Duration ===
function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// === Task Item Component (bullet point style) ===
function TaskItem({ task }: { task: LessonTask }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '16px 0',
        borderBottom: `1px solid ${ModalColors.borderLight}`,
      }}
    >
      {/* Bullet Point */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: ModalColors.accent,
          flexShrink: 0,
          marginTop: '8px',
        }}
      />

      {/* Task Text */}
      <span
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          color: ModalColors.textPrimary,
        }}
      >
        {task.text}
      </span>
    </div>
  );
}

// === Direction Sign Illustration (SVG) ===
function DirectionSignIllustration() {
  return (
    <svg
      width="180"
      height="140"
      viewBox="0 0 220 200"
      fill="none"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {/* Ground shadow */}
      <ellipse cx="110" cy="180" rx="70" ry="14" fill={AppColors.accent} opacity="0.2" />

      {/* Sign post */}
      <rect x="70" y="60" width="8" height="125" rx="4" fill={AppColors.textSecondary} />

      {/* Direction signs */}
      <g>
        {/* Top sign pointing right */}
        <path
          d="M78 45 H130 L148 60 L130 75 H78 V45Z"
          fill={AppColors.accent}
          rx="4"
        />
        {/* Bottom sign pointing left */}
        <path
          d="M78 85 H35 L20 100 L35 115 H78 V85Z"
          fill={AppColors.accentBlue}
          rx="4"
        />
      </g>

      {/* Person */}
      <g transform="translate(120, 70)">
        {/* Head */}
        <circle cx="30" cy="18" r="18" fill="#FBBF7D" />
        {/* Hair */}
        <path
          d="M14 14 Q18 0 32 3 Q46 7 44 18 Q42 12 30 12 Q18 12 14 14Z"
          fill="#3F3F46"
        />
        {/* Body/Jacket */}
        <path
          d="M14 40 L18 36 L42 36 L46 40 L44 85 L32 85 L31 60 L29 60 L28 85 L16 85 Z"
          fill={AppColors.bgPrimary}
        />
        {/* Shirt */}
        <rect x="20" y="36" width="20" height="28" rx="2" fill={AppColors.accent} />
        {/* Arm pointing */}
        <path
          d="M42 42 L68 28 L72 34 L48 52 Z"
          fill="#FBBF7D"
        />
        {/* Legs */}
        <rect x="18" y="68" width="10" height="38" rx="3" fill={AppColors.bgPrimary} />
        <rect x="32" y="68" width="10" height="38" rx="3" fill={AppColors.bgPrimary} />
        {/* Shoes */}
        <ellipse cx="23" cy="108" rx="7" ry="5" fill={AppColors.accent} />
        <ellipse cx="37" cy="108" rx="7" ry="5" fill={AppColors.accent} />
      </g>

      {/* Decorative plants/shapes */}
      <ellipse cx="45" cy="175" rx="18" ry="10" fill={AppColors.accent} opacity="0.15" />
      <ellipse cx="38" cy="168" rx="10" ry="16" fill={AppColors.accent} opacity="0.25" />
      <ellipse cx="52" cy="165" rx="8" ry="14" fill={AppColors.accentBlue} opacity="0.3" />
    </svg>
  );
}

// === Main Modal Component ===
export function LessonDetailModal({
  isOpen,
  onClose,
  onStartChat,
  lesson,
}: LessonDetailModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleStartChat = async () => {
    if (!lesson) return;

    // Request microphone permission BEFORE navigating
    // iOS Safari requires getUserMedia to be called from a direct user gesture
    // The navigation would break the gesture chain, so we request permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop tracks - we just needed to trigger the permission prompt
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      const err = error as Error;
      if (err.name === 'NotAllowedError') {
        alert('Microphone access is required for voice interaction. Please allow microphone permission and try again.');
        return;
      }
      // For other errors (NotFoundError, etc.), continue to chat page and handle there
      console.warn('Pre-navigation microphone check failed:', err.message);
    }

    // DEBUG: Log what prompt we're about to use
    console.log('[LessonDetailModal] Starting chat with systemPrompt:', lesson.systemPrompt?.slice(0, 150) + '...');

    // Set up sessionStorage for the chat page (like HomePage does)
    const roleConfig = {
      id: lesson.id,
      name: lesson.title,
      icon: '📚',
      scenario: lesson.title,
      systemPrompt: lesson.systemPrompt || '',
      persona: 'actor' as const,
      tone: lesson.tone || 'friendly',
      level: lesson.level,
      color: '#8B5CF6',
      durationMinutes: lesson.durationMinutes || 15,
      functionCallingEnabled: lesson.functionCallingEnabled ?? true,
      functionCallingInstructions: lesson.functionCallingInstructions,
      imageUrl: lesson.imageUrl,
      teacherId: lesson.teacherId,
      tasks: lesson.tasks,
      allowTranslation: lesson.allowTranslation ?? true, // Default to true
    };
    sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
    onStartChat(lesson.id);
  };

  if (!isOpen || !lesson) return null;

  const levelStyle = getLevelStyle(lesson.level);

  return (
    <div
      className="lesson-modal-wrapper"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style>{`
        /* Mobile: Full screen bottom sheet */
        .lesson-modal-wrapper {
          align-items: stretch;
          justify-content: flex-end;
        }
        .lesson-modal-content {
          margin-top: auto;
          max-height: 92vh;
          border-radius: ${radius.xxl}px ${radius.xxl}px 0 0;
          border: none;
        }

        /* Desktop: Centered fixed-width modal */
        @media (min-width: 640px) {
          .lesson-modal-wrapper {
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .lesson-modal-content {
            margin-top: 0;
            max-width: 480px;
            max-height: 85vh;
            border-radius: ${radius.xxl}px;
            border: 1px solid ${ModalColors.borderLight};
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes modalFadeIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .lesson-modal-scroll::-webkit-scrollbar {
          width: 0;
          display: none;
        }
        .lesson-modal-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Animation based on screen size */
        @media (max-width: 639px) {
          .lesson-modal-content {
            animation: slideUp 0.3s ease-out;
          }
        }
        @media (min-width: 640px) {
          .lesson-modal-content {
            animation: modalFadeIn 0.25s ease-out;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal Content - Full screen on mobile, fixed width centered on desktop */}
      <div
        className="lesson-modal-content"
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: ModalColors.bgPrimary,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >

        {/* Drag Handle - Overlaid on image, only visible on mobile */}
        <div
          className="drag-handle-mobile"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 0 8px',
            zIndex: 5,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderRadius: radius.full,
            }}
          />
        </div>
        <style>{`
          @media (min-width: 640px) {
            .drag-handle-mobile {
              display: none !important;
            }
          }
        `}</style>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Content */}
        <div
          className="lesson-modal-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: '140px',
          }}
        >
          {/* Hero Section with Full-Width Image - Flush to top */}
          <div
            style={{
              backgroundColor: ModalColors.bgHero,
              minHeight: '160px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {lesson.imageUrl ? (
              <img
                src={lesson.imageUrl}
                alt={lesson.title}
                style={{
                  width: '100%',
                  height: '160px',
                  objectFit: 'cover',
                  objectPosition: `center ${lesson.imageCropPosition ?? 50}%`,
                }}
              />
            ) : (
              <div style={{ padding: `${spacing.md}px` }}>
                <DirectionSignIllustration />
              </div>
            )}
          </div>

          {/* Content Section */}
          <div
            style={{
              backgroundColor: ModalColors.bgCard,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              marginTop: '-24px',
              padding: `${spacing.lg}px ${spacing.md}px`,
              position: 'relative',
              minHeight: '300px',
            }}
          >
            {/* Level Badge + Duration */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: spacing.sm,
              }}
            >
              {/* Level Badge */}
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: radius.full,
                  backgroundColor: levelStyle.bg,
                  border: `1.5px solid ${levelStyle.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: levelStyle.text,
                  }}
                >
                  {lesson.level}
                </span>
              </div>

              {/* Duration indicator */}
              {lesson.durationMinutes && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: ModalColors.textSecondary,
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  <ClockIcon />
                  <span>{lesson.durationMinutes} min</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1
              style={{
                margin: `0 0 ${spacing.lg}px 0`,
                fontSize: '26px',
                fontWeight: '700',
                color: ModalColors.textPrimary,
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
              }}
            >
              {lesson.title}
            </h1>

            {/* Description Section */}
            <div style={{ marginBottom: spacing.lg }}>
              {/* Section Header */}
              <h2
                style={{
                  margin: `0 0 ${spacing.sm}px 0`,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: ModalColors.accent,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                DESCRIPTION
              </h2>

              {/* Case Description Card */}
              <div
                style={{
                  backgroundColor: ModalColors.bgPrimary,
                  borderRadius: radius.lg,
                  padding: `${spacing.md}px`,
                  border: `1px solid ${ModalColors.borderLight}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    lineHeight: 1.6,
                    color: ModalColors.textPrimary,
                  }}
                >
                  {lesson.description}
                </p>
              </div>
            </div>

            {/* Tasks Section - Only shown if lesson has tasks */}
            {lesson.tasks && lesson.tasks.length > 0 && (
              <div>
                {/* Section Header */}
                <h2
                  style={{
                    margin: `0 0 ${spacing.xs}px 0`,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: ModalColors.accent,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  TASKS
                </h2>

                {/* Tasks Card - Bullet points */}
                <div
                  style={{
                    backgroundColor: ModalColors.bgPrimary,
                    borderRadius: radius.lg,
                    padding: `0 ${spacing.md}px`,
                    border: `1px solid ${ModalColors.borderLight}`,
                  }}
                >
                  {lesson.tasks.map((task, index) => (
                    <div
                      key={task.id}
                      style={{
                        borderBottom: index < lesson.tasks!.length - 1 ? `1px solid ${ModalColors.borderLight}` : 'none',
                      }}
                    >
                      <TaskItem task={task} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Button - extra padding to clear bottom nav on mobile */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: `${spacing.md}px`,
            backgroundColor: ModalColors.bgCard,
            borderTop: `1px solid ${ModalColors.borderLight}`,
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
            zIndex: 10,
          }}
        >
          <button
            onClick={handleStartChat}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: radius.lg,
              border: 'none',
              backgroundColor: ModalColors.accent,
              color: AppColors.textDark,
              fontSize: '17px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(216, 180, 254, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = AppColors.accentHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = ModalColors.accent;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Start Lesson
          </button>
        </div>
      </div>
    </div>
  );
}

export default LessonDetailModal;
