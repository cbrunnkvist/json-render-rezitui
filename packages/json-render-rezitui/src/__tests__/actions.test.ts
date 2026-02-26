import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setStateHandler,
  pushStateHandler,
  removeStateHandler,
  focusHandler,
  toastHandler,
  navigateHandler,
  quitHandler,
  createActionHandlers,
  executeAction,
  type ActionContext,
  type ActionHandlers,
  type ActionHandler,
  type SetStateParams,
  type PushStateParams,
  type RemoveStateParams,
  type FocusParams,
  type ToastParams,
  type NavigateParams,
  type QuitParams,
} from "../actions.js";
import type { StateStore } from "@json-render/core";
import type { Toast } from "@rezi-ui/core";

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock state store for testing.
 */
function createMockStore(initialData: Record<string, unknown> = {}): StateStore {
  const data = new Map<string, unknown>();
  
  // Initialize with data
  Object.entries(initialData).forEach(([key, value]) => {
    data.set(key, value);
  });

  return {
    get: vi.fn((path: string) => data.get(path)),
    set: vi.fn((path: string, value: unknown) => {
      data.set(path, value);
    }),
    update: vi.fn((updates: Record<string, unknown>) => {
      Object.entries(updates).forEach(([path, value]) => {
        data.set(path, value);
      });
    }),
    subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
    getSnapshot: vi.fn(() => Object.fromEntries(data)),
  };
}

/**
 * Create a mock action context for testing.
 */
function createMockContext(
  overrides: Partial<ActionContext> = {},
  debug = false
): ActionContext {
  const mockStore = createMockStore();
  
  return {
    store: mockStore,
    requestFocus: vi.fn(),
    addToast: vi.fn(),
    quit: vi.fn(),
    navigate: vi.fn(),
    debug,
    ...overrides,
  };
}

// =============================================================================
// setState Action Tests
// =============================================================================

describe("setState action", () => {
  it("should update state at a JSON Pointer path", () => {
    const ctx = createMockContext();
    const params: SetStateParams = {
      path: "/user/name",
      value: "John Doe",
    };

    setStateHandler(params, ctx);

    expect(ctx.store.set).toHaveBeenCalledWith("/user/name", "John Doe");
  });

  it("should handle nested paths", () => {
    const ctx = createMockContext();
    const params: SetStateParams = {
      path: "/settings/theme/darkMode",
      value: true,
    };

    setStateHandler(params, ctx);

    expect(ctx.store.set).toHaveBeenCalledWith("/settings/theme/darkMode", true);
  });

  it("should handle various value types", () => {
    const ctx = createMockContext();

    // String
    setStateHandler({ path: "/name", value: "test" }, ctx);
    expect(ctx.store.set).toHaveBeenCalledWith("/name", "test");

    // Number
    setStateHandler({ path: "/count", value: 42 }, ctx);
    expect(ctx.store.set).toHaveBeenCalledWith("/count", 42);

    // Boolean
    setStateHandler({ path: "/active", value: false }, ctx);
    expect(ctx.store.set).toHaveBeenCalledWith("/active", false);

    // Object
    setStateHandler({ path: "/data", value: { foo: "bar" } }, ctx);
    expect(ctx.store.set).toHaveBeenCalledWith("/data", { foo: "bar" });

    // Array
    setStateHandler({ path: "/items", value: [1, 2, 3] }, ctx);
    expect(ctx.store.set).toHaveBeenCalledWith("/items", [1, 2, 3]);

    // Null
    setStateHandler({ path: "/nullable", value: null }, ctx);
    expect(ctx.store.set).toHaveBeenCalledWith("/nullable", null);
  });

  it("should log debug message when debug mode is enabled", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const ctx = createMockContext({}, true);
    const params: SetStateParams = {
      path: "/test",
      value: "value",
    };

    setStateHandler(params, ctx);

    consoleSpy.mockRestore();
  });

  it("should not log when debug mode is disabled", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const ctx = createMockContext({}, false);
    const params: SetStateParams = {
      path: "/test",
      value: "value",
    };

    setStateHandler(params, ctx);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// =============================================================================
// pushState Action Tests
// =============================================================================

describe("pushState action", () => {
  it("should append item to an existing array", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["item1", "item2"]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: PushStateParams = {
      path: "/items",
      item: "item3",
    };

    pushStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("/items", ["item1", "item2", "item3"]);
  });

  it("should create new array if path does not exist", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => undefined);
    
    const ctx = createMockContext({ store: mockStore });
    const params: PushStateParams = {
      path: "/newArray",
      item: "first",
    };

    pushStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("/newArray", ["first"]);
  });

  it("should create new array if current value is not an array", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => "not an array");
    
    const ctx = createMockContext({ store: mockStore });
    const params: PushStateParams = {
      path: "/invalid",
      item: "item",
    };

    pushStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("/invalid", ["item"]);
  });

  it("should handle complex item types", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => [{ id: 1 }]);
    
    const ctx = createMockContext({ store: mockStore });
    const newItem = { id: 2, name: "Test" };
    const params: PushStateParams = {
      path: "/users",
      item: newItem,
    };

    pushStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("/users", [{ id: 1 }, newItem]);
  });

  it("should log debug message when debug mode is enabled", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => []);
    
    const ctx = createMockContext({ store: mockStore }, true);
    const params: PushStateParams = {
      path: "/items",
      item: "test",
    };

    pushStateHandler(params, ctx);

    consoleSpy.mockRestore();
  });
});

