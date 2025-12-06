import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { createMission, getAllMissions, deleteMission } from '../services/firebase/missions';
import { MissionDocument, ConversationTone, ProficiencyLevel } from '../types/firestore';
import { useAuth } from '../hooks/useAuth';
import {
  PlusIcon,
  ImageIcon,
  ChevronDownIcon,
  XIcon,
  BarChartIcon,
  AlertCircleIcon,
  SparklesIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  ArrowLeftIcon,
} from '../theme/icons';

// Types
interface LessonData {
  id: string;
  title: string;
  description: string;
  targetVocab: string[];
  imageUrl: string | null;
  assignedGroups: string[];
  status: 'draft' | 'published';
  completionRate: number;
  studentsCompleted: number;
  totalStudents: number;
}


// Form Components
interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
}) => (
  <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
    <label
      style={{
        display: 'block',
        fontSize: 'clamp(12px, 2.5vw, 14px)',
        fontWeight: 500,
        color: AppColors.textSecondary,
        marginBottom: 'clamp(4px, 1vw, 6px)',
      }}
    >
      {label}
    </label>
    {multiline ? (
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          minHeight: 'clamp(80px, 15vw, 100px)',
          background: AppColors.surfaceLight,
          border: `1px solid ${AppColors.borderColor}`,
          borderRadius: 'clamp(8px, 2vw, 12px)',
          padding: 'clamp(10px, 2.5vw, 14px)',
          color: AppColors.textPrimary,
          fontSize: 'clamp(14px, 3vw, 16px)',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
    ) : (
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: 'clamp(40px, 8vw, 48px)',
          background: AppColors.surfaceLight,
          border: `1px solid ${AppColors.borderColor}`,
          borderRadius: 'clamp(8px, 2vw, 12px)',
          padding: '0 clamp(10px, 2.5vw, 14px)',
          color: AppColors.textPrimary,
          fontSize: 'clamp(14px, 3vw, 16px)',
          boxSizing: 'border-box',
        }}
      />
    )}
  </div>
);

interface SelectFieldProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
}) => (
  <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
    <label
      style={{
        display: 'block',
        fontSize: 'clamp(12px, 2.5vw, 14px)',
        fontWeight: 500,
        color: AppColors.textSecondary,
        marginBottom: 'clamp(4px, 1vw, 6px)',
      }}
    >
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: 'clamp(40px, 8vw, 48px)',
          background: AppColors.surfaceLight,
          border: `1px solid ${AppColors.borderColor}`,
          borderRadius: 'clamp(8px, 2vw, 12px)',
          padding: '0 clamp(10px, 2.5vw, 14px)',
          color: AppColors.textPrimary,
          fontSize: 'clamp(14px, 3vw, 16px)',
          appearance: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div
        style={{
          position: 'absolute',
          right: 'clamp(10px, 2.5vw, 14px)',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: AppColors.textSecondary,
        }}
      >
        <ChevronDownIcon size={16} />
      </div>
    </div>
  </div>
);

// Vocab Input Component
interface VocabInputProps {
  vocab: string[];
  onAdd: (word: string) => void;
  onRemove: (index: number) => void;
}

