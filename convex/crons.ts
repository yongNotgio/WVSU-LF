import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "auto-archive old posts",
  { hourUTC: 0, minuteUTC: 0 },
  internal.safety.autoArchiveOldPosts
);

export default crons;
