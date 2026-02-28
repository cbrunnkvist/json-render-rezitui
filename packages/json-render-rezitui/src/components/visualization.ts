import { ui, type VNode } from "@rezi-ui/core";
import type {
  CodeEditorProps,
  DiffViewerProps,
  CanvasProps,
  LineChartProps,
  BarChartProps,
  GaugeProps,
} from "@rezi-ui/core";
import type { ReziComponentContext } from "../types.js";

// =============================================================================
// Spinner Component
// =============================================================================

/**
 * Spinner component - animated loading indicator.
 * Maps to ui.spinner() for spinner visualization.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the Spinner
 */
export function Spinner(ctx: ReziComponentContext<any>): VNode {
  return ui.spinner(ctx.props);
}

// =============================================================================
// CodeEditor Component
// =============================================================================

/**
 * Code editor component - a code editing widget with syntax highlighting.
 * Maps to ui.codeEditor() for multiline code editing.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the CodeEditor
 */
export function CodeEditor(ctx: ReziComponentContext<CodeEditorProps>): VNode {
  return ui.codeEditor(ctx.props);
}

// =============================================================================
// DiffViewer Component
// =============================================================================

/**
 * Diff viewer component - displays file changes between original and modified.
 * Maps to ui.diffViewer() for showing diffs.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the DiffViewer
 */
export function DiffViewer(ctx: ReziComponentContext<DiffViewerProps>): VNode {
  return ui.diffViewer(ctx.props);
}

// =============================================================================
// Canvas Component
// =============================================================================

/**
 * Canvas component - a drawing surface for custom graphics.
 * Maps to ui.canvas() for canvas rendering.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the Canvas
 */
export function Canvas(ctx: ReziComponentContext<CanvasProps>): VNode {
  return ui.canvas(ctx.props);
}

// =============================================================================
// LineChart Component
// =============================================================================

/**
 * Line chart component - displays data as a line chart.
 * Maps to ui.lineChart() for line chart visualization.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the LineChart
 */
export function LineChart(ctx: ReziComponentContext<LineChartProps>): VNode {
  return ui.lineChart(ctx.props);
}

// =============================================================================
// BarChart Component
// =============================================================================

/**
 * Bar chart component - displays data as a bar chart.
 * Maps to ui.barChart() for bar chart visualization.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the BarChart
 */
export function BarChart(ctx: ReziComponentContext<BarChartProps>): VNode {
  return ui.barChart(ctx.props.data ?? [], ctx.props);
}

// =============================================================================
// Gauge Component
// =============================================================================

/**
 * Gauge component - displays a value as a gauge/progress indicator.
 * Maps to ui.gauge() for gauge visualization.
 *
 * @param ctx - Component context with props and children
 * @returns VNode for the Gauge
 */
export function Gauge(ctx: ReziComponentContext<GaugeProps>): VNode {
  return ui.gauge(ctx.props.value ?? 0, ctx.props);
}
