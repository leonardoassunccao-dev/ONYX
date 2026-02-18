export type Section = 'today' | 'finance' | 'pacer' | 'reading' | 'study' | 'work' | 'routine' | 'general' | 'system';

export interface SyncMetadata {
  updatedAt?: number;
  userId?: string;
}

export interface Profile extends SyncMetadata {
  id?: any;
  name: string;
}

export interface Settings extends SyncMetadata {
  id?: any;
  meetingMode: boolean;
  greetingsEnabled: boolean;
  accent: string;
}

export interface Quote extends SyncMetadata {
  id?: any;
  text: string;
  author?: string;
  isCustom: boolean;
}

export interface AppState extends SyncMetadata {
  key: string;
  value: any;
}

export interface Habit extends SyncMetadata {
  id?: any;
  title: string;
  type: 'count' | 'minutes' | 'boolean';
  targetValue: number;
  daysOfWeek: number[]; // 0-6
  timeOptional?: string;
  active: boolean;
  createdAt: number;
}

export interface HabitCheckin extends SyncMetadata {
  id?: any;
  habitId: any;
  date: string; // YYYY-MM-DD
  value: number;
}

export interface Task extends SyncMetadata {
  id?: any;
  title: string;
  date: string; // YYYY-MM-DD
  section: 'finance' | 'pacer' | 'reading' | 'study' | 'work' | 'routine' | 'general';
  priority: 'low' | 'med' | 'high';
  done: boolean;
}

export interface FinanceTransaction extends SyncMetadata {
  id?: any;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note?: string;
}

export interface FixedExpense extends SyncMetadata {
  id?: any;
  title: string;
  amount: number;
}

export interface PacerWorkout extends SyncMetadata {
  id?: any;
  type: 'run' | 'rope' | 'gym' | 'tennis' | 'other';
  plannedDate: string;
  completedDateOptional?: string;
  durationMin: number;
  notes?: string;
  done: boolean;
}

export interface Book extends SyncMetadata {
  id?: any;
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
  id?: any;
  bookId: any;
  date: string; // YYYY-MM-DD
  pages: number; // Mandatory for counting
  minutesOptional?: number;
  notes?: string;
}

export interface StudySession extends SyncMetadata {
  id?: any;
  subject: string;
  date: string;
  minutes: number;
  notes?: string;
}

export interface WorkTask extends SyncMetadata {
  id?: any;
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
  id?: any;
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
  id?: any;
  goalId: any;
  date: string; // YYYY-MM-DD
  value: number;
  notes?: string;
}

export interface GoalTemplate extends SyncMetadata {
  id?: any;
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
