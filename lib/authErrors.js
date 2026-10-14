const AUTH_MESSAGE_KEYS = {
  "auth/configuration-not-found": "auth.configuration",
  "auth/email-already-in-use": "auth.emailInUse",
  "auth/invalid-credential": "auth.invalidCredential",
  "auth/wrong-password": "auth.invalidCredential",
  "auth/user-not-found": "auth.invalidCredential",
  "auth/weak-password": "auth.weakPassword",
  "auth/invalid-email": "auth.invalidEmail",
  "auth/too-many-requests": "auth.tooManyRequests",
  "auth/expired-action-code": "auth.invalidReset",
  "auth/invalid-action-code": "auth.invalidReset",
};

export function authErrorKey(error) {
  return AUTH_MESSAGE_KEYS[error?.code] ?? "generic";
}

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

  if (code === "auth/too-many-requests") {
    return "Too many attempts. Wait a minute and try again.";
  }

  if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
    return "This reset link is invalid or has expired. Request a new one.";
  }

  return error?.message ?? "Something went wrong. Try again.";
}
