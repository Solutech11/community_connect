import { useState } from 'react';
import { Text, View } from 'react-native';

import Chip from './chip';
import PrimaryButton from './primary-button';
import { colors } from '../../styles/theme';

type Props = {
  data: string[];
  nextLabel: string;
  onNext: () => void;
};

export default function SelectionCard({ data, nextLabel, onNext }: Props) {
  const [selected, setSelected] = useState(() => new Set(data.slice(0, 3)));

  const toggle = (item: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {data.map((item) => (
          <Chip key={item} label={item} selected={selected.has(item)} onPress={() => toggle(item)} />
        ))}
      </View>
      <Text selectable style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
        {selected.size} selected. Choose at least three to tune your recommendations.
      </Text>
      <PrimaryButton label={nextLabel} onPress={onNext} />
    </>
  );
}
