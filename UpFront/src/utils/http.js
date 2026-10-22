// Server errors come as {message} from UpBack, as plain text, or as an
// ASP.NET validation object ({errors: {field: [messages]}}).
export async function readErrorMessage(response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (data.message) return data.message;
    const errors = data.errors || data.Errors;
    if (errors) return Object.values(errors).flat().join("\n");
    return text;
  } catch {
    return text || `Erreur ${response.status}`;
  }
}
