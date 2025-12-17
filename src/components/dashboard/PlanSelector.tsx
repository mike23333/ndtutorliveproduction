/**
 * Plan Selector Component
 *
 * Custom styled dropdown for changing subscription plans.
 * Better UX than native select with proper positioning and styling.
 * Auto-detects if near bottom of screen and opens upward.
 */

import React, { useState, useRef, useEffect } from 'react';
import { AppColors } from '../../theme/colors';
import { SUBSCRIPTION_PLANS } from '../../constants/subscriptionPlans';
import type { SubscriptionPlan } from '../../types/firestore';

interface PlanSelectorProps {
  currentPlan: SubscriptionPlan;
  onChange: (plan: SubscriptionPlan) => void;
  disabled?: boolean;
  compact?: boolean;
}

const plans: { id: SubscriptionPlan; name: string; limit: string }[] = [
  { id: 'starter', name: 'Starter', limit: '1 hr/week' },
  { id: 'plus', name: 'Plus', limit: '2 hrs/week' },
  { id: 'unlimited', name: 'Unlimited', limit: 'No limit' },
];

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  currentPlan,
  onChange,
  disabled = false,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPlanConfig = SUBSCRIPTION_PLANS[currentPlan];

  // Check if dropdown should open upward
  const checkDropdownPosition = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 200; // Approximate height of dropdown
    const bottomNavHeight = 80; // Height of bottom navigation
    const spaceBelow = window.innerHeight - rect.bottom - bottomNavHeight;

    setOpenUpward(spaceBelow < dropdownHeight);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      checkDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (plan: SubscriptionPlan) => {
    if (plan !== currentPlan) {
      onChange(plan);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: compact ? '6px 12px' : '8px 14px',
          borderRadius: '10px',
          border: `1px solid ${currentPlanConfig.color}50`,
          background: `${currentPlanConfig.color}15`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {/* Plan color dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: currentPlanConfig.color,
          }}
        />
        <span
          style={{
            fontSize: compact ? '12px' : '13px',
            fontWeight: 600,
            color: currentPlanConfig.color,
          }}
        >
          {currentPlanConfig.name}
        </span>
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={currentPlanConfig.color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen
              ? (openUpward ? 'rotate(0deg)' : 'rotate(180deg)')
              : (openUpward ? 'rotate(180deg)' : 'rotate(0deg)'),
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            ...(openUpward
              ? { bottom: 'calc(100% + 6px)' }
              : { top: 'calc(100% + 6px)' }
            ),
            right: 0,
            minWidth: '180px',
            background: AppColors.bgSecondary,
            border: `1px solid ${AppColors.borderColor}`,
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: openUpward ? 'dropdownFadeInUp 0.15s ease-out' : 'dropdownFadeIn 0.15s ease-out',
          }}
        >
          <style>
            {`
              @keyframes dropdownFadeIn {
                from {
                  opacity: 0;
                  transform: translateY(-8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes dropdownFadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          </style>

          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: `1px solid ${AppColors.borderColor}`,
              fontSize: '11px',
              fontWeight: 600,
              color: AppColors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Select Plan
          </div>

          {/* Options */}
          {plans.map((plan) => {
            const planConfig = SUBSCRIPTION_PLANS[plan.id];
            const isSelected = plan.id === currentPlan;

            return (
              <button
                key={plan.id}
                onClick={() => handleSelect(plan.id)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: isSelected ? `${planConfig.color}15` : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {/* Color dot */}
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: planConfig.color,
                    flexShrink: 0,
                  }}
                />

                {/* Plan info */}
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: isSelected ? planConfig.color : AppColors.textPrimary,
                    }}
                  >
                    {plan.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: AppColors.textSecondary,
                      marginTop: '2px',
                    }}
                  >
                    {plan.limit}
                  </div>
                </div>

                {/* Checkmark for selected */}
                {isSelected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={planConfig.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanSelector;