// =============================================================================
// removeState Action Tests
// =============================================================================

describe("removeState action", () => {
  it("should remove item by index", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["a", "b", "c", "d"]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: RemoveStateParams = {
      path: "/items",
      index: 1,
    };

    removeStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("/items", ["a", "c", "d"]);
  });

  it("should remove first item when index is 0", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["first", "second", "third"]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: RemoveStateParams = {
      path: "/items",
      index: 0,
    };

    removeStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("/items", ["second", "third"]);
  });

  it("should remove last item by index", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["a", "b", "c"]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: RemoveStateParams = {
      path: "/items",
      index: 2,
    };

    removeStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("/items", ["a", "b"]);
  });

  it("should remove items by matching value", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["keep", "remove", "keep", "remove"]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: RemoveStateParams = {
      path: "/items",
      match: "remove",
    };

    removeStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("/items", ["keep", "keep"]);
  });

  it("should remove objects by matching value", () => {
    const mockStore = createMockStore();
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const obj3 = { id: 1 }; // Same content as obj1 but different reference
    mockStore.get = vi.fn(() => [obj1, obj2, obj3]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: RemoveStateParams = {
      path: "/items",
      match: obj1, // This will only remove obj1 (same reference)
    };

    removeStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("/items", [obj2, obj3]);
  });

  it("should do nothing when path is not an array", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => "not an array");
    
    const ctx = createMockContext({ store: mockStore }, true);
    const params: RemoveStateParams = {
      path: "/invalid",
      index: 0,
    };

    removeStateHandler(params, ctx);

    expect(mockStore.set).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should do nothing when neither index nor match is provided", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["a", "b", "c"]);
    
    const ctx = createMockContext({ store: mockStore }, true);
    const params: RemoveStateParams = {
      path: "/items",
    };

    removeStateHandler(params, ctx);

    expect(mockStore.set).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should prioritize index over match when both provided", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["a", "b", "c"]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: RemoveStateParams = {
      path: "/items",
      index: 1,
      match: "a",
    };

    removeStateHandler(params, ctx);

    // Should remove by index (1 = "b"), not by match ("a")
    expect(mockStore.set).toHaveBeenCalledWith("/items", ["a", "c"]);
  });

  it("should log debug message when removing by index", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["a", "b", "c"]);
    
    const ctx = createMockContext({ store: mockStore }, true);
    const params: RemoveStateParams = {
      path: "/items",
      index: 1,
    };

    removeStateHandler(params, ctx);

    consoleSpy.mockRestore();
  });

  it("should log debug message when removing by match", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["a", "b", "c"]);
    
    const ctx = createMockContext({ store: mockStore }, true);
    const params: RemoveStateParams = {
      path: "/items",
      match: "b",
    };

    removeStateHandler(params, ctx);

    consoleSpy.mockRestore();
  });
});

