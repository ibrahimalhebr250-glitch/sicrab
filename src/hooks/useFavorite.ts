import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useFavorite(listingId: string, userId: string | undefined) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !listingId) return;
    supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .maybeSingle()
      .then(({ data }) => setIsFavorited(!!data));
  }, [userId, listingId]);

  const toggle = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!userId) {
      window.location.href = '/login';
      return;
    }
    setLoading(true);
    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);
      setIsFavorited(false);
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: userId, listing_id: listingId });
      setIsFavorited(true);
    }
    setLoading(false);
  }, [userId, listingId, isFavorited]);

  return { isFavorited, toggle, loading };
}
