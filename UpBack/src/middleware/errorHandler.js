// Only intentional errors (httpError, status < 500) reach the client with
// their message. Unexpected ones are logged and answered generically, so
// SQL errors and stack details never leak like they did on the .NET API.
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Une erreur interne est survenue." });
  }
  res.status(status).json({ message: err.message });
}
