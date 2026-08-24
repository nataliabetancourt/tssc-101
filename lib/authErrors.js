export function firebaseAuthMessage(error) {
  const code = error?.code;

  if (code === "auth/configuration-not-found") {
    return "Email/password sign-in is not enabled yet. In Firebase Console, open Authentication, click Get started if needed, then enable Email/Password.";
  }

  if (code === "auth/email-already-in-use") {
    return "An account with this email already exists. Try logging in.";
  }

  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Email or password is incorrect.";
  }

  if (code === "auth/weak-password") {
    return "Password must be at least 6 characters.";
  }

  if (code === "auth/invalid-email") {
    return "Enter a valid email address.";
  }

  return error?.message ?? "Something went wrong. Try again.";
}
