import type { LucideIcon } from "lucide-react";
import {
  GraduationCap,
  Home,
  Car,
  Plane,
  HeartPulse,
  TrendingUp,
  Users,
  Trophy,
  PiggyBank,
  BookOpen,
  FileText,
  Landmark,
  Wallet,
  UtensilsCrossed,
  CreditCard,
  Building2,
  CalendarOff,
  Sofa,
  Laptop,
  Music,
  Sparkles,
  Palmtree,
  Target,
  LineChart,
  PartyPopper,
  Gift,
  MapPin,
  Flame,
  Coins,
  Briefcase,
  Percent,
  ClipboardCheck,
} from "lucide-react";

export type GoalCategoryId =
  | "education-career"
  | "daily-life"
  | "big-purchases"
  | "lifestyle-fun"
  | "financial-health"
  | "income-growth"
  | "social-life"
  | "challenges";

export type ProgressUnit = "usd" | "days" | "weeks" | "none";

export type PresetGoalDefinition = {
  id: string;
  categoryId: GoalCategoryId;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Suggested target; user can edit when adding */
  defaultTarget: number;
  unit: ProgressUnit;
};

export const GOAL_CATEGORIES: {
  id: GoalCategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
}[] = [
  {
    id: "education-career",
    label: "Education & Career",
    description: "Classes, certs, and your future career",
    icon: GraduationCap,
    accentClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
  },
  {
    id: "daily-life",
    label: "Daily Life & Stability",
    description: "Budgets, food, rent, and peace of mind",
    icon: Home,
    accentClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20",
  },
  {
    id: "big-purchases",
    label: "Big Purchases",
    description: "Wheels, home setup, and gear",
    icon: Car,
    accentClass: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/25",
  },
  {
    id: "lifestyle-fun",
    label: "Lifestyle & Fun",
    description: "Trips, tickets, and joy money",
    icon: Plane,
    accentClass: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/20",
  },
  {
    id: "financial-health",
    label: "Financial Health",
    description: "Safety nets and smarter money habits",
    icon: HeartPulse,
    accentClass: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/25",
  },
  {
    id: "income-growth",
    label: "Income & Growth",
    description: "Earn more and keep more",
    icon: TrendingUp,
    accentClass: "bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/25",
  },
  {
    id: "social-life",
    label: "Social & Life",
    description: "People, gifts, and big life moves",
    icon: Users,
    accentClass: "bg-orange-500/15 text-orange-800 dark:text-orange-200 border-orange-500/25",
  },
  {
    id: "challenges",
    label: "Challenges",
    description: "Quick wins and streaks",
    icon: Trophy,
    accentClass: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 border-indigo-500/25",
  },
];

