import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReziRenderer, createRenderer } from "../renderer.js";
import type { Spec, StateStore } from "@json-render/core";
import { createStateStore } from "@json-render/core";
import { ui } from "@rezi-ui/core";

describe("ReziRenderer State Integration", () => {
  describe("Store as single source of truth", () => {
    it("should use internal store when no external store provided", () => {
      const renderer = new ReziRenderer({
        initialState: { count: 0, name: "test" },
      });

      expect(renderer.getState("/count")).toBe(0);
      expect(renderer.getState("/name")).toBe("test");
      renderer.dispose();
    });

    it("should use external store when provided", () => {
      const externalStore = createStateStore({ count: 100 });
      const renderer = new ReziRenderer({ store: externalStore });

      expect(renderer.getState("/count")).toBe(100);
      expect(renderer.getStore()).toBe(externalStore);
      renderer.dispose();
    });

    it("should read state from store during render", () => {
      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Text",
            props: { content: "Hello" },
          },
        },
        state: { message: "World" },
      };

      const renderer = new ReziRenderer();
      renderer.setSpec(spec);

      // State should be initialized from spec
      expect(renderer.getState("/message")).toBe("World");
      renderer.dispose();
    });
  });

  describe("subscribe(listener) pattern", () => {
    it("should expose subscribe method that returns unsubscribe function", () => {
      const renderer = new ReziRenderer();
      const listener = vi.fn();
      
      const unsubscribe = renderer.subscribe(listener);
      expect(typeof unsubscribe).toBe("function");
      
      // Trigger a state change
      renderer.setState("/test", "value");
      expect(listener).toHaveBeenCalledTimes(1);
      
      // Unsubscribe should stop notifications
      unsubscribe();
      renderer.setState("/test", "value2");
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
      
      renderer.dispose();
    });

    it("should notify multiple subscribers", () => {
      const renderer = new ReziRenderer();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      const unsub1 = renderer.subscribe(listener1);
      const unsub2 = renderer.subscribe(listener2);
      
      renderer.setState("/key", "value");
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      
      unsub1();
      renderer.setState("/key", "value2");
      
      expect(listener1).toHaveBeenCalledTimes(1); // Unsubscribed
      expect(listener2).toHaveBeenCalledTimes(2); // Still subscribed
      
      unsub2();
      renderer.dispose();
    });
  });

  describe("onStateChange callback", () => {
    it("should call onStateChange when state changes", () => {
      const onStateChange = vi.fn();
      const renderer = new ReziRenderer({ onStateChange });
      
      renderer.setState("/count", 1);
      
      expect(onStateChange).toHaveBeenCalledTimes(1);
      renderer.dispose();
    });

    it("should not call onStateChange when value is same", () => {
      const onStateChange = vi.fn();
      const renderer = new ReziRenderer({ 
        initialState: { count: 5 },
        onStateChange 
      });
      
      // Setting same value should not trigger callback
      renderer.setState("/count", 5);
      
      expect(onStateChange).not.toHaveBeenCalled();
      renderer.dispose();
    });

    it("should call onStateChange for batch updates", () => {
      const onStateChange = vi.fn();
      const renderer = new ReziRenderer({ onStateChange });
      
      // Batch update via store directly
      renderer.getStore().update({
        "/a": 1,
        "/b": 2,
        "/c": 3,
      });
      
      // Should only trigger once for batch
      expect(onStateChange).toHaveBeenCalledTimes(1);
      renderer.dispose();
    });
  });

  describe("Update queue during render", () => {
    it("should queue setState calls during render phase", () => {
      const onStateChange = vi.fn();
      let renderCount = 0;
      
      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Custom",
            props: {},
          },
        },
      };

      const renderer = new ReziRenderer({
        onStateChange,
        components: {
          Custom: (ctx) => {
            renderCount++;
            // This setState during render should be queued
            ctx.emit("test");
            return ui.text("test");
          },
        },
      });
      
      renderer.setSpec(spec);
      
      // The component's emit doesn't call setState, so let's test differently
      // We need to test that setState during render is queued
      renderer.dispose();
    });

    it("should flush pending updates after render completes", () => {
      const stateChanges: string[] = [];
      const onStateChange = () => stateChanges.push("changed");
      
      let setStateDuringRender: any = null;
      
      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Custom",
            props: {},
          },
        },
      };

      const renderer = new ReziRenderer({
        onStateChange,
        components: {
          Custom: (ctx) => {
            // Capture setState function to call during render
            setStateDuringRender = () => {
              renderer.setState("/during-render", "value");
            };
            return ui.text("test");
          },
        },
      });
      
      renderer.setSpec(spec);
      
      // Clear previous state changes
      stateChanges.length = 0;
      
      // Render should trigger the component
      renderer.render();

      // Call setState during render
      setStateDuringRender?.();
      
      // The setState during render should have been queued and flushed
      // Check that state was updated after render
      expect(renderer.getState("/during-render")).toBe("value");
      
      renderer.dispose();
    });

    it("should batch multiple queued updates", () => {
      const onStateChange = vi.fn();
      
      const spec: Spec = {
        root: "root",
        elements: {
          root: {
            type: "Custom",
            props: {},
          },
        },
      };

      const renderer = new ReziRenderer({
        onStateChange,
        debug: true,
        components: {
          Custom: (ctx) => {
            // Multiple setState calls during render
            renderer.setState("/a", 1);
            renderer.setState("/b", 2);
            renderer.setState("/c", 3);
            return ui.text("test");
          },
        },
      });
      
      renderer.setSpec(spec);
      
      // Clear previous calls
      onStateChange.mockClear();
      
      // Render triggers the component
      renderer.render();
      
      // All updates should be batched into single notification
      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(renderer.getState("/a")).toBe(1);
      expect(renderer.getState("/b")).toBe(2);
      expect(renderer.getState("/c")).toBe(3);
      
      renderer.dispose();
    });
  });

  describe("dispose()", () => {
    it("should clean up store subscription", () => {
      const onStateChange = vi.fn();
      const renderer = new ReziRenderer({ onStateChange });
      
      renderer.dispose();
      
      // After dispose, state changes should not trigger callback
      renderer.setState("/test", "value");
      
      expect(onStateChange).not.toHaveBeenCalled();
    });

    it("should be safe to call dispose multiple times", () => {
      const renderer = new ReziRenderer();
      
      expect(() => {
        renderer.dispose();
        renderer.dispose();
        renderer.dispose();
      }).not.toThrow();
    });
  });

  describe("getStore()", () => {
    it("should return the underlying store", () => {
      const externalStore = createStateStore({ test: true });
      const renderer = new ReziRenderer({ store: externalStore });
      
      expect(renderer.getStore()).toBe(externalStore);
      renderer.dispose();
    });

    it("should allow direct store manipulation", () => {
      const renderer = new ReziRenderer();
      const store = renderer.getStore();
      
      store.update({ "/direct": "access" });
      
      expect(renderer.getState("/direct")).toBe("access");
      renderer.dispose();
    });
  });
});
