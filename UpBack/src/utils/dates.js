import { httpError } from "./httpError.js";

const pad = (n) => String(n).padStart(2, "0");

const LOCAL_DATE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;

// Turns a date sent by UpFront into a MySQL DATETIME literal. Values
// without a timezone ("2026-10-19", "2026-10-19T08:30") keep their wall
// clock time, like .NET did; values with one ("...Z") are stored in UTC,
// the timezone the existing rows use.
export function parseDateInput(value, field) {
  const text = String(value ?? "").trim();
  const match = LOCAL_DATE.exec(text);
  let parts;
  if (match) {
    const [, y, mo, d, h = "00", mi = "00", s = "00"] = match;
    parts = { y: +y, mo: +mo, d: +d, h: +h, mi: +mi, s: +s };
  } else {
    const date = new Date(text);
    if (!text || Number.isNaN(date.getTime())) {
      throw httpError(400, `Date invalide : ${field}.`);
    }
    parts = {
      y: date.getUTCFullYear(),
      mo: date.getUTCMonth() + 1,
      d: date.getUTCDate(),
      h: date.getUTCHours(),
      mi: date.getUTCMinutes(),
      s: date.getUTCSeconds(),
    };
  }
  const check = new Date(Date.UTC(parts.y, parts.mo - 1, parts.d));
  if (check.getUTCMonth() !== parts.mo - 1 || check.getUTCDate() !== parts.d) {
    throw httpError(400, `Date invalide : ${field}.`);
  }
  return `${parts.y}-${pad(parts.mo)}-${pad(parts.d)} ${pad(parts.h)}:${pad(
    parts.mi
  )}:${pad(parts.s)}`;
}

// "YYYY-MM-DD" part of a parsed date, for DATE() comparisons.
export const dayOf = (mysqlDateTime) => mysqlDateTime.slice(0, 10);

// Same shape as .NET's DateTime JSON ("2026-10-19T00:00:00"). The pool
// reads DATETIME as UTC, so the UTC fields are the stored wall clock.
export function toNetDateTime(date) {
  if (!date) return null;
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds()
  )}`;
}

export function formatFr(date) {
  if (!date) return "";
  return `${pad(date.getUTCDate())}/${pad(
    date.getUTCMonth() + 1
  )}/${date.getUTCFullYear()}`;
}

// "dd/MM/yyyy" from a "YYYY-MM-DD..." string, for PDF headers.
export function formatFrDay(mysqlDateTime) {
  const [y, m, d] = dayOf(mysqlDateTime).split("-");
  return `${d}/${m}/${y}`;
}
