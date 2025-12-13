import React, { useState, useMemo } from 'react';
import { AppColors } from '../../theme/colors';
import { PlusIcon, LoaderIcon } from '../../theme/icons';
import { useCollections, CollectionWithCount } from '../../hooks/useCollections';
import { useTeacherLessons } from '../../hooks/useTeacherLessons';
import { CollectionCard } from './CollectionCard';
import { CollectionFormModal } from './CollectionFormModal';
import { CollectionDetailView } from './CollectionDetailView';

export const RolePlayTab: React.FC = () => {
  const { collections, loading, error, createCollection, updateCollection, deleteCollection, refetch } = useCollections();
  const { lessons } = useTeacherLessons();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionWithCount | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<CollectionWithCount | null>(null);

  // Map lessons to format expected by LessonPickerModal
  const availableLessons = useMemo(() => {
    return lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      targetLevel: lesson.targetLevel ?? null,
      durationMinutes: lesson.durationMinutes,
      collectionId: lesson.collectionId ?? null,
    }));
  }, [lessons]);

  const handleCreateCollection = () => {
    setEditingCollection(null);
    setShowFormModal(true);
  };

  const handleEditCollection = (collection: CollectionWithCount) => {
    setEditingCollection(collection);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingCollection(null);
  };

  const handleSaveCollection = async (formData: {
    title: string;
    description: string;
    category: string;
    imageUrl: string;
    imageStoragePath: string | null;
    color: string;
    visibility: 'visible' | 'hidden';
  }) => {
    // Convert null to undefined for imageStoragePath (service expects undefined)
    const serviceData = {
      ...formData,
      imageStoragePath: formData.imageStoragePath || undefined,
    };
    if (editingCollection) {
      await updateCollection({
        id: editingCollection.id,
        ...serviceData,
      });
    } else {
      await createCollection(serviceData);
    }
    handleCloseFormModal();
  };

  const handleDeleteCollection = async (collectionId: string) => {
    await deleteCollection(collectionId);
  };

  const handleCollectionClick = (collection: CollectionWithCount) => {
    setSelectedCollection(collection);
  };

  const handleCloseDetailView = () => {
    setSelectedCollection(null);
    refetch(); // Refresh to get updated lesson counts
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(40px, 10vw, 60px)',
        }}
      >
        <LoaderIcon size={24} />
        <span style={{ marginLeft: 8, color: AppColors.textSecondary }}>
          Loading collections...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 'clamp(16px, 4vw, 24px)',
          background: `${AppColors.errorRose}20`,
          borderRadius: 'clamp(8px, 2vw, 12px)',
          color: AppColors.errorRose,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0 }}>Error loading collections: {error}</p>
        <button
          onClick={refetch}
          style={{
            marginTop: 12,
            padding: '8px 16px',
            background: AppColors.errorRose,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show detail view if a collection is selected
  if (selectedCollection) {
    return (
      <CollectionDetailView
        collection={selectedCollection}
        allLessons={availableLessons}
        onClose={handleCloseDetailView}
        onEdit={() => handleEditCollection(selectedCollection)}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'clamp(16px, 4vw, 24px)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'clamp(16px, 3.5vw, 18px)',
              fontWeight: 600,
              margin: 0,
              color: AppColors.textPrimary,
            }}
          >
            Your Collections
          </h2>
          <p
            style={{
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
              margin: 'clamp(4px, 1vw, 6px) 0 0 0',
            }}
          >
            Organize lessons into themed collections for RolePlay practice
          </p>
        </div>

        <button
          onClick={handleCreateCollection}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1vw, 6px)',
            padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
            background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: 'clamp(8px, 2vw, 10px)',
            fontSize: 'clamp(12px, 2.5vw, 14px)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <PlusIcon size={16} />
          New Collection
        </button>
      </div>

      {/* Collections grid */}
      {collections.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'clamp(40px, 10vw, 60px) clamp(16px, 4vw, 24px)',
            background: AppColors.surfaceLight,
            borderRadius: 'clamp(12px, 3vw, 16px)',
            border: `1px dashed ${AppColors.borderColor}`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(36px, 8vw, 48px)',
              marginBottom: 'clamp(12px, 3vw, 16px)',
            }}
          >
            📚
          </div>
          <h3
            style={{
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              color: AppColors.textPrimary,
              margin: '0 0 8px 0',
            }}
          >
            No collections yet
          </h3>
          <p
            style={{
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
              margin: '0 0 16px 0',
            }}
          >
            Create your first collection to organize lessons into themed practice scenarios
          </p>
          <button
            onClick={handleCreateCollection}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <PlusIcon size={16} />
            Create Collection
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(200px, 40vw, 280px), 1fr))',
            gap: 'clamp(12px, 3vw, 16px)',
          }}
        >
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              id={collection.id}
              title={collection.title}
              description={collection.description}
              category={collection.category}
              imageUrl={collection.imageUrl}
              lessonCount={collection.lessonCount}
              color={collection.color}
              onClick={() => handleCollectionClick(collection)}
              onEdit={() => handleEditCollection(collection)}
              onDelete={() => handleDeleteCollection(collection.id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <CollectionFormModal
          collection={editingCollection}
          onSave={handleSaveCollection}
          onClose={handleCloseFormModal}
        />
      )}
    </div>
  );
};
