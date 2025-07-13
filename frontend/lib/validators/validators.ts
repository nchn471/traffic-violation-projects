// lib/validators/violation.ts

export function validateLicensePlate(plate: string): string | null {
  if (!plate.trim()) return "License plate is required";
  if (!/^[A-Z0-9-]+$/i.test(plate))
    return "Only letters, numbers, and hyphens allowed";
  if (plate.length < 5 || plate.length > 20)
    return "License plate must be 5–20 characters";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return "Invalid email address";
  return null;
}

export function validateAmount(amount: number): string | null {
  if (isNaN(amount)) return "Amount must be a number";
  if (amount <= 0) return "Amount must be greater than zero";
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return "Name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  return null;
}
