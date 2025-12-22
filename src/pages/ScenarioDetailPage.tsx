import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppColors, radius } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { ScenarioIllustration } from '../components/roleplay/ScenarioIllustration';
import { TaskList } from '../components/roleplay/TaskCheckbox';
import { LevelKey } from '../components/roleplay';

// === Types ===
interface ScenarioTask {
  id: string;
  text: string;
  completed: boolean;
}

interface ScenarioConfig {
  id: string;
  title: string;
  level: LevelKey;
  illustration: string;
  caseDescription: string;
  tasks: ScenarioTask[];
  systemPrompt: string;
}

// === Scenario Data (would typically come from a database) ===
const SCENARIO_DATA: Record<string, Omit<ScenarioConfig, 'id'>> = {
  'job-interview': {
    title: 'Job Interview',
    level: 'beginner',
    illustration: 'interview',
    caseDescription:
      'You are at an interview with a hiring manager. You must answer common interview questions, such as describing your strengths, past experiences, and career goals.',
    tasks: [
      { id: '1', text: 'Describe your previous experiences and what you did in your previous jobs.', completed: false },
      { id: '2', text: "Answer the question: 'What are your strengths?'", completed: false },
      { id: '3', text: 'Ask the interviewer one question about the role.', completed: false },
    ],
    systemPrompt: `You are a professional hiring manager conducting a job interview. Your name is Sarah Chen.

SCENARIO: The student is interviewing for an entry-level position at a mid-sized company.

YOUR ROLE:
- Be professional but friendly
- Ask common interview questions one at a time
- Listen to their answers and ask follow-up questions
- Provide encouragement when appropriate

INTERVIEW FLOW:
1. Start with a warm greeting and brief introduction
2. Ask about their background and experience
3. Ask about their strengths
4. Allow them to ask you questions about the role
5. Close the interview professionally

Keep responses concise and natural. Wait for their responses before moving to the next question.`,
  },
  'talking-about-your-skills': {
    title: 'Talking About Your Skills',
    level: 'beginner',
    illustration: 'skills',
    caseDescription:
      'Practice describing your professional skills and abilities in a workplace context. Learn to highlight your strengths effectively.',
    tasks: [
      { id: '1', text: 'Introduce yourself and mention your main skill.', completed: false },
      { id: '2', text: 'Give an example of how you used this skill in the past.', completed: false },
      { id: '3', text: 'Explain why this skill is valuable for your career.', completed: false },
    ],
    systemPrompt: `You are a career coach helping someone practice talking about their skills.

YOUR ROLE:
- Be supportive and encouraging
- Ask follow-up questions to help them elaborate
- Provide gentle corrections if needed
- Help them structure their responses

Keep the conversation natural and flowing.`,
  },
  'first-date-tips': {
    title: 'First Date Tips',
    level: 'beginner',
    illustration: 'date',
    caseDescription:
      'Practice casual conversation skills for social situations. Learn to make small talk, ask questions, and share about yourself.',
    tasks: [
      { id: '1', text: 'Introduce yourself and ask about their interests.', completed: false },
      { id: '2', text: 'Share something interesting about your hobbies.', completed: false },
      { id: '3', text: 'Suggest a fun activity you could do together.', completed: false },
    ],
    systemPrompt: `You are Alex, a friendly person on a casual first meeting at a café.

YOUR ROLE:
- Be warm and approachable
- Show genuine interest in the conversation
- Share about yourself too
- Keep the conversation light and fun

Be natural and respond to what they say.`,
  },
  'asking-for-directions': {
    title: 'Asking for Directions',
    level: 'beginner',
    illustration: 'directions',
    caseDescription:
      'You are lost in a new city and need to find the train station. Practice asking for directions politely and understanding the response.',
    tasks: [
      { id: '1', text: 'Politely stop someone and ask for directions to the train station.', completed: false },
      { id: '2', text: 'Ask them to repeat or clarify if you do not understand.', completed: false },
      { id: '3', text: 'Thank them for their help.', completed: false },
    ],
    systemPrompt: `You are a friendly local who knows the area well.

SCENARIO: A tourist approaches you on the street asking for directions to the train station.

YOUR ROLE:
- Be helpful and patient
- Give clear directions (the station is 2 blocks north, then turn left)
- Offer to repeat if they seem confused
- Use simple language

Start by responding to their request for help.`,
  },
  'visiting-the-pharmacy': {
    title: 'Visiting the Pharmacy',
    level: 'pre-intermediate',
    illustration: 'pharmacy',
    caseDescription:
      'You have a headache and need to buy medicine. Practice asking for health products and describing symptoms.',
    tasks: [
      { id: '1', text: 'Greet the pharmacist and explain your symptoms.', completed: false },
      { id: '2', text: 'Ask for a recommendation for medicine.', completed: false },
      { id: '3', text: 'Ask about dosage and any side effects.', completed: false },
    ],
    systemPrompt: `You are a friendly pharmacist at a local pharmacy.

YOUR ROLE:
- Be professional and helpful
- Ask clarifying questions about symptoms
- Recommend appropriate over-the-counter medicine
- Explain dosage clearly
- Mention any common side effects

Start by greeting the customer.`,
  },
  'shopping-for-clothes': {
    title: 'Shopping for Clothes',
    level: 'pre-intermediate',
    illustration: 'shopping',
    caseDescription:
      'You are at a clothing store looking for a new shirt. Practice asking about sizes, colors, and prices.',
    tasks: [
      { id: '1', text: 'Ask the shop assistant for help finding a shirt.', completed: false },
      { id: '2', text: 'Ask about available sizes and colors.', completed: false },
      { id: '3', text: 'Ask if you can try it on and where the fitting room is.', completed: false },
    ],
    systemPrompt: `You are a friendly shop assistant at a clothing store.

YOUR ROLE:
- Greet the customer warmly
- Help them find what they're looking for
- Offer size and color options
- Direct them to the fitting room
- Be ready to suggest alternatives

The store has shirts in sizes S, M, L, XL and colors: blue, white, black, and gray.`,
  },
  'ordering-at-a-restaurant': {
    title: 'Ordering at a Restaurant',
    level: 'beginner',
    illustration: 'restaurant-order',
    caseDescription:
      'You are at a restaurant ready to order food. Practice reading a menu, ordering dishes, and asking about ingredients.',
    tasks: [
      { id: '1', text: 'Greet the waiter and ask for the menu.', completed: false },
      { id: '2', text: 'Order a main course and a drink.', completed: false },
      { id: '3', text: 'Ask about a dish you are curious about.', completed: false },
    ],
    systemPrompt: `You are a friendly waiter at a casual restaurant.

MENU:
- Grilled chicken with vegetables ($15)
- Pasta carbonara ($13)
- Caesar salad ($10)
- Fish and chips ($14)
- Vegetable stir-fry ($12)

Drinks: Water, Soda, Juice, Coffee, Tea

YOUR ROLE:
- Be polite and attentive
- Answer questions about the menu
- Take their order clearly
- Confirm the order at the end

Start by greeting them and asking if they're ready to order.`,
  },
  'booking-a-hotel-room': {
    title: 'Booking a Hotel Room',
    level: 'beginner',
    illustration: 'hotel',
    caseDescription:
      'You need to book a hotel room for your vacation. Practice making reservations, asking about amenities, and confirming details.',
    tasks: [
      { id: '1', text: 'Call the hotel and ask about room availability.', completed: false },
      { id: '2', text: 'Ask about the price and what is included.', completed: false },
      { id: '3', text: 'Confirm your booking dates and provide your name.', completed: false },
    ],
    systemPrompt: `You are a hotel receptionist at the Grand Plaza Hotel.

AVAILABLE ROOMS:
- Standard room: $100/night (1 bed, TV, WiFi)
- Deluxe room: $150/night (1 king bed, TV, WiFi, breakfast included)
- Suite: $220/night (living area, 1 king bed, TV, WiFi, breakfast, minibar)

YOUR ROLE:
- Be professional and helpful
- Answer questions about rooms and amenities
- Check availability for their dates
- Take booking details

Start by greeting them: "Thank you for calling Grand Plaza Hotel. How may I help you?"`,
  },
  'meeting-new-people': {
    title: 'Meeting New People',
    level: 'pre-intermediate',
    illustration: 'social',
    caseDescription:
      'You are at a networking event and want to meet new people. Practice introducing yourself and making small talk.',
    tasks: [
      { id: '1', text: 'Introduce yourself and mention what you do.', completed: false },
      { id: '2', text: 'Ask them about their work or interests.', completed: false },
      { id: '3', text: 'Find something in common and continue the conversation.', completed: false },
    ],
    systemPrompt: `You are Jamie, a marketing professional at a networking event.

YOUR ROLE:
- Be friendly and open
- Share about yourself when asked
- Show genuine interest in them
- Find common ground

You work in digital marketing, enjoy hiking, and recently moved to the city.`,
  },
  'talking-to-a-neighbour': {
    title: 'Talking to a Neighbour',
    level: 'beginner',
    illustration: 'neighbour',
    caseDescription:
      'You just moved to a new apartment and want to introduce yourself to your neighbour. Practice friendly neighborhood conversation.',
    tasks: [
      { id: '1', text: 'Introduce yourself as the new neighbour.', completed: false },
      { id: '2', text: 'Ask about the neighbourhood and local amenities.', completed: false },
      { id: '3', text: 'Exchange contact information in case of emergencies.', completed: false },
    ],
    systemPrompt: `You are Pat, a friendly neighbour who has lived in the building for 3 years.

YOUR ROLE:
- Be welcoming to the new neighbour
- Share helpful information about the area
- Mention the good coffee shop nearby
- Offer to help if they need anything

Start by responding to their introduction.`,
  },
  'planning-a-romantic-evening': {
    title: 'Planning a Romantic Evening',
    level: 'upper-intermediate',
    illustration: 'romantic',
    caseDescription:
      'Practice planning a special evening, making reservations, and discussing preferences with a partner.',
    tasks: [
      { id: '1', text: 'Suggest a restaurant and explain why you chose it.', completed: false },
      { id: '2', text: 'Discuss timing and transportation.', completed: false },
      { id: '3', text: 'Plan an activity after dinner.', completed: false },
    ],
    systemPrompt: `You are helping your partner plan a romantic evening for your anniversary.

YOUR ROLE:
- Be enthusiastic about planning together
- Share your preferences
- Suggest ideas and be open to theirs
- Help make decisions together

Start by asking what kind of evening they have in mind.`,
  },
};

