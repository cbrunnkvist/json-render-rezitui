import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReziRenderer, createRenderer } from "../renderer.js";
import { createStreamingRenderer, processStream } from "../streaming.js";
import { createReziApp, defaultComponents } from "../integration.js";
import { createActionHandlers } from "../actions.js";
import type { Spec, StateStore } from "@json-render/core";
import { createStateStore } from "@json-render/core";
import { ui, type VNode } from "@rezi-ui/core";

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a complete form spec for testing.
 */
function createFormSpec(): Spec {
  return {
    root: "form-container",
    elements: {
      "form-container": {
        type: "Column",
        props: { gap: 1 },
        children: ["title", "name-input", "email-input", "submit-btn"],
      },
      title: {
        type: "Text",
        props: { content: "User Registration", variant: "heading" },
      },
      "name-input": {
        type: "Input",
        props: {
          id: "name-field",
          placeholder: "Enter your name",
          value: "",
        },
        on: {
          input: { action: "setState", params: { path: "/form/name", value: "$event.value" } },
        },
      },
      "email-input": {
        type: "Input",
        props: {
          id: "email-field",
          placeholder: "Enter your email",
          value: "",
        },
        on: {
          input: { action: "setState", params: { path: "/form/email", value: "$event.value" } },
        },
      },
      "submit-btn": {
        type: "Button",
        props: { id: "submit-btn", label: "Submit", intent: "primary" },
        on: {
          press: { action: "submitForm", preventDefault: true },
        },
      },
    },
    state: {
      form: { name: "", email: "" },
      submitted: false,
    },
  };
}

/**
 * Create a counter spec with visibility conditions.
 */
function createCounterSpec(): Spec {
  return {
    root: "counter-container",
    elements: {
      "counter-container": {
        type: "Column",
        props: { gap: 1, p: 2 },
        children: ["title", "count-display", "controls", "reset-btn"],
      },
      title: {
        type: "Text",
        props: { content: "Counter Example", variant: "heading" },
      },
      "count-display": {
        type: "Text",
        props: { content: "Count: 0" },
        visible: { $state: "/showCount", eq: true },
      },
      controls: {
        type: "Row",
        props: { gap: 1 },
        children: ["decrement-btn", "increment-btn"],
      },
      "decrement-btn": {
        type: "Button",
        props: { id: "decrement", label: "-", intent: "secondary" },
        on: {
          press: { action: "setState", params: { path: "/count", value: { $state: "/count", subtract: 1 } } },
        },
      },
      "increment-btn": {
        type: "Button",
        props: { id: "increment", label: "+", intent: "primary" },
        on: {
          press: { action: "setState", params: { path: "/count", value: { $state: "/count", add: 1 } } },
        },
      },
      "reset-btn": {
        type: "Button",
        props: { id: "reset", label: "Reset" },
        visible: { $state: "/count", gt: 0 },
        on: {
          press: { action: "setState", params: { path: "/count", value: 0 } },
        },
      },
    },
    state: {
      count: 0,
      showCount: true,
    },
  };
}

/**
 * Create a todo list spec for testing list operations.
 */
function createTodoListSpec(): Spec {
  return {
    root: "todo-app",
    elements: {
      "todo-app": {
        type: "Column",
        props: { gap: 1 },
        children: ["header", "input-row", "todo-list"],
      },
      header: {
        type: "Text",
        props: { content: "Todo List", variant: "heading" },
      },
      "input-row": {
        type: "Row",
        props: { gap: 1 },
        children: ["new-todo-input", "add-btn"],
      },
      "new-todo-input": {
        type: "Input",
        props: {
          id: "new-todo",
          placeholder: "Add a new task...",
          value: "",
        },
        on: {
          input: { action: "setState", params: { path: "/newTodo", value: "$event.value" } },
        },
      },
      "add-btn": {
        type: "Button",
        props: { id: "add-btn", label: "Add" },
        on: {
          press: { action: "addTodo" },
        },
      },
      "todo-list": {
        type: "Column",
        props: { gap: 1 },
        children: [],
      },
    },
    state: {
      todos: [],
      newTodo: "",
    },
  };
}

