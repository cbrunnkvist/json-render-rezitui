import {
  ui,
  type VNode,
  type PageOptions,
  type TableProps,
  type VirtualListProps,
  type LogsConsoleProps,
} from "@rezi-ui/core";
import type { ReziComponentContext } from "../types.js";

// =============================================================================
// Page Component
// =============================================================================

/**
 * Page component - root-level wrapper with header/body/footer structure.
 * Maps to ui.page(options) for full-page layouts.
 *
 * @param ctx - Component context with props
 * @returns VNode for the Page
 *
 * @example
 * // JSON spec:
 * {
 *   type: "Page",
 *   props: {
 *     header: { type: "Header", props: { title: "Dashboard" } },
 *     body: { type: "Column", children: [...] },
 *     footer: { type: "StatusBar", props: { ... } }
 *   }
 * }
 */
export function Page(ctx: ReziComponentContext<PageOptions>): VNode {
  return ui.page(ctx.props);
}

// =============================================================================
// Panel Component
// =============================================================================

/**
 * Panel options for the Panel component.
 * Extends the core PanelOptions with optional children.
 */
export interface PanelProps {
  id?: string;
  key?: string;
  title?: string;
  variant?: "none" | "single" | "double" | "rounded";
  p?: number;
  gap?: number;
  style?: Record<string, unknown>;
}

/**
 * Panel component - section container with optional border and title.
 * Maps to ui.panel(options, children) for grouped content.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the Panel
 *
 * @example
 * // JSON spec:
 * { type: "Panel", props: { title: "Settings" }, children: [...] }
 * { type: "Panel", props: { variant: "rounded", p: 1 }, children: [...] }
 */
export function Panel(ctx: ReziComponentContext<PanelProps>): VNode {
  const { id, key, title, variant, p, gap, style } = ctx.props;

  const options: {
    id?: string;
    key?: string;
    title?: string;
    variant?: PanelProps["variant"];
    p?: number;
    gap?: number;
    style?: Record<string, unknown>;
  } = {};

  if (id !== undefined) options.id = id;
  if (key !== undefined) options.key = key;
  if (title !== undefined) options.title = title;
  if (variant !== undefined) options.variant = variant;
  if (p !== undefined) options.p = p;
  if (gap !== undefined) options.gap = gap;
  if (style !== undefined) options.style = style;

  return ui.panel(options, ctx.children ?? []);
}

// =============================================================================
// Table Component
// =============================================================================

/**
 * Table column definition for JSON schema.
 */
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: number;
  flex?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  overflow?: "clip" | "ellipsis" | "middle";
}

/**
 * Table component props for JSON schema.
 */
export interface TableSchemaProps<T = Record<string, unknown>> {
  id?: string;
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey?: string | ((row: T) => string);
  selection?: string | string[];
  selectionMode?: "single" | "multi" | "none";
  onSelectionChange?: string;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: string;
}

/**
 * Table component - tabular data display with sorting and selection.
 * Maps to ui.table(props) for data tables.
 *
 * @param ctx - Component context with props
 * @returns VNode for the Table
 *
 * @example
 * // JSON spec:
 * {
 *   type: "Table",
 *   props: {
 *     id: "users",
 *     columns: [
 *       { key: "name", header: "Name", flex: 1 },
 *       { key: "email", header: "Email", width: 30 }
 *     ],
 *     rows: [
 *       { id: "1", name: "Alice", email: "alice@example.com" },
 *       { id: "2", name: "Bob", email: "bob@example.com" }
 *     ],
 *     getRowKey: "id"
 *   }
 * }
 */
