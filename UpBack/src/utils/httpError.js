// Errors carrying a status below 500 are shown to the client as-is; the
// error handler hides the message of anything else.
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