export const PRESET_GOALS: PresetGoalDefinition[] = [
  // Education & Career
  {
    id: "education-emergency-fund",
    categoryId: "education-career",
    title: "Build an emergency fund",
    description: "Aim for $500–$1,000 so surprises don’t derail you.",
    icon: PiggyBank,
    defaultTarget: 750,
    unit: "usd",
  },
  {
    id: "education-certifications",
    categoryId: "education-career",
    title: "Save for certifications or courses",
    description: "Level up skills with a dedicated course fund.",
    icon: BookOpen,
    defaultTarget: 400,
    unit: "usd",
  },
  {
    id: "education-grad-school",
    categoryId: "education-career",
    title: "Save for grad school applications",
    description: "Fees, tests, and transcripts add up—plan ahead.",
    icon: FileText,
    defaultTarget: 600,
    unit: "usd",
  },
  {
    id: "education-student-loans",
    categoryId: "education-career",
    title: "Prepare for student loan payments",
    description: "Build a buffer before payments kick in.",
    icon: Landmark,
    defaultTarget: 1000,
    unit: "usd",
  },
  // Daily Life & Stability
  {
    id: "daily-monthly-budget",
    categoryId: "daily-life",
    title: "Stick to a monthly budget",
    description: "Track days you stayed on plan this month (goal: 30).",
    icon: Wallet,
    defaultTarget: 30,
    unit: "days",
  },
  {
    id: "daily-eating-out",
    categoryId: "daily-life",
    title: "Reduce eating out spending",
    description: "Shift dollars from restaurants to your goals.",
    icon: UtensilsCrossed,
    defaultTarget: 150,
    unit: "usd",
  },
  {
    id: "daily-cc-debt",
    categoryId: "daily-life",
    title: "Pay off credit card debt",
    description: "Chip away at balances with steady payments.",
    icon: CreditCard,
    defaultTarget: 500,
    unit: "usd",
  },
  {
    id: "daily-rent-utilities",
    categoryId: "daily-life",
    title: "Save for rent and utilities",
    description: "Stay ahead of housing bills with a cushion.",
    icon: Building2,
    defaultTarget: 1200,
    unit: "usd",
  },
  {
    id: "daily-no-spend",
    categoryId: "daily-life",
    title: "No-spend challenge",
    description: "Pick 7, 14, or 30 days—track each day you stay on track.",
    icon: CalendarOff,
    defaultTarget: 14,
    unit: "days",
  },
  // Big Purchases
  {
    id: "big-car",
    categoryId: "big-purchases",
    title: "Save for a car",
    description: "Down payment or reliable wheels—your call.",
    icon: Car,
    defaultTarget: 4000,
    unit: "usd",
  },
  {
    id: "big-apartment",
    categoryId: "big-purchases",
    title: "Save for first apartment / moving out",
    description: "Deposits, movers, and first-month costs.",
    icon: Building2,
    defaultTarget: 2500,
    unit: "usd",
  },
  {
    id: "big-furniture",
    categoryId: "big-purchases",
    title: "Save for furniture",
    description: "Make your space feel like home.",
    icon: Sofa,
    defaultTarget: 800,
    unit: "usd",
  },
  {
    id: "big-laptop",
    categoryId: "big-purchases",
    title: "Save for a laptop or tech upgrade",
    description: "Gear that supports school and side projects.",
    icon: Laptop,
    defaultTarget: 1200,
    unit: "usd",
  },
  // Lifestyle & Fun
  {
    id: "fun-trip",
    categoryId: "lifestyle-fun",
    title: "Save for a trip",
    description: "Flights, stays, and memories—without guilt.",
    icon: Palmtree,
    defaultTarget: 800,
    unit: "usd",
  },
  {
    id: "fun-concerts",
    categoryId: "lifestyle-fun",
    title: "Save for concerts/events",
    description: "Tickets and fun nights out, funded on purpose.",
    icon: Music,
    defaultTarget: 200,
    unit: "usd",
  },
  {
    id: "fun-money",
    categoryId: "lifestyle-fun",
    title: "Build a “fun money” fund",
    description: "Spending you can enjoy with zero stress.",
    icon: Sparkles,
    defaultTarget: 300,
    unit: "usd",
  },
  {
    id: "fun-hobbies",
    categoryId: "lifestyle-fun",
    title: "Save for hobbies",
    description: "Sports, art, gaming—fund what recharges you.",
    icon: Target,
    defaultTarget: 250,
    unit: "usd",
  },
  // Financial Health
  {
    id: "health-emergency-1k",
    categoryId: "financial-health",
    title: "Build a $1,000 emergency fund",
    description: "The classic first safety net milestone.",
    icon: PiggyBank,
    defaultTarget: 1000,
    unit: "usd",
  },
  {
    id: "health-10k",
    categoryId: "financial-health",
    title: "Save your first $10,000",
    description: "A bigger cushion for real independence.",
    icon: LineChart,
    defaultTarget: 10000,
    unit: "usd",
  },
  {
    id: "health-invest-500",
    categoryId: "financial-health",
    title: "Start investing (first $500)",
    description: "Get in the game with a starter investing pot.",
    icon: TrendingUp,
    defaultTarget: 500,
    unit: "usd",
  },
  {
    id: "health-credit-score",
    categoryId: "financial-health",
    title: "Improve credit score",
    description: "Save toward fees, secured deposits, or paydowns that help your score.",
    icon: LineChart,
    defaultTarget: 300,
    unit: "usd",
  },
  {
    id: "health-track-30",
    categoryId: "financial-health",
    title: "Track spending for 30 days",
    description: "Log each day you review your spending.",
    icon: ClipboardCheck,
    defaultTarget: 30,
    unit: "days",
  },
  // Income & Growth
  {
    id: "income-plus",
    categoryId: "income-growth",
    title: "Increase income by $X/month",
    description: "Set a raise, gig, or hourly goal—track extra income saved.",
    icon: Coins,
    defaultTarget: 200,
    unit: "usd",
  },
  {
    id: "income-side-hustle",
    categoryId: "income-growth",
    title: "Save from a side hustle",
    description: "Every hustle dollar you stash counts.",
    icon: Briefcase,
    defaultTarget: 300,
    unit: "usd",
  },
  {
    id: "income-20pct",
    categoryId: "income-growth",
    title: "Save 20% of income",
    description: "Set a monthly savings target that matches ~20% of what you earn.",
    icon: Percent,
    defaultTarget: 400,
    unit: "usd",
  },
  {
    id: "income-freelance",
    categoryId: "income-growth",
    title: "Build a freelance fund",
    description: "Taxes, dry spells, and gear—freelancers need backup.",
    icon: Briefcase,
    defaultTarget: 1500,
    unit: "usd",
  },
  // Social & Life
  {
    id: "social-dating",
    categoryId: "social-life",
    title: "Save for dating/social life",
    description: "Coffee, outings, and connection—on budget.",
    icon: PartyPopper,
    defaultTarget: 150,
    unit: "usd",
  },
  {
    id: "social-gifts",
    categoryId: "social-life",
    title: "Gift fund (birthdays/holidays)",
    description: "Spread cheer without the January hangover.",
    icon: Gift,
    defaultTarget: 400,
    unit: "usd",
  },
  {
    id: "social-moving-grad",
    categoryId: "social-life",
    title: "Moving after graduation",
    description: "New city, new job—fund the transition.",
    icon: MapPin,
    defaultTarget: 2000,
    unit: "usd",
  },
  // Challenges
  {
    id: "challenge-30-day",
    categoryId: "challenges",
    title: "30-day savings challenge",
    description: "Save something every day for 30 days.",
    icon: Flame,
    defaultTarget: 30,
    unit: "days",
  },
  {
    id: "challenge-5-30",
    categoryId: "challenges",
    title: "Save $5/day for 30 days",
    description: "$150 goal—small daily habit, big finish.",
    icon: Coins,
    defaultTarget: 150,
    unit: "usd",
  },
  {
    id: "challenge-weekly-streak",
    categoryId: "challenges",
    title: "Weekly savings streak",
    description: "Log each week you hit your savings habit—aim for 4 in a row.",
    icon: Trophy,
    defaultTarget: 4,
    unit: "weeks",
  },
];

export function getCategoryMeta(id: GoalCategoryId) {
  return GOAL_CATEGORIES.find((c) => c.id === id)!;
}

export function getPresetById(id: string) {
  return PRESET_GOALS.find((g) => g.id === id);
}

export function formatGoalAmount(value: number, unit: ProgressUnit): string {
  if (unit === "none") return "";
  if (unit === "days") {
    return `${Math.round(value)} ${value === 1 ? "day" : "days"}`;
  }
  if (unit === "weeks") {
    return `${Math.round(value)} ${value === 1 ? "week" : "weeks"}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function motivationalLine(percent: number): string {
  if (percent >= 100) return "You did it—goal complete! 🎉";
  if (percent >= 90) return "So close—you’ve got this! ✨";
  if (percent >= 75) return "You’re in the home stretch! 🚀";
  if (percent >= 50) return "Halfway there—keep the momentum! 💪";
  if (percent >= 25) return "Nice start—small steps add up. 🌱";
  return "Every bit counts—stay consistent. 💚";
}