const VocabInput: React.FC<VocabInputProps> = ({ vocab, onAdd, onRemove }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
      <label
        style={{
          display: 'block',
          fontSize: 'clamp(12px, 2.5vw, 14px)',
          fontWeight: 500,
          color: AppColors.textSecondary,
          marginBottom: 'clamp(4px, 1vw, 6px)',
        }}
      >
        Target Vocabulary
      </label>
      <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 8px)', marginBottom: 'clamp(8px, 2vw, 10px)' }}>
        <input
          type="text"
          placeholder="Add a word..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            flex: 1,
            height: 'clamp(36px, 7vw, 42px)',
            background: AppColors.surfaceLight,
            border: `1px solid ${AppColors.borderColor}`,
            borderRadius: 'clamp(8px, 2vw, 12px)',
            padding: '0 clamp(10px, 2.5vw, 14px)',
            color: AppColors.textPrimary,
            fontSize: 'clamp(14px, 3vw, 16px)',
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            width: 'clamp(36px, 7vw, 42px)',
            height: 'clamp(36px, 7vw, 42px)',
            background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
            border: 'none',
            borderRadius: 'clamp(8px, 2vw, 12px)',
            color: AppColors.textDark,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusIcon size={18} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 1.5vw, 8px)' }}>
        {vocab.map((word, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(4px, 1vw, 6px)',
              background: AppColors.surfaceMedium,
              borderRadius: 'clamp(14px, 3vw, 18px)',
              padding: 'clamp(4px, 1vw, 6px) clamp(10px, 2.5vw, 12px)',
            }}
          >
            <span style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: AppColors.textPrimary }}>{word}</span>
            <button
              onClick={() => onRemove(index)}
              style={{
                background: 'transparent',
                border: 'none',
                color: AppColors.textSecondary,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Image Upload Component
interface ImageUploadProps {
  imageUrl: string | null;
  onUpload: (url: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ imageUrl, onUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload to storage and get URL
      const fakeUrl = URL.createObjectURL(file);
      onUpload(fakeUrl);
    }
  };

  return (
    <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
      <label
        style={{
          display: 'block',
          fontSize: 'clamp(12px, 2.5vw, 14px)',
          fontWeight: 500,
          color: AppColors.textSecondary,
          marginBottom: 'clamp(4px, 1vw, 6px)',
        }}
      >
        Lesson Image
      </label>
      {imageUrl ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(120px, 25vw, 160px)',
            borderRadius: 'clamp(8px, 2vw, 12px)',
            overflow: 'hidden',
          }}
        >
          <img
            src={imageUrl}
            alt="Lesson"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button
            onClick={() => onUpload('')}
            style={{
              position: 'absolute',
              top: 'clamp(6px, 1.5vw, 8px)',
              right: 'clamp(6px, 1.5vw, 8px)',
              width: 'clamp(28px, 6vw, 32px)',
              height: 'clamp(28px, 6vw, 32px)',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              color: AppColors.textPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon size={16} />
          </button>
        </div>
      ) : (
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 'clamp(120px, 25vw, 160px)',
            background: AppColors.surfaceLight,
            border: `2px dashed ${AppColors.borderColor}`,
            borderRadius: 'clamp(8px, 2vw, 12px)',
            cursor: 'pointer',
          }}
        >
          <div style={{ color: AppColors.textSecondary, marginBottom: 'clamp(6px, 1.5vw, 8px)' }}>
            <ImageIcon size={32} />
          </div>
          <span style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: AppColors.textSecondary }}>
            Click to upload image
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  );
};


