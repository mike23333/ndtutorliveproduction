import React from 'react';
import { AppColors } from '../../theme/colors';
import { EditIcon, TrashIcon } from '../../theme/icons';

interface CollectionCardProps {
  id: string;
  title: string;
  description?: string;
  category: string;
  imageUrl: string;
  lessonCount: number;
  color?: string;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  title,
  description,
  category,
  imageUrl,
  lessonCount,
  color,
  onClick,
  onEdit,
  onDelete,
}) => {
  const actionButtonStyle: React.CSSProperties = {
    width: 'clamp(28px, 5vw, 32px)',
    height: 'clamp(28px, 5vw, 32px)',
    background: 'rgba(0,0,0,0.3)',
    border: 'none',
    borderRadius: 'clamp(6px, 1.5vw, 8px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    backdropFilter: 'blur(4px)',
    transition: 'background 0.2s ease',
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this collection?')) {
      onDelete();
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: AppColors.surfaceLight,
        borderRadius: 'clamp(12px, 3vw, 16px)',
        overflow: 'hidden',
        border: `1px solid ${AppColors.borderColor}`,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image section */}
      <div
        style={{
          position: 'relative',
          height: 'clamp(100px, 25vw, 140px)',
          background: color ? `linear-gradient(135deg, ${color}88 0%, ${color}44 100%)` : AppColors.surfaceMedium,
        }}
      >
        <img
          src={imageUrl}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            // Hide image on error, show color background
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* Action buttons overlay */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(8px, 2vw, 12px)',
            right: 'clamp(8px, 2vw, 12px)',
            display: 'flex',
            gap: 'clamp(4px, 1vw, 6px)',
          }}
        >
          <button
            onClick={handleEdit}
            style={actionButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            }}
          >
            <EditIcon size={14} />
          </button>
          <button
            onClick={handleDelete}
            style={{
              ...actionButtonStyle,
              color: AppColors.errorRose,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            }}
          >
            <TrashIcon size={14} />
          </button>
        </div>

        {/* Category badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(8px, 2vw, 12px)',
            left: 'clamp(8px, 2vw, 12px)',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            padding: 'clamp(3px, 0.8vw, 4px) clamp(8px, 2vw, 10px)',
            borderRadius: 'clamp(4px, 1vw, 6px)',
            fontSize: 'clamp(10px, 2vw, 11px)',
            color: 'white',
            fontWeight: 500,
          }}
        >
          {category}
        </div>
      </div>

      {/* Content section */}
      <div
        style={{
          padding: 'clamp(12px, 3vw, 16px)',
        }}
      >
        <h3
          style={{
            fontSize: 'clamp(14px, 3vw, 16px)',
            fontWeight: 600,
            color: AppColors.textPrimary,
            margin: 0,
            marginBottom: 'clamp(4px, 1vw, 6px)',
          }}
        >
          {title}
        </h3>

        {description && (
          <p
            style={{
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              color: AppColors.textSecondary,
              margin: 0,
              marginBottom: 'clamp(8px, 2vw, 10px)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1vw, 6px)',
          }}
        >
          <span
            style={{
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              color: AppColors.textSecondary,
              background: AppColors.surfaceMedium,
              padding: 'clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px)',
              borderRadius: 'clamp(4px, 1vw, 6px)',
            }}
          >
            {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
          </span>
        </div>
      </div>
    </div>
  );
};
