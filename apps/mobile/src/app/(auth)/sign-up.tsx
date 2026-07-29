import { useState } from "react";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  OutlinedTextField,
  Row,
  Text,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { authClient } from "@/auth/client";
import {
  signUpSchema,
  type SignUpValues,
} from "@/auth/schemas";
import { colors } from "@/theme";
import { AuthScreen } from "@/components/auth/auth-screen";

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
    >
      <OutlinedTextField
        value={name}
        singleLine
        enabled={!isSubmitting}
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
        enabled={!isSubmitting}
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
          <Text>you@example.com</Text>
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
        enabled={!isSubmitting}
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

      <Button
        enabled={!isSubmitting}
        onClick={() => void onSubmit()}
        colors={{
          containerColor: colors.primary,
          contentColor: colors.primaryForeground,
          disabledContainerColor: "#5c3d00",
          disabledContentColor: "#1a1a1a",
        }}
        modifiers={[fillMaxWidth()]}
      >
        <Text style={{ fontWeight: "600" }}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Text>
      </Button>

      <Row
        horizontalArrangement="center"
        verticalAlignment="center"
        modifiers={[fillMaxWidth()]}
      >
        <Text color={colors.muted} style={{ fontSize: 14 }}>
          Already have an account?
        </Text>
        <TextButton
          enabled={!isSubmitting}
          contentPadding={{ start: 4, top: 0, end: 0, bottom: 0 }}
          onClick={() => router.push("/sign-in")}
        >
          <Text color={colors.primary} style={{ fontSize: 14, fontWeight: "600" }}>
            Sign in
          </Text>
        </TextButton>
      </Row>
    </AuthScreen>
  );
}

export default SignUpForm;
