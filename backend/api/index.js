let app;

export default async function handler(req, res) {
  try {
    if (!app) {
      const mod = await import("../src/app.js");
      app = mod.default;
    }
    app(req, res);
  } catch (err) {
    console.error("Vercel handler startup error:", err);
    if (!res.headersSent) {
      const isEnvError = /environment variable/i.test(err.message);
      res.status(500).json({
        message: "Server failed to start",
        error: err.message,
        ...(isEnvError
          ? {
              hint: "Add the missing variables in Vercel → Project Settings → Environment Variables, then redeploy.",
            }
          : {}),
      });
    }
  }
}