// Lesson List Card
interface LessonListCardProps {
  lesson: LessonData;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const LessonListCard: React.FC<LessonListCardProps> = ({
  lesson,
  onEdit,
  onDelete,
  onDuplicate,
}) => (
  <div
    style={{
      background: AppColors.surfaceLight,
      borderRadius: 'clamp(10px, 2.5vw, 14px)',
      padding: 'clamp(12px, 3vw, 16px)',
      marginBottom: 'clamp(10px, 2.5vw, 12px)',
      border: `1px solid ${AppColors.borderColor}`,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'clamp(8px, 2vw, 10px)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)' }}>
          <h3
            style={{
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              color: AppColors.textPrimary,
              margin: 0,
            }}
          >
            {lesson.title}
          </h3>
          <span
            style={{
              fontSize: 'clamp(10px, 2vw, 11px)',
              padding: 'clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px)',
              borderRadius: 'clamp(8px, 2vw, 10px)',
              background: lesson.status === 'published' ? AppColors.successGreen : AppColors.whisperAmber,
              color: AppColors.textDark,
              fontWeight: 500,
            }}
          >
            {lesson.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
        <p
          style={{
            fontSize: 'clamp(12px, 2.5vw, 13px)',
            color: AppColors.textSecondary,
            margin: 'clamp(4px, 1vw, 6px) 0 0 0',
          }}
        >
          {lesson.description}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'clamp(4px, 1vw, 6px)' }}>
        <button
          onClick={onEdit}
          style={{
            width: 'clamp(30px, 6vw, 34px)',
            height: 'clamp(30px, 6vw, 34px)',
            background: AppColors.surfaceMedium,
            border: 'none',
            borderRadius: 'clamp(6px, 1.5vw, 8px)',
            color: AppColors.textSecondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EditIcon size={14} />
        </button>
        <button
          onClick={onDuplicate}
          style={{
            width: 'clamp(30px, 6vw, 34px)',
            height: 'clamp(30px, 6vw, 34px)',
            background: AppColors.surfaceMedium,
            border: 'none',
            borderRadius: 'clamp(6px, 1.5vw, 8px)',
            color: AppColors.textSecondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CopyIcon size={14} />
        </button>
        <button
          onClick={onDelete}
          style={{
            width: 'clamp(30px, 6vw, 34px)',
            height: 'clamp(30px, 6vw, 34px)',
            background: AppColors.surfaceMedium,
            border: 'none',
            borderRadius: 'clamp(6px, 1.5vw, 8px)',
            color: AppColors.errorRose,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrashIcon size={14} />
        </button>
      </div>
    </div>

    {/* Progress bar */}
    <div style={{ marginBottom: 'clamp(6px, 1.5vw, 8px)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'clamp(3px, 0.8vw, 4px)',
        }}
      >
        <span style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textSecondary }}>
          Completion
        </span>
        <span style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textPrimary }}>
          {lesson.studentsCompleted}/{lesson.totalStudents} students
        </span>
      </div>
      <div
        style={{
          height: 'clamp(4px, 1vw, 6px)',
          background: AppColors.surfaceMedium,
          borderRadius: 'clamp(2px, 0.5vw, 3px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${lesson.completionRate}%`,
            height: '100%',
            background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
            borderRadius: 'clamp(2px, 0.5vw, 3px)',
          }}
        />
      </div>
    </div>

    {/* Vocab tags */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 1vw, 6px)' }}>
      {lesson.targetVocab.slice(0, 4).map((word, index) => (
        <span
          key={index}
          style={{
            fontSize: 'clamp(10px, 2vw, 11px)',
            padding: 'clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px)',
            background: AppColors.surfaceMedium,
            borderRadius: 'clamp(8px, 2vw, 10px)',
            color: AppColors.textSecondary,
          }}
        >
          {word}
        </span>
      ))}
      {lesson.targetVocab.length > 4 && (
        <span
          style={{
            fontSize: 'clamp(10px, 2vw, 11px)',
            padding: 'clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px)',
            background: AppColors.surfaceMedium,
            borderRadius: 'clamp(8px, 2vw, 10px)',
            color: AppColors.textSecondary,
          }}
        >
          +{lesson.targetVocab.length - 4} more
        </span>
      )}
    </div>
  </div>
);

// Class Pulse Alert
interface ClassPulseAlertProps {
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
}

const ClassPulseAlert: React.FC<ClassPulseAlertProps> = ({ title, message, type }) => {
  const bgColor =
    type === 'warning'
      ? 'rgba(251, 191, 36, 0.15)'
      : type === 'success'
      ? 'rgba(74, 222, 128, 0.15)'
      : 'rgba(96, 165, 250, 0.15)';
  const iconColor =
    type === 'warning'
      ? AppColors.whisperAmber
      : type === 'success'
      ? AppColors.successGreen
      : AppColors.accentBlue;

  return (
    <div
      style={{
        display: 'flex',
        gap: 'clamp(10px, 2.5vw, 12px)',
        padding: 'clamp(10px, 2.5vw, 14px)',
        background: bgColor,
        borderRadius: 'clamp(8px, 2vw, 10px)',
        marginBottom: 'clamp(8px, 2vw, 10px)',
      }}
    >
      <div style={{ color: iconColor }}>
        <AlertCircleIcon size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 'clamp(13px, 2.8vw, 14px)',
            fontWeight: 600,
            color: AppColors.textPrimary,
            marginBottom: 'clamp(2px, 0.5vw, 4px)',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary }}>
          {message}
        </div>
      </div>
    </div>
  );
};

// Tab Button
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(6px, 1.5vw, 8px)',
      padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3.5vw, 18px)',
      background: isActive ? AppColors.surfaceMedium : 'transparent',
      border: 'none',
      borderRadius: 'clamp(16px, 4vw, 20px)',
      color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
      fontSize: 'clamp(13px, 2.8vw, 14px)',
      fontWeight: isActive ? 600 : 400,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    {icon}
    {label}
  </button>
);