// =============================================================================
// Other Built-in Action Tests
// =============================================================================

describe("focus action", () => {
  it("should call requestFocus callback with widget ID", () => {
    const requestFocus = vi.fn();
    const ctx = createMockContext({ requestFocus });
    const params: FocusParams = {
      id: "my-widget",
    };

    focusHandler(params, ctx);

    expect(requestFocus).toHaveBeenCalledWith("my-widget");
  });

  it("should warn when requestFocus is not available", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ctx = createMockContext({ requestFocus: undefined }, true);
    const params: FocusParams = {
      id: "my-widget",
    };

    focusHandler(params, ctx);

    consoleSpy.mockRestore();
  });

  it("should not throw when requestFocus is not available", () => {
    const ctx = createMockContext({ requestFocus: undefined });
    const params: FocusParams = {
      id: "my-widget",
    };

    expect(() => focusHandler(params, ctx)).not.toThrow();
  });
});

describe("toast action", () => {
  it("should call addToast callback with toast config", () => {
    const addToast = vi.fn();
    const ctx = createMockContext({ addToast });
    const params: ToastParams = {
      id: "toast-1",
      message: "Hello World",
      type: "info",
    };

    toastHandler(params, ctx);

    expect(addToast).toHaveBeenCalledWith({
      id: "toast-1",
      message: "Hello World",
      type: "info",
      duration: undefined,
      progress: undefined,
    });
  });

  it("should pass all toast parameters", () => {
    const addToast = vi.fn();
    const ctx = createMockContext({ addToast });
    const params: ToastParams = {
      id: "toast-2",
      message: "Success!",
      type: "success",
      duration: 5000,
      progress: 100,
    };

    toastHandler(params, ctx);

    expect(addToast).toHaveBeenCalledWith({
      id: "toast-2",
      message: "Success!",
      type: "success",
      duration: 5000,
      progress: 100,
    });
  });

  it("should warn when addToast is not available", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ctx = createMockContext({ addToast: undefined }, true);
    const params: ToastParams = {
      id: "toast-1",
      message: "Test",
      type: "error",
    };

    toastHandler(params, ctx);

    consoleSpy.mockRestore();
  });
});

describe("navigate action", () => {
  it("should call navigate callback with path", () => {
    const navigate = vi.fn();
    const ctx = createMockContext({ navigate });
    const params: NavigateParams = {
      path: "/dashboard",
    };

    navigateHandler(params, ctx);

    expect(navigate).toHaveBeenCalledWith("/dashboard", undefined);
  });

  it("should call navigate callback with path and params", () => {
    const navigate = vi.fn();
    const ctx = createMockContext({ navigate });
    const params: NavigateParams = {
      path: "/user/:id",
      params: { id: "123", tab: "profile" },
    };

    navigateHandler(params, ctx);

    expect(navigate).toHaveBeenCalledWith("/user/:id", { id: "123", tab: "profile" });
  });

  it("should warn when navigate is not available", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ctx = createMockContext({ navigate: undefined }, true);
    const params: NavigateParams = {
      path: "/home",
    };

    navigateHandler(params, ctx);

    consoleSpy.mockRestore();
  });
});