// === Level Badge Component ===
function LevelBadge({ level }: { level: LevelKey }) {
  const levelStyles: Record<LevelKey, { bg: string; color: string; border: string }> = {
    beginner: {
      bg: 'rgba(96, 165, 250, 0.15)',
      color: AppColors.accentBlue,
      border: 'rgba(96, 165, 250, 0.3)',
    },
    'pre-intermediate': {
      bg: 'rgba(74, 222, 128, 0.15)',
      color: AppColors.success,
      border: 'rgba(74, 222, 128, 0.3)',
    },
    intermediate: {
      bg: 'rgba(251, 191, 36, 0.15)',
      color: AppColors.warning,
      border: 'rgba(251, 191, 36, 0.3)',
    },
    'upper-intermediate': {
      bg: 'rgba(248, 113, 113, 0.15)',
      color: AppColors.error,
      border: 'rgba(248, 113, 113, 0.3)',
    },
  };

  const style = levelStyles[level];
  const label = level
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 16px',
        fontSize: '14px',
        fontWeight: '500',
        color: style.color,
        backgroundColor: style.bg,
        borderRadius: radius.full,
        border: `1px solid ${style.border}`,
        marginBottom: '12px',
      }}
    >
      {label}
    </span>
  );
}

// === Section Header Component ===
function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: AppColors.accent,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h2>
      <button
        aria-label="Translate"
        style={{
          background: 'none',
          border: 'none',
          color: AppColors.textSecondary,
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.sm,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = AppColors.accent;
          e.currentTarget.style.backgroundColor = AppColors.accentMuted;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = AppColors.textSecondary;
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      </button>
    </div>
  );
}

