import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const DIET_TYPES = [
  "Vegan",
  "Vegetarian",
  "Pescatarian",
  "Keto",
  "Paleo",
  "Gluten-Free",
  "Dairy-Free",
  "Halal",
  "Kosher",
  "Low-Carb",
  "High-Protein",
  "Mediterranean",
];

interface DietaryPreferencesSelectorProps {
  selected: string[];
  onChange: (preferences: string[]) => void;
  showPrompt?: boolean;
}

export function DietaryPreferencesSelector({
  selected,
  onChange,
  showPrompt = true,
}: DietaryPreferencesSelectorProps) {
  const toggle = (diet: string) => {
    if (selected.includes(diet)) {
      onChange(selected.filter((d) => d !== diet));
    } else {
      onChange([...selected, diet]);
    }
  };

  return (
    <div className="space-y-4">
      {showPrompt && selected.length === 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">Set your dietary preferences</p>
            <p className="mt-1 text-xs opacity-90">
              This helps us generate meal plans tailored to your lifestyle.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {DIET_TYPES.map((diet) => (
          <Button
            key={diet}
            variant={selected.includes(diet) ? "default" : "outline"}
            size="sm"
            onClick={() => toggle(diet)}
            className="rounded-full"
          >
            {diet}
          </Button>
        ))}
      </div>
    </div>
  );
}
