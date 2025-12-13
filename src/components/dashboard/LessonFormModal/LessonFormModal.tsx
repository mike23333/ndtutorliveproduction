import React, { useState, useEffect, useRef } from 'react';
import { AppColors } from '../../../theme/colors';
import { XIcon } from '../../../theme/icons';
import { ProgressBar } from './ProgressBar';
import { StepIndicator } from './StepIndicator';
import { StepNavigation } from './StepNavigation';
import { CollapsibleSection } from './CollapsibleSection';
import { StepEssence, getEssenceSummary } from './steps/StepEssence';
import { StepIntelligence, getIntelligenceSummary } from './steps/StepIntelligence';
import { StepAudience, getAudienceSummary } from './steps/StepAudience';
import type { LessonFormData, LessonTask } from '../../../types/dashboard';
import type { PromptTemplateDocument, ProficiencyLevel, UserDocument } from '../../../types/firestore';

interface CollectionOption {
  id: string;
  title: string;
}

interface LessonFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: LessonFormData;
  onClose: () => void;
  onSave: () => Promise<void>;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onSystemPromptChange: (prompt: string) => void;
  onDurationChange: (duration: number) => void;
  onTargetLevelChange: (level: ProficiencyLevel | null) => void;
  onFirstLessonChange: (isFirst: boolean) => void;
  onImageUpload: (url: string, path: string) => void;
  onImageRemove: () => void;
  teacherId: string;
  saving: boolean;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  promptTemplates: PromptTemplateDocument[];
  selectedTemplateId: string;
  onTemplateSelect: (id: string) => void;
  onSaveAsTemplate: () => void;
  privateStudents?: UserDocument[];
  onAssignedStudentsChange?: (studentIds: string[]) => void;
  onTasksChange?: (tasks: LessonTask[]) => void;
  collections?: CollectionOption[];
  onCollectionChange?: (collectionId: string | null) => void;
  onShowOnHomepageChange?: (show: boolean) => void;
}

type StepNumber = 1 | 2 | 3;