export function Table<T = Record<string, unknown>>(
  ctx: ReziComponentContext<TableSchemaProps<T>>
): VNode {
  const {
    id,
    columns,
    rows,
    getRowKey,
    selection,
    selectionMode,
    onSelectionChange,
    sortColumn,
    sortDirection,
    onSort,
  } = ctx.props;

  // Build TableProps from schema props
  const tableProps: TableProps<T> = {
    id: id ?? "table",
    columns: columns.map((col) => ({
      key: col.key,
      header: col.header,
      ...(col.width !== undefined && { width: col.width }),
      ...(col.flex !== undefined && { flex: col.flex }),
      ...(col.align !== undefined && { align: col.align }),
      ...(col.sortable !== undefined && { sortable: col.sortable }),
      ...(col.overflow !== undefined && { overflow: col.overflow }),
    })),
    data: rows,
    getRowKey:
      typeof getRowKey === "string"
        ? (row: T) => String((row as Record<string, unknown>)[getRowKey])
        : getRowKey ?? ((row: T, index: number) => String(index)),
    ...(selection !== undefined && { selection: Array.isArray(selection) ? selection : [selection] }),
    ...(selectionMode !== undefined && { selectionMode }),
    ...(sortColumn !== undefined && { sortColumn }),
    ...(sortDirection !== undefined && { sortDirection }),
    ...(onSelectionChange !== undefined && {
      onSelectionChange: (keys: readonly string[]) =>
        ctx.emit("selectionChange", { action: onSelectionChange, keys: Array.from(keys) }),
    }),
    ...(onSort !== undefined && {
      onSort: (col: string, dir: "asc" | "desc") =>
        ctx.emit("sort", { action: onSort, column: col, direction: dir }),
    }),
  };

  return ui.table(tableProps);
}

// =============================================================================
// VirtualList Component
// =============================================================================

/**
 * VirtualList component props for JSON schema.
 */
export interface VirtualListSchemaProps<T = unknown> {
  id?: string;
  items: T[];
  itemHeight?: number;
  overscan?: number;
  renderItem?: string;
}

/**
 * VirtualList component - efficient rendering of large lists.
 * Maps to ui.virtualList(props) for virtualized lists.
 *
 * @param ctx - Component context with props
 * @returns VNode for the VirtualList
 *
 * @example
 * // JSON spec:
 * {
 *   type: "VirtualList",
 *   props: {
 *     id: "file-list",
 *     items: ["file1.ts", "file2.ts", "file3.ts"],
 *     itemHeight: 1,
 *     renderItem: "renderFileItem"
 *   }
 * }
 */
export function VirtualList<T = unknown>(
  ctx: ReziComponentContext<VirtualListSchemaProps<T>>
): VNode {
  const { id, items, itemHeight, overscan, renderItem } = ctx.props;

  const listProps: VirtualListProps<T> = {
    id: id ?? "virtual-list",
    items,
    ...(itemHeight !== undefined && { itemHeight }),
    ...(overscan !== undefined && { overscan }),
    renderItem: (item: T, index: number, focused: boolean) => {
      if (renderItem) {
        ctx.emit("renderItem", { action: renderItem, item, index, focused });
      }
      return ui.text(String(item));
    },
  };

  return ui.virtualList(listProps);
}

// =============================================================================
// Logs Component
// =============================================================================

/**
 * Log entry for the Logs component.
 */
export interface LogEntry {
  timestamp?: string;
  level?: "debug" | "info" | "warn" | "error";
  message: string;
}

/**
 * Logs component props for JSON schema.
 */
export interface LogsSchemaProps {
  id?: string;
  entries: LogEntry[];
  autoScroll?: boolean;
  levelFilter?: ("debug" | "info" | "warn" | "error")[];
  showTimestamps?: boolean;
  onClear?: string;
}

/**
 * Logs component - log viewer with filtering and auto-scroll.
 * Maps to ui.logsConsole(props) for log output display.
 *
 * @param ctx - Component context with props
 * @returns VNode for the Logs
 *
 * @example
 * // JSON spec:
 * {
 *   type: "Logs",
 *   props: {
 *     id: "build-logs",
 *     entries: [
 *       { timestamp: "10:00:01", level: "info", message: "Build started" },
 *       { timestamp: "10:00:05", level: "error", message: "Build failed" }
 *     ],
 *     autoScroll: true,
 *     levelFilter: ["info", "warn", "error"]
 *   }
 * }
 */
export function Logs(ctx: ReziComponentContext<LogsSchemaProps>): VNode {
  const { id, entries, autoScroll, levelFilter, showTimestamps, onClear } = ctx.props;

  const logsProps: LogsConsoleProps = {
    id: id ?? "logs",
    entries: entries.map((entry, i) => ({
      id: `log-${i}`,
      timestamp: entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now(),
      level: entry.level ?? "info",
      source: "system",
      message: entry.message,
    })),
    scrollTop: 0,
    onScroll: () => {},
    ...(autoScroll !== undefined && { autoScroll }),
    ...(levelFilter !== undefined && { levelFilter }),
    ...(showTimestamps !== undefined && { showTimestamps }),
    ...(onClear !== undefined && {
      onClear: () => ctx.emit("clear", { action: onClear }),
    }),
  };

  return ui.logsConsole(logsProps);
}
