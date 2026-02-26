import type {
  VNode,
  TextProps,
  BoxProps,
  ButtonProps,
  InputProps,
  // RowProps,
  // ColumnProps,
  StackProps,
  SpacerProps,
  SelectProps,
  SelectOption,
  CheckboxProps,
  RadioGroupProps,
  SliderProps,
  TextareaProps,
  TableProps,
  VirtualListProps,
  TabsProps,
  AccordionProps,
  ModalProps,
  DialogProps,
  DropdownProps,
  LayersProps,
  LayerProps,
  // GridProps,
  RichTextProps,
  ImageProps,
  CanvasProps,
  LinkProps,
  BadgeProps,
  TagProps,
  CalloutProps,
  ProgressProps,
  SpinnerProps,
  SkeletonProps,
  KbdProps,
  StatusProps,
  EmptyProps,
  ErrorDisplayProps,
  ErrorBoundaryProps,
  // FocusZoneProps,
  // FocusTrapProps,
  FieldProps,
  BreadcrumbProps,
  PaginationProps,
  BarChartProps,
  LineChartProps,
  SparklineProps,
  MiniChartProps,
  GaugeProps,
  HeatmapProps,
  ScatterProps,
  CommandPaletteProps,
  FilePickerProps,
  FileTreeExplorerProps,
  SplitPaneProps,
  CodeEditorProps,
  DiffViewerProps,
  LogsConsoleProps,
  ToastContainerProps,
  TreeProps,
  DividerProps,
  IconProps,
  CardOptions,
  PageOptions,
  AppShellOptions,
  HeaderOptions,
  SidebarOptions,
  ToolbarOptions,
  StatusBarOptions,
  MasterDetailOptions,
} from "@rezi-ui/core";
import type { ReziRendererOptions } from "./renderer.js"; // Import ReziRendererOptions

// =============================================================================
// Component Types
// =============================================================================

/**
 * Component context passed to Rezi component render functions.
 *
 * @example
 * ```ts
 * const Button: ReziComponentFn<ButtonProps> = (ctx) => {
 *   return ui.button({
 *     id: ctx.id("button"),
 *     label: ctx.props.label,
 *     onPress: () => ctx.emit("press"),
 *   });
 * }
 * ```
 */
export interface ReziComponentContext<P = Record<string, unknown>> {
  /** Resolved props for the component */
  props: P;
  /** Child VNodes */
  children?: VNode[];
  /** Emit an event to trigger action handlers */
  emit: (event: string, params?: unknown) => void;
  /** Get event handle for binding checks */
  on: (eventName: string) => EventHandle;
  /** Generate a deterministic ID based on element key path */
  id: (suffix: string) => string;
  /** Loading state for async components */
  loading?: boolean;
}

/**
 * Event handle returned by on() function.
 * Provides metadata about event bindings.
 */
export interface EventHandle {
  /** Emit the event to trigger bound actions */
  emit: () => void;
  /** Whether the event has handlers bound */
  bound: boolean;
  /** Whether any handler calls preventDefault */
  shouldPreventDefault: boolean;
}

/**
 * Component render function type for Rezi.
 * @example
 * const Button: ReziComponentFn<ButtonProps> = (ctx) => {
 *   return ui.button({
 *     id: ctx.props.id,
 *     label: ctx.props.label,
 *     onPress: () => ctx.emit("press"),
 *   });
 * }
 */
export type ReziComponentFn<P = Record<string, unknown>> = (
  ctx: ReziComponentContext<P>
) => VNode;

/**
 * Registry of all component render functions for the Rezi renderer.
 * Maps component names to their render functions.
 * @example
 * const components: ReziComponents = {
 *   Button: (ctx) => ui.button({ ... }),
 *   Input: (ctx) => ui.input({ ... }),
 * };
 */
export type ReziComponents = {
  [key: string]: ReziComponentFn<any>;
};

// =============================================================================
// Action Types
// =============================================================================

/**
 * Action handler function type for Rezi.
 * @example
 * const viewCustomers: ReziActionFn<{ customerId: string }> = async (params, setState) => {
 *   const data = await fetch(`/api/customers/${params?.customerId}`);
 *   setState(prev => ({ ...prev, customers: data }));
 * };
 */
export type ReziActionFn<P = unknown> = (
  params: P | undefined,
  setState: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void,
  state: Record<string, unknown>
) => Promise<void>;

/**
 * Registry of all action handlers for the Rezi renderer.
 * Maps action names to their handler functions.
 * @example
 * const actions: ReziActions = {
 *   viewCustomers: async (params, setState) => { ... },
 *   createCustomer: async (params, setState) => { ... },
 * };
 */
export type ReziActions = {
  [key: string]: ReziActionFn;
};

// =============================================================================
// Renderer Options (re-exported from renderer.ts for backward compat)
// =============================================================================

// Note: ReziRendererOptions is defined in renderer.ts with full options
// This file re-exports it for backward compatibility
export type { ReziRendererOptions };

// =============================================================================
// Re-export VNode and widget prop types
// =============================================================================

// Re-export VNode for consumers
export type { VNode };

// Re-export common widget prop types for component definitions
export type {
  TextProps,
  BoxProps,
  ButtonProps,
  InputProps,
  // RowProps,
  // ColumnProps,
  StackProps,
  SpacerProps,
  SelectProps,
  SelectOption,
  CheckboxProps,
  RadioGroupProps,
  SliderProps,
  TextareaProps,
  TableProps,
  VirtualListProps,
  TabsProps,
  AccordionProps,
  ModalProps,
  DialogProps,
  DropdownProps,
  LayersProps,
  LayerProps,
  // GridProps,
  RichTextProps,
  ImageProps,
  CanvasProps,
  LinkProps,
  BadgeProps,
  TagProps,
  CalloutProps,
  ProgressProps,
  SpinnerProps,
  SkeletonProps,
  KbdProps,
  StatusProps,
  EmptyProps,
  ErrorDisplayProps,
  ErrorBoundaryProps,
  // FocusZoneProps,
  // FocusTrapProps,
  FieldProps,
  BreadcrumbProps,
  PaginationProps,
  BarChartProps,
  LineChartProps,
  SparklineProps,
  MiniChartProps,
  GaugeProps,
  HeatmapProps,
  ScatterProps,
  CommandPaletteProps,
  FilePickerProps,
  FileTreeExplorerProps,
  SplitPaneProps,
  CodeEditorProps,
  DiffViewerProps,
  LogsConsoleProps,
  ToastContainerProps,
  TreeProps,
  DividerProps,
  IconProps,
  CardOptions,
  PageOptions,
  AppShellOptions,
  HeaderOptions,
  SidebarOptions,
  ToolbarOptions,
  StatusBarOptions,
  MasterDetailOptions,
};
