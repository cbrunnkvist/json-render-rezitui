// Core renderer
export { ReziRenderer, createRenderer, type ReziRendererOptions } from "./renderer.js";

// Components
export * from "./components/index.js";

// Types
export type {
  VNode,
  ReziComponentContext,
  ReziComponentFn,
  ReziComponents,
  ReziActions,
  ReziActionFn,
} from "./types.js";

// Re-export widget prop types for convenience
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
} from "./types.js";

// Schema
export { schema, type ReziSchema, type ReziSpec } from "./schema.js";

// Visibility
export {
  evaluateVisibility,
  createVisibilityContext,
  visibility,
  type VisibilityCondition,
  type VisibilityContext,
} from "./visibility.js";

// Props
export {
  resolvePropValue,
  resolveElementProps,
  resolveBindings,
  resolveActionParam,
  resolveBindItemPath,
  createPropResolutionContext,
  type ReziPropResolutionContext,
} from "./props.js";

// Re-export prop types from core
export type {
  PropExpression,
  PropResolutionContext,
  ComputedFunction,
} from "./props.js";

// Actions
export {
  // Schemas
  SetStateParamsSchema,
  PushStateParamsSchema,
  RemoveStateParamsSchema,
  FocusParamsSchema,
  ToastParamsSchema,
  NavigateParamsSchema,
  QuitParamsSchema,
  // Types
  type SetStateParams,
  type PushStateParams,
  type RemoveStateParams,
  type FocusParams,
  type ToastParams,
  type NavigateParams,
  type QuitParams,
  type ActionContext,
  type ActionHandler,
  type ActionHandlers,
  // Handlers
  setStateHandler,
  pushStateHandler,
  removeStateHandler,
  focusHandler,
  toastHandler,
  navigateHandler,
  quitHandler,
  // Factory
  createActionHandlers,
  defaultActionHandlers,
  // Executor
  executeAction,
  // Re-export Toast type
  type Toast,
} from "./actions.js";

// Streaming
export {
  createStreamingRenderer,
  createAppStreamingRenderer,
  processStream,
  type StreamingRendererOptions,
  type StreamingRenderer,
  type StreamingPushResult,
  type StreamingAppAdapter,
} from "./streaming.js";


// Integration
export {
  createReziApp,
  createStreamingReziApp,
  useRenderer,
  setRendererContext,
  withRenderer,
  mergeComponents,
  type CreateReziAppOptions,
  type CreateStreamingReziAppOptions,
  type ReziApp,
} from "./integration.js";

// Defaults
export { defaultComponents } from "./defaults.js";

// Registry
export {
  defineReziRegistry,
  mergeRegistries,
  type ReziCatalog,
  type DefineReziRegistryOptions,
  type DefineReziRegistryResult,
} from "./registry.js";

// Errors
export {
  ErrorDisplay,
  withErrorBoundary,
  safeRender,
  withErrorHandling,
  logRenderError,
  createErrorFallback,
  BatchErrorHandler,
  wrapChildrenWithErrorBoundaries,
  type RenderError,
  type ErrorBoundaryOptions,
} from "./errors.js";