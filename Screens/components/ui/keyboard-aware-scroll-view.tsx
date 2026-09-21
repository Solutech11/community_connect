import type { ComponentProps } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

type Props = ComponentProps<typeof ScrollView> & {
  keyboardVerticalOffset?: number;
};

export default function KeyboardAwareScrollView({
  keyboardVerticalOffset = 0,
  ...props
}: Props) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.container}
    >
      <ScrollView {...props} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
