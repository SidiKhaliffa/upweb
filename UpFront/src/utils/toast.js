// Small notification store used instead of alert(), which blocks the page
// and looks out of place. <Toaster /> (mounted once in App) renders them.
//   toast.success("Commande enregistrée.")
//   toast.error("Le code client est obligatoire.")

let nextId = 1;
let toasts = [];
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener(toasts));

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function show(type, message, duration) {
  if (!message) return;
  const id = nextId++;
  // The same message twice in a row (double click) is shown once.
  toasts = toasts.filter((t) => t.message !== message);
  toasts = [...toasts, { id, type, message }].slice(-4);
  emit();
  setTimeout(() => dismissToast(id), duration);
}

export const toast = {
  success: (message) => show("success", message, 3500),
  // Errors stay longer: they usually need to be read and acted on.
  error: (message) => show("error", message, 7000),
  info: (message) => show("info", message, 4500),
};

export function subscribeToasts(listener) {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}
