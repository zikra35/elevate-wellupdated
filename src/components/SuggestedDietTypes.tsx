import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DIET_TYPES = [
  {
    name: "Mediterranean",
    description: "Heart-healthy diet rich in olive oil, fish, and vegetables",
    tags: ["Vegetarian", "Pescatarian", "Mediterranean"],
  },
  {
    name: "Intermittent Fasting",
    description: "Eat within specific time windows to optimize metabolism",
    tags: ["Low-Carb", "High-Protein"],
  },
  {
    name: "DASH",
    description: "Designed to lower blood pressure with whole foods",
    tags: ["Vegetarian", "Gluten-Free", "Low-Carb"],
  },
];

interface SuggestedDietTypesProps {
  onSelectDiet: (tags: string[]) => Promise<void>;
}

export function SuggestedDietTypes({ onSelectDiet }: SuggestedDietTypesProps) {
  const handleTryDiet = async (tags: string[]) => {
    try {
      await onSelectDiet(tags);
      toast.success("Diet preferences updated!");
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };

  return (
    <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
      <h3 className="font-display text-xl font-bold mb-4">Suggested Diet Types</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {DIET_TYPES.map((diet) => (
          <div
            key={diet.name}
            className="rounded-2xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-4 hover:shadow-md transition-shadow"
          >
            <h4 className="font-display font-bold text-lg">{diet.name}</h4>
            <p className="text-sm text-muted-foreground mt-2">{diet.description}</p>
            <div className="flex flex-wrap gap-1 mt-3 mb-4">
              {diet.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => handleTryDiet(diet.tags)}
            >
              Try this diet
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
