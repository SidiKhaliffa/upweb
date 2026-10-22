import React, { useEffect, useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { readErrorMessage } from "../utils/http";
import "./PdfViewer.css";

// Phones and tablets can't reliably show a PDF inside an iframe (blank
// frame, first page only, or a download prompt), so they get buttons
// that hand the file to the device's own PDF reader instead.
const canPreviewInline = () =>
  navigator.pdfViewerEnabled !== false &&
  !window.matchMedia("(pointer: coarse)").matches;

// "attachment; filename="X.pdf"; filename*=UTF-8''X.pdf" -> "X.pdf"
function fileNameFromHeader(header) {
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header || "");
  if (utf8) return decodeURIComponent(utf8[1]);
  return /filename="?([^";]+)"?/i.exec(header || "")?.[1] ?? null;
}

const pad = (n) => String(n).padStart(2, "0");

// Today as "yyyy-MM-dd" in the user's timezone.
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Shared PDF preview popup. Opens when `pdf` is set and fetches it with
 * the user's token.
 *
 * pdf: { title, url, fileName } | null — fileName is the fallback when
 * the server doesn't send one.
 * For a PDF of one day, pass { title, urlForDate, fileNameForDate } instead
 * (functions of a "yyyy-MM-dd" date): the popup then shows a date picker,
 * starting on today.
 */
const PdfViewer = ({ pdf, onClose }) => {
  const { authFetch } = useAuth();
  const [date, setDate] = useState(todayIso);
  const [blobUrl, setBlobUrl] = useState(null);
  const [fileName, setFileName] = useState("document.pdf");
  const [error, setError] = useState(null);
  const inline = canPreviewInline();
  const hasDate = Boolean(pdf?.urlForDate);
  const url = hasDate ? pdf.urlForDate(date) : pdf?.url;
  const defaultFileName =
    (hasDate ? pdf.fileNameForDate?.(date) : pdf?.fileName) || "document.pdf";

  // Back to today once closed, so the next PDF opens on today.
  useEffect(() => {
    if (!pdf) setDate(todayIso());
  }, [pdf]);

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    let createdUrl = null;
    setBlobUrl(null);
    setError(null);
    setFileName(defaultFileName);

    (async () => {
      try {
        const response = await authFetch(url, { method: "GET" });
        if (!response.ok) {
          const message = await readErrorMessage(response);
          if (!cancelled) setError(message);
          return;
        }
        const name = fileNameFromHeader(response.headers.get("Content-Disposition"));
        const blob = await response.blob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        if (name) setFileName(name);
      } catch {
        if (!cancelled) {
          setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [url]);

  // Escape closes the popup; the page behind doesn't scroll while open.
  useEffect(() => {
    if (!pdf) return undefined;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pdf, onClose]);

  if (!pdf) return null;

  const download = () => {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div
        className="pdf-viewer"
        role="dialog"
        aria-modal="true"
        aria-label={pdf.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdf-viewer-header">
          <h2 className="pdf-viewer-title">{pdf.title}</h2>
          <div className="pdf-viewer-actions">
            {/* On phones the download button sits in the body instead. */}
            {inline && (
              <button
                type="button"
                className="pdf-viewer-btn primary"
                onClick={download}
                disabled={!blobUrl}
              >
                <Download size={18} />
                <span>Télécharger</span>
              </button>
            )}
            <button
              type="button"
              className="pdf-viewer-close"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {hasDate && (
          <div className="pdf-viewer-toolbar">
            <label htmlFor="pdf-viewer-date">Date</label>
            <input
              id="pdf-viewer-date"
              type="date"
              className="pdf-viewer-date"
              value={date}
              max={todayIso()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
            {date !== todayIso() && (
              <button
                type="button"
                className="pdf-viewer-link"
                onClick={() => setDate(todayIso())}
              >
                Aujourd'hui
              </button>
            )}
          </div>
        )}

        <div className="pdf-viewer-body">
          {error ? (
            <div className="pdf-viewer-state error">
              <p>{error}</p>
              <button type="button" className="pdf-viewer-btn" onClick={onClose}>
                Fermer
              </button>
            </div>
          ) : !blobUrl ? (
            <div className="pdf-viewer-state">
              <div className="pdf-viewer-spinner" />
              <p>Chargement du PDF...</p>
            </div>
          ) : inline ? (
            <iframe src={blobUrl} title={pdf.title} className="pdf-viewer-frame" />
          ) : (
            <div className="pdf-viewer-state">
              <p className="pdf-viewer-filename">{fileName}</p>
              <p>Le PDF est prêt.</p>
              <div className="pdf-viewer-mobile-actions">
                <a
                  className="pdf-viewer-btn primary"
                  href={blobUrl}
                  target="_blank"
                  rel="noopener"
                >
                  <ExternalLink size={18} />
                  Ouvrir
                </a>
                <button type="button" className="pdf-viewer-btn" onClick={download}>
                  <Download size={18} />
                  Télécharger
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
