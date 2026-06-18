import { queryOne, queryAll, runSql, transaction, saveDatabase } from './database';

export function bookClass(scheduleId: number, memberId: number) {
  const member = queryOne('SELECT * FROM members WHERE id = ?', [memberId]);
  if (!member) {
    throw new Error('会员不存在');
  }

  const schedule = queryOne('SELECT * FROM schedules WHERE id = ?', [scheduleId]);
  if (!schedule) {
    throw new Error('课程不存在');
  }

  if (schedule.status !== 'available') {
    throw new Error('课程不可预约');
  }

  if (schedule.booked_count >= schedule.capacity) {
    throw new Error('课程已满员，请加入候补队列');
  }

  const existingBooking = queryOne(
    "SELECT * FROM bookings WHERE schedule_id = ? AND member_id = ? AND status = 'booked'",
    [scheduleId, memberId]
  );
  if (existingBooking) {
    throw new Error('您已预约该课程');
  }

  let bookingId = 0;

  transaction(() => {
    if (member.family_id) {
      const family = queryOne('SELECT * FROM families WHERE id = ?', [
        member.family_id,
      ]);
      if (!family || family.balance <= 0) {
        throw new Error('家庭课时余额不足');
      }

      const updateResult = runSql(
        'UPDATE families SET balance = balance - 1 WHERE id = ? AND balance > 0',
        [member.family_id]
      );

      if (updateResult.changes === 0) {
        throw new Error('扣款失败，请重试');
      }
    }

    const insertResult = runSql(
      'INSERT INTO bookings (schedule_id, member_id, family_id, status) VALUES (?, ?, ?, ?)',
      [scheduleId, memberId, member.family_id || null, 'booked']
    );
    bookingId = insertResult.lastInsertRowid;

    runSql(
      'UPDATE schedules SET booked_count = booked_count + 1 WHERE id = ?',
      [scheduleId]
    );

    const updatedSchedule = queryOne(
      'SELECT * FROM schedules WHERE id = ?',
      [scheduleId]
    );
    if (updatedSchedule && updatedSchedule.booked_count >= updatedSchedule.capacity) {
      runSql("UPDATE schedules SET status = ? WHERE id = ?", [
        'full',
        scheduleId,
      ]);
    }

    if (member.family_id) {
      runSql(
        'INSERT INTO balance_transactions (family_id, amount, type, booking_id, description) VALUES (?, ?, ?, ?, ?)',
        [member.family_id, -1, 'book', bookingId, '预约课程扣费']
      );
    }
  });

  return { bookingId };
}

export function cancelBooking(bookingId: number) {
  const booking = queryOne('SELECT * FROM bookings WHERE id = ?', [bookingId]);
  if (!booking) {
    throw new Error('预约不存在');
  }

  if (booking.status !== 'booked') {
    throw new Error('该预约无法取消');
  }

  transaction(() => {
    runSql(
      "UPDATE bookings SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = ?",
      [bookingId]
    );

    runSql(
      "UPDATE schedules SET booked_count = booked_count - 1, status = 'available' WHERE id = ?",
      [booking.schedule_id]
    );

    if (booking.family_id) {
      runSql('UPDATE families SET balance = balance + 1 WHERE id = ?', [
        booking.family_id,
      ]);

      runSql(
        'INSERT INTO balance_transactions (family_id, amount, type, booking_id, description) VALUES (?, ?, ?, ?, ?)',
        [booking.family_id, 1, 'cancel', bookingId, '取消课程退款']
      );
    }

    processWaitlist(booking.schedule_id);
  });

  return { success: true };
}

export function joinWaitlist(scheduleId: number, memberId: number) {
  const member = queryOne('SELECT * FROM members WHERE id = ?', [memberId]);
  if (!member) {
    throw new Error('会员不存在');
  }

  const schedule = queryOne('SELECT * FROM schedules WHERE id = ?', [scheduleId]);
  if (!schedule) {
    throw new Error('课程不存在');
  }

  const existingWaitlist = queryOne(
    "SELECT * FROM waitlist WHERE schedule_id = ? AND member_id = ? AND status = 'waiting'",
    [scheduleId, memberId]
  );
  if (existingWaitlist) {
    throw new Error('您已在候补队列中');
  }

  const existingBooking = queryOne(
    "SELECT * FROM bookings WHERE schedule_id = ? AND member_id = ? AND status = 'booked'",
    [scheduleId, memberId]
  );
  if (existingBooking) {
    throw new Error('您已预约该课程');
  }

  if (member.family_id) {
    const family = queryOne('SELECT * FROM families WHERE id = ?', [
      member.family_id,
    ]);
    if (!family || family.balance <= 0) {
      throw new Error('家庭课时余额不足');
    }
  }

  const maxPosResult = queryOne(
    "SELECT COALESCE(MAX(position), 0) as max_pos FROM waitlist WHERE schedule_id = ? AND status = 'waiting'",
    [scheduleId]
  );
  const nextPosition = (maxPosResult?.max_pos || 0) + 1;

  const result = runSql(
    'INSERT INTO waitlist (schedule_id, member_id, family_id, position, status) VALUES (?, ?, ?, ?, ?)',
    [scheduleId, memberId, member.family_id || null, nextPosition, 'waiting']
  );

  return { waitlistId: result.lastInsertRowid, position: nextPosition };
}

