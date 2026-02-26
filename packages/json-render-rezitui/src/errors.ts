import { ui, type VNode, type ErrorDisplayProps } from "@rezi-ui/core";

/**
 * Error information captured during component rendering.
 */
export interface RenderError {
  /** The error that was thrown */
  error: Error;
  /** Component type that threw the error */
  componentType: string;
  /** Element key path for context */
  elementKey?: string;
  /** Additional context about where the error occurred */
  context?: Record<string, unknown>;
}

/**
 * Options for error boundary configuration.
 */
export interface ErrorBoundaryOptions {
  /** Custom fallback renderer for errors */
  fallback?: (error: RenderError) => VNode;
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Additional context to include with error logs */
  errorContext?: Record<string, unknown>;
}

/**
 * Creates an error display VNode for showing error messages.
 * Provides graceful degradation when rendering fails.
 *
 * @param message - Error message to display
 * @param props - Optional error display props
 * @returns VNode for error display
 *
 * @example
 * ```ts
 * ErrorDisplay("Failed to load data")
 * ErrorDisplay("Connection failed", { title: "Network Error", onRetry: refetch })
 * ```
 */
export function ErrorDisplay(message: string, props?: Omit<ErrorDisplayProps, "message">): VNode {
  return ui.errorDisplay(message, props ?? {});
}

/**
 * Creates an error boundary that catches rendering errors and displays fallback UI.
 * Wraps children with error handling to prevent crashes from propagating.
 *
 * @param options - Error boundary options
 * @returns VNode with error boundary wrapping
 *
 * @example
 * ```ts
 * withErrorBoundary({
 *   children: RiskyComponent(),
 *   fallback: (err) => ErrorDisplay(err.message, { title: "Render Error" }),
 * })
 * ```
 */
export function withErrorBoundary(options: {
  children: VNode;
  fallback?: (error: RenderError) => VNode;
  componentType?: string;
  elementKey?: string;
  logErrors?: boolean;
}): VNode {
  const { children, fallback, componentType = "unknown", elementKey, logErrors = true } = options;

  return ui.errorBoundary({
    children,
    fallback: (error: any) => {
      const actualError = error instanceof Error ? error : new Error(error?.message || String(error));
      const renderError: RenderError = {
        error: actualError,
        componentType,
        elementKey,
      };

      if (logErrors) {
        logRenderError(renderError);
      }

      if (fallback) {
        return fallback(renderError);
      }

      // Default error display
      return ui.errorDisplay(actualError.message, {
        title: `Error in ${componentType}`,
        showStack: typeof process !== 'undefined' && process.env.NODE_ENV === "development",
        stack: actualError.stack,
      });
    },
  });
}

/**
 * Safely executes a render function with error handling.
 * Returns fallback VNode if render throws, or null if no fallback provided.
 *
 * @param renderFn - Function that renders a VNode
 * @param options - Error handling options
 * @returns VNode from render function, or fallback on error
 *
 * @example
 * ```ts
 * safeRender(
 *   () => renderComplexComponent(props),
 *   { componentType: "ComplexComponent", elementKey: "root.complex" }
 * )
 * ```
 */
export function safeRender(
  renderFn: () => VNode,
  options: {
    componentType: string;
    elementKey?: string;
    fallback?: (error: RenderError) => VNode | null;
    logErrors?: boolean;
  }
): VNode | null {
  const { componentType, elementKey, fallback, logErrors = true } = options;

  try {
    return renderFn();
  } catch (error) {
    const renderError: RenderError = {
      error: error instanceof Error ? error : new Error(String(error)),
      componentType,
      elementKey,
    };

    if (logErrors) {
      logRenderError(renderError);
    }

    if (fallback) {
      return fallback(renderError);
    }

    // Return default error display
    return ui.errorDisplay(renderError.error.message, {
      title: `Render Error: ${componentType}`,
      showStack: typeof process !== 'undefined' && process.env.NODE_ENV === "development",
      stack: renderError.error.stack,
    });
  }
}

/**
 * Wraps a component render function with automatic error handling.
 * Returns a new function that catches errors and returns fallback UI.
 *
 * @param renderFn - Original component render function
 * @param componentType - Name of the component for error context
 * @returns Wrapped render function with error handling
 *
 * @example
 * ```ts
 * const SafeButton = withErrorHandling(
 *   (ctx) => ui.button({ id: ctx.id("btn"), label: ctx.props.label }),
 *   "Button"
 * );
 * ```
 */
export function withErrorHandling<T extends Record<string, unknown>>(
  renderFn: (props: T, elementKey?: string) => VNode,
  componentType: string
): (props: T, elementKey?: string) => VNode {
  return (props: T, elementKey?: string): VNode => {
    return safeRender(
      () => renderFn(props, elementKey),
      {
        componentType,
        elementKey,
        fallback: (err) =>
          ui.errorDisplay(err.error.message, {
            title: `${componentType} Error`,
          }),
      }
    ) ?? ui.errorDisplay("Component failed to render", { title: componentType });
  };
}

