import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: number;
  intensity: string;
  description: string;
}

interface Meal {
  id: string;
  day: string;
  mealType: string;
  name: string;
  calories: number;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface Schedule {
  id: string;
  day: string;
  time: string;
  activity: string;
  duration: number;
  notes?: string;
}

interface TimetableProps {
  workouts: Workout[];
  meals: Meal[];
  schedule: Schedule[];
  view?: 'week' | 'day';
  selectedDay?: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

export function Timetable({
  workouts,
  meals,
  schedule,
  view = 'week',
  selectedDay = 0
}: TimetableProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const getItemsForDayAndTime = (day: string, time: string) => {
    const items = [];

    // Get schedule items
    const scheduleItems = schedule.filter(s => s.day === day && s.time === time);
    items.push(...scheduleItems.map(s => ({ type: 'schedule', data: s })));

    // Get meal items
    const mealItems = meals.filter(m => m.day === day && m.mealType === getMealTypeForTime(time));
    items.push(...mealItems.map(m => ({ type: 'meal', data: m })));

    return items;
  };

  const getMealTypeForTime = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 22) return 'dinner';
    return 'snack';
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'workout':
        return 'bg-blue-100 text-blue-700';
      case 'meal':
        return 'bg-green-100 text-green-700';
      case 'schedule':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isCurrentDayAndTime = (day: string, time: string) => {
    const now = new Date();
    const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return day === currentDay && time === currentTime.slice(0, 5);
  };

  if (view === 'day') {
    const day = DAYS[selectedDay];
    return (
      <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
        <h3 className="font-semibold text-lg mb-4">{day}'s Schedule</h3>
        <div className="space-y-3">
          {TIME_SLOTS.map(time => {
            const items = getItemsForDayAndTime(day, time);
            const isCurrentTime = isCurrentDayAndTime(day, time);

            return (
              <div
                key={time}
                className={`rounded-2xl p-4 ${
                  isCurrentTime
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{time}</span>
                  {isCurrentTime && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Now
                    </span>
                  )}
                </div>

                {items.length > 0 ? (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-2 text-xs ${getColorForType(item.type)}`}
                      >
                        {item.type === 'schedule' && (
                          <div>
                            <p className="font-medium">{item.data.activity}</p>
                            {item.data.duration > 0 && (
                              <p className="opacity-75">{item.data.duration} min</p>
                            )}
                          </div>
                        )}
                        {item.type === 'meal' && (
                          <div>
                            <p className="font-medium">{item.data.name}</p>
                            <p className="opacity-75">{item.data.calories} cal</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No activities scheduled</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Week view
  return (
    <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-neumorphic)]">
      <h3 className="font-semibold text-lg mb-4">Weekly Timetable</h3>

      <div className="space-y-3">
        {DAYS.map(day => {
          const dayItems = schedule.filter(s => s.day === day);
          const dayMeals = meals.filter(m => m.day === day);
          const totalItems = dayItems.length + dayMeals.length;
          const isExpanded = expandedDay === day;

          return (
            <div key={day} className="rounded-2xl bg-muted/40 overflow-hidden">
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/60 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">{day}</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    {totalItems} items
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-border p-4 space-y-2 bg-muted/20">
                  {dayItems.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Schedule</p>
                      <div className="space-y-1">
                        {dayItems.map(item => (
                          <div
                            key={item.id}
                            className="text-xs bg-purple-100 text-purple-700 rounded-lg p-2"
                          >
                            <p className="font-medium">{item.time} - {item.activity}</p>
                            {item.duration > 0 && (
                              <p className="opacity-75">{item.duration} min</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dayMeals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Meals</p>
                      <div className="space-y-1">
                        {dayMeals.map(meal => (
                          <div
                            key={meal.id}
                            className="text-xs bg-green-100 text-green-700 rounded-lg p-2"
                          >
                            <p className="font-medium">{meal.mealType} - {meal.name}</p>
                            <p className="opacity-75">{meal.calories} cal</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalItems === 0 && (
                    <p className="text-xs text-muted-foreground">No activities scheduled</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
