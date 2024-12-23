import { program } from "commander";
import { deleteOldRooms } from "./src/jobs";

program.option("-j, --job <job>", "The job to run").parse(process.argv);

const job = program.opts().job;

if (job === "delete-old-rooms" || job === "deleteOldRooms") {
  await deleteOldRooms();
}