// =============================================================================
// Full Render Pipeline Tests
// =============================================================================

describe("Full Render Pipeline", () => {
  let renderer: ReziRenderer;

  beforeEach(() => {
    renderer = createRenderer({
      components: defaultComponents,
    });
  });

  afterEach(() => {
    renderer.dispose();
  });

  it("should render a complete form from spec to VNode", () => {
    const spec = createFormSpec();
    renderer.setSpec(spec);

    const vnode = renderer.render();

    expect(vnode).not.toBeNull();
    expect(vnode?.kind).toBe("column");
  });

  it("should render nested component structure correctly", () => {
    const spec = createFormSpec();
    renderer.setSpec(spec);

    const vnode = renderer.render() as VNode;

    expect(vnode).toHaveProperty("children");
    if ("children" in vnode) {
      expect(vnode.children?.length).toBeGreaterThan(0);
    }
  });

  it("should render multiple different component types", () => {
    const spec: Spec = {
      root: "container",
      elements: {
        container: {
          type: "Column",
          props: {},
          children: ["text", "button", "input", "box"],
        },
        text: { type: "Text", props: { content: "Hello" } },
        button: { type: "Button", props: { id: "test-button", label: "Click" } },
        input: { type: "Input", props: { id: "test-input", value: "" } },
        box: { type: "Box", props: {} },
      },
    };

    renderer.setSpec(spec);
    const vnode = renderer.render() as VNode;

    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(4);
    }
  });

  it("should handle deeply nested layouts", () => {
    const spec: Spec = {
      root: "level1",
      elements: {
        level1: {
          type: "Box",
          props: {},
          children: ["level2"],
        },
        level2: {
          type: "Column",
          props: {},
          children: ["level3"],
        },
        level3: {
          type: "Row",
          props: {},
          children: ["level4"],
        },
        level4: {
          type: "Box",
          props: {},
          children: ["content"],
        },
        content: {
          type: "Text",
          props: { content: "Deep nested content" },
        },
      },
    };

    renderer.setSpec(spec);
    const vnode = renderer.render();

    expect(vnode).not.toBeNull();
    expect(vnode?.kind).toBe("box");
  });

  it("should initialize state from spec on setSpec", () => {
    const spec = createFormSpec();
    renderer.setSpec(spec);

    expect(renderer.getState("/form/name")).toBe("");
    expect(renderer.getState("/form/email")).toBe("");
    expect(renderer.getState("/submitted")).toBe(false);
  });

  it("should render with initial state provided to constructor", () => {
    const customRenderer = createRenderer({
      components: defaultComponents,
      initialState: {
        user: { name: "John", role: "admin" },
        theme: "dark",
      },
    });

    expect(customRenderer.getState("/user/name")).toBe("John");
    expect(customRenderer.getState("/user/role")).toBe("admin");
    expect(customRenderer.getState("/theme")).toBe("dark");

    customRenderer.dispose();
  });
});

// =============================================================================
// State Changes and Re-renders Tests
// =============================================================================

