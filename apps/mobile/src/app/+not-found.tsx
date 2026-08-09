import { Redirect } from "expo-router";

/** Fallback when a deep link or web path has no mobile screen. */
export default function NotFound() {
  return <Redirect href="/sign-in" />;
}
