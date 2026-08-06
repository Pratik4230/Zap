import { useState } from "react";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  OutlinedTextField,
  Text,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AuthSwitchLink } from "@/features/auth/components/auth-switch-link";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { authClient } from "@/features/auth/utils/client";
import { signUpSchema, type SignUpValues } from "@/features/auth/utils/schemas";
import { colors } from "@/global/theme";

function SignUpForm() {
  const name = useNativeState("");
  const email = useNativeState("");
  const password = useNativeState("");

  const {
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onChange",
  });

  const [serverError, setServerError] = useState("");
  const [oauthBusy, setOauthBusy] = useState(false);
  const formBusy = isSubmitting || oauthBusy;

  function syncFromNative() {
    setValue("name", name.get().trim(), { shouldValidate: false });
    setValue("email", email.get().trim(), { shouldValidate: false });
    setValue("password", password.get(), { shouldValidate: false });
  }

  const onValid = handleSubmit(async (values) => {
    setServerError("");

    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(error.message ?? "Something went wrong");
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
  });

  async function onSubmit() {
    syncFromNative();
    await onValid();
  }

  return (
    <AuthScreen
      title="Create an account"
      subtitle="Start shortening links in seconds"
      footer={
        <>
          <AuthPrimaryButton
            label="Create account"
            loadingLabel="Creating account…"
            loading={isSubmitting}
            enabled={!formBusy}
            onPress={() => void onSubmit()}
          />
          <GoogleSignInButton
            enabled={!formBusy}
            onBusyChange={setOauthBusy}
            onError={setServerError}
          />
          <AuthSwitchLink
            prompt="Already have an account?"
            actionLabel="Sign in"
            enabled={!formBusy}
            onPress={() => router.push("/sign-in")}
          />
        </>
      }
    >
      <OutlinedTextField
        value={name}
        singleLine
        enabled={!formBusy}
        isError={!!errors.name}
        onValueChange={(value) =>
          setValue("name", value, { shouldValidate: true })
        }
        keyboardOptions={{
          keyboardType: "text",
          capitalization: "words",
          imeAction: "next",
        }}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField.Label>
          <Text>Name</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.Placeholder>
          <Text>Your name</Text>
        </OutlinedTextField.Placeholder>
        {errors.name ? (
          <OutlinedTextField.SupportingText>
            <Text>{errors.name.message}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>

      <OutlinedTextField
        value={email}
        singleLine
        enabled={!formBusy}
        isError={!!errors.email}
        onValueChange={(value) =>
          setValue("email", value, { shouldValidate: true })
        }
        keyboardOptions={{
          keyboardType: "email",
          capitalization: "none",
          autoCorrectEnabled: false,
          imeAction: "next",
        }}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField.Label>
          <Text>Email</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.Placeholder>
          <Text>Enter Your Email</Text>
        </OutlinedTextField.Placeholder>
        {errors.email ? (
          <OutlinedTextField.SupportingText>
            <Text>{errors.email.message}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>

      <OutlinedTextField
        value={password}
        singleLine
        enabled={!formBusy}
        isError={!!errors.password}
        visualTransformation="password"
        onValueChange={(value) =>
          setValue("password", value, { shouldValidate: true })
        }
        keyboardOptions={{
          keyboardType: "password",
          capitalization: "none",
          autoCorrectEnabled: false,
          imeAction: "done",
        }}
        keyboardActions={{ onDone: () => void onSubmit() }}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField.Label>
          <Text>Password</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.Placeholder>
          <Text>At least 8 characters</Text>
        </OutlinedTextField.Placeholder>
        {errors.password ? (
          <OutlinedTextField.SupportingText>
            <Text>{errors.password.message}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>

      {serverError ? (
        <Text color={colors.destructive} style={{ fontSize: 13 }}>
          {serverError}
        </Text>
      ) : null}

    </AuthScreen>
  );
}

export default SignUpForm;
