export function calcBMI(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 0;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-warning" };
  if (bmi < 25) return { label: "Healthy", color: "text-success" };
  if (bmi < 30) return { label: "Overweight", color: "text-warning" };
  return { label: "Obese", color: "text-destructive" };
}

export function calcAge(dob: string): number {
  if (!dob) return 0;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

const ACTIVITY_MULT: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcTDEE(opts: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string;
  activityLevel: string;
}): number {
  const { weightKg, heightCm, age, gender, activityLevel } = opts;
  if (!weightKg || !heightCm || !age) return 0;
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "female" ? base - 161 : base + 5;
  const mult = ACTIVITY_MULT[activityLevel] ?? 1.375;
  return Math.round(bmr * mult);
}
