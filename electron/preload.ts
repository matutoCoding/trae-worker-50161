import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getCoaches: () => ipcRenderer.invoke('get-coaches'),
  addCoach: (data: any) => ipcRenderer.invoke('add-coach', data),
  updateCoach: (data: any) => ipcRenderer.invoke('update-coach', data),
  deleteCoach: (id: number) => ipcRenderer.invoke('delete-coach', id),

  getSchedules: (date?: string) => ipcRenderer.invoke('get-schedules', date),
  addSchedule: (data: any) => ipcRenderer.invoke('add-schedule', data),
  updateSchedule: (data: any) => ipcRenderer.invoke('update-schedule', data),
  deleteSchedule: (id: number) => ipcRenderer.invoke('delete-schedule', id),

  getMembers: () => ipcRenderer.invoke('get-members'),
  addMember: (data: any) => ipcRenderer.invoke('add-member', data),
  updateMember: (data: any) => ipcRenderer.invoke('update-member', data),
  deleteMember: (id: number) => ipcRenderer.invoke('delete-member', id),

  getFamilies: () => ipcRenderer.invoke('get-families'),
  addFamily: (data: any) => ipcRenderer.invoke('add-family', data),
  updateFamily: (data: any) => ipcRenderer.invoke('update-family', data),
  deleteFamily: (id: number) => ipcRenderer.invoke('delete-family', id),
  addFamilyMember: (data: any) => ipcRenderer.invoke('add-family-member', data),
  removeFamilyMember: (memberId: number) => ipcRenderer.invoke('remove-family-member', memberId),

  getFamilyBalance: (familyId: number) => ipcRenderer.invoke('get-family-balance', familyId),
  rechargeFamily: (data: any) => ipcRenderer.invoke('recharge-family', data),
  getBalanceTransactions: (familyId: number) => ipcRenderer.invoke('get-balance-transactions', familyId),

  bookClass: (data: any) => ipcRenderer.invoke('book-class', data),
  cancelBooking: (bookingId: number) => ipcRenderer.invoke('cancel-booking', bookingId),
  checkInBooking: (bookingId: number) => ipcRenderer.invoke('check-in-booking', bookingId),
  getBookings: (filters?: any) => ipcRenderer.invoke('get-bookings', filters),

  joinWaitlist: (data: any) => ipcRenderer.invoke('join-waitlist', data),
  getWaitlist: (scheduleId: number) => ipcRenderer.invoke('get-waitlist', scheduleId),
  leaveWaitlist: (waitlistId: number) => ipcRenderer.invoke('leave-waitlist', waitlistId),

  getBodyMeasurements: (memberId: number) => ipcRenderer.invoke('get-body-measurements', memberId),
  addBodyMeasurement: (data: any) => ipcRenderer.invoke('add-body-measurement', data),

  checkTimeoutAndRelease: () => ipcRenderer.invoke('check-timeout-and-release'),

  getStats: () => ipcRenderer.invoke('get-stats'),
});
