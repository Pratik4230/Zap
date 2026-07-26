import { StatusBar } from "expo-status-bar";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-black">
      <Text className="mb-3 text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
        Xaply
      </Text>
      <Text className="mb-8 text-center text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
        Mobile app scaffold. Explore Expo UI Jetpack Compose components below.
      </Text>

      <Link href="/expo-ui" asChild>
        <Pressable className="rounded-lg bg-neutral-900 px-5 py-3 dark:bg-white">
          <Text className="font-semibold text-white dark:text-neutral-900">
            Open Expo UI gallery
          </Text>
        </Pressable>
      </Link>

      <StatusBar style="auto" />
    </View>
  );
}
