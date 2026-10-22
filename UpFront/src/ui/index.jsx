import React, { useId } from "react";
import { Plus, X } from "lucide-react";
import "./ui.css";

/* Shared building blocks, so every page looks and behaves the same.
 * Styles live in ui.css. */

export const Page = ({ title, description, actions, children }) => (
  <div className="ui-page">
    <header className="ui-page-header">
      <div>
        <h1 className="ui-page-title">{title}</h1>
        {description && <p className="ui-page-description">{description}</p>}
      </div>
      {actions && <div className="ui-actions">{actions}</div>}
    </header>
    {children}
  </div>
);

export const Section = ({ title, actions, children }) => (
  <section className="ui-section">
    {(title || actions) && (
      <div className="ui-section-header">
        {title && <h2 className="ui-section-title">{title}</h2>}
        {actions}
      </div>
    )}
    {children}
  </section>
);

// A <form> that never reloads the page; Enter (or "OK" on a phone
// keyboard) submits it.
export const Form = ({ onSubmit, children, ...props }) => (
  <form
    className="ui-form"
    noValidate
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit?.();
    }}
    {...props}
  >
    {children}
  </form>
);

export const Grid = ({ children }) => <div className="ui-grid">{children}</div>;

/**
 * Label + control. Pass the control as children, or use the TextField /
 * SelectField shortcuts below.
 */
export const Field = ({ label, required, hint, full, htmlFor, children }) => (
  <div className={`ui-field${full ? " full" : ""}`}>
    <label className="ui-label" htmlFor={htmlFor}>
      {label}
      {required && <span className="ui-required" aria-hidden="true">*</span>}
    </label>
    {children}
    {hint && <span className="ui-hint">{hint}</span>}
  </div>
);

export const Input = (props) => <input className="ui-input" {...props} />;

export const TextField = ({ label, required, hint, full, id, ...inputProps }) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} required={required} hint={hint} full={full} htmlFor={inputId}>
      <Input id={inputId} required={required} {...inputProps} />
    </Field>
  );
};

/**
 * Native <select>: on phones it opens the system picker, which is far
 * easier to use than a custom dropdown.
 * options: array of strings or {value, label}.
 */
export const Select = ({ options, placeholder = "Choisir…", value, ...props }) => (
  <select
    className={`ui-select${value ? "" : " is-empty"}`}
    value={value}
    {...props}
  >
    <option value="">{placeholder}</option>
    {options.map((option) => {
      const { value: v, label } =
        typeof option === "string" ? { value: option, label: option } : option;
      return (
        <option key={v} value={v}>
          {label}
        </option>
      );
    })}
  </select>
);

