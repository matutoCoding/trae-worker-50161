import { ipcMain } from 'electron';
import { queryAll, queryOne, runSql } from './database';
import {
  bookClass,
  cancelBooking,
  checkInBooking,
  joinWaitlist,
  leaveWaitlist,
  checkTimeoutAndRelease,
  rechargeFamily,
  getFamilyBalance,
} from './booking-service';

export function registerIpcHandlers() {
  ipcMain.handle('get-coaches', () => {
    return queryAll('SELECT * FROM coaches ORDER BY id');
  });

  ipcMain.handle('add-coach', (_event, data) => {
    const result = runSql(
      'INSERT INTO coaches (name, phone, specialty, avatar) VALUES (?, ?, ?, ?)',
      [data.name, data.phone || null, data.specialty || null, data.avatar || null]
    );
    return { id: result.lastInsertRowid };
  });

  ipcMain.handle('update-coach', (_event, data) => {
    runSql(
      'UPDATE coaches SET name = ?, phone = ?, specialty = ?, avatar = ? WHERE id = ?',
      [data.name, data.phone || null, data.specialty || null, data.avatar || null, data.id]
    );
    return { success: true };
  });

  ipcMain.handle('delete-coach', (_event, id) => {
    runSql('DELETE FROM coaches WHERE id = ?', [id]);
    return { success: true };
  });

  ipcMain.handle('get-schedules', (_event, date?) => {
    let sql = `
      SELECT s.*, c.name as coach_name, c.specialty as coach_specialty
      FROM schedules s
      JOIN coaches c ON s.coach_id = c.id
    `;
    const params: any[] = [];
    if (date) {
      sql += ' WHERE s.course_date = ?';
      params.push(date);
    }
    sql += ' ORDER BY s.course_date, s.start_time';
    const schedules = queryAll(sql, params);

    return schedules.map((s: any) => {
      const bookings = queryAll(
        `SELECT b.id as booking_id, b.member_id, b.status as booking_status, b.checked_in_at,
                m.name as member_name, m.phone as member_phone
         FROM bookings b
         JOIN members m ON b.member_id = m.id
         WHERE b.schedule_id = ? AND b.status IN ('booked', 'checked_in')
         ORDER BY b.booked_at`,
        [s.id]
      );
      return { ...s, bookings };
    });
  });

  ipcMain.handle('add-schedule', (_event, data) => {
    const result = runSql(
      'INSERT INTO schedules (coach_id, course_date, start_time, end_time, capacity, course_name) VALUES (?, ?, ?, ?, ?, ?)',
      [
        data.coach_id,
        data.course_date,
        data.start_time,
        data.end_time,
        data.capacity || 1,
        data.course_name || '私教课',
      ]
    );
    return { id: result.lastInsertRowid };
  });

  ipcMain.handle('update-schedule', (_event, data) => {
    runSql(
      'UPDATE schedules SET coach_id = ?, course_date = ?, start_time = ?, end_time = ?, capacity = ?, course_name = ? WHERE id = ?',
      [
        data.coach_id,
        data.course_date,
        data.start_time,
        data.end_time,
        data.capacity,
        data.course_name,
        data.id,
      ]
    );
    return { success: true };
  });

  ipcMain.handle('delete-schedule', (_event, id) => {
    runSql('DELETE FROM schedules WHERE id = ?', [id]);
    return { success: true };
  });

  ipcMain.handle('get-members', () => {
    return queryAll(`
      SELECT m.*, f.name as family_name, f.balance as family_balance
      FROM members m
      LEFT JOIN families f ON m.family_id = f.id
      ORDER BY m.id
    `);
  });

  ipcMain.handle('add-member', (_event, data) => {
    const result = runSql(
      'INSERT INTO members (name, phone, gender, birthday, family_id) VALUES (?, ?, ?, ?, ?)',
      [
        data.name,
        data.phone || null,
        data.gender || null,
        data.birthday || null,
        data.family_id || null,
      ]
    );
    return { id: result.lastInsertRowid };
  });

  ipcMain.handle('update-member', (_event, data) => {
    runSql(
      'UPDATE members SET name = ?, phone = ?, gender = ?, birthday = ?, family_id = ? WHERE id = ?',
      [
        data.name,
        data.phone || null,
        data.gender || null,
        data.birthday || null,
        data.family_id || null,
        data.id,
      ]
    );
    return { success: true };
  });

  ipcMain.handle('delete-member', (_event, id) => {
    runSql('DELETE FROM members WHERE id = ?', [id]);
    return { success: true };
  });

  ipcMain.handle('get-families', () => {
    const families = queryAll('SELECT * FROM families ORDER BY id');
    return families.map((f: any) => {
      const members = queryAll(
        'SELECT * FROM members WHERE family_id = ?',
        [f.id]
      );
      return { ...f, members };
    });
  });

  ipcMain.handle('add-family', (_event, data) => {
    const result = runSql(
      'INSERT INTO families (name, balance, total_purchased) VALUES (?, ?, ?)',
      [data.name, data.initial_balance || 0, data.initial_balance || 0]
    );
    return { id: result.lastInsertRowid };
  });

  ipcMain.handle('update-family', (_event, data) => {
    runSql('UPDATE families SET name = ? WHERE id = ?', [data.name, data.id]);
    return { success: true };
  });

  ipcMain.handle('delete-family', (_event, id) => {
    runSql('UPDATE members SET family_id = NULL WHERE family_id = ?', [id]);
    runSql('DELETE FROM families WHERE id = ?', [id]);
    return { success: true };
  });

  ipcMain.handle('add-family-member', (_event, data) => {
    runSql('UPDATE members SET family_id = ? WHERE id = ?', [
      data.family_id,
      data.member_id,
    ]);
    return { success: true };
  });

  ipcMain.handle('remove-family-member', (_event, memberId) => {
    runSql('UPDATE members SET family_id = NULL WHERE id = ?', [memberId]);
    return { success: true };
  });

  ipcMain.handle('get-family-balance', (_event, familyId) => {
    return getFamilyBalance(familyId);
  });

  ipcMain.handle('recharge-family', (_event, data) => {
    return rechargeFamily(data.family_id, data.amount, data.description);
  });

  ipcMain.handle('book-class', (_event, data) => {
    try {
      return bookClass(data.schedule_id, data.member_id);
    } catch (e: any) {
      return { error: e.message };
    }
  });

  ipcMain.handle('cancel-booking', (_event, bookingId) => {
    try {
      return cancelBooking(bookingId);
    } catch (e: any) {
      return { error: e.message };
    }
  });

  ipcMain.handle('check-in-booking', (_event, bookingId) => {
    try {
      return checkInBooking(bookingId);
    } catch (e: any) {
      return { error: e.message };
    }
  });

  ipcMain.handle('get-bookings', (_event, memberId?) => {
    let sql = `
      SELECT b.*, s.course_date, s.start_time, s.end_time, s.course_name,
             c.name as coach_name, m.name as member_name
      FROM bookings b
      JOIN schedules s ON b.schedule_id = s.id
      JOIN coaches c ON s.coach_id = c.id
      JOIN members m ON b.member_id = m.id
    `;
    const params: any[] = [];
    if (memberId) {
      sql += ' WHERE b.member_id = ?';
      params.push(memberId);
    }
    sql += ' ORDER BY s.course_date DESC, s.start_time DESC';
    return queryAll(sql, params);
  });

  ipcMain.handle('join-waitlist', (_event, data) => {
    try {
      return joinWaitlist(data.schedule_id, data.member_id);
    } catch (e: any) {
      return { error: e.message };
    }
  });

  ipcMain.handle('get-waitlist', (_event, scheduleId) => {
    return queryAll(
      `
      SELECT w.*, m.name as member_name, m.phone as member_phone
      FROM waitlist w
      JOIN members m ON w.member_id = m.id
      WHERE w.schedule_id = ? AND w.status = 'waiting'
      ORDER BY w.position
    `,
      [scheduleId]
    );
  });

  ipcMain.handle('leave-waitlist', (_event, waitlistId) => {
    try {
      return leaveWaitlist(waitlistId);
    } catch (e: any) {
      return { error: e.message };
    }
  });

  ipcMain.handle('get-body-measurements', (_event, memberId) => {
    return queryAll(
      'SELECT * FROM body_measurements WHERE member_id = ? ORDER BY measure_date DESC',
      [memberId]
    );
  });

  ipcMain.handle('add-body-measurement', (_event, data) => {
    const result = runSql(
      `INSERT INTO body_measurements
       (member_id, measure_date, height, weight, bmi, body_fat, muscle_mass, waist, hip, chest, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.member_id,
        data.measure_date,
        data.height || null,
        data.weight || null,
        data.bmi || null,
        data.body_fat || null,
        data.muscle_mass || null,
        data.waist || null,
        data.hip || null,
        data.chest || null,
        data.notes || null,
      ]
    );
    return { id: result.lastInsertRowid };
  });

  ipcMain.handle('check-timeout-and-release', () => {
    return checkTimeoutAndRelease();
  });

  ipcMain.handle('get-stats', () => {
    const coachCount = queryOne(
      'SELECT COUNT(*) as count FROM coaches'
    );
    const memberCount = queryOne(
      'SELECT COUNT(*) as count FROM members'
    );
    const familyCount = queryOne(
      'SELECT COUNT(*) as count FROM families'
    );
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = queryOne(
      "SELECT COUNT(*) as count FROM bookings b JOIN schedules s ON b.schedule_id = s.id WHERE s.course_date = ? AND b.status = 'booked'",
      [today]
    );
    const totalBalance = queryOne(
      'SELECT SUM(balance) as total FROM families'
    );

    return {
      coachCount: coachCount?.count || 0,
      memberCount: memberCount?.count || 0,
      familyCount: familyCount?.count || 0,
      todayBookings: todayBookings?.count || 0,
      totalBalance: totalBalance?.total || 0,
    };
  });
}