describe("quit action", () => {
  it("should call quit callback with default code", () => {
    const quit = vi.fn();
    const ctx = createMockContext({ quit });
    const params: QuitParams = {};

    quitHandler(params, ctx);

    expect(quit).toHaveBeenCalledWith(undefined, undefined);
  });

  it("should call quit callback with exit code", () => {
    const quit = vi.fn();
    const ctx = createMockContext({ quit });
    const params: QuitParams = {
      code: 1,
    };

    quitHandler(params, ctx);

    expect(quit).toHaveBeenCalledWith(1, undefined);
  });

  it("should call quit callback with code and message", () => {
    const quit = vi.fn();
    const ctx = createMockContext({ quit });
    const params: QuitParams = {
      code: 0,
      message: "Goodbye!",
    };

    quitHandler(params, ctx);

    expect(quit).toHaveBeenCalledWith(0, "Goodbye!");
  });

  it("should warn when quit is not available", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ctx = createMockContext({ quit: undefined }, true);
    const params: QuitParams = {
      code: 0,
    };

    quitHandler(params, ctx);

    consoleSpy.mockRestore();
  });
});

// =============================================================================
// createActionHandlers Tests
// =============================================================================

describe("createActionHandlers", () => {
  it("should create default handlers", () => {
    const handlers = createActionHandlers();

    expect(handlers.setState).toBeDefined();
    expect(handlers.pushState).toBeDefined();
    expect(handlers.removeState).toBeDefined();
    expect(handlers.focus).toBeDefined();
    expect(handlers.toast).toBeDefined();
    expect(handlers.navigate).toBeDefined();
    expect(handlers.quit).toBeDefined();
  });

  it("should include all built-in handlers", () => {
    const handlers = createActionHandlers();
    const expectedHandlers = [
      "setState",
      "pushState",
      "removeState",
      "focus",
      "toast",
      "navigate",
      "quit",
    ];

    expectedHandlers.forEach((name) => {
      expect(handlers[name]).toBeDefined();
      expect(typeof handlers[name]).toBe("function");
    });
  });
});

// =============================================================================
// Custom Action Handler Tests
// =============================================================================

describe("custom action handlers", () => {
  it("should support adding custom handlers", () => {
    const customHandler = vi.fn();
    const handlers = createActionHandlers({
      overrides: {
        customAction: customHandler,
      },
    });

    expect(handlers.customAction).toBe(customHandler);
  });

  it("should support multiple custom handlers", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    const handlers = createActionHandlers({
      overrides: {
        actionOne: handler1,
        actionTwo: handler2,
      },
    });

    expect(handlers.actionOne).toBe(handler1);
    expect(handlers.actionTwo).toBe(handler2);
  });

  it("should execute custom handlers", async () => {
    const customHandler = vi.fn().mockResolvedValue(undefined);
    const handlers = createActionHandlers({
      overrides: {
        myCustomAction: customHandler,
      },
    });

    const ctx = createMockContext();
    await executeAction("myCustomAction", { foo: "bar" }, handlers, ctx);

    expect(customHandler).toHaveBeenCalledWith({ foo: "bar" }, ctx);
  });

  it("should allow async custom handlers", async () => {
    const asyncHandler = vi.fn().mockResolvedValue(undefined);
    const handlers = createActionHandlers({
      overrides: {
        asyncAction: asyncHandler,
      },
    });

    const ctx = createMockContext();
    await executeAction("asyncAction", {}, handlers, ctx);

    expect(asyncHandler).toHaveBeenCalled();
  });

  it("should pass correct context to custom handlers", async () => {
    const customHandler = vi.fn().mockResolvedValue(undefined);
    const mockStore = createMockStore();
    const requestFocus = vi.fn();
    
    const handlers = createActionHandlers({
      overrides: {
        testAction: customHandler,
      },
    });

    const ctx = createMockContext({
      store: mockStore,
      requestFocus,
      debug: true,
    });

    await executeAction("testAction", { test: true }, handlers, ctx);

    expect(customHandler).toHaveBeenCalledWith(
      { test: true },
      expect.objectContaining({
        store: mockStore,
        requestFocus,
        debug: true,
      })
    );
  });
});

// =============================================================================
// Action Handler Override Tests
// =============================================================================

