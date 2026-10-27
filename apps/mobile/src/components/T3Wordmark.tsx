import type { ColorValue } from "react-native";
import { useColorScheme } from "react-native";
import { Image } from "expo-image";

export function T3Wordmark(props: {
  readonly height: number;
  readonly color?: ColorValue;
  readonly colorClassName?: string;
}) {
  const dark = useColorScheme() === "dark";
  return (
    <Image
      accessibilityLabel="atQor"
      source={
        dark
          ? require("../../../../assets/atqor/logo-dark.png")
          : require("../../../../assets/atqor/logo.png")
      }
      contentFit="contain"
      style={{ height: props.height, width: (props.height * 300) / 76 }}
    />
  );
}
