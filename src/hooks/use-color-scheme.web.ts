import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

const subscribe = (onChange: () => void) => {
  const subscription = Appearance.addChangeListener(onChange);
  return () => subscription.remove();
};
const getSnapshot = () => Appearance.getColorScheme();
const getServerSnapshot = () => 'light';

export function useColorScheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