// Main Component
const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'lessons' | 'analytics'>('lessons');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [, setLoading] = useState(true);
  const [, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('conversation');
  const [targetLevel, setTargetLevel] = useState<ProficiencyLevel>('A2');
  const [vocab, setVocab] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // CEFR Level options
  const levelOptions: { value: ProficiencyLevel; label: string; description: string }[] = [
    { value: 'A1', label: 'A1 - Beginner', description: 'Basic phrases and expressions' },
    { value: 'A2', label: 'A2 - Elementary', description: 'Simple everyday situations' },
    { value: 'B1', label: 'B1 - Intermediate', description: 'Main points of familiar topics' },
    { value: 'B2', label: 'B2 - Upper Intermediate', description: 'Complex texts and discussions' },
    { value: 'C1', label: 'C1 - Advanced', description: 'Demanding, longer texts' },
    { value: 'C2', label: 'C2 - Proficient', description: 'Near-native fluency' },
  ];

  // Fetch lessons from Firestore
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const missions = await getAllMissions();
        const mappedLessons: LessonData[] = missions.map((m: MissionDocument) => ({
          id: m.id,
          title: m.title,
          description: m.scenario,
          targetVocab: m.vocabList.map(v => v.word),
          imageUrl: m.imageUrl || null,
          assignedGroups: m.groupId ? [m.groupId] : [],
          status: m.isActive ? 'published' as const : 'draft' as const,
          completionRate: 0,
          studentsCompleted: 0,
          totalStudents: 0,
        }));
        setLessons(mappedLessons);
      } catch (error) {
        console.error('Error fetching lessons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const handleAddVocab = (word: string) => {
    setVocab([...vocab, word]);
  };

  const handleRemoveVocab = (index: number) => {
    setVocab(vocab.filter((_, i) => i !== index));
  };

  const handleCreateLesson = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    setSaving(true);
    try {
      // Map category to tone
      const toneMap: Record<string, ConversationTone> = {
        conversation: 'friendly',
        vocabulary: 'encouraging',
        grammar: 'formal',
        pronunciation: 'challenging',
      };

      const newMission = await createMission({
        teacherId: user?.uid || 'anonymous',
        teacherName: user?.displayName || 'Teacher',
        title: title.trim(),
        scenario: description.trim(),
        tone: toneMap[category] || 'friendly',
        vocabList: vocab.map(word => ({ word })),
        imageUrl: imageUrl || undefined,
        targetLevel: targetLevel,
        isActive: true,
      });

      // Add to local state
      setLessons(prev => [{
        id: newMission.id,
        title: newMission.title,
        description: newMission.scenario,
        targetVocab: newMission.vocabList.map(v => v.word),
        imageUrl: newMission.imageUrl || null,
        assignedGroups: newMission.groupId ? [newMission.groupId] : [],
        status: 'published',
        completionRate: 0,
        studentsCompleted: 0,
        totalStudents: 0,
      }, ...prev]);

      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('conversation');
      setTargetLevel('A2');
      setVocab([]);
      setImageUrl(null);
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Failed to create lesson. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await deleteMission(lessonId);
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: gradientBackground,
        color: AppColors.textPrimary,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'clamp(16px, 4vw, 24px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'clamp(20px, 5vw, 28px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.5vw, 14px)' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: AppColors.surfaceLight,
                border: 'none',
                borderRadius: 'clamp(8px, 2vw, 10px)',
                padding: 'clamp(8px, 2vw, 10px)',
                color: AppColors.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeftIcon size={20} />
            </button>
            <div>
              <h1
                style={{
                  fontSize: 'clamp(20px, 5vw, 26px)',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Teacher Dashboard
              </h1>
              <p
                style={{
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  color: AppColors.textSecondary,
                  margin: 0,
                }}
              >
                Manage lessons and track progress
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1.5vw, 8px)',
              background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
              border: 'none',
              borderRadius: 'clamp(10px, 2.5vw, 14px)',
              padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
              color: AppColors.textDark,
              fontSize: 'clamp(13px, 2.8vw, 15px)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <PlusIcon size={18} />
            <span style={{ display: 'none' }} className="hide-mobile">New Lesson</span>
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(6px, 1.5vw, 8px)',
            marginBottom: 'clamp(20px, 5vw, 28px)',
            background: AppColors.surfaceLight,
            padding: 'clamp(4px, 1vw, 6px)',
            borderRadius: 'clamp(20px, 5vw, 24px)',
          }}
        >
          <TabButton
            label="Lessons"
            isActive={activeTab === 'lessons'}
            onClick={() => setActiveTab('lessons')}
            icon={<SparklesIcon size={16} />}
          />
          <TabButton
            label="Analytics"
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={<BarChartIcon size={16} />}
          />
        </div>

        {/* Class Pulse Section */}
        <div style={{ marginBottom: 'clamp(20px, 5vw, 28px)' }}>
          <h2
            style={{
              fontSize: 'clamp(16px, 3.5vw, 18px)',
              fontWeight: 600,
              marginBottom: 'clamp(12px, 3vw, 16px)',
            }}
          >
            Class Pulse
          </h2>
          <ClassPulseAlert
            type="warning"
            title="Vocabulary Gap Detected"
            message="5 students in Morning Class A are struggling with 'reservation' and 'appetizer'"
          />
          <ClassPulseAlert
            type="success"
            title="Great Progress!"
            message="Advanced Speakers completed 'Airport Navigation' with 94% accuracy"
          />
        </div>

        {/* Lessons Tab Content */}
        {activeTab === 'lessons' && (
          <div>
            <h2
              style={{
                fontSize: 'clamp(16px, 3.5vw, 18px)',
                fontWeight: 600,
                marginBottom: 'clamp(12px, 3vw, 16px)',
              }}
            >
              Your Lessons
            </h2>
            {lessons.map((lesson) => (
              <LessonListCard
                key={lesson.id}
                lesson={lesson}
                onEdit={() => console.log('Edit', lesson.id)}
                onDelete={() => handleDeleteLesson(lesson.id)}
                onDuplicate={() => console.log('Duplicate', lesson.id)}
              />
            ))}
          </div>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <div
            style={{
              background: AppColors.surfaceLight,
              borderRadius: 'clamp(12px, 3vw, 16px)',
              padding: 'clamp(20px, 5vw, 28px)',
              textAlign: 'center',
            }}
          >
            <div style={{ color: AppColors.textSecondary, marginBottom: 'clamp(10px, 2.5vw, 12px)' }}>
              <BarChartIcon size={40} />
            </div>
            <h3
              style={{
                fontSize: 'clamp(16px, 3.5vw, 18px)',
                fontWeight: 600,
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
              }}
            >
              Analytics Coming Soon
            </h3>
            <p style={{ fontSize: 'clamp(13px, 2.8vw, 14px)', color: AppColors.textSecondary }}>
              Track student progress, completion rates, and vocabulary mastery
            </p>
          </div>
        )}
      </div>

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              background: AppColors.surfaceDark,
              borderRadius: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px) 0 0',
              padding: 'clamp(20px, 5vw, 28px)',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'clamp(20px, 5vw, 28px)',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Create New Lesson
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: AppColors.surfaceLight,
                  border: 'none',
                  borderRadius: '50%',
                  width: 'clamp(32px, 7vw, 38px)',
                  height: 'clamp(32px, 7vw, 38px)',
                  color: AppColors.textSecondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Form */}
            <InputField
              label="Lesson Title"
              placeholder="e.g., Ordering at a Restaurant"
              value={title}
              onChange={setTitle}
            />
            <InputField
              label="Description"
              placeholder="Describe what students will learn..."
              value={description}
              onChange={setDescription}
              multiline
            />
            <SelectField
              label="Category"
              options={[
                { value: 'conversation', label: 'Conversation' },
                { value: 'vocabulary', label: 'Vocabulary' },
                { value: 'grammar', label: 'Grammar' },
                { value: 'pronunciation', label: 'Pronunciation' },
              ]}
              value={category}
              onChange={setCategory}
            />

            {/* Level Selection */}
            <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  fontWeight: 500,
                  color: AppColors.textSecondary,
                  marginBottom: 'clamp(6px, 1.5vw, 8px)',
                }}
              >
                Target Level (CEFR)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 1.5vw, 8px)' }}>
                {levelOptions.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setTargetLevel(level.value)}
                    style={{
                      padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
                      background: targetLevel === level.value ? AppColors.accentPurple : AppColors.surfaceLight,
                      border: `1px solid ${targetLevel === level.value ? AppColors.accentPurple : AppColors.borderColor}`,
                      borderRadius: 'clamp(6px, 1.5vw, 8px)',
                      color: targetLevel === level.value ? AppColors.textDark : AppColors.textSecondary,
                      fontSize: 'clamp(12px, 2.5vw, 14px)',
                      fontWeight: targetLevel === level.value ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    title={level.description}
                  >
                    {level.value}
                  </button>
                ))}
              </div>
              <p style={{
                fontSize: 'clamp(11px, 2.5vw, 12px)',
                color: AppColors.textSecondary,
                marginTop: 'clamp(4px, 1vw, 6px)',
                margin: 'clamp(4px, 1vw, 6px) 0 0 0',
              }}>
                {levelOptions.find(l => l.value === targetLevel)?.description}
              </p>
            </div>

            <VocabInput vocab={vocab} onAdd={handleAddVocab} onRemove={handleRemoveVocab} />
            <ImageUpload imageUrl={imageUrl} onUpload={setImageUrl} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'clamp(10px, 2.5vw, 12px)', marginTop: 'clamp(20px, 5vw, 28px)' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: AppColors.surfaceLight,
                  border: `1px solid ${AppColors.borderColor}`,
                  borderRadius: 'clamp(10px, 2.5vw, 14px)',
                  color: AppColors.textPrimary,
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save as Draft
              </button>
              <button
                onClick={handleCreateLesson}
                style={{
                  flex: 1,
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                  border: 'none',
                  borderRadius: 'clamp(10px, 2.5vw, 14px)',
                  color: AppColors.textDark,
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Publish Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
