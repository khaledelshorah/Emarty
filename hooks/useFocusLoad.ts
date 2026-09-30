import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { errorMessage } from '@/lib/errors';

/**
 * يحمّل البيانات عند كل دخول للشاشة، ويحتفظ بآخر بيانات ناجحة أثناء إعادة التحميل،
 * ويتجاهل الردود المتأخرة (race) ويعرض الخطأ بدل الدوران للأبد.
 */
export function useFocusLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const reqId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++reqId.current;
    try {
      const result = await loaderRef.current();
      if (id === reqId.current) { setData(result); setError(null); }
    } catch (e) {
      if (id === reqId.current) setError(errorMessage(e));
      console.warn(e);
    } finally {
      if (id === reqId.current) setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const refresh = useCallback(async () => { setRefreshing(true); await reload(); }, [reload]);

  return { data, error, refreshing, reload, refresh };
}
