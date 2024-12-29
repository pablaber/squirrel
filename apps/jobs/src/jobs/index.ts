import type { Job } from "../types";
import { deleteOldRoomsJob } from "./delete-old-rooms";

export const jobs: Record<string, Job> = {
  deleteOldRooms: deleteOldRoomsJob,
};
