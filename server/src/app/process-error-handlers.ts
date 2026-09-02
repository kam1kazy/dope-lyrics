const report = (kind: string, error: unknown): void => {
  console.error(kind, error);
};

process.on('uncaughtException', (error: Error) => {
  report('uncaughtException', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  report('unhandledRejection', reason);
});