export function leaveWaitlist(waitlistId: number) {
  const waitlistItem = queryOne('SELECT * FROM waitlist WHERE id = ?', [
    waitlistId,
  ]);
  if (!waitlistItem) {
    throw new Error('候补记录不存在');
  }

  if (waitlistItem.status !== 'waiting') {
    throw new Error('该候补无法退出');
  }

  runSql("UPDATE waitlist SET status = 'cancelled' WHERE id = ?", [
    waitlistId,
  ]);

  const remaining = queryAll(
    "SELECT * FROM waitlist WHERE schedule_id = ? AND status = 'waiting' ORDER BY position",
    [waitlistItem.schedule_id]
  );

  remaining.forEach((item: any, index: number) => {
    runSql('UPDATE waitlist SET position = ? WHERE id = ?', [
      index + 1,
      item.id,
    ]);
  });

  saveDatabase();
  return { success: true };
}

export function processWaitlist(scheduleId: number) {
  const schedule = queryOne('SELECT * FROM schedules WHERE id = ?', [
    scheduleId,
  ]);
  if (!schedule) return;

  if (schedule.booked_count >= schedule.capacity) return;

  const nextWaitlist = queryOne(
    "SELECT * FROM waitlist WHERE schedule_id = ? AND status = 'waiting' ORDER BY position LIMIT 1",
    [scheduleId]
  );

  if (!nextWaitlist) return;

  try {
    const result = bookClass(scheduleId, nextWaitlist.member_id);

    runSql(
      "UPDATE waitlist SET status = 'converted', notified_at = datetime('now') WHERE id = ?",
      [nextWaitlist.id]
    );

    return {
      success: true,
      memberId: nextWaitlist.member_id,
      bookingId: result.bookingId,
    };
  } catch (e) {
    runSql("UPDATE waitlist SET status = 'failed' WHERE id = ?", [
      nextWaitlist.id,
    ]);
    return processWaitlist(scheduleId);
  }
}

export function checkTimeoutAndRelease() {
  const now = new Date();
  const nowStr = now.toISOString().split('T')[0];
  const nowTime = now.toTimeString().slice(0, 5);

  const timeoutBookings = queryAll(
    `SELECT b.*, s.start_time, s.course_date
     FROM bookings b
     JOIN schedules s ON b.schedule_id = s.id
     WHERE b.status = 'booked'
       AND s.course_date = ?
       AND s.start_time <= ?
       AND b.checked_in_at IS NULL`,
    [nowStr, nowTime]
  );

  const released: number[] = [];

  timeoutBookings.forEach((booking: any) => {
    const courseDateTime = new Date(
      `${booking.course_date}T${booking.start_time}:00`
    );
    const timeoutMs = (booking.timeout_minutes || 15) * 60 * 1000;

    if (now.getTime() - courseDateTime.getTime() > timeoutMs) {
      try {
        cancelBooking(booking.id);
        released.push(booking.id);
      } catch (e) {
        console.error('释放超时预约失败:', e);
      }
    }
  });

  return { releasedCount: released.length, releasedBookings: released };
}

export function rechargeFamily(familyId: number, amount: number, description?: string) {
  const family = queryOne('SELECT * FROM families WHERE id = ?', [familyId]);
  if (!family) {
    throw new Error('家庭不存在');
  }

  if (amount <= 0) {
    throw new Error('充值金额必须大于0');
  }

  transaction(() => {
    runSql(
      'UPDATE families SET balance = balance + ?, total_purchased = total_purchased + ? WHERE id = ?',
      [amount, amount, familyId]
    );

    runSql(
      'INSERT INTO balance_transactions (family_id, amount, type, description) VALUES (?, ?, ?, ?)',
      [familyId, amount, 'recharge', description || '课时充值']
    );
  });

  const updatedFamily = queryOne('SELECT * FROM families WHERE id = ?', [
    familyId,
  ]);

  return { balance: updatedFamily.balance };
}

export function getFamilyBalance(familyId: number) {
  const family = queryOne('SELECT * FROM families WHERE id = ?', [familyId]);
  if (!family) {
    throw new Error('家庭不存在');
  }
  return { balance: family.balance, totalPurchased: family.total_purchased };
}
