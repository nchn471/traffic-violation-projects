"use client";

import { formatTime } from "@/components/features/violations/utils";

export function Test() {
  const formattedTime = formatTime("2025-07-01T07:35:52.792924");
  console.log("✅ full:", formattedTime.full);

  return (
    <div>
      <h1>Full: {formattedTime.full}</h1>
      <p>Date: {formattedTime.date}</p>
      <p>Time: {formattedTime.time}</p>
      <p>DateTime: {formattedTime.dateTime}</p>
    </div>
  );
}
