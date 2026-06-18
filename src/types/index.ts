export interface Coach {
  id: number;
  name: string;
  phone?: string;
  specialty?: string;
  avatar?: string;
  created_at?: string;
}

export interface Member {
  id: number;
  name: string;
  phone?: string;
  gender?: string;
  birthday?: string;
  family_id?: number;
  family_name?: string;
  family_balance?: number;
  created_at?: string;
}

export interface Family {
  id: number;
  name: string;
  balance: number;
  total_purchased: number;
  created_at?: string;
  members?: Member[];
}

export interface Schedule {
  id: number;
  coach_id: number;
  coach_name?: string;
  coach_specialty?: string;
  course_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  status: 'available' | 'full' | 'cancelled';
  course_name?: string;
  created_at?: string;
}

export interface Booking {
  id: number;
  schedule_id: number;
  member_id: number;
  family_id?: number;
  status: 'booked' | 'cancelled' | 'checked_in' | 'completed';
  booked_at?: string;
  checked_in_at?: string;
  cancelled_at?: string;
  timeout_minutes?: number;
  course_date?: string;
  start_time?: string;
  end_time?: string;
  course_name?: string;
  coach_name?: string;
  member_name?: string;
}

export interface WaitlistItem {
  id: number;
  schedule_id: number;
  member_id: number;
  family_id?: number;
  position: number;
  status: 'waiting' | 'converted' | 'cancelled' | 'failed';
  joined_at?: string;
  notified_at?: string;
  member_name?: string;
  member_phone?: string;
}

export interface BodyMeasurement {
  id: number;
  member_id: number;
  measure_date: string;
  height?: number;
  weight?: number;
  bmi?: number;
  body_fat?: number;
  muscle_mass?: number;
  waist?: number;
  hip?: number;
  chest?: number;
  notes?: string;
  created_at?: string;
}

export interface Stats {
  coachCount: number;
  memberCount: number;
  familyCount: number;
  todayBookings: number;
  totalBalance: number;
}

declare global {
  interface Window {
    electronAPI: {
      getCoaches: () => Promise<Coach[]>;
      addCoach: (data: any) => Promise<{ id: number }>;
      updateCoach: (data: any) => Promise<{ success: boolean }>;
      deleteCoach: (id: number) => Promise<{ success: boolean }>;

      getSchedules: (date?: string) => Promise<Schedule[]>;
      addSchedule: (data: any) => Promise<{ id: number }>;
      updateSchedule: (data: any) => Promise<{ success: boolean }>;
      deleteSchedule: (id: number) => Promise<{ success: boolean }>;

      getMembers: () => Promise<Member[]>;
      addMember: (data: any) => Promise<{ id: number }>;
      updateMember: (data: any) => Promise<{ success: boolean }>;
      deleteMember: (id: number) => Promise<{ success: boolean }>;

      getFamilies: () => Promise<Family[]>;
      addFamily: (data: any) => Promise<{ id: number }>;
      updateFamily: (data: any) => Promise<{ success: boolean }>;
      deleteFamily: (id: number) => Promise<{ success: boolean }>;
      addFamilyMember: (data: any) => Promise<{ success: boolean }>;
      removeFamilyMember: (memberId: number) => Promise<{ success: boolean }>;

      getFamilyBalance: (familyId: number) => Promise<{ balance: number; totalPurchased: number }>;
      rechargeFamily: (data: any) => Promise<{ balance: number }>;

      bookClass: (data: any) => Promise<any>;
      cancelBooking: (bookingId: number) => Promise<any>;
      getBookings: (memberId?: number) => Promise<Booking[]>;

      joinWaitlist: (data: any) => Promise<any>;
      getWaitlist: (scheduleId: number) => Promise<WaitlistItem[]>;
      leaveWaitlist: (waitlistId: number) => Promise<any>;

      getBodyMeasurements: (memberId: number) => Promise<BodyMeasurement[]>;
      addBodyMeasurement: (data: any) => Promise<{ id: number }>;

      checkTimeoutAndRelease: () => Promise<any>;

      getStats: () => Promise<Stats>;
    };
  }
}

export {};
