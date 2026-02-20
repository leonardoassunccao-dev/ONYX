
export type Section = 'today' | 'finance' | 'pacer' | 'reading' | 'study' | 'work' | 'routine' | 'general' | 'system';

export interface SyncMetadata {
  updatedAt?: number; // Timestamp for conflict resolution
  userId?: string;    // Owner of the data
}

export interface Profile extends SyncMetadata {
  id?: string | number;
  name: string;
}

export interface Settings extends SyncMetadata {
  id?: string | number;
  meetingMode: boolean;
  greetingsEnabled: boolean;
  accent: string;
}

export interface Quote extends SyncMetadata {
  id?: string | number;
  text: string;
  author?: string;
  isCustom: boolean;
}

export interface AppState extends SyncMetadata {
  key: string;
  value: any;
}

export interface Habit extends SyncMetadata {
  id?: number;
  title: string;
  type: 'count' | 'minutes' | 'boolean';
  targetValue: number;
  daysOfWeek: number[]; // 0-6
  timeOptional?: string;
  active: boolean;
  createdAt: number;
}

export interface HabitCheckin extends SyncMetadata {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  value: number;
}

export interface Task extends SyncMetadata {
  id?: number;
  title: string;
  date: string; // YYYY-MM-DD
  section: 'finance' | 'pacer' | 'reading' | 'study' | 'work' | 'routine' | 'general';
  priority: 'low' | 'med' | 'high';
  done: boolean;
}

export interface FinanceTransaction extends SyncMetadata {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note?: string;
}

export interface FixedExpense extends SyncMetadata {
  id?: number;
  title: string;
  amount: number;
}

export interface PacerWorkout extends SyncMetadata {
  id?: number;
  type: 'run' | 'rope' | 'gym' | 'tennis' | 'other';
  plannedDate: string;
  completedDateOptional?: string;
  durationMin: number;
  notes?: string;
  done: boolean;
}

export interface Book extends SyncMetadata {
  id?: number;
  title: string;
  authorOptional?: string;
  status: 'reading' | 'paused' | 'done';
  pagesTotalOptional?: number;
  dailyPagesGoal?: number;
  currentPage: number;
  startedAt?: string; // YYYY-MM-DD
  coverOptionalUrl?: string;
  createdAt: number;
}

export interface ReadingSession extends SyncMetadata {
  id?: number;
  bookId: number;
  date: string; // YYYY-MM-DD
  pages: number; // Mandatory for counting
  minutesOptional?: number;
  notes?: string;
}

export interface StudySession extends SyncMetadata {
  id?: number;
  subject: string;
  date: string;
  minutes: number;
  notes?: string;
}

export interface WorkTask extends SyncMetadata {
  id?: number;
  title: string;
  date: string;
  done: boolean;
  priority: 'low' | 'med' | 'high';
  tagsOptional?: string;
}

// Unified Goal System
export type GoalSession = 'finance' | 'pacer' | 'reading' | 'study' | 'work' | 'routine';
export type GoalType = 'daily' | 'weekly' | 'monthly' | 'one_time';
export type MetricType = 'count' | 'minutes' | 'pages' | 'currency' | 'boolean';

export interface SessionGoal extends SyncMetadata {
  id?: number;
  session: GoalSession;
  title: string;
  description?: string;
  type: GoalType;
  metricType: MetricType;
  targetValue: number;
  startDate?: string;
  dueDate?: string;
  daysOfWeek?: number[]; // 0-6
  timeOptional?: string;
  active: boolean;
  done: boolean;
  createdAt: number;
}

export interface GoalCheckin extends SyncMetadata {
  id?: number;
  goalId: number;
  date: string; // YYYY-MM-DD
  value: number;
  notes?: string;
}

export interface GoalTemplate extends SyncMetadata {
  id?: number;
  session: GoalSession;
  title: string;
  type: GoalType;
  metricType: MetricType;
  defaultTargetValue: number;
  defaultDaysOfWeek?: number[];
  defaultTimeOptional?: string | null;
  description?: string;
  isBuiltIn: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  lastSync?: number;
}
