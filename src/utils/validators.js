// Lightweight validators used by Route Handlers + forms.
// We avoid pulling in a schema lib for these — they're trivial.

export function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPhone(value) {
  return typeof value === "string" && /^\+?[0-9 ()-]{7,20}$/.test(value);
}

export function isHandle(value) {
  return typeof value === "string" && /^[a-z0-9_.]{3,24}$/i.test(value);
}

export function isNonEmptyString(value, min = 1, max = 1024) {
  return (
    typeof value === "string" &&
    value.trim().length >= min &&
    value.trim().length <= max
  );
}

// Returns null if valid, otherwise the first error message.
export function validateRegister({ name, handle, password, email, phone }) {
  if (!isNonEmptyString(name, 1, 60)) return "Name is required";
  if (!isHandle(handle))
    return "Username can be 3–24 chars of letters, numbers, dot or underscore";
  if (!isNonEmptyString(password, 6, 128))
    return "Password must be at least 6 characters";
  if (!email && !phone) return "Email or phone is required";
  if (email && !isEmail(email)) return "Invalid email";
  if (phone && !isPhone(phone)) return "Invalid phone";
  return null;
}

export function validateLogin({ identifier, password }) {
  if (!isNonEmptyString(identifier)) return "Email or phone is required";
  if (!isNonEmptyString(password)) return "Password is required";
  return null;
}
