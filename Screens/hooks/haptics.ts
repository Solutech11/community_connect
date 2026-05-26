import * as Haptics from 'expo-haptics';

export async function lightTap() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    return;
  }
}