describe("action handler overrides", () => {
  it("should override setState handler", async () => {
    const customSetState = vi.fn().mockResolvedValue(undefined);
    const handlers = createActionHandlers({
      overrides: {
        setState: customSetState,
      },
    });

    const ctx = createMockContext();
    await executeAction("setState", { path: "/test", value: "value" }, handlers, ctx);

    expect(customSetState).toHaveBeenCalled();
  });

  it("should override pushState handler", async () => {
    const customPushState = vi.fn().mockResolvedValue(undefined);
    const handlers = createActionHandlers({
      overrides: {
        pushState: customPushState,
      },
    });

    const ctx = createMockContext();
    await executeAction("pushState", { path: "/items", item: "new" }, handlers, ctx);

    expect(customPushState).toHaveBeenCalled();
  });

  it("should override removeState handler", async () => {
    const customRemoveState = vi.fn().mockResolvedValue(undefined);
    const handlers = createActionHandlers({
      overrides: {
        removeState: customRemoveState,
      },
    });

    const ctx = createMockContext();
    await executeAction("removeState", { path: "/items", index: 0 }, handlers, ctx);

    expect(customRemoveState).toHaveBeenCalled();
  });

  it("should override multiple handlers at once", async () => {
    const customSetState = vi.fn().mockResolvedValue(undefined);
    const customPushState = vi.fn().mockResolvedValue(undefined);
    
    const handlers = createActionHandlers({
      overrides: {
        setState: customSetState,
        pushState: customPushState,
      },
    });

    const ctx = createMockContext();
    await executeAction("setState", { path: "/a", value: 1 }, handlers, ctx);
    await executeAction("pushState", { path: "/b", item: 2 }, handlers, ctx);

    expect(customSetState).toHaveBeenCalled();
    expect(customPushState).toHaveBeenCalled();
  });

  it("should keep non-overridden handlers as default", async () => {
    const customSetState = vi.fn().mockResolvedValue(undefined);
    const handlers = createActionHandlers({
      overrides: {
        setState: customSetState,
      },
    });

    // setState should be overridden
    expect(handlers.setState).toBe(customSetState);

    // Other handlers should still be default
    expect(handlers.pushState).toBeDefined();
    expect(handlers.removeState).toBeDefined();
    expect(handlers.focus).toBeDefined();
    expect(handlers.toast).toBeDefined();
    expect(handlers.navigate).toBeDefined();
    expect(handlers.quit).toBeDefined();
  });

  it("should allow override to call original handler", async () => {
    const mockStore = createMockStore();
    const originalCalls: unknown[] = [];
    
    const customSetState = async (params: unknown, ctx: ActionContext) => {
      originalCalls.push(params);
      // Call the original behavior
      ctx.store.set((params as SetStateParams).path, (params as SetStateParams).value);
    };

    const handlers = createActionHandlers({
      overrides: {
        setState: customSetState as ActionHandler<unknown>,
      },
    });

    const ctx = createMockContext({ store: mockStore });
    await executeAction("setState", { path: "/test", value: "value" }, handlers, ctx);

    expect(originalCalls).toHaveLength(1);
    expect(mockStore.set).toHaveBeenCalledWith("/test", "value");
  });
});

// =============================================================================
// executeAction Tests
// =============================================================================

