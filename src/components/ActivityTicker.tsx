"use client";

import { CreditCard, KeyRound, Package, Shirt, Smartphone, Watch } from "lucide-react";

export function ActivityTicker() {
  const items = [
    { Icon: Smartphone, text: "iPhone found at Library", highlight: "iPhone" },
    { Icon: Package, text: "Backpack reported lost near CICT Bldg", highlight: "CICT Bldg" },
    { Icon: KeyRound, text: "Keys returned - +50 Karma to finder!", highlight: "+50 Karma" },
    { Icon: CreditCard, text: "ID found at Main Gate", highlight: "Main Gate" },
    { Icon: Shirt, text: "Jacket lost at Gymnasium", highlight: "Gymnasium" },
    { Icon: Watch, text: "Watch returned - +50 Karma to finder!", highlight: "+50 Karma" },
  ];

  return (
    <div className="bg-wvsu-blue-deeper py-[7px] px-6 overflow-hidden whitespace-nowrap">
      <div className="inline-block animate-ticker">
        {/* Duplicate for seamless loop */}
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 mr-12 text-[11px] text-white/75 font-mono"
          >
            <item.Icon className="h-3.5 w-3.5 shrink-0" />
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
