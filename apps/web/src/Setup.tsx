import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
type Row = {
  id: string;
  name?: string;
  code?: string;
  label?: string;
  text?: string;
  active: boolean;
  position?: number;
  department_id?: string;
  section_id?: string;
  equipment_type_id?: string;
  key?: string;
  kind?: string;
  required?: boolean;
  options?: string[];
};
const resources = [
  "departments",
  "sections",
  "equipment_types",
  "equipment",
  "detail_fields",
  "checklist_items",
] as const;
const tabs = ["Structure", "Equipment", "Details form", "Checklists"];
const titles: Record<string, string> = {
  departments: "Departments",
  sections: "Sections",
  equipment_types: "Equipment types",
  equipment: "Equipment",
  detail_fields: "Details form",
  checklist_items: "Checklists",
};
const parentKey: Record<string, string> = {
  sections: "department_id",
  equipment_types: "section_id",
  equipment: "equipment_type_id",
  detail_fields: "equipment_type_id",
  checklist_items: "equipment_type_id",
};
export function Setup() {
  const [tab, setTab] = useState("Structure");
  const queries = resources.map((resource) => ({ resource }));
  return (
    <section>
      <div className="tabs" role="tablist" aria-label="Setup areas">
        {tabs.map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "secondary" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Structure" ? <StructureTree /> : null}
      {queries
        .filter(({ resource }) =>
          tab === "Structure"
            ? ["departments", "sections", "equipment_types"].includes(resource)
            : tab === "Equipment"
              ? resource === "equipment"
              : tab === "Details form"
                ? resource === "detail_fields"
                : resource === "checklist_items",
        )
        .map(({ resource }) => (
          <ResourceEditor key={resource} resource={resource} />
        ))}
    </section>
  );
}
function StructureTree() {
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => api<Row[]>("/departments"),
  });
  const sections = useQuery({
    queryKey: ["sections"],
    queryFn: () => api<Row[]>("/sections"),
  });
  const types = useQuery({
    queryKey: ["equipment_types"],
    queryFn: () => api<Row[]>("/equipment_types"),
  });
  if (departments.isPending || sections.isPending || types.isPending)
    return <p role="status">Loading structure…</p>;
  if (departments.isError || sections.isError || types.isError)
    return <p role="alert">Unable to load structure</p>;
  return (
    <section className="panel">
      <h2>Company structure</h2>
      <ul className="tree">
        {departments.data
          .filter((d) => d.active)
          .map((d) => (
            <li key={d.id}>
              <TreeRow
                resource="departments"
                row={d}
                childResource="sections"
                parentField="department_id"
              />
              <ul>
                {sections.data
                  .filter((s) => s.active && s.department_id === d.id)
                  .map((s) => (
                    <li key={s.id}>
                      <TreeRow
                        resource="sections"
                        row={s}
                        childResource="equipment_types"
                        parentField="section_id"
                      />
                      <ul>
                        {types.data
                          .filter((t) => t.active && t.section_id === s.id)
                          .map((t) => (
                            <li key={t.id}>
                              <TreeRow resource="equipment_types" row={t} />
                            </li>
                          ))}
                      </ul>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
      </ul>
    </section>
  );
}
function TreeRow({
  resource,
  row,
  childResource,
  parentField,
}: {
  resource: string;
  row: Row;
  childResource?: string;
  parentField?: string;
}) {
  const [mode, setMode] = useState<"rename" | "add" | null>(null);
  const [error, setError] = useState("");
  const cache = useQueryClient();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const name = String(new FormData(event.currentTarget).get("name") || "");
    try {
      const target = mode === "rename" ? resource : childResource!;
      await api(
        `/${target}${mode === "rename" ? "/" + row.id : ""}`,
        mode === "rename" ? "PATCH" : "POST",
        mode === "rename" ? { name } : { name, [parentField!]: row.id },
      );
      await cache.invalidateQueries({ queryKey: [target] });
      setMode(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }
  return (
    <div>
      <strong>{row.name}</strong>{" "}
      <button className="secondary" onClick={() => setMode("rename")}>
        Rename
      </button>
      {childResource ? (
        <button className="secondary" onClick={() => setMode("add")}>
          Add {childResource === "sections" ? "section" : "equipment type"}
        </button>
      ) : null}
      {mode ? (
        <form className="inline-form" onSubmit={submit}>
          <label>
            {mode === "rename" ? "New name" : "Name"}
            <input
              name="name"
              required
              maxLength={200}
              defaultValue={mode === "rename" ? row.name : ""}
            />
          </label>
          <button>Save name</button>
          <button
            type="button"
            className="secondary"
            onClick={() => setMode(null)}
          >
            Cancel
          </button>
        </form>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
function ResourceEditor({
  resource,
}: {
  resource: (typeof resources)[number];
}) {
  const cache = useQueryClient();
  const list = useQuery({
    queryKey: [resource],
    queryFn: () => api<Row[]>(`/${resource}`),
  });
  const parentResource =
    resource === "sections"
      ? "departments"
      : resource === "equipment_types"
        ? "sections"
        : "equipment_types";
  const parents = useQuery({
    queryKey: [parentResource],
    queryFn: () => api<Row[]>(`/${parentResource}`),
    enabled: resource !== "departments",
  });
  const [editing, setEditing] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedParent, setSelectedParent] = useState("");
  const key = parentKey[resource];
  const rows = (list.data || []).filter(
    (r) => !key || !selectedParent || r[key as keyof Row] === selectedParent,
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = event.currentTarget;
    const fields: Record<string, unknown> = Object.fromEntries(
      new FormData(form),
    );
    if (resource === "detail_fields" || resource === "checklist_items")
      fields.position = Number(fields.position);
    if (resource === "detail_fields") {
      fields.required = fields.required === "on";
      fields.options = String(fields.options || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (fields.kind === "text") fields.options = [];
    }
    try {
      await api(
        `/${resource}${editing ? "/" + editing.id : ""}`,
        editing ? "PATCH" : "POST",
        fields,
      );
      await cache.invalidateQueries({ queryKey: [resource] });
      setEditing(null);
      form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPending(false);
    }
  }
  async function disable(row: Row) {
    setError("");
    try {
      await api(`/${resource}/${row.id}`, "DELETE");
      await cache.invalidateQueries({ queryKey: [resource] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }
  async function move(index: number, direction: number) {
    const ordered = [...rows];
    const other = index + direction;
    if (other < 0 || other >= ordered.length) return;
    [ordered[index], ordered[other]] = [ordered[other], ordered[index]];
    try {
      await api(`/${resource}/reorder`, "POST", {
        ids: ordered.map((r) => r.id),
      });
      await cache.invalidateQueries({ queryKey: [resource] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }
  return (
    <section className="panel">
      <h2>{titles[resource]}</h2>
      {key ? (
        <label>
          View by parent
          <select
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
          >
            <option value="">All</option>
            {parents.data
              ?.filter((r) => r.active)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
          </select>
        </label>
      ) : null}
      {list.isPending ? (
        <p role="status">Loading…</p>
      ) : list.isError ? (
        <p role="alert">Unable to load {titles[resource]}</p>
      ) : rows.length ? (
        <table>
          <thead>
            <tr>
              <th>Name / label</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>{row.name || row.code || row.label || row.text}</td>
                <td>{row.active ? "Active" : "Disabled"}</td>
                <td>
                  <button className="secondary" onClick={() => setEditing(row)}>
                    Edit
                  </button>{" "}
                  <button
                    className="secondary"
                    onClick={() => {
                      void disable(row);
                    }}
                  >
                    Disable
                  </button>
                  {(resource === "detail_fields" ||
                    resource === "checklist_items") &&
                  selectedParent ? (
                    <>
                      <button
                        className="secondary"
                        aria-label="Move up"
                        disabled={index === 0}
                        onClick={() => {
                          void move(index, -1);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        className="secondary"
                        aria-label="Move down"
                        disabled={index === rows.length - 1}
                        onClick={() => {
                          void move(index, 1);
                        }}
                      >
                        ↓
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No {titles[resource].toLowerCase()} yet. Add the first one below.</p>
      )}
      <form key={editing?.id || "new"} onSubmit={submit}>
        <h3>
          {editing ? "Edit" : "Add"} {titles[resource].toLowerCase()}
        </h3>
        {key ? (
          <label>
            Parent
            <select
              name={key}
              required
              defaultValue={String(
                editing?.[key as keyof Row] || selectedParent,
              )}
            >
              <option value="">Select…</option>
              {parents.data
                ?.filter((r) => r.active)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
        ) : null}
        {resource === "departments" ||
        resource === "sections" ||
        resource === "equipment_types" ? (
          <label>
            Name
            <input
              name="name"
              required
              maxLength={200}
              defaultValue={editing?.name}
            />
          </label>
        ) : null}
        {resource === "equipment" ? (
          <>
            <label>
              Unit code
              <input
                name="code"
                required
                maxLength={200}
                defaultValue={editing?.code}
              />
            </label>
            <label>
              Unit label
              <input
                name="label"
                required
                maxLength={200}
                defaultValue={editing?.label}
              />
            </label>
          </>
        ) : null}
        {resource === "detail_fields" ? (
          <>
            <label>
              Field key
              <input
                name="key"
                required
                pattern="[a-z][a-z0-9_]{0,39}"
                defaultValue={editing?.key}
              />
            </label>
            <label>
              Label
              <input name="label" required defaultValue={editing?.label} />
            </label>
            <label>
              Kind
              <select name="kind" defaultValue={editing?.kind || "text"}>
                <option value="text">Text</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </label>
            <label>
              Options (one per line)
              <textarea
                name="options"
                defaultValue={editing?.options?.join("\n")}
              />
            </label>
            <label>
              <input
                name="required"
                type="checkbox"
                defaultChecked={editing?.required}
              />
              Required
            </label>
          </>
        ) : null}
        {resource === "checklist_items" ? (
          <label>
            Checklist item
            <input
              name="text"
              required
              maxLength={200}
              defaultValue={editing?.text}
            />
          </label>
        ) : null}
        {resource === "detail_fields" || resource === "checklist_items" ? (
          <label>
            Position
            <input
              name="position"
              type="number"
              min={0}
              max={10000}
              required
              defaultValue={editing?.position ?? rows.length}
            />
          </label>
        ) : null}
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
        <div>
          <button disabled={pending}>{pending ? "Saving…" : "Save"}</button>
          {editing ? (
            <button
              type="button"
              className="secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
