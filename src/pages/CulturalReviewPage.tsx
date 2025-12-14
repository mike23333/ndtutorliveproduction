/**
 * Cultural Review Page - Redesigned
 * Premium page for reviewing cultural mistakes
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMistakesOfType } from '../hooks/useMistakesByType';
import { ReviewPageLayout, MistakeCard, FilterType } from '../components/progress';

export default function CulturalReviewPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('unmastered');

  const { items, loading, error } = useMistakesOfType(user?.uid, 'Cultural', filter);

  return (
    <ReviewPageLayout
      category="Cultural"
      itemCount={items.length}
      loading={loading}
      error={error}
      filter={filter}
      onFilterChange={setFilter}
    >
      {items.map((item, index) => (
        <MistakeCard
          key={item.id}
          item={item}
          userId={user?.uid || ''}
          showAudioButtons={true}
          index={index}
        />
      ))}
    </ReviewPageLayout>
  );
}