// === Main Page Component ===
export default function ScenarioDetailPage() {
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { userDocument } = useAuth();

  const [tasks, setTasks] = useState<ScenarioTask[]>([]);
  const [scenario, setScenario] = useState<ScenarioConfig | null>(null);

  // Load scenario data
  useEffect(() => {
    if (scenarioId) {
      const data = SCENARIO_DATA[scenarioId];
      if (data) {
        setScenario({ id: scenarioId, ...data });
        setTasks(data.tasks.map((t) => ({ ...t })));
      }
    }
  }, [scenarioId]);

  const handleToggleTask = (taskId: string | number) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  };

  const handleStartChat = async () => {
    if (!scenario) return;

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

    const roleConfig = {
      id: `roleplay-${scenario.id}`,
      name: scenario.title,
      icon: '🎭',
      scenario: scenario.caseDescription,
      systemPrompt: scenario.systemPrompt,
      persona: 'actor' as const,
      tone: 'friendly',
      level: userDocument?.level || 'B1',
      color: AppColors.accent,
      durationMinutes: 5,
      functionCallingEnabled: true,
      isRoleplay: true,
      tasks: tasks.map((t) => t.text),
    };
    sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
    navigate(`/chat/roleplay-${scenario.id}`);
  };

  const handleBack = () => {
    navigate('/roleplay');
  };

  if (!scenario) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: AppColors.bgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: AppColors.textPrimary,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p style={{ color: AppColors.textSecondary }}>Scenario not found</p>
          <button
            onClick={handleBack}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              borderRadius: radius.md,
              border: 'none',
              backgroundColor: AppColors.accent,
              color: AppColors.textDark,
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Back to Role Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: AppColors.bgPrimary,
        color: AppColors.textPrimary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        .scenario-content::-webkit-scrollbar { width: 0; display: none; }
        .scenario-content { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 640px) {
          .scenario-content { max-width: 540px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .scenario-content { max-width: 640px; }
        }
      `}</style>

      {/* Scrollable content */}
      <div
        className="scenario-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
        }}
      >
        {/* Card container */}
        <div
          style={{
            backgroundColor: AppColors.bgSecondary,
            borderRadius: '0 0 24px 24px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Back button overlay */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              zIndex: 10,
            }}
          >
            <button
              onClick={handleBack}
              aria-label="Go back"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>

          {/* Header Illustration */}
          <ScenarioIllustration type={scenario.illustration} />

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Level Badge */}
            <LevelBadge level={scenario.level} />

            {/* Title */}
            <h1
              style={{
                margin: '0 0 24px 0',
                fontSize: '28px',
                fontWeight: '700',
                color: AppColors.textPrimary,
                letterSpacing: '-0.5px',
              }}
            >
              {scenario.title}
            </h1>

            {/* Case Section */}
            <div style={{ marginBottom: '24px' }}>
              <SectionHeader title="Case" />
              <div
                style={{
                  backgroundColor: AppColors.bgTertiary,
                  borderRadius: radius.lg,
                  padding: '16px',
                  border: `1px solid ${AppColors.borderColor}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color: AppColors.textPrimary,
                  }}
                >
                  {scenario.caseDescription}
                </p>
              </div>
            </div>

            {/* Tasks Section */}
            <div style={{ marginBottom: '24px' }}>
              <SectionHeader title="Tasks" />
              <TaskList tasks={tasks} onToggle={handleToggleTask} />
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartChat}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: AppColors.accentPurple,
                color: AppColors.textDark,
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: radius.md,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
