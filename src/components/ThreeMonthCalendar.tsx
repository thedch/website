import { useMemo, useState, type FormEvent } from "react";

type CalendarEvent = {
  id: string;
  name: string;
  start: Date;
  end: Date;
  color: string;
};

type DateCell = {
  date: Date | null;
  key: string;
};

const EVENT_COLORS = [
  "border-sky-500/40 bg-sky-500/15 text-sky-900 dark:text-sky-100",
  "border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
  "border-purple-500/40 bg-purple-500/15 text-purple-900 dark:text-purple-100",
  "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-100",
  "border-rose-500/40 bg-rose-500/15 text-rose-900 dark:text-rose-100",
  "border-teal-500/40 bg-teal-500/15 text-teal-900 dark:text-teal-100",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);

const pad = (value: number) => value.toString().padStart(2, "0");

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
};

const buildMonthGrid = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: DateCell[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ date: null, key: `empty-${year}-${month}-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(year, month, day, 12),
      key: `${year}-${month}-${day}`,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      date: null,
      key: `empty-${year}-${month}-${cells.length}`,
    });
  }

  return cells;
};

const enumerateDates = (start: Date, end: Date) => {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const ThreeMonthCalendar = () => {
  const now = new Date();
  const [startMonth, setStartMonth] = useState(() =>
    new Date(now.getFullYear(), 5, 1),
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [formState, setFormState] = useState({
    name: "",
    start: "",
    end: "",
  });
  const [error, setError] = useState("");

  const months = useMemo(() => {
    return [0, 1, 2].map((offset) => {
      const date = new Date(
        startMonth.getFullYear(),
        startMonth.getMonth() + offset,
        1,
      );
      return {
        label: formatMonth(date),
        year: date.getFullYear(),
        month: date.getMonth(),
        cells: buildMonthGrid(date.getFullYear(), date.getMonth()),
      };
    });
  }, [startMonth]);

  const eventsByDate = useMemo(() => {
    const mapping: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      enumerateDates(event.start, event.end).forEach((date) => {
        const key = toDateKey(date);
        if (!mapping[key]) {
          mapping[key] = [];
        }
        mapping[key].push(event);
      });
    });
    return mapping;
  }, [events]);

  const handleInputChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const name = formState.name.trim();
    const startDate = parseDateInput(formState.start);
    const endDate = parseDateInput(formState.end);

    if (!name || !startDate || !endDate) {
      setError("Please provide a name, start date, and end date.");
      return;
    }

    if (startDate > endDate) {
      setError("End date must be the same as or after the start date.");
      return;
    }

    const color = EVENT_COLORS[events.length % EVENT_COLORS.length];
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setEvents((prev) => [
      ...prev,
      {
        id,
        name,
        start: startDate,
        end: endDate,
        color,
      },
    ]);
    setFormState({ name: "", start: "", end: "" });
  };

  const handleRemoveEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const shiftMonths = (delta: number) => {
    setStartMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Three-month window
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Summer calendar overview
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonths(-1)}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => shiftMonths(1)}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {months.map((month) => (
          <section
            key={`${month.year}-${month.month}`}
            className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/40"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {month.label}
            </h2>
            <div className="mt-3 grid grid-cols-7 gap-1 text-xs font-semibold text-slate-400">
              {DAY_LABELS.map((label) => (
                <div key={label} className="text-center">
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-xs">
              {month.cells.map((cell) => (
                <div
                  key={cell.key}
                  className="min-h-[4.5rem] rounded-lg border border-slate-100 bg-white/50 p-1 text-[0.65rem] text-slate-700 shadow-sm transition hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200"
                >
                  {cell.date ? (
                    <div className="flex h-full flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-500">
                        {cell.date.getDate()}
                      </span>
                      <div className="flex flex-col gap-1">
                        {(eventsByDate[toDateKey(cell.date)] || []).map(
                          (event) => (
                            <span
                              key={`${event.id}-${cell.key}`}
                              className={`line-clamp-1 rounded-full border px-1 py-[1px] text-[0.6rem] font-semibold ${event.color}`}
                            >
                              {event.name}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="opacity-0">0</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Add a multi-day event
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Events are stored locally for this session only.
          </p>
        </div>
        <form
          className="mt-4 grid gap-4 md:grid-cols-[1.5fr,1fr,1fr,auto]"
          onSubmit={handleAddEvent}
        >
          <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
            Event name
            <input
              type="text"
              value={formState.name}
              onChange={(event) => handleInputChange("name", event.target.value)}
              placeholder="Team retreat"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
            Start date
            <input
              type="date"
              value={formState.start}
              onChange={(event) =>
                handleInputChange("start", event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
            End date
            <input
              type="date"
              value={formState.end}
              onChange={(event) => handleInputChange("end", event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <button
            type="submit"
            className="mt-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
          >
            Add event
          </button>
        </form>
        {error ? (
          <p className="mt-3 text-sm font-semibold text-rose-500">{error}</p>
        ) : null}
        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Event list
          </h3>
          {events.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              No events yet. Add one to see it appear on the calendar.
            </p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="flex flex-col gap-1">
                    <span
                      className={`w-fit rounded-full border px-2 py-1 text-xs font-semibold ${event.color}`}
                    >
                      {event.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-300">
                      {toDateKey(event.start)} → {toDateKey(event.end)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(event.id)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:text-slate-200"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default ThreeMonthCalendar;
