import React, { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { formatAmount } from "../utils/format";
import { Field } from "../ui";
import "./ClientPicker.css";

const SEARCH_DELAY_MS = 250;

const describe = (client) =>
  [client.societe, client.zone, client.phone].filter(Boolean).join(" · ");

/**
 * "Code client" field with search: typing a code, a name, a société, a
 * zone or a phone number lists the matching clients. Picking one fills
 * the code. A code typed in full still works without picking.
 *
 * value / onChange(code): the client code, like a plain text field.
 * onSelect(client): optional, called when a client is picked.
 */
const ClientPicker = ({ label = "Client", required, value, onChange, onSelect, autoFocus }) => {
  const { authFetch } = useAuth();
  const inputId = useId();
  const listId = useId();
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const boxRef = useRef(null);
  // Set when a client is picked, so picking doesn't trigger a new search.
  const skipSearch = useRef(false);

  // The form was reset or the code edited: forget the picked client.
  useEffect(() => {
    if (selected && selected.code !== value) setSelected(null);
  }, [value]);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return undefined;
    }
    const q = (value ?? "").trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await authFetch(`${API_BASE}/Clients/search?q=${encodeURIComponent(q)}`);
        const data = response.ok ? await response.json() : [];
        if (cancelled) return;
        setResults(Array.isArray(data) ? data : []);
        setActive(-1);
        setOpen(true);
        // A code typed in full is recognised without picking it.
        const exact = data.find?.((c) => c.code === q);
        if (exact) setSelected(exact);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  // Close the list when tapping elsewhere.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const pick = (client) => {
    skipSearch.current = client.code !== value;
    setSelected(client);
    setOpen(false);
    onChange(client.code);
    onSelect?.(client);
  };

  const onKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      // Pick the highlighted client instead of submitting the form.
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Field label={label} required={required} htmlFor={inputId}>
      <div className="client-picker" ref={boxRef}>
        <div className="client-picker-input">
          <Search size={18} className="client-picker-icon" />
          <input
            id={inputId}
            className="ui-input"
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            autoFocus={autoFocus}
            placeholder="Code, nom, zone ou téléphone"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => results.length && !selected && setOpen(true)}
            onKeyDown={onKeyDown}
          />
          {value && (
            <button
              type="button"
              className="client-picker-clear"
              onClick={() => {
                onChange("");
                setResults([]);
              }}
              aria-label="Effacer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {open && (
          <ul className="client-picker-list" id={listId} role="listbox">
            {loading && !results.length ? (
              <li className="client-picker-empty">Recherche…</li>
            ) : results.length ? (
              results.map((client, i) => (
                <li
                  key={client.code}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`client-picker-option${i === active ? " active" : ""}`}
                  // pointerdown, so the pick happens before the input loses focus.
                  onPointerDown={(e) => {
                    e.preventDefault();
                    pick(client);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="client-picker-name">{client.name || "Sans nom"}</span>
                  <span className="client-picker-meta">
                    <strong>{client.code}</strong>
                    {describe(client) && ` · ${describe(client)}`}
                  </span>
                </li>
              ))
            ) : (
              <li className="client-picker-empty">Aucun client trouvé.</li>
            )}
          </ul>
        )}

        {selected && (
          <div className="client-picker-selected">
            <span className="client-picker-name">{selected.name || selected.code}</span>
            <span className="client-picker-meta">
              {[selected.zone, selected.phone].filter(Boolean).join(" · ")}
              {selected.solde > 0 && (
                <>
                  {" · "}
                  <span className="client-picker-due">Doit {formatAmount(selected.solde)}</span>
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </Field>
  );
};

export default ClientPicker;