export const LessonFormModal: React.FC<LessonFormModalProps> = ({
  isOpen,
  isEditing,
  formData,
  onClose,
  onSave,
  onTitleChange,
  onDescriptionChange,
  onSystemPromptChange,
  onDurationChange,
  onTargetLevelChange,
  onFirstLessonChange,
  onImageUpload,
  onImageRemove,
  teacherId,
  saving,
  isUploading,
  setIsUploading,
  promptTemplates,
  selectedTemplateId,
  onTemplateSelect,
  onSaveAsTemplate,
  privateStudents = [],
  onAssignedStudentsChange,
  onTasksChange,
  collections = [],
  onCollectionChange,
  onShowOnHomepageChange,
}) => {
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [expandedSections, setExpandedSections] = useState({
    essence: true,
    intelligence: false,
    audience: false,
  });
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const mode = isEditing ? 'edit' : 'create';

  // Reset step when opening in create mode
  useEffect(() => {
    if (isOpen && !isEditing) {
      setCurrentStep(1);
    }
  }, [isOpen, isEditing]);

  // Focus first input when step changes (create mode)
  useEffect(() => {
    if (mode === 'create' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 200);
    }
  }, [currentStep, mode]);

  if (!isOpen) return null;

  // Validation
  const canProceedFromStep1 = Boolean(formData.title.trim() && formData.description.trim());
  const canProceedFromStep2 = Boolean(formData.systemPrompt.trim());
  const canCreate = canProceedFromStep1 && canProceedFromStep2;

  const canProceed =
    currentStep === 1 ? canProceedFromStep1 : currentStep === 2 ? canProceedFromStep2 : canCreate;

  // Progress calculation
  const progress: 33 | 66 | 100 = mode === 'edit' ? 100 : currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  // Navigation handlers
  const handleContinue = () => {
    if (currentStep < 3 && canProceed) {
      setSlideDirection('right');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) as StepNumber);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setSlideDirection('left');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => (prev - 1) as StepNumber);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const toggleSection = (section: 'essence' | 'intelligence' | 'audience') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Step content for create mode
  const renderCreateModeStep = () => {
    const stepStyle: React.CSSProperties = {
      opacity: isTransitioning ? 0 : 1,
      transform: isTransitioning
        ? `translateX(${slideDirection === 'right' ? '-20px' : '20px'})`
        : 'translateX(0)',
      transition: 'opacity 150ms ease, transform 150ms ease',
    };

    switch (currentStep) {
      case 1:
        return (
          <div style={stepStyle}>
            <StepEssence
              formData={formData}
              onTitleChange={onTitleChange}
              onDescriptionChange={onDescriptionChange}
              onImageUpload={onImageUpload}
              onImageRemove={onImageRemove}
              teacherId={teacherId}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />
          </div>
        );
      case 2:
        return (
          <div style={stepStyle}>
            <StepIntelligence
              formData={formData}
              onSystemPromptChange={onSystemPromptChange}
              onDurationChange={onDurationChange}
              onTasksChange={onTasksChange}
              promptTemplates={promptTemplates}
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={onTemplateSelect}
              onSaveAsTemplate={onSaveAsTemplate}
            />
          </div>
        );
      case 3:
        return (
          <div style={stepStyle}>
            <StepAudience
              formData={formData}
              onTargetLevelChange={onTargetLevelChange}
              onFirstLessonChange={onFirstLessonChange}
              onShowOnHomepageChange={onShowOnHomepageChange}
              onCollectionChange={onCollectionChange}
              onAssignedStudentsChange={onAssignedStudentsChange}
              collections={collections}
              privateStudents={privateStudents}
            />
          </div>
        );
    }
  };

  // Edit mode with collapsible sections
  const renderEditMode = () => (
    <>
      <CollapsibleSection
        title="The Essence"
        summary={getEssenceSummary(formData)}
        expanded={expandedSections.essence}
        onToggle={() => toggleSection('essence')}
        stepNumber={1}
      >
        <StepEssence
          formData={formData}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onImageUpload={onImageUpload}
          onImageRemove={onImageRemove}
          teacherId={teacherId}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="The Intelligence"
        summary={getIntelligenceSummary(formData, selectedTemplateId)}
        expanded={expandedSections.intelligence}
        onToggle={() => toggleSection('intelligence')}
        stepNumber={2}
      >
        <StepIntelligence
          formData={formData}
          onSystemPromptChange={onSystemPromptChange}
          onDurationChange={onDurationChange}
          onTasksChange={onTasksChange}
          promptTemplates={promptTemplates}
          selectedTemplateId={selectedTemplateId}
          onTemplateSelect={onTemplateSelect}
          onSaveAsTemplate={onSaveAsTemplate}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="The Audience"
        summary={getAudienceSummary(formData)}
        expanded={expandedSections.audience}
        onToggle={() => toggleSection('audience')}
        stepNumber={3}
      >
        <StepAudience
          formData={formData}
          onTargetLevelChange={onTargetLevelChange}
          onFirstLessonChange={onFirstLessonChange}
          onShowOnHomepageChange={onShowOnHomepageChange}
          onCollectionChange={onCollectionChange}
          onAssignedStudentsChange={onAssignedStudentsChange}
          collections={collections}
          privateStudents={privateStudents}
        />
      </CollapsibleSection>
    </>
  );

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          background: AppColors.surfaceDark,
          borderRadius: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px) 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar - full width, no padding */}
        <ProgressBar progress={progress} />

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'clamp(20px, 5vw, 28px)',
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'clamp(16px, 4vw, 20px)',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(18px, 4vw, 22px)',
                fontWeight: 700,
                margin: 0,
              }}
            >
              {isEditing ? 'Edit Lesson' : 'Create New Lesson'}
            </h2>
            <button
              onClick={onClose}
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

          {/* Step Indicator (create mode only) */}
          <StepIndicator currentStep={currentStep} mode={mode} />

          {/* Content */}
          {mode === 'create' ? renderCreateModeStep() : renderEditMode()}

          {/* Navigation */}
          <StepNavigation
            currentStep={currentStep}
            mode={mode}
            canProceed={mode === 'edit' ? canCreate : canProceed}
            saving={saving}
            isUploading={isUploading}
            onBack={handleBack}
            onContinue={handleContinue}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
