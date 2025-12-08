import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { createMission, getAllMissions, deleteMission, updateMission } from '../services/firebase/missions';
import { MissionDocument } from '../types/firestore';
import type { PromptTemplateDocument } from '../types/firestore';
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
import { uploadLessonImage, validateImageFile, deleteLessonImage } from '../services/firebase/storage';
import {
  getPromptTemplatesForTeacher,
  createPromptTemplate,
} from '../services/firebase/promptTemplates';

// Types
interface LessonData {
  id: string;
  title: string;
  systemPrompt: string;
  durationMinutes: number;
  imageUrl: string | null;
  functionCallingEnabled: boolean;
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

// Image Upload Component (with Firebase Storage)
interface ImageUploadProps {
  imageUrl: string | null;
  storagePath: string | null;
  onUpload: (url: string, storagePath: string) => void;
  onRemove: () => void;
  teacherId: string;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  imageUrl,
  storagePath,
  onUpload,
  onRemove,
  teacherId,
  isUploading,
  setIsUploading,
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      alert('Please select a valid image file (max 5MB, jpg/png/gif/webp)');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadLessonImage(file, teacherId);
      onUpload(result.downloadUrl, result.storagePath);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (storagePath) {
      try {
        await deleteLessonImage(storagePath);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
    onRemove();
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
            onClick={handleRemove}
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
            cursor: isUploading ? 'wait' : 'pointer',
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          <div style={{ color: AppColors.textSecondary, marginBottom: 'clamp(6px, 1.5vw, 8px)' }}>
            <ImageIcon size={32} />
          </div>
          <span style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: AppColors.textSecondary }}>
            {isUploading ? 'Uploading...' : 'Click to upload image'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={isUploading}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)', flexWrap: 'wrap' }}>
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
          <span
            style={{
              fontSize: 'clamp(10px, 2vw, 11px)',
              padding: 'clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px)',
              borderRadius: 'clamp(8px, 2vw, 10px)',
              background: AppColors.surfaceMedium,
              color: AppColors.textSecondary,
            }}
          >
            {lesson.durationMinutes} min
          </span>
        </div>
        <p
          style={{
            fontSize: 'clamp(12px, 2.5vw, 13px)',
            color: AppColors.textSecondary,
            margin: 'clamp(4px, 1vw, 6px) 0 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}
        >
          {lesson.systemPrompt.slice(0, 100)}...
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
    <div>
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
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [_loading, setLoading] = useState(true); // TODO: Add loading indicator
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state - New simplified structure
  const [title, setTitle] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStoragePath, setImageStoragePath] = useState<string | null>(null);

  // Prompt templates
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplateDocument[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Fetch lessons from Firestore
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const missions = await getAllMissions();
        const mappedLessons: LessonData[] = missions.map((m: MissionDocument) => ({
          id: m.id,
          title: m.title,
          systemPrompt: m.systemPrompt || m.scenario || '',
          durationMinutes: m.durationMinutes || 15,
          imageUrl: m.imageUrl || null,
          functionCallingEnabled: m.functionCallingEnabled ?? true,
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

  // Fetch prompt templates for this teacher
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user?.uid) return;
      try {
        const templates = await getPromptTemplatesForTeacher(user.uid);
        setPromptTemplates(templates);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, [user?.uid]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = promptTemplates.find(t => t.id === templateId);
      if (template) {
        setSystemPrompt(template.systemPrompt);
        if (template.defaultDurationMinutes) {
          setDurationMinutes(template.defaultDurationMinutes);
        }
      }
    }
  };

  // Save current prompt as template
  const handleSaveTemplate = async () => {
    if (!user?.uid || !newTemplateName.trim() || !systemPrompt.trim()) {
      alert('Please provide a template name and system prompt');
      return;
    }

    try {
      const newTemplate = await createPromptTemplate({
        teacherId: user.uid,
        name: newTemplateName.trim(),
        systemPrompt: systemPrompt,
        defaultDurationMinutes: durationMinutes,
      });
      setPromptTemplates(prev => [...prev, newTemplate]);
      setShowSaveTemplateModal(false);
      setNewTemplateName('');
      alert('Template saved successfully!');
    } catch (error: unknown) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save template: ${errorMessage}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setSystemPrompt('');
    setDurationMinutes(15);
    setImageUrl(null);
    setImageStoragePath(null);
    setSelectedTemplateId('');
    setEditingLessonId(null);
  };

  // Handle edit lesson - populate form with existing data
  const handleEditLesson = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    setTitle(lesson.title);
    setSystemPrompt(lesson.systemPrompt);
    setDurationMinutes(lesson.durationMinutes);
    setImageUrl(lesson.imageUrl);
    setImageStoragePath(null); // We don't have this in LessonData, but that's ok
    setSelectedTemplateId('');
    setEditingLessonId(lessonId);
    setShowCreateModal(true);
  };

  const handleSaveLesson = async () => {
    if (!title.trim() || !systemPrompt.trim()) {
      alert('Please fill in title and system prompt');
      return;
    }

    setSaving(true);
    try {
      if (editingLessonId) {
        // Update existing lesson - build update object without undefined values
        const updateData: Record<string, unknown> = {
          id: editingLessonId,
          title: title.trim(),
          scenario: systemPrompt.trim(),
          systemPrompt: systemPrompt.trim(),
          durationMinutes: durationMinutes,
          functionCallingEnabled: true, // Always enabled
        };

        // Only include optional fields if they have values
        if (imageUrl) updateData.imageUrl = imageUrl;
        if (imageStoragePath) updateData.imageStoragePath = imageStoragePath;

        await updateMission(updateData as Parameters<typeof updateMission>[0]);

        // Update local state
        setLessons(prev => prev.map(l =>
          l.id === editingLessonId
            ? {
                ...l,
                title: title.trim(),
                systemPrompt: systemPrompt.trim(),
                durationMinutes: durationMinutes,
                imageUrl: imageUrl,
              }
            : l
        ));
      } else {
        // Create new lesson
        const newMission = await createMission({
          teacherId: user?.uid || 'anonymous',
          teacherName: user?.displayName || 'Teacher',
          title: title.trim(),
          scenario: systemPrompt.trim(), // Keep for backwards compatibility
          systemPrompt: systemPrompt.trim(),
          durationMinutes: durationMinutes,
          tone: 'friendly', // Default tone
          vocabList: [], // No more vocab
          imageUrl: imageUrl || undefined,
          imageStoragePath: imageStoragePath || undefined,
          functionCallingEnabled: true, // Always enabled
          isActive: true,
        });

        // Add to local state
        setLessons(prev => [{
          id: newMission.id,
          title: newMission.title,
          systemPrompt: newMission.systemPrompt || newMission.scenario,
          durationMinutes: newMission.durationMinutes || 15,
          imageUrl: newMission.imageUrl || null,
          functionCallingEnabled: newMission.functionCallingEnabled ?? true,
          assignedGroups: newMission.groupId ? [newMission.groupId] : [],
          status: 'published',
          completionRate: 0,
          studentsCompleted: 0,
          totalStudents: 0,
        }, ...prev]);
      }

      setShowCreateModal(false);
      resetForm();
    } catch (error: unknown) {
      console.error('Error saving lesson:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save lesson: ${errorMessage}`);
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
                onEdit={() => handleEditLesson(lesson.id)}
                onDelete={() => handleDeleteLesson(lesson.id)}
                onDuplicate={() => {
                  // Duplicate by opening create modal with copied data
                  setTitle(lesson.title + ' (Copy)');
                  setSystemPrompt(lesson.systemPrompt);
                  setDurationMinutes(lesson.durationMinutes);
                  setImageUrl(lesson.imageUrl);
                  setEditingLessonId(null); // Not editing, creating new
                  setShowCreateModal(true);
                }}
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

      {/* Create/Edit Lesson Modal */}
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
          onClick={() => {
            setShowCreateModal(false);
            resetForm();
          }}
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
                {editingLessonId ? 'Edit Lesson' : 'Create New Lesson'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
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

            {/* Prompt Template Selector */}
            {promptTemplates.length > 0 && (
              <SelectField
                label="Load from Template"
                options={[
                  { value: '', label: 'Start from scratch' },
                  ...promptTemplates.map(t => ({ value: t.id, label: t.name })),
                ]}
                value={selectedTemplateId}
                onChange={handleTemplateSelect}
              />
            )}

            {/* System Prompt - Main input */}
            <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(4px, 1vw, 6px)' }}>
                <label
                  style={{
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    fontWeight: 500,
                    color: AppColors.textSecondary,
                  }}
                >
                  System Prompt
                </label>
                <button
                  onClick={() => setShowSaveTemplateModal(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: AppColors.accentPurple,
                    fontSize: 'clamp(11px, 2.2vw, 12px)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  Save as Template
                </button>
              </div>
              <textarea
                placeholder="Enter the complete system prompt for Gemini. This defines how the AI will behave during the lesson..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 'clamp(150px, 30vw, 200px)',
                  background: AppColors.surfaceLight,
                  border: `1px solid ${AppColors.borderColor}`,
                  borderRadius: 'clamp(8px, 2vw, 12px)',
                  padding: 'clamp(10px, 2.5vw, 14px)',
                  color: AppColors.textPrimary,
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />
              <p style={{
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                color: AppColors.textSecondary,
                margin: 'clamp(4px, 1vw, 6px) 0 0 0',
              }}>
                This is the full instruction set for the AI tutor. Include personality, scenario, and teaching style.
              </p>
            </div>

            {/* Duration */}
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
                Session Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.min(60, Math.max(1, parseInt(e.target.value) || 15)))}
                style={{
                  width: '120px',
                  height: 'clamp(40px, 8vw, 48px)',
                  background: AppColors.surfaceLight,
                  border: `1px solid ${AppColors.borderColor}`,
                  borderRadius: 'clamp(8px, 2vw, 12px)',
                  padding: '0 clamp(10px, 2.5vw, 14px)',
                  color: AppColors.textPrimary,
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  textAlign: 'center',
                }}
              />
            </div>

            {/* Image Upload */}
            <ImageUpload
              imageUrl={imageUrl}
              storagePath={imageStoragePath}
              onUpload={(url, path) => {
                setImageUrl(url);
                setImageStoragePath(path);
              }}
              onRemove={() => {
                setImageUrl(null);
                setImageStoragePath(null);
              }}
              teacherId={user?.uid || 'anonymous'}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'clamp(10px, 2.5vw, 12px)', marginTop: 'clamp(20px, 5vw, 28px)' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
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
                Cancel
              </button>
              <button
                onClick={handleSaveLesson}
                disabled={saving || isUploading}
                style={{
                  flex: 1,
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                  border: 'none',
                  borderRadius: 'clamp(10px, 2.5vw, 14px)',
                  color: AppColors.textDark,
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  fontWeight: 600,
                  cursor: saving || isUploading ? 'not-allowed' : 'pointer',
                  opacity: saving || isUploading ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : editingLessonId ? 'Update Lesson' : 'Create Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
          onClick={() => setShowSaveTemplateModal(false)}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '400px',
              background: AppColors.surfaceDark,
              borderRadius: 'clamp(12px, 3vw, 16px)',
              padding: 'clamp(20px, 5vw, 28px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: 'clamp(16px, 3.5vw, 18px)',
                fontWeight: 600,
                marginBottom: 'clamp(16px, 4vw, 20px)',
                margin: '0 0 clamp(16px, 4vw, 20px) 0',
              }}
            >
              Save as Template
            </h3>
            <InputField
              label="Template Name"
              placeholder="e.g., Coffee Shop Roleplay"
              value={newTemplateName}
              onChange={setNewTemplateName}
            />
            <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 10px)', marginTop: 'clamp(16px, 4vw, 20px)' }}>
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setNewTemplateName('');
                }}
                style={{
                  flex: 1,
                  padding: 'clamp(10px, 2.5vw, 12px)',
                  background: AppColors.surfaceLight,
                  border: `1px solid ${AppColors.borderColor}`,
                  borderRadius: 'clamp(8px, 2vw, 10px)',
                  color: AppColors.textPrimary,
                  fontSize: 'clamp(14px, 3vw, 15px)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                style={{
                  flex: 1,
                  padding: 'clamp(10px, 2.5vw, 12px)',
                  background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                  border: 'none',
                  borderRadius: 'clamp(8px, 2vw, 10px)',
                  color: AppColors.textDark,
                  fontSize: 'clamp(14px, 3vw, 15px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