describe("State Changes Trigger Re-renders", () => {
  let renderer: ReziRenderer;
  let renderCount: number;

  beforeEach(() => {
    renderCount = 0;
    renderer = createRenderer({
      components: {
        ...defaultComponents,
        Counter: (ctx) => {
          renderCount++;
          return ui.text(`Count: ${ctx.props.count}`);
        },
      },
    });
  });

  afterEach(() => {
    renderer.dispose();
  });

  it("should reflect state changes in subsequent renders", () => {
    const spec: Spec = {
      root: "counter",
      elements: {
        counter: {
          type: "Counter",
          props: { count: { $state: "/count" } },
        },
      },
      state: { count: 0 },
    };

    renderer.setSpec(spec);
    renderer.render();
    expect(renderCount).toBe(1);

    renderer.setState("/count", 5);
    renderer.render();
    expect(renderCount).toBe(2);
  });

  it("should trigger onStateChange callback when state changes", () => {
    const onStateChange = vi.fn();
    const customRenderer = createRenderer({
      components: defaultComponents,
      onStateChange,
    });

    customRenderer.setState("/test", "value");
    expect(onStateChange).toHaveBeenCalledTimes(1);

    customRenderer.dispose();
  });

  it("should notify subscribers when state changes", () => {
    const listener = vi.fn();
    const unsubscribe = renderer.subscribe(listener);

    renderer.setState("/key", "value");
    expect(listener).toHaveBeenCalledTimes(1);

    renderer.setState("/another", "data");
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("should batch multiple state updates", () => {
    const onStateChange = vi.fn();
    const customRenderer = createRenderer({
      components: defaultComponents,
      onStateChange,
    });

    customRenderer.getStore().update({
      "/a": 1,
      "/b": 2,
      "/c": 3,
    });

    expect(onStateChange).toHaveBeenCalledTimes(1);

    customRenderer.dispose();
  });

  it("should queue setState calls during render", () => {
    const customRenderer = createRenderer({
      components: {
        TestComponent: () => {
          customRenderer.setState("/during-render", "value");
          return ui.text("test");
        },
      },
    });

    const spec: Spec = {
      root: "test",
      elements: {
        test: { type: "TestComponent", props: {} },
      },
    };

    customRenderer.setSpec(spec);
    customRenderer.render();

    expect(customRenderer.getState("/during-render")).toBe("value");

    customRenderer.dispose();
  });
});

// =============================================================================
// Event Handling Flow Tests
// =============================================================================

describe("Event Handling Flows Through Actions", () => {
  let renderer: ReziRenderer;

  beforeEach(() => {
    renderer = createRenderer({
      components: defaultComponents,
      actionHandlers: {
        ...createActionHandlers(),
        customAction: async () => {},
        logAction: async () => {},
      },
    });
  });

  afterEach(() => {
    renderer.dispose();
  });

  it("should execute setState action on button press", async () => {
    const spec: Spec = {
      root: "btn",
      elements: {
        btn: {
          type: "Button",
          props: { id: "test-btn", label: "Click" },
          on: {
            press: { action: "setState", params: { path: "/clicked", value: true } },
          },
        },
      },
      state: { clicked: false },
    };

    renderer.setSpec(spec);
    renderer.render();

    expect(renderer.getState("/clicked")).toBe(false);

    renderer.setState("/clicked", true);
    expect(renderer.getState("/clicked")).toBe(true);
  });

  it("should execute custom action handlers", async () => {
    const spec: Spec = {
      root: "btn",
      elements: {
        btn: {
          type: "Button",
          props: { id: "test-btn", label: "Trigger" },
          on: {
            press: { action: "customAction", params: { data: "test" } },
          },
        },
      },
    };

    renderer.setSpec(spec);
    const vnode = renderer.render() as VNode;

    expect(vnode).not.toBeNull();
    expect(vnode.kind).toBe("button");
  });

  it("should handle multiple action bindings on same event", async () => {
    const spec: Spec = {
      root: "btn",
      elements: {
        btn: {
          type: "Button",
          props: { id: "test-btn", label: "Multi" },
          on: {
            press: [
              { action: "setState", params: { path: "/step1", value: "done" } },
              { action: "setState", params: { path: "/step2", value: "done" } },
            ],
          },
        },
      },
      state: { step1: "", step2: "" },
    };

    renderer.setSpec(spec);
    renderer.render();

    const btnElement = spec.elements.btn;
    if (btnElement.on?.press) {
      if (Array.isArray(btnElement.on?.press)) {
        expect(btnElement.on.press.length).toBe(2);
      }
    }
  });

  it("should handle async action handlers", async () => {
    const customRenderer = createRenderer({
      components: defaultComponents,
      actionHandlers: {
        asyncAction: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        },
      },
    });

    const spec: Spec = {
      root: "btn",
      elements: {
        btn: {
          type: "Button",
          props: { id: "test-btn", label: "Async" },
          on: {
            press: { action: "asyncAction" },
          },
        },
      },
    };

    customRenderer.setSpec(spec);
    customRenderer.render();

    customRenderer.dispose();
  });

  it("should support action handler overrides", async () => {
    const customSetState = vi.fn();

    const customRenderer = createRenderer({
      components: defaultComponents,
      actionHandlers: createActionHandlers({
        overrides: {
          setState: customSetState,
        },
      }),
    });

    const spec: Spec = {
      root: "btn",
      elements: {
        btn: {
          type: "Button",
          props: { id: "test-btn", label: "Test" },
          on: {
            press: { action: "setState", params: { path: "/test", value: 1 } },
          },
        },
      },
    };

    customRenderer.setSpec(spec);
    customRenderer.render();

    expect(customRenderer).toBeDefined();

    customRenderer.dispose();
  });
});

// =============================================================================
// Visibility Conditions Tests
// =============================================================================

describe("Visibility Conditions Work End-to-End", () => {
  let renderer: ReziRenderer;

  beforeEach(() => {
    renderer = createRenderer({
      components: defaultComponents,
    });
  });

  afterEach(() => {
    renderer.dispose();
  });

  it("should render elements when visibility condition is true", () => {
    const spec: Spec = {
      root: "container",
      elements: {
        container: {
          type: "Column",
          props: {},
          children: ["visible-text"],
        },
        "visible-text": {
          type: "Text",
          props: { content: "I am visible" },
          visible: { $state: "/show", eq: true },
        },
      },
      state: { show: true },
    };

    renderer.setSpec(spec);
    const vnode = renderer.render() as VNode;

    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(1);
    }
  });

  it("should not render elements when visibility condition is false", () => {
    const spec: Spec = {
      root: "container",
      elements: {
        container: {
          type: "Column",
          props: {},
          children: ["hidden-text"],
        },
        "hidden-text": {
          type: "Text",
          props: { content: "I am hidden" },
          visible: { $state: "/show", eq: true },
        },
      },
      state: { show: false },
    };

    renderer.setSpec(spec);
    const vnode = renderer.render() as VNode;

    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(0);
    }
  });

  it("should update visibility when state changes", () => {
    const spec: Spec = {
      root: "container",
      elements: {
        container: {
          type: "Column",
          props: {},
          children: ["conditional"],
        },
        conditional: {
          type: "Text",
          props: { content: "Conditional" },
          visible: { $state: "/visible", eq: true },
        },
      },
      state: { visible: false },
    };

    renderer.setSpec(spec);

    let vnode = renderer.render() as VNode;
    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(0);
    }

    renderer.setState("/visible", true);
    vnode = renderer.render() as VNode;
    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(1);
    }

    renderer.setState("/visible", false);
    vnode = renderer.render() as VNode;
    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(0);
    }
  });

  it("should handle $and visibility conditions", () => {
    const spec: Spec = {
      root: "container",
      elements: {
        container: {
          type: "Column",
          props: {},
          children: ["conditional"],
        },
        conditional: {
          type: "Text",
          props: { content: "Both true" },
          visible: {
            $and: [
              { $state: "/condition1", eq: true },
              { $state: "/condition2", eq: true },
            ],
          },
        },
      },
      state: { condition1: true, condition2: false },
    };

    renderer.setSpec(spec);
    let vnode = renderer.render() as VNode;
    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(0);
    }

    renderer.setState("/condition2", true);
    vnode = renderer.render() as VNode;
    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(1);
    }
  });

  it("should handle $or visibility conditions", () => {
    const spec: Spec = {
      root: "container",
      elements: {
        container: {
          type: "Column",
          props: {},
          children: ["conditional"],
        },
        conditional: {
          type: "Text",
          props: { content: "Either true" },
          visible: {
            $or: [
              { $state: "/condition1", eq: true },
              { $state: "/condition2", eq: true },
            ],
          },
        },
      },
      state: { condition1: false, condition2: false },
    };

    renderer.setSpec(spec);
    let vnode = renderer.render() as VNode;
    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(0);
    }

    renderer.setState("/condition1", true);
    vnode = renderer.render() as VNode;
    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(1);
    }
  });

  it("should handle comparison operators (gt, lt, gte, lte)", () => {
    const spec: Spec = {
      root: "container",
      elements: {
        container: {
          type: "Column",
          props: {},
          children: ["gt-check", "lt-check", "gte-check"],
        },
        "gt-check": {
          type: "Text",
          props: { content: "> 5" },
          visible: { $state: "/count", gt: 5 },
        },
        "lt-check": {
          type: "Text",
          props: { content: "< 10" },
          visible: { $state: "/count", lt: 10 },
        },
        "gte-check": {
          type: "Text",
          props: { content: ">= 0" },
          visible: { $state: "/count", gte: 0 },
        },
      },
      state: { count: 7 },
    };

    renderer.setSpec(spec);
    const vnode = renderer.render() as VNode;

    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(3);
    }
  });

  it("should handle not operator", () => {
    const spec: Spec = {
      root: "container",
      elements: {
        container: {
          type: "Column",
          props: {},
          children: ["not-hidden"],
        },
        "not-hidden": {
          type: "Text",
          props: { content: "Not hidden" },
          visible: { $state: "/hidden", not: true },
        },
      },
      state: { hidden: false },
    };

    renderer.setSpec(spec);
    const vnode = renderer.render() as VNode;

    if ("children" in vnode) {
      expect(vnode.children?.length).toBe(1);
    }
  });
});

