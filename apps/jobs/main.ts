import { program } from "commander";
import { deleteOldRooms } from "./src/jobs";
import { logger } from "./src/utils/logger";

program
  .option("-j, --job <job>", "The job to run")
  .option("-d, --dry-run", "Dry run the job")
  .parse(process.argv);

const job = program.opts().job;
const dryRun = program.opts().dryRun;

async function main() {
  logger.info({ job, dryRun }, "Running job");
  let success = false;
  if (job === "delete-old-rooms") {
    success = (await deleteOldRooms({ dryRun })).success;
  } else {
    logger.error({ job }, `Unknown job: "${job}"`);
    success = false;
  }

  if (success) {
    logger.info("Job completed successfully");
    process.exit(0);
  } else {
    logger.error("Job failed");
    process.exit(1);
  }
}

main();
