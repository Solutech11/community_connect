import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IconName;
  color?: string;
  size?: number;
};

export type AppIconName = IconName;

export default function AppIcon({ name, color = '#07130d', size = 20 }: Props) {
  return <Ionicons name={name} color={color} size={size} />;
}
