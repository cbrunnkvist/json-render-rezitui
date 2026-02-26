import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReziRenderer, createRenderer } from "../renderer.js";
import type { Spec } from "@json-render/core";
import { ui } from "@rezi-ui/core";

describe("ReziRenderer", () => {
  describe("constructor", () => {
    it("should create renderer with default options", () => {
      const renderer = new ReziRenderer();

      expect(renderer).toBeDefined();
      expect(renderer.getStore()).toBeDefined();
      renderer.dispose();
    });

    it("should create renderer with custom components", () => {
      const customComponent = vi.fn((ctx) => ui.text(ctx.props.content));
      const renderer = new ReziRenderer({
        components: {
          CustomText: customComponent,
        },
      });

      expect(renderer).toBeDefined();
      renderer.dispose();
    });

    it("should create renderer with initial state", () => {
      const renderer = new ReziRenderer({
        initialState: { count: 42, name: "test" },
      });

      expect(renderer.getState("/count")).toBe(42);
      expect(renderer.getState("/name")).toBe("test");
      renderer.dispose();
    });

    it("should create renderer with debug enabled", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const renderer = new ReziRenderer({
        debug: true,
      });

      expect(renderer).toBeDefined();
      renderer.dispose();
      consoleSpy.mockRestore();
    });

    it("should create renderer with action handlers", () => {
      const actionHandler = vi.fn();
      const renderer = new ReziRenderer({
        actionHandlers: {
          testAction: actionHandler,
        },
      });

      expect(renderer).toBeDefined();
      renderer.dispose();
    });

    it("should create renderer with onStateChange callback", () => {
      const onStateChange = vi.fn();
      const renderer = new ReziRenderer({
        onStateChange,
      });

      renderer.setState("/test", "value");
      expect(onStateChange).toHaveBeenCalledTimes(1);
      renderer.dispose();
    });
  });

  describe("createRenderer factory function", () => {
    it("should create renderer using factory function", () => {
      const renderer = createRenderer({
        initialState: { foo: "bar" },
      });

      expect(renderer).toBeInstanceOf(ReziRenderer);
      expect(renderer.getState("/foo")).toBe("bar");
      renderer.dispose();
    });
  });

  describe("setSpec", () => {
    it("should set spec and return void", () => {
      const renderer = new ReziRenderer();
      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Text",
            props: { content: "Hello" },
          },
        },
      };

      const result = renderer.setSpec(spec);
      expect(result).toBeUndefined();
      renderer.dispose();
    });

    it("should initialize state from spec", () => {
      const renderer = new ReziRenderer();
      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Text",
            props: { content: "Hello" },
          },
        },
        state: { initialized: true, count: 10 },
      };

      renderer.setSpec(spec);
      expect(renderer.getState("/initialized")).toBe(true);
      expect(renderer.getState("/count")).toBe(10);
      renderer.dispose();
    });

    it("should clear spec when set to null", () => {
      const renderer = new ReziRenderer();
      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Text",
            props: { content: "Hello" },
          },
        },
      };

      renderer.setSpec(spec);
      renderer.setSpec(null);
      expect(renderer.render()).toBeNull();
      renderer.dispose();
    });

    it("should update spec when set multiple times", () => {
      const renderer = new ReziRenderer();
      const spec1: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Text",
            props: { content: "First" },
          },
        },
        state: { version: 1 },
      };

      const spec2: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Text",
            props: { content: "Second" },
          },
        },
        state: { version: 2 },
      };

      renderer.setSpec(spec1);
      expect(renderer.getState("/version")).toBe(1);

      renderer.setSpec(spec2);
      expect(renderer.getState("/version")).toBe(2);
      renderer.dispose();
    });
  });

  describe("render", () => {
    it("should return VNode for valid spec", () => {
      const renderer = new ReziRenderer();
      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Text",
            props: { content: "Hello World" },
          },
        },
      };

      renderer.setSpec(spec);
      const vnode = renderer.render();

      expect(vnode).not.toBeNull();
      expect(vnode).toHaveProperty("kind");
      expect(vnode?.kind).toBe("text");
      renderer.dispose();
    });

    it("should return null when no spec is set", () => {
      const renderer = new ReziRenderer();

      const vnode = renderer.render();
      expect(vnode).toBeNull();
      renderer.dispose();
    });

    it("should return null for empty spec", () => {
      const renderer = new ReziRenderer();
      const spec: Spec = {
        root: "",
        elements: {},
      };

      renderer.setSpec(spec);
      const vnode = renderer.render();

      expect(vnode).toBeNull();
      renderer.dispose();
    });

    it("should return null when root element is not found", () => {
      const renderer = new ReziRenderer();
      const spec: Spec = {
        root: "missing",
        elements: {
          other: {
            type: "Text",
            props: { content: "Hello" },
          },
        },
      };

      renderer.setSpec(spec);
      const vnode = renderer.render();

      expect(vnode).toBeNull();
      renderer.dispose();
    });

    it("should render nested elements", () => {
      const renderer = new ReziRenderer();
      const spec: Spec = {
        root: "container",
        elements: {
          container: {
            type: "Box",
            props: {},
            children: ["child1", "child2"],
          },
          child1: {
            type: "Text",
            props: { content: "First" },
          },
          child2: {
            type: "Text",
            props: { content: "Second" },
          },
        },
      };

      renderer.setSpec(spec);
      const vnode = renderer.render();

      expect(vnode).not.toBeNull();
      expect(vnode?.kind).toBe("box");
      renderer.dispose();
    });

    it("should render with custom components", () => {
      const customComponent = vi.fn((ctx) => ui.text(`Custom: ${ctx.props.label}`));
      const renderer = new ReziRenderer({
        components: {
          MyComponent: customComponent,
        },
      });

      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "MyComponent",
            props: { label: "Test" },
          },
        },
      };

      renderer.setSpec(spec);
      const vnode = renderer.render();

      expect(customComponent).toHaveBeenCalled();
      expect(vnode).not.toBeNull();
      expect(vnode?.kind).toBe("text");
      renderer.dispose();
    });
  });

  describe("getState", () => {
    it("should get state by path", () => {
      const renderer = new ReziRenderer({
        initialState: {
          user: { name: "John", age: 30 },
          items: ["a", "b", "c"],
        },
      });

      expect(renderer.getState("/user/name")).toBe("John");
      expect(renderer.getState("/user/age")).toBe(30);
      expect(renderer.getState("/items/0")).toBe("a");
      renderer.dispose();
    });

    it("should return undefined for non-existent path", () => {
      const renderer = new ReziRenderer({
        initialState: { foo: "bar" },
      });

      expect(renderer.getState("/nonexistent")).toBeUndefined();
      expect(renderer.getState("/foo/baz")).toBeUndefined();
      renderer.dispose();
    });

    it("should work with empty state", () => {
      const renderer = new ReziRenderer();

      expect(renderer.getState("/anything")).toBeUndefined();
      renderer.dispose();
    });
  });

  describe("setState", () => {
    it("should set state by path", () => {
      const renderer = new ReziRenderer();

      renderer.setState("/count", 42);
      expect(renderer.getState("/count")).toBe(42);

      renderer.setState("/user/name", "Alice");
      expect(renderer.getState("/user/name")).toBe("Alice");
      renderer.dispose();
    });

    it("should update existing state", () => {
      const renderer = new ReziRenderer({
        initialState: { count: 0 },
      });

      renderer.setState("/count", 1);
      expect(renderer.getState("/count")).toBe(1);

      renderer.setState("/count", 100);
      expect(renderer.getState("/count")).toBe(100);
      renderer.dispose();
    });

    it("should create nested paths", () => {
      const renderer = new ReziRenderer();

      renderer.setState("/a/b/c", "deep");
      expect(renderer.getState("/a/b/c")).toBe("deep");
      renderer.dispose();
    });

    it("should trigger onStateChange callback", () => {
      const onStateChange = vi.fn();
      const renderer = new ReziRenderer({ onStateChange });

      renderer.setState("/test", "value1");
      expect(onStateChange).toHaveBeenCalledTimes(1);

      renderer.setState("/test", "value2");
      expect(onStateChange).toHaveBeenCalledTimes(2);
      renderer.dispose();
    });
  });

  describe("state subscription", () => {
    it("should subscribe to state changes", () => {
      const renderer = new ReziRenderer();
      const listener = vi.fn();

      const unsubscribe = renderer.subscribe(listener);

      renderer.setState("/key", "value");
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      renderer.dispose();
    });

    it("should unsubscribe from state changes", () => {
      const renderer = new ReziRenderer();
      const listener = vi.fn();

      const unsubscribe = renderer.subscribe(listener);
      renderer.setState("/key", "value1");
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      renderer.setState("/key", "value2");
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
      renderer.dispose();
    });

    it("should support multiple subscribers", () => {
      const renderer = new ReziRenderer();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      const unsub1 = renderer.subscribe(listener1);
      const unsub2 = renderer.subscribe(listener2);
      const unsub3 = renderer.subscribe(listener3);

      renderer.setState("/key", "value");
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);

      unsub1();
      renderer.setState("/key", "value2");
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);
      expect(listener3).toHaveBeenCalledTimes(2);

      unsub2();
      unsub3();
      renderer.dispose();
    });

    it("should notify subscribers when state is set via spec", () => {
      const renderer = new ReziRenderer();
      const listener = vi.fn();

      renderer.subscribe(listener);
      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Text",
            props: { content: "Hello" },
          },
        },
        state: { fromSpec: true },
      };

      renderer.setSpec(spec);
      expect(listener).toHaveBeenCalled();
      renderer.dispose();
    });
  });

  describe("getStateSnapshot", () => {
    it("should return full state snapshot", () => {
      const renderer = new ReziRenderer({
        initialState: { a: 1, b: 2 },
      });

      const snapshot = renderer.getStateSnapshot();
      expect(snapshot).toEqual({ a: 1, b: 2 });
      renderer.dispose();
    });

    it("should return updated snapshot after setState", () => {
      const renderer = new ReziRenderer({
        initialState: { count: 0 },
      });

      renderer.setState("/count", 5);
      const snapshot = renderer.getStateSnapshot();
      expect(snapshot).toEqual({ count: 5 });
      renderer.dispose();
    });
  });

  describe("dispose", () => {
    it("should clean up subscriptions", () => {
      const onStateChange = vi.fn();
      const renderer = new ReziRenderer({ onStateChange });

      renderer.dispose();
      renderer.setState("/test", "value");
      expect(onStateChange).not.toHaveBeenCalled();
    });

    it("should be safe to call multiple times", () => {
      const renderer = new ReziRenderer();

      expect(() => {
        renderer.dispose();
        renderer.dispose();
        renderer.dispose();
      }).not.toThrow();
    });
  });
});
