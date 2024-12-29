export type Job = {
  schedule: string;
  handler<T = {}>(
    options: { dryRun: boolean } & T
  ): Promise<{ success: boolean }>;
};
