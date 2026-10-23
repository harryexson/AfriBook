// Hooks are a local development convenience, never a deployment prerequisite.
if (!process.env.CI && !process.env.VERCEL) {
  import('husky').then(({ default: install }) => install()).catch((error) => {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  });
}
