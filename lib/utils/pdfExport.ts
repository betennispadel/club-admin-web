import { Reservation, Court, User } from '@/lib/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatCurrencyByLocale } from '@/stores/localeStore';

// Format currency using locale settings
const formatCurrency = (amount: number) => {
  return formatCurrencyByLocale(amount);
};

// Get reservation type label
const getReservationType = (reservation: Reservation): string => {
  if (reservation.isTraining) return 'Antrenman';
  if (reservation.isChallenge) return 'Maç';
  if (reservation.isGift) return 'Hediye';
  if (reservation.isLesson) return 'Ders';
  return 'Normal';
};

// Generate HTML for PDF
const generatePDFContent = (
  reservations: Reservation[],
  courts: Court[],
  users: User[],
  dateRange: { start: Date; end: Date },
  clubName?: string
): string => {
  const getCourtName = (courtId: string) => courts.find(c => c.id === courtId)?.name || courtId;
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.username || userId;

  // Calculate totals
  const totalAmount = reservations.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const activeCount = reservations.filter(r => r.status !== 'cancelled').length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

  // Group by date
  const groupedByDate = reservations.reduce((acc, r) => {
    const date = r.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(r);
    return acc;
  }, {} as Record<string, Reservation[]>);

  const sortedDates = Object.keys(groupedByDate).sort();

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Rezervasyon Raporu</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
        }
        .header h1 {
          font-size: 24px;
          color: #1e40af;
          margin-bottom: 5px;
        }
        .header .club-name {
          font-size: 18px;
          color: #64748b;
          margin-bottom: 10px;
        }
        .header .date-range {
          font-size: 14px;
          color: #64748b;
        }
        .summary {
          display: flex;
          justify-content: space-around;
          margin-bottom: 30px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item .label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-item .value {
          font-size: 20px;
          font-weight: bold;
          color: #1e40af;
        }
        .date-section {
          margin-bottom: 25px;
        }
        .date-header {
          font-size: 14px;
          font-weight: bold;
          color: #1e40af;
          padding: 8px 12px;
          background: #eff6ff;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th {
          background: #f1f5f9;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        tr:hover {
          background: #f8fafc;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }
        .badge-normal { background: #f1f5f9; color: #475569; }
        .badge-training { background: #f3e8ff; color: #7c3aed; }
        .badge-match { background: #ffedd5; color: #ea580c; }
        .badge-gift { background: #dcfce7; color: #16a34a; }
        .badge-lesson { background: #e0e7ff; color: #4f46e5; }
        .badge-active { background: #dcfce7; color: #16a34a; }
        .badge-cancelled { background: #fee2e2; color: #dc2626; }
        .amount {
          font-weight: 600;
          color: #059669;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
        }
        @media print {
          body { padding: 0; }
          .date-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${clubName ? `<div class="club-name">${clubName}</div>` : ''}
        <h1>Rezervasyon Raporu</h1>
        <div class="date-range">
          ${format(dateRange.start, 'dd MMMM yyyy', { locale: tr })} -
          ${format(dateRange.end, 'dd MMMM yyyy', { locale: tr })}
        </div>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="value">${reservations.length}</div>
          <div class="label">Toplam Rezervasyon</div>
        </div>
        <div class="summary-item">
          <div class="value">${activeCount}</div>
          <div class="label">Aktif</div>
        </div>
        <div class="summary-item">
          <div class="value">${cancelledCount}</div>
          <div class="label">İptal</div>
        </div>
        <div class="summary-item">
          <div class="value">${formatCurrency(totalAmount)}</div>
          <div class="label">Toplam Tutar</div>
        </div>
      </div>

      ${sortedDates.map(date => `
        <div class="date-section">
          <div class="date-header">
            ${format(new Date(date), 'dd MMMM yyyy, EEEE', { locale: tr })}
            (${groupedByDate[date].length} rezervasyon)
          </div>
          <table>
            <thead>
              <tr>
                <th>Saat</th>
                <th>Kort</th>
                <th>Kullanıcı</th>
                <th>Tür</th>
                <th>Durum</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${groupedByDate[date]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(r => `
                  <tr>
                    <td>${r.time}${r.endTime ? ` - ${r.endTime}` : ''}</td>
                    <td>${getCourtName(r.courtId)}</td>
                    <td>${r.username || getUserName(r.userId)}</td>
                    <td>
                      <span class="badge badge-${r.isTraining ? 'training' : r.isChallenge ? 'match' : r.isGift ? 'gift' : r.isLesson ? 'lesson' : 'normal'}">
                        ${getReservationType(r)}
                      </span>
                    </td>
                    <td>
                      <span class="badge badge-${r.status === 'cancelled' ? 'cancelled' : 'active'}">
                        ${r.status === 'cancelled' ? 'İptal' : 'Aktif'}
                      </span>
                    </td>
                    <td class="amount">${formatCurrency(r.amountPaid || 0)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      <div class="footer">
        Oluşturulma Tarihi: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}
      </div>
    </body>
    </html>
  `;
};

// Export reservations as PDF
export const exportReservationsPDF = (
  reservations: Reservation[],
  courts: Court[],
  users: User[],
  dateRange: { start: Date; end: Date },
  clubName?: string
): void => {
  const html = generatePDFContent(reservations, courts, users, dateRange, clubName);

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
};

// Export reservations as CSV
export const exportReservationsCSV = (
  reservations: Reservation[],
  courts: Court[],
  users: User[]
): void => {
  const getCourtName = (courtId: string) => courts.find(c => c.id === courtId)?.name || courtId;
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.username || userId;

  const headers = [
    'Tarih',
    'Saat',
    'Bitiş',
    'Kort',
    'Kullanıcı',
    'Tür',
    'Durum',
    'Tutar',
    'Isıtıcı',
    'Aydınlatma',
  ];

  const rows = reservations.map(r => [
    r.date,
    r.time,
    r.endTime || '',
    getCourtName(r.courtId),
    r.username || getUserName(r.userId),
    getReservationType(r),
    r.status === 'cancelled' ? 'İptal' : 'Aktif',
    (r.amountPaid || 0).toString(),
    r.heater ? 'Evet' : 'Hayır',
    r.light ? 'Evet' : 'Hayır',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rezervasyonlar_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate time slots for a court
const generateCourtTimeSlots = (court: Court): string[] => {
  const interval = court.timeSlotInterval || 60;
  const slots: string[] = [];
  const [fromH, fromM] = (court.availableFrom || '08:00').split(':').map(Number);
  const [toH, toM] = (court.availableUntil || '22:00').split(':').map(Number);
  const startMinutes = fromH * 60 + (fromM || 0);
  const endMinutes = toH * 60 + (toM || 0);

  for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
};

// Calculate end time
const calculateEndTime = (startTime: string, intervalMinutes: number): string => {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + intervalMinutes;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

// Check if time has passed
const isSlotPast = (date: Date, time: string): boolean => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate < today) return true;
  if (checkDate > today) return false;

  // Same day - check time
  const [h, m] = time.split(':').map(Number);
  const slotTime = new Date(date);
  slotTime.setHours(h, m, 0, 0);
  return slotTime < now;
};

// Export single day report - Court View Style
export const exportDayReportPDF = (
  date: Date,
  reservations: Reservation[],
  courts: Court[],
  clubName?: string
): void => {
  // Get reservations for each court with slot mapping
  const courtsWithSlots = courts.map(court => {
    const interval = court.timeSlotInterval || 60;
    const slots = generateCourtTimeSlots(court);
    const courtReservations = reservations.filter(r => r.courtId === court.id && r.status !== 'cancelled');

    const slotsWithStatus = slots.map(time => {
      const reservation = courtReservations.find(r => r.time === time);
      const endTime = calculateEndTime(time, interval);
      const isPast = isSlotPast(date, time);

      return {
        time,
        endTime,
        reservation,
        isPast,
        isAvailable: !reservation && !isPast,
      };
    });

    return {
      court,
      slots: slotsWithStatus,
      reservationCount: courtReservations.length,
      totalAmount: courtReservations.reduce((sum, r) => sum + (r.amountPaid || 0), 0),
    };
  });

  const totalAmount = reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  const totalReservations = reservations.filter(r => r.status !== 'cancelled').length;

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Kort Görünümü - ${format(date, 'dd MMMM yyyy', { locale: tr })}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #333;
          padding: 15px;
          background: #f8fafc;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding: 15px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 20px; color: #1e40af; margin-bottom: 5px; }
        .header .club-name { font-size: 14px; color: #64748b; margin-bottom: 5px; }
        .header .date { font-size: 14px; color: #475569; font-weight: 500; }

        .summary {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 20px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .summary-item { text-align: center; }
        .summary-item .value { font-size: 18px; font-weight: bold; color: #1e40af; }
        .summary-item .label { font-size: 10px; color: #64748b; text-transform: uppercase; }

        .courts-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .court-card {
          width: 180px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
          page-break-inside: avoid;
        }

        .court-header {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 10px;
          text-align: center;
        }
        .court-header h3 { font-size: 13px; margin-bottom: 2px; }
        .court-header .info { font-size: 9px; opacity: 0.9; }

        .slots-container { padding: 8px; }

        .slot {
          padding: 6px 8px;
          margin-bottom: 4px;
          border-radius: 6px;
          font-size: 10px;
        }

        .slot-available {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .slot-reserved {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .slot-past {
          background: #f1f5f9;
          color: #94a3b8;
          border: 1px solid #e2e8f0;
        }

        .slot-time {
          font-weight: 600;
          font-size: 11px;
        }
        .slot-user {
          font-size: 9px;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .slot-amount {
          font-size: 9px;
          font-weight: 600;
          color: #059669;
        }
        .slot-status {
          font-size: 9px;
          opacity: 0.8;
        }

        .court-footer {
          background: #f8fafc;
          padding: 8px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
        }
        .court-footer .count { color: #1e40af; font-weight: 600; }
        .court-footer .amount { color: #059669; font-weight: 600; }

        .legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 15px;
          padding: 10px;
          background: white;
          border-radius: 8px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
        }
        .legend-color {
          width: 14px;
          height: 14px;
          border-radius: 4px;
        }
        .legend-available { background: #dcfce7; border: 1px solid #bbf7d0; }
        .legend-reserved { background: #fee2e2; border: 1px solid #fecaca; }
        .legend-past { background: #f1f5f9; border: 1px solid #e2e8f0; }

        .footer {
          margin-top: 15px;
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
        }

        @media print {
          body { padding: 10px; background: white; }
          .court-card { box-shadow: none; border: 1px solid #e2e8f0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${clubName ? `<div class="club-name">${clubName}</div>` : ''}
        <h1>🎾 Kort Görünümü</h1>
        <div class="date">${format(date, 'dd MMMM yyyy, EEEE', { locale: tr })}</div>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="value">${courts.length}</div>
          <div class="label">Kort</div>
        </div>
        <div class="summary-item">
          <div class="value">${totalReservations}</div>
          <div class="label">Rezervasyon</div>
        </div>
        <div class="summary-item">
          <div class="value">${formatCurrency(totalAmount)}</div>
          <div class="label">Toplam Gelir</div>
        </div>
      </div>

      <div class="courts-grid">
        ${courtsWithSlots.map(({ court, slots, reservationCount, totalAmount: courtTotal }) => `
          <div class="court-card">
            <div class="court-header">
              <h3>${court.name}</h3>
              <div class="info">${court.availableFrom || '08:00'} - ${court.availableUntil || '22:00'} | ${court.timeSlotInterval || 60} dk</div>
            </div>
            <div class="slots-container">
              ${slots.map(slot => `
                <div class="slot ${slot.reservation ? 'slot-reserved' : slot.isPast ? 'slot-past' : 'slot-available'}">
                  <div class="slot-time">${slot.time} → ${slot.endTime}</div>
                  ${slot.reservation ? `
                    <div class="slot-user">${slot.reservation.username || 'Rezerve'}</div>
                    <div class="slot-amount">${formatCurrency(slot.reservation.amountPaid || 0)}</div>
                  ` : `
                    <div class="slot-status">${slot.isPast ? 'Geçmiş' : 'Müsait'}</div>
                  `}
                </div>
              `).join('')}
            </div>
            <div class="court-footer">
              <span class="count">${reservationCount} rez.</span> |
              <span class="amount">${formatCurrency(courtTotal)}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="legend">
        <div class="legend-item">
          <div class="legend-color legend-available"></div>
          <span>Müsait</span>
        </div>
        <div class="legend-item">
          <div class="legend-color legend-reserved"></div>
          <span>Dolu</span>
        </div>
        <div class="legend-item">
          <div class="legend-color legend-past"></div>
          <span>Geçmiş</span>
        </div>
      </div>

      <div class="footer">
        Oluşturulma: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: tr })}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
};