describe("executeAction", () => {
  it("should execute an action by name", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const handlers: ActionHandlers = {
      testAction: handler,
    };
    const ctx = createMockContext();

    await executeAction("testAction", { foo: "bar" }, handlers, ctx);

    expect(handler).toHaveBeenCalledWith({ foo: "bar" }, ctx);
  });

  it("should throw error for unknown action", async () => {
    const handlers: ActionHandlers = {};
    const ctx = createMockContext();

    await expect(
      executeAction("unknownAction", {}, handlers, ctx)
    ).rejects.toThrow('Unknown action: "unknownAction"');
  });

  it("should pass parameters to handler", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const handlers: ActionHandlers = {
      testAction: handler,
    };
    const ctx = createMockContext();
    const params = { key: "value", nested: { prop: true } };

    await executeAction("testAction", params, handlers, ctx);

    expect(handler).toHaveBeenCalledWith(params, ctx);
  });

  it("should await async handlers", async () => {
    let resolved = false;
    const handler = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      resolved = true;
    });
    const handlers: ActionHandlers = {
      asyncAction: handler,
    };
    const ctx = createMockContext();

    await executeAction("asyncAction", {}, handlers, ctx);

    expect(resolved).toBe(true);
  });

  it("should propagate errors from handlers", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("Action failed"));
    const handlers: ActionHandlers = {
      failingAction: handler,
    };
    const ctx = createMockContext();

    await expect(
      executeAction("failingAction", {}, handlers, ctx)
    ).rejects.toThrow("Action failed");
  });
});

// =============================================================================
// Debug Mode Tests
// =============================================================================

