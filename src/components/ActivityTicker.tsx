"use client";

export function ActivityTicker() {
  const items = [
    { text: "📱 iPhone found at Library", highlight: "iPhone" },
    { text: "🎒 Backpack reported lost near CICT Bldg", highlight: "CICT Bldg" },
    { text: "🔑 Keys returned — +50 Karma to finder!", highlight: "+50 Karma" },
    { text: "🪪 ID found at Main Gate", highlight: "Main Gate" },
    { text: "👕 Jacket lost at Gymnasium", highlight: "Gymnasium" },
    { text: "⌚ Watch returned — +50 Karma to finder!", highlight: "+50 Karma" },
  ];

  return (
    <div className="bg-wvsu-blue-deeper py-[7px] px-6 overflow-hidden whitespace-nowrap">
      <div className="inline-block animate-ticker">
        {/* Duplicate for seamless loop */}
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="inline-block mr-12 text-[11px] text-white/75 font-mono"
          >
            {item.text.split(item.highlight).map((part, j, arr) => (
              <span key={j}>
                {part}
                {j < arr.length - 1 && (
                  <span className="text-wvsu-gold font-bold">
                    {item.highlight}
                  </span>
                )}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
