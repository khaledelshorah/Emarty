import { Redirect } from 'expo-router';
import { useSession } from '@/hooks/useSession';
import { Loading } from '@/components/ui';

export default function Index() {
  const { session, loading } = useSession();
  if (loading) return <Loading />;
  return <Redirect href={session ? '/(tabs)/' : '/(auth)/login'} />;
}
