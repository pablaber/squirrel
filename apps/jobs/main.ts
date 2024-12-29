import { program } from "commander";
import { jobs } from "./src/jobs";
import { logger } from "./src/utils/logger";
import { scheduleJob, gracefulShutdown } from "node-schedule";

program
  .option("-s, --schedule", "Run the jobs on a chron schedule provided")
  .option("-j, --job <job>", "The job to run")
  .option("-d, --dry-run", "Dry run the job")
  .parse(process.argv);

const schedule = program.opts().schedule as boolean;
const job = program.opts().job as string;
const dryRun = program.opts().dryRun as boolean;

/**
 * Schedules all jobs using node-schedule.
 */
async function scheduleJobs() {
  logger.info("Scheduling jobs...");
  Object.entries(jobs).forEach(([jobName, job]) => {
    scheduleJob(job.schedule, () => {
      logger.info({ jobName }, `Starting job: "${jobName}"`);
      job
        .handler({ dryRun })
        .then((result) => {
          logger.info({ jobName, result }, `Job "${jobName}" completed`);
        })
        .catch((error) => {
          logger.error({ jobName, error }, `Job "${jobName}" errored`);
        });
    });
    logger.info({ jobName }, `Scheduled job: "${jobName}"`);
  });
}

/**
 * Runs a single job with the provided name.
 */
async function runSingleJob(jobName: string, dryRun: boolean) {
  const fullJobName = `${jobName}Job`;
  const job = jobs[fullJobName];
  if (!job) {
    logger.error({ jobName }, `Unknown job: "${jobName}"`);
    process.exit(1);
  }
  const result = await job.handler({ dryRun });
  if (result.success) {
    logger.info({ jobName, result }, `Job "${jobName}" completed`);
    process.exit(0);
  } else {
    logger.error({ jobName, result }, `Job "${jobName}" failed`);
    process.exit(1);
  }
}

async function main() {
  if (schedule) {
    return scheduleJobs();
  }
  return runSingleJob(job, dryRun);
}

main();

process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  gracefulShutdown().then(() => {
    logger.info("Shutdown complete.");
    process.exit(0);
  });
});