export const Button = ({
  variant = "primary",
  size,
  icon: Icon,
  loading = false,
  disabled,
  children,
  className = "",
  type = "button",
  ...props
}) => (
  <button
    type={type}
    className={`ui-btn ui-btn-${variant}${size ? ` ui-btn-${size}` : ""} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <span className="ui-spinner" aria-hidden="true" /> : Icon && <Icon size={18} />}
    {children}
  </button>
);

export const Actions = ({ children }) => <div className="ui-actions">{children}</div>;

export const Alert = ({ type = "error", children }) => (
  <div className={`ui-alert ui-alert-${type}`} role={type === "error" ? "alert" : "status"}>
    {children}
  </div>
);

export const Empty = ({ children }) => <p className="ui-empty">{children}</p>;

export const Stats = ({ items }) => (
  <div className="ui-stats">
    {items.map(({ label, value }) => (
      <div key={label} className="ui-stat">
        <div className="ui-stat-label">{label}</div>
        <div className="ui-stat-value">{value}</div>
      </div>
    ))}
  </div>
);

/**
 * Table that turns into one card per row on narrow screens.
 * columns: [{ key, label, align: "right"|"center", primary, actions,
 *             render: (row) => node }]
 * The `primary` column is the card's title on phones, `actions` holds
 * buttons. isTotal(row) highlights total rows.
 */
export const DataTable = ({ columns, rows, rowKey, empty, isTotal, footer }) => {
  if (!rows.length) return <Empty>{empty}</Empty>;
  const cellClass = (column) =>
    [
      column.align && `align-${column.align}`,
      column.primary && "is-primary",
      column.actions && "is-actions",
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.align && `align-${column.align}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={rowKey ? rowKey(row, index) : index}
              className={isTotal?.(row) ? "is-total" : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className={cellClass(column)} data-label={column.label}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr>
              {columns.map((column) => (
                <td key={column.key} className={cellClass(column)} data-label={column.label}>
                  {footer[column.key]}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

/* ---------- Product lines (commandes, factures, stock client) ---------- */

export const EMPTY_LINE = { produit: "", quantite: "" };
export const MAX_LINES = 10;

/**
 * Editable list of "product + quantity" lines with add / remove buttons.
 * lines: [{produit, quantite}]; onChange receives the new array.
 */
export const ProductLines = ({ lines, onChange, produits, loading, error, onRetry }) => {
  const update = (index, patch) =>
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  const remove = (index) =>
    onChange(lines.length === 1 ? [EMPTY_LINE] : lines.filter((_, i) => i !== index));

  return (
    <div className="ui-lines">
      <div className="ui-lines-head" aria-hidden="true">
        <span>
          Produit<span className="ui-required">*</span>
        </span>
        <span>Quantité</span>
        <span />
      </div>

      {lines.map((line, index) => {
        // A product already picked on another line can't be picked twice.
        const taken = new Set(lines.filter((_, i) => i !== index).map((l) => l.produit));
        return (
          <div className="ui-line" key={index}>
            <Select
              aria-label={`Produit ${index + 1}`}
              value={line.produit}
              onChange={(e) => update(index, { produit: e.target.value })}
              placeholder={loading ? "Chargement…" : "Choisir un produit"}
              options={produits.filter((p) => p === line.produit || !taken.has(p))}
              disabled={loading}
            />
            <Input
              aria-label={`Quantité ${index + 1}`}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={line.quantite}
              onChange={(e) => update(index, { quantite: e.target.value })}
            />
            <Button
              variant="ghost"
              className="ui-btn-icon"
              onClick={() => remove(index)}
              aria-label={`Retirer la ligne ${index + 1}`}
              title="Retirer la ligne"
            >
              <X size={18} />
            </Button>
          </div>
        );
      })}

      {error && (
        <Alert>
          {error}
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              Réessayer
            </Button>
          )}
        </Alert>
      )}

      <div className="ui-lines-footer">
        <Button
          variant="ghost"
          size="sm"
          icon={Plus}
          onClick={() => onChange([...lines, EMPTY_LINE])}
          disabled={lines.length >= MAX_LINES}
        >
          Ajouter un produit
        </Button>
        <span>
          {lines.filter((l) => l.produit).length} produit(s)
        </span>
      </div>
    </div>
  );
};

/**
 * Checks the lines and builds the API payload [{NameProduit, Quantite}].
 * Returns { error } or { items }. Empty lines are ignored.
 */
export function productLinesPayload(lines, { allowZero = false } = {}) {
  const items = [];
  for (const [index, { produit, quantite }] of lines.entries()) {
    if (!produit && quantite === "") continue;
    const n = index + 1;
    if (!produit) return { error: `Ligne ${n} : choisissez le produit.` };
    if (quantite === "") return { error: `Ligne ${n} : saisissez la quantité de ${produit}.` };
    const quantity = Number(quantite);
    if (!Number.isInteger(quantity) || quantity < 0 || (!allowZero && quantity === 0)) {
      return {
        error: `Ligne ${n} : la quantité de ${produit} doit être un nombre entier${
          allowZero ? " positif ou nul" : " supérieur à 0"
        }.`,
      };
    }
    items.push({ NameProduit: produit, Quantite: quantity });
  }
  if (!items.length) return { error: "Ajoutez au moins un produit avec sa quantité." };
  return { items };
}
