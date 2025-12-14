/**
 * Pronunciation Review Page - Redesigned
 * Premium page for reviewing pronunciation mistakes with audio
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMistakesOfType } from '../hooks/useMistakesByType';
import { ReviewPageLayout, MistakeCard, FilterType } from '../components/progress';

export default function PronunciationReviewPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('unmastered');

  const { items, loading, error } = useMistakesOfType(user?.uid, 'Pronunciation', filter);

  return (
    <ReviewPageLayout
      category="Pronunciation"
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