describe("debug mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should wrap handlers with debug logging when debug is enabled", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const handlers = createActionHandlers({ debug: true });
    const mockStore = createMockStore();
    const ctx = createMockContext({ store: mockStore }, true);

    await handlers.setState({ path: "/test", value: "value" }, ctx);

    // Should log debug message and completion

    consoleSpy.mockRestore();
  });

  it("should not wrap handlers when debug is disabled", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const handlers = createActionHandlers({ debug: false });
    const mockStore = createMockStore();
    const ctx = createMockContext({ store: mockStore }, false);

    await handlers.setState({ path: "/test", value: "value" }, ctx);

    // Should only log the handler's own debug, not the wrapper
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("[actions] setState completed in")
    );

    consoleSpy.mockRestore();
  });

  it("should log errors in debug mode", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const testError = new Error("Test error");
    
    const handlers = createActionHandlers({
      debug: true,
      overrides: {
        failingAction: async () => {
          throw testError;
        },
      },
    });
    const ctx = createMockContext({}, true);

    await expect(
      handlers.failingAction({}, ctx)
    ).rejects.toThrow("Test error");


    consoleSpy.mockRestore();
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe("edge cases", () => {
  it("should handle empty string paths", () => {
    const mockStore = createMockStore();
    const ctx = createMockContext({ store: mockStore });
    const params: SetStateParams = {
      path: "",
      value: "root",
    };

    setStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith("", "root");
  });

  it("should handle paths with special characters", () => {
    const mockStore = createMockStore();
    const ctx = createMockContext({ store: mockStore });
    const params: SetStateParams = {
      path: "/user/name-with-dashes_and_underscores.123",
      value: "test",
    };

    setStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith(
      "/user/name-with-dashes_and_underscores.123",
      "test"
    );
  });

  it("should handle very large arrays in pushState", () => {
    const mockStore = createMockStore();
    const largeArray = Array.from({ length: 10000 }, (_, i) => i);
    mockStore.get = vi.fn(() => largeArray);
    
    const ctx = createMockContext({ store: mockStore });
    const params: PushStateParams = {
      path: "/items",
      item: 10000,
    };

    pushStateHandler(params, ctx);

    expect(mockStore.set).toHaveBeenCalledWith(
      "/items",
      expect.arrayContaining([10000])
    );
    expect(mockStore.set).toHaveBeenCalledWith(
      "/items",
      expect.arrayContaining([0, 9999, 10000])
    );
  });

  it("should handle removing from empty array", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => []);
    
    const ctx = createMockContext({ store: mockStore }, true);
    const params: RemoveStateParams = {
      path: "/items",
      index: 0,
    };

    removeStateHandler(params, ctx);

    // Should set empty array (filter returns empty)
    expect(mockStore.set).toHaveBeenCalledWith("/items", []);
    consoleSpy.mockRestore();
  });

  it("should handle negative index gracefully", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["a", "b", "c"]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: RemoveStateParams = {
      path: "/items",
      index: -1,
    };

    removeStateHandler(params, ctx);

    // Negative index is not equal to any index, so nothing is removed
    expect(mockStore.set).toHaveBeenCalledWith("/items", ["a", "b", "c"]);
  });

  it("should handle out of bounds index", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["a", "b"]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: RemoveStateParams = {
      path: "/items",
      index: 100,
    };

    removeStateHandler(params, ctx);

    // Index 100 doesn't exist, so nothing is removed
    expect(mockStore.set).toHaveBeenCalledWith("/items", ["a", "b"]);
  });

  it("should handle null as match value", () => {
    const mockStore = createMockStore();
    mockStore.get = vi.fn(() => ["a", null, "b", null]);
    
    const ctx = createMockContext({ store: mockStore });
    const params: RemoveStateParams = {
      path: "/items",
      match: null,
    };

    removeStateHandler(params, ctx);

    // Should remove null values
    expect(mockStore.set).toHaveBeenCalledWith("/items", ["a", "b"]);
  });

  it("should handle circular references in debug mode", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mockStore = createMockStore();
    
    const ctx = createMockContext({ store: mockStore }, true);
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    
    const params: SetStateParams = {
      path: "/circular",
      value: circular,
    };

    // Should not throw even with circular reference
    expect(() => setStateHandler(params, ctx)).not.toThrow();
    expect(mockStore.set).toHaveBeenCalledWith("/circular", circular);

    consoleSpy.mockRestore();
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe("action handler integration", () => {
  it("should work with real store implementation pattern", async () => {
    const state: Record<string, unknown> = { items: ["a", "b"] };
    
    const mockStore: StateStore = {
      get: vi.fn((path: string) => {
        if (path === "/items") return state.items;
        return undefined;
      }),
      set: vi.fn((path: string, value: unknown) => {
        if (path === "/items") state.items = value as string[];
      }),
      update: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      getSnapshot: vi.fn(() => state),
    };

    const handlers = createActionHandlers();
    const ctx = createMockContext({ store: mockStore });

    // Add item
    await handlers.pushState({ path: "/items", item: "c" }, ctx);
    expect(state.items).toEqual(["a", "b", "c"]);

    // Remove item
    await handlers.removeState({ path: "/items", index: 0 }, ctx);
    expect(state.items).toEqual(["b", "c"]);

    // Set state
    await handlers.setState({ path: "/items", value: ["x", "y"] }, ctx);
    expect(state.items).toEqual(["x", "y"]);
  });

  it("should support chaining actions in custom handler", async () => {
    const actions: string[] = [];
    const mockStore = createMockStore();
    
    const customHandler = async (params: unknown, ctx: ActionContext) => {
      actions.push("start");
      ctx.store.set("/step1", "done");
      actions.push("step1");
      ctx.store.set("/step2", "done");
      actions.push("step2");
    };

    const handlers = createActionHandlers({
      overrides: {
        chainedAction: customHandler,
      },
    });
    const ctx = createMockContext({ store: mockStore });

    await handlers.chainedAction({}, ctx);

    expect(actions).toEqual(["start", "step1", "step2"]);
    expect(mockStore.set).toHaveBeenCalledWith("/step1", "done");
    expect(mockStore.set).toHaveBeenCalledWith("/step2", "done");
  });

  it("should handle concurrent action executions", async () => {
    const executionOrder: number[] = [];
    
    const slowHandler = async (params: { delay: number; id: number }) => {
      await new Promise((resolve) => setTimeout(resolve, params.delay));
      executionOrder.push(params.id);
    };

    const handlers = createActionHandlers({
      overrides: {
        slowAction: slowHandler as ActionHandler<unknown>,
      },
    });
    const ctx = createMockContext();

    // Start both actions concurrently
    const promise1 = handlers.slowAction({ delay: 20, id: 1 }, ctx);
    const promise2 = handlers.slowAction({ delay: 10, id: 2 }, ctx);

    await Promise.all([promise1, promise2]);

    // Action 2 should complete first (shorter delay)
    expect(executionOrder).toEqual([2, 1]);
  });
});

});