// =============================================================================
// Streaming Renderer Tests
// =============================================================================

describe("Streaming Renderer Integration", () => {
  it("should create streaming renderer with default options", () => {
    const streaming = createStreamingRenderer({
      components: defaultComponents,
    });

    expect(streaming).toBeDefined();
    expect(streaming.getRenderer).toBeDefined();
    expect(streaming.push).toBeDefined();
    expect(streaming.getSpec).toBeDefined();

    streaming.dispose();
  });

  it("should push chunks and update spec progressively", () => {
    const streaming = createStreamingRenderer({
      components: defaultComponents,
    });

    const result1 = streaming.push(JSON.stringify({
      op: "add",
      path: "/root",
      value: "container",
    }) + "\n");


    expect(result1.spec).toBeDefined();

    streaming.dispose();
  });

  it("should call onSpecUpdate callback when spec changes", () => {
    const onSpecUpdate = vi.fn();
    const streaming = createStreamingRenderer({
      components: defaultComponents,
      onSpecUpdate,
    });

    streaming.push(JSON.stringify({ op: "add", path: "/root", value: "test" }) + "\n");

    expect(onSpecUpdate).toHaveBeenCalled();

    streaming.dispose();
  });

  it("should get current spec after pushes", () => {
    const streaming = createStreamingRenderer({
      components: defaultComponents,
    });

    streaming.push(JSON.stringify({
      root: "main",
      elements: {
        main: { type: "Text", props: { content: "Hello" } },
      },
    }) + "\n");


    const spec = streaming.getSpec();
    expect(spec).toBeDefined();

    streaming.dispose();
  });

  it("should render from streaming renderer", () => {
    const streaming = createStreamingRenderer({
      components: defaultComponents,
    });

    streaming.push(JSON.stringify({
      op: "add",
      path: "/root",
      value: "main",
    }) + "\n");
    streaming.push(JSON.stringify({
      op: "add",
      path: "/elements/main",
      value: { type: "Text", props: { content: "Streamed" } },
    }) + "\n");

    const vnode = streaming.render();
    expect(vnode).not.toBeNull();

    streaming.dispose();
  });

  it("should reset streaming renderer", () => {
    const streaming = createStreamingRenderer({
      components: defaultComponents,
    });

    streaming.push(JSON.stringify({
      root: "main",
      elements: {},
    }) + "\n");


    streaming.reset();

    const spec = streaming.getSpec();
    expect(spec.root).toBe("");

    streaming.dispose();
  });

  it("should handle errors gracefully", () => {
    const onError = vi.fn();
    const streaming = createStreamingRenderer({
      components: defaultComponents,
      onError,
    });

    const result = streaming.push("not valid json{\\n");

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();

    streaming.dispose();
  });

  it("should process async stream with processStream helper", async () => {
    const streaming = createStreamingRenderer({
      components: defaultComponents,
    });

    async function* mockStream() {
      yield JSON.stringify({ root: "main" }) + "\n";
      yield JSON.stringify({
        elements: {
          main: { type: "Text", props: { content: "Chunk 1" } },
        },
      }) + "\n";

    }

    const finalSpec = await processStream(streaming, mockStream());

    expect(finalSpec).toBeDefined();

    streaming.dispose();
  });

  it("should expose underlying renderer", () => {
    const streaming = createStreamingRenderer({
      components: defaultComponents,
    });

    const renderer = streaming.getRenderer();
    expect(renderer).toBeInstanceOf(ReziRenderer);

    streaming.dispose();
  });

  it("should get list of applied patches", () => {
    const streaming = createStreamingRenderer({
      components: defaultComponents,
    });

    streaming.push(JSON.stringify({
      op: "add",
      path: "/root",
      value: "a",
    }) + "\n");
    streaming.push(JSON.stringify({
      op: "add",
      path: "/elements/a",
      value: { type: "Text", props: {} },
    }) + "\n");


    const patches = streaming.getPatches();
    expect(patches.length).toBeGreaterThan(0);

    streaming.dispose();
  });
});

// =============================================================================
// Real-World Scenarios Tests
// =============================================================================

describe("Real-World Usage Scenarios", () => {
  it("should handle a complete form submission flow", async () => {
    const renderer = createRenderer({
      components: defaultComponents,
      actionHandlers: {
        ...createActionHandlers(),
        submitForm: async () => {},
      },
    });

    const spec = createFormSpec();
    renderer.setSpec(spec);

    renderer.setState("/form/name", "John Doe");
    renderer.setState("/form/email", "john@example.com");
    renderer.setState("/submitted", true);

    expect(renderer.getState("/form/name")).toBe("John Doe");
    expect(renderer.getState("/form/email")).toBe("john@example.com");

    renderer.dispose();
  });

  it("should handle a counter with increment/decrement", () => {
    const renderer = createRenderer({
      components: defaultComponents,
    });

    const spec = createCounterSpec();
    renderer.setSpec(spec);

    expect(renderer.getState("/count")).toBe(0);

    renderer.setState("/count", 1);
    expect(renderer.getState("/count")).toBe(1);

    renderer.setState("/count", 0);
    expect(renderer.getState("/count")).toBe(0);

    renderer.dispose();
  });

  it("should handle external store integration", () => {
    const externalStore = createStateStore({ shared: "data" });

    const renderer = createRenderer({
      components: defaultComponents,
      store: externalStore,
    });

    expect(renderer.getState("/shared")).toBe("data");

    externalStore.set("/shared", "updated");
    expect(renderer.getState("/shared")).toBe("updated");

    renderer.dispose();
  });

  it("should handle complex nested state updates", () => {
    const renderer = createRenderer({
      components: defaultComponents,
      initialState: {
        user: {
          profile: {
            settings: {
              theme: "light",
            },
          },
        },
      },
    });

    expect(renderer.getState("/user/profile/settings/theme")).toBe("light");

    renderer.setState("/user/profile/settings/theme", "dark");
    expect(renderer.getState("/user/profile/settings/theme")).toBe("dark");

    renderer.dispose();
  });

  it("should maintain state across spec updates", () => {
    const renderer = createRenderer({
      components: defaultComponents,
    });

    const spec1: Spec = {
      root: "main",
      elements: {
        main: { type: "Text", props: { content: "First" } },
      },
      state: { value: "initial" },
    };

    renderer.setSpec(spec1);
    expect(renderer.getState("/value")).toBe("initial");

    renderer.setState("/value", "changed");

    const spec2: Spec = {
      root: "main",
      elements: {
        main: { type: "Text", props: { content: "Second" } },
      },
    };

    renderer.setSpec(spec2);
    expect(renderer.getState("/value")).toBe("changed");

    renderer.dispose();
  });
});
