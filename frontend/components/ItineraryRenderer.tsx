import ReactMarkdown from "react-markdown";

type DaySection = {
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  other: string;
};

/** Parse AI markdown into per-day sections with morning/afternoon/evening columns */
export function parseItinerary(markdown: string): { intro: string; days: DaySection[] } {
  const lines = markdown.split("\n");
  const days: DaySection[] = [];
  let intro = "";
  let currentDay: DaySection | null = null;
  let currentSection: "morning" | "afternoon" | "evening" | "other" | "intro" = "intro";
  const introLines: string[] = [];

  for (const line of lines) {
    const isDay = /^#{1,2}\s+day\s+\d+/i.test(line);
    const isMorning = /^#{2,3}\s+morning/i.test(line);
    const isAfternoon = /^#{2,3}\s+afternoon/i.test(line);
    const isEvening = /^#{2,3}\s+(evening|night)/i.test(line);

    if (isDay) {
      if (currentDay) days.push(currentDay);
      currentDay = { title: line.replace(/^#+\s*/, ""), morning: "", afternoon: "", evening: "", other: "" };
      currentSection = "other";
    } else if (isMorning && currentDay) {
      currentSection = "morning";
    } else if (isAfternoon && currentDay) {
      currentSection = "afternoon";
    } else if (isEvening && currentDay) {
      currentSection = "evening";
    } else if (currentDay) {
      currentDay[currentSection === "intro" ? "other" : currentSection] += line + "\n";
    } else {
      introLines.push(line);
    }
  }

  if (currentDay) days.push(currentDay);
  intro = introLines.join("\n").trim();

  return { intro, days };
}

const sectionLabel: Record<string, { label: string; color: string; bg: string }> = {
  morning:   { label: "🌅 Morning",   color: "text-amber-700",  bg: "bg-amber-50 border-amber-100" },
  afternoon: { label: "☀️ Afternoon", color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
  evening:   { label: "🌙 Evening",   color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
};

export function ItineraryRenderer({ markdown }: { markdown: string }) {
  const { intro, days } = parseItinerary(markdown);

  // Fallback: if no days parsed, render plain markdown
  if (days.length === 0) {
    return (
      <div className="prose prose-sm max-w-none prose-headings:text-zinc-800 prose-h2:text-blue-700 prose-li:text-zinc-600">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Intro section (budget breakdown etc) */}
      {intro && (
        <div className="prose prose-sm max-w-none prose-p:text-zinc-600 prose-strong:text-zinc-800 prose-li:text-zinc-600">
          <ReactMarkdown>{intro}</ReactMarkdown>
        </div>
      )}

      {/* Per-day cards */}
      {days.map((day, i) => (
        <div key={i} className="rounded-lg border border-zinc-100 overflow-hidden shadow-sm">
          {/* Day header */}
          <div className="bg-blue-600 px-5 py-3">
            <h3 className="text-sm font-bold text-white">{day.title}</h3>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
            {(["morning", "afternoon", "evening"] as const).map((period) => {
              const content = day[period].trim();
              const meta = sectionLabel[period];
              return (
                <div key={period} className={`p-4 ${meta.bg} border-t md:border-t-0 border-zinc-100`}>
                  <p className={`text-xs font-bold mb-2 ${meta.color}`}>{meta.label}</p>
                  {content ? (
                    <div className="prose prose-xs max-w-none
                      prose-p:text-zinc-600 prose-p:text-xs prose-p:my-0.5 prose-p:leading-relaxed
                      prose-ul:pl-3 prose-ul:my-1
                      prose-li:text-zinc-600 prose-li:text-xs prose-li:my-0.5
                      prose-strong:text-zinc-700 prose-strong:font-semibold
                    ">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">—</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Other content per day (transportation, food, etc) */}
          {day.other.trim() && (
            <div className="px-5 py-3 bg-white border-t border-zinc-100">
              <div className="prose prose-xs max-w-none prose-p:text-zinc-500 prose-p:text-xs prose-li:text-zinc-500 prose-li:text-xs prose-strong:text-zinc-700">
                <ReactMarkdown>{day.other}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