/**
 * Logs render errors to console with context.
 * Includes component type, element key, and stack trace.
 *
 * @param error - The render error to log
 * @param context - Additional context to include
 */
export function logRenderError(
  error: RenderError,
  context?: Record<string, unknown>
): void {
  const { error: err, componentType, elementKey } = error;

  console.error(
    `[ReziRenderer] Error rendering <${componentType}>`,
    elementKey ? `at "${elementKey}"` : "",
    ":",
    err.message
  );

  if (context) {
    console.error("  Context:", context);
  }

  if (err.stack) {
    console.error("  Stack:", err.stack);
  }
}

/**
 * Creates a fallback UI component for rendering errors.
 * Use this when you need a reusable error fallback pattern.
 *
 * @param title - Title for the error display
 * @param showRetry - Whether to show a retry button
 * @param onRetry - Callback when retry is pressed
 * @returns Function that creates error display VNode
 *
 * @example
 * ```ts
 * const fallback = createErrorFallback("Data Load Failed", true, () => refetch());
 * safeRender(() => loadData(), { fallback: (err) => fallback(err.message) })
 * ```
 */
export function createErrorFallback(
  title: string,
  showRetry?: boolean,
  onRetry?: () => void
): (message: string, stack?: string) => VNode {
  return (message: string, stack?: string) => {
    return ui.errorDisplay(message, {
      title,
      showStack: typeof process !== 'undefined' && process.env.NODE_ENV === "development",
      stack,
      ...(showRetry && onRetry ? { onRetry } : {}),
    });
  };
}

/**
 * Batch error handler for collecting multiple render errors.
 * Useful for rendering lists where individual item failures shouldn't crash the whole list.
 */
export class BatchErrorHandler {
  private errors: RenderError[] = [];
  private logErrors: boolean;

  constructor(options: { logErrors?: boolean } = {}) {
    this.logErrors = options.logErrors ?? true;
  }

  /**
   * Attempt to render an item, catching and collecting any errors.
   *
   * @param renderFn - Function to render the item
   * @param options - Render options for error context
   * @returns Rendered VNode or null on error
   */
  tryRender(
    renderFn: () => VNode,
    options: {
      componentType: string;
      elementKey?: string;
      fallback?: (error: RenderError) => VNode | null;
    }
  ): VNode | null {
    try {
      return renderFn();
    } catch (error) {
      const renderError: RenderError = {
        error: error instanceof Error ? error : new Error(String(error)),
        componentType: options.componentType,
        elementKey: options.elementKey,
      };

      this.errors.push(renderError);

      if (this.logErrors) {
        logRenderError(renderError);
      }

      return options.fallback?.(renderError) ?? null;
    }
  }

  /**
   * Get all collected errors.
   */
  getErrors(): readonly RenderError[] {
    return Object.freeze([...this.errors]);
  }

  /**
   * Check if any errors were collected.
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get the count of collected errors.
   */
  getErrorCount(): number {
    return this.errors.length;
  }

  /**
   * Clear all collected errors.
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Create a summary error display for all collected errors.
   */
  createSummary(): VNode | null {
    if (this.errors.length === 0) return null;

    if (this.errors.length === 1) {
      const err = this.errors[0];
      return ui.errorDisplay(err.error.message, {
        title: `Error in ${err.componentType}`,
        showStack: typeof process !== 'undefined' && process.env.NODE_ENV === "development",
        stack: err.error.stack,
      });
    }

    return ui.errorDisplay(`${this.errors.length} components failed to render`, {
      title: "Multiple Render Errors",
    });
  }
}

/**
 * Wraps an array of VNodes with individual error boundaries.
 * Each child gets its own error boundary to prevent one failure from affecting others.
 *
 * @param children - Array of VNodes to wrap
 * @param options - Error boundary options
 * @returns Array of VNodes wrapped with error boundaries
 *
 * @example
 * ```ts
 * const safeChildren = wrapChildrenWithErrorBoundaries(children, {
 *   getComponentType: (i) => `ListItem-${i}`,
 * });
 * ```
 */
export function wrapChildrenWithErrorBoundaries(
  children: VNode[],
  options: {
    getComponentType: (index: number) => string;
    getElementKey?: (index: number) => string;
    fallback?: (error: RenderError, index: number) => VNode;
    logErrors?: boolean;
  }
): VNode[] {
  const { getComponentType, getElementKey, fallback, logErrors = true } = options;

  return children.map((child, index) =>
    withErrorBoundary({
      children: child,
      componentType: getComponentType(index),
      elementKey: getElementKey?.(index),
      fallback: fallback ? (err) => fallback(err, index) : undefined,
      logErrors,
    })
  );
}
