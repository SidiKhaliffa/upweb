import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { dismissToast, subscribeToasts } from "../utils/toast";
import "./Toaster.css";

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };

const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeToasts(setToasts), []);

  return (
    <div className="toaster" aria-live="polite">
      {toasts.map(({ id, type, message }) => {
        const Icon = ICONS[type];
        return (
          <div key={id} className={`toast toast-${type}`} role={type === "error" ? "alert" : "status"}>
            <Icon size={20} className="toast-icon" />
            <p className="toast-message">{message}</p>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismissToast(id)}
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;
