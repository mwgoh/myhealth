/** "YYYY-MM-DD" 형식의 현지 날짜 */
export type DateStr = string;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateStr(d: Date): DateStr {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 현지 자정의 Date. new Date("YYYY-MM-DD")는 UTC로 해석되므로 쓰지 않는다. */
export function parseDateStr(s: string): Date | null {
  if (!DATE_RE.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  // 2026-02-30처럼 넘친 날짜는 다른 날로 바뀌므로 되돌려 비교해 걸러낸다
  return toDateStr(date) === s ? date : null;
}

export function isValidDateStr(s: string): boolean {
  return parseDateStr(s) !== null;
}

export function todayStr(now: Date = new Date()): DateStr {
  return toDateStr(now);
}

function mustParse(s: DateStr): Date {
  const d = parseDateStr(s);
  if (!d) throw new Error(`잘못된 날짜: ${s}`);
  return d;
}

export function addDays(s: DateStr, n: number): DateStr {
  const d = mustParse(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** n개월 이동한 달의 1일 */
export function shiftMonth(s: DateStr, n: number): DateStr {
  const d = mustParse(s);
  return toDateStr(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

export function weekRange(s: DateStr): { start: DateStr; end: DateStr } {
  const d = mustParse(s);
  // getDay(): 일=0 … 토=6 → 월요일까지 되돌아갈 일수
  const back = (d.getDay() + 6) % 7;
  const start = addDays(s, -back);
  return { start, end: addDays(start, 6) };
}

export function monthRange(s: DateStr): { start: DateStr; end: DateStr } {
  const d = mustParse(s);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toDateStr(start), end: toDateStr(end) };
}

/** 월요일에 시작하는 7칸 줄 배열. 그 달이 아닌 칸은 null. month는 1~12 */
export function monthGrid(year: number, month: number): (DateStr | null)[][] {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (DateStr | null)[] = Array((first.getDay() + 6) % 7).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateStr(new Date(year, month - 1, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (DateStr | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function weekdayKo(s: DateStr): string {
  return WEEKDAYS_KO[mustParse(s).getDay()];
}

/** "HH:MM" 형식의 24시간 현지 시각. 운동 시작·종료 시간에 쓴다. */
export type TimeStr = string;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function toTimeStr(d: Date): TimeStr {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isValidTimeStr(s: string): boolean {
  return TIME_RE.test(s);
}

const toMinutes = (s: TimeStr) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

/** 시작부터 종료까지 분. 종료가 시작보다 이르면 자정을 넘긴 것으로 보고 하루를 더한다. 같으면 0. */
export function minutesBetween(start: TimeStr, end: TimeStr): number {
  const diff = toMinutes(end) - toMinutes(start);
  return diff < 0 ? diff + 24 * 60 : diff;
}
