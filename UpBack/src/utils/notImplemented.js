// Placeholder handler for routes whose DB queries we can't write yet
// without the real MySQL schema. Returns 501 so the frontend's error
// handling (which already treats any non-ok response as a failure) does
// something sane instead of hanging, and so it's obvious in the Network
// tab which endpoints are still stubs.
export function notImplemented(note) {
  return (req, res) => {
    res.status(501).json({
      message: `Pas encore implémenté côté UpBack : ${note}`,
    });
  };
}
