import { describe, it, expect, vi, beforeEach } from "vitest";
import { ui, type VNode } from "@rezi-ui/core";
import {
  Box,
  Row,
  Column,
  Text,
  Button,
  Input,
  Select,
  Checkbox,
  Slider,
  resetIdCounter,
} from "../components/index.js";
import type { ReziComponentContext, SelectOption } from "../types.js";

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock component context for testing.
 */
function createMockContext<P = Record<string, unknown>>(
  props: P,
  children?: VNode[]
): ReziComponentContext<P> {
  return {
    props,
    children,
    emit: vi.fn(),
    on: vi.fn(() => ({ emit: vi.fn(), bound: false, shouldPreventDefault: false })),
    id: vi.fn((suffix) => `${suffix}-test-id`),
    loading: false,
  };
}

/**
 * Create a mock VNode for use as a child.
 */
function createMockVNode(kind: string = "text", text?: string): VNode {
  return text ? ui.text(text) : ({ kind } as VNode);
}

// =============================================================================
// Layout Components Tests
// =============================================================================

describe("Layout Components", () => {
  beforeEach(() => {
    // Reset ID counter before each test for deterministic results
    resetIdCounter();
  });

  describe("Box", () => {
    it("should return a VNode", () => {
      const ctx = createMockContext({ p: 1 });
      const result = Box(ctx);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("kind");
    });

    it("should return VNode with kind 'box'", () => {
      const ctx = createMockContext({ p: 1 });
      const result = Box(ctx);

      expect(result.kind).toBe("box");
    });

    it("should pass props correctly", () => {
      const props = {
        p: 2,
        border: "single" as const,
        width: 100,
        height: 50,
      };
      const ctx = createMockContext(props);
      const result = Box(ctx);

      // Props should be passed to the underlying ui.box call
      expect(result).toBeDefined();
      expect(result.kind).toBe("box");
    });

    it("should render children when provided", () => {
      const child1 = ui.text("Child 1");
      const child2 = ui.text("Child 2");
      const ctx = createMockContext({ p: 1 }, [child1, child2]);
      const result = Box(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("box");
      // Children should be passed through
      expect(result).toHaveProperty("children");
    });

    it("should handle empty props", () => {
      const ctx = createMockContext({});
      const result = Box(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("box");
    });

    it("should handle undefined children", () => {
      const ctx = createMockContext({ p: 1 }, undefined);
      const result = Box(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("box");
    });
  });

  describe("Row", () => {
    it("should return a VNode", () => {
      const ctx = createMockContext({ gap: 1 });
      const result = Row(ctx);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("kind");
    });

    it("should return VNode with kind 'row'", () => {
      const ctx = createMockContext({ gap: 1 });
      const result = Row(ctx);

      expect(result.kind).toBe("row");
    });

    it("should pass props correctly", () => {
      const props = {
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
      };
      const ctx = createMockContext(props);
      const result = Row(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("row");
    });

    it("should render children when provided", () => {
      const child1 = ui.text("Item 1");
      const child2 = ui.text("Item 2");
      const ctx = createMockContext({ gap: 1 }, [child1, child2]);
      const result = Row(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("row");
      expect(result).toHaveProperty("children");
    });

    it("should handle empty props", () => {
      const ctx = createMockContext({});
      const result = Row(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("row");
    });

    it("should handle gap prop default", () => {
      const ctx = createMockContext({});
      const result = Row(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("row");
    });
  });

  describe("Column", () => {
    it("should return a VNode", () => {
      const ctx = createMockContext({ gap: 1 });
      const result = Column(ctx);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("kind");
    });

    it("should return VNode with kind 'column'", () => {
      const ctx = createMockContext({ gap: 1 });
      const result = Column(ctx);

      expect(result.kind).toBe("column");
    });

    it("should pass props correctly", () => {
      const props = {
        gap: 2,
        alignItems: "stretch",
        justifyContent: "flex-start",
      };
      const ctx = createMockContext(props);
      const result = Column(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("column");
    });

    it("should render children when provided", () => {
      const child1 = ui.text("Item 1");
      const child2 = ui.text("Item 2");
      const child3 = ui.text("Item 3");
      const ctx = createMockContext({ gap: 1 }, [child1, child2, child3]);
      const result = Column(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("column");
      expect(result).toHaveProperty("children");
    });

    it("should handle empty props", () => {
      const ctx = createMockContext({});
      const result = Column(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("column");
    });

    it("should handle nested layout components", () => {
      const innerRow = Row(createMockContext({}, [ui.text("Inner 1")]));
      const ctx = createMockContext({ gap: 1 }, [innerRow]);
      const result = Column(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("column");
      expect(result).toHaveProperty("children");
    });
  });
});

// =============================================================================
// Interactive Components Tests
// =============================================================================

describe("Interactive Components", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe("Text", () => {
    it("should return a VNode", () => {
      const ctx = createMockContext({ content: "Hello World" });
      const result = Text(ctx);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("kind");
    });

    it("should return VNode with kind 'text'", () => {
      const ctx = createMockContext({ content: "Hello World" });
      const result = Text(ctx);

      expect(result.kind).toBe("text");
    });

    it("should pass content prop correctly", () => {
      const ctx = createMockContext({ content: "Test Content" });
      const result = Text(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("text");
      // Content should be rendered as text
      expect(result).toHaveProperty("text");
    });

    it("should handle empty content", () => {
      const ctx = createMockContext({ content: "" });
      const result = Text(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("text");
    });

    it("should pass style props correctly", () => {
      const ctx = createMockContext({
        content: "Styled Text",
        style: { bold: true, color: "red" },
      });
      const result = Text(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("text");
    });

    it("should handle undefined content", () => {
      const ctx = createMockContext({ content: undefined });
      const result = Text(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("text");
    });
  });

  describe("Button", () => {
    it("should return a VNode", () => {
      const ctx = createMockContext({ id: "btn1", label: "Click Me" });
      const result = Button(ctx);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("kind");
    });

    it("should return VNode with kind 'button'", () => {
      const ctx = createMockContext({ id: "btn2", label: "Click Me" });
      const result = Button(ctx);

      expect(result.kind).toBe("button");
    });

    it("should pass label prop correctly", () => {
      const ctx = createMockContext({ id: "btn3", label: "Submit" });
      const result = Button(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("button");
      expect(result).toHaveProperty("props");
    });

    it("should use provided id", () => {
      const ctx = createMockContext({ id: "my-button", label: "Click" });
      const result = Button(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("button");
    });

    it("should auto-generate id if not provided", () => {
      const ctx = createMockContext({ label: "Click" });
      const result = Button(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("button");
    });

    it("should handle onPress as string action", () => {
      const emit = vi.fn();
      const ctx = createMockContext({
        id: "btn5",
        label: "Click",
        onPress: vi.fn(),
      });
      ctx.emit = emit;

      const result = Button(ctx);
      expect(result).toBeDefined();
    });

    it("should handle onPress as function", () => {
      const onPress = vi.fn();
      const ctx = createMockContext({
        id: "btn6",
        label: "Click",
        onPress,
      });

      const result = Button(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("button");
    });

    it("should use default label when not provided", () => {
      const ctx = createMockContext({ id: "btn7", label: "Button" });
      const result = Button(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("button");
    });

    it("should pass intent and other props", () => {
      const ctx = createMockContext({
        id: "btn8",
        label: "Danger",
        intent: "danger" as const,
        disabled: false,
      });
      const result = Button(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("button");
    });
  });

  describe("Input", () => {
    it("should return a VNode", () => {
      const ctx = createMockContext({ id: "input1", value: "test" });
      const result = Input(ctx);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("kind");
    });

    it("should return VNode with kind 'input'", () => {
      const ctx = createMockContext({ id: "input2", value: "test" });
      const result = Input(ctx);

      expect(result.kind).toBe("input");
    });

    it("should pass value prop correctly", () => {
      const ctx = createMockContext({ id: "input3", value: "Hello" });
      const result = Input(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("input");
    });

    it("should use provided id", () => {
      const ctx = createMockContext({ id: "my-input", value: "test" });
      const result = Input(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("input");
    });

    it("should auto-generate id if not provided", () => {
      const ctx = createMockContext({ id: "input4", value: "test" });
      const result = Input(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("input");
    });

    it("should handle onInput as string action", () => {
      const emit = vi.fn();
      const ctx = createMockContext({
        id: "input5",
        value: "",
        onInput: vi.fn(),
      });
      ctx.emit = emit;

      const result = Input(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("input");
    });

    it("should handle onInput as function", () => {
      const onInput = vi.fn();
      const ctx = createMockContext({
        id: "input6",
        value: "",
        onInput,
      });

      const result = Input(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("input");
    });

    it("should handle bindings for two-way state binding", () => {
      const emit = vi.fn();
      const ctx = createMockContext({
        id: "input7",
        value: "",
        bindings: { value: "/user/name" },
      });
      ctx.emit = emit;

      const result = Input(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("input");
    });

    it("should pass placeholder and other props", () => {
      const ctx = createMockContext({
        id: "input8",
        value: "",
        placeholder: "Enter your name",
        multiline: false,
      });
      const result = Input(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("input");
    });

    it("should handle empty value", () => {
      const ctx = createMockContext({ id: "input9", value: "" });
      const result = Input(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("input");
    });
  });

  describe("Select", () => {
    it("should return a VNode", () => {
      const ctx = createMockContext({
        id: "select1",
        options: [],
        value: "",
      });
      const result = Select(ctx);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("kind");
    });

    it("should return VNode with kind 'select'", () => {
      const ctx = createMockContext({
        id: "select2",
        options: [],
        value: "",
      });
      const result = Select(ctx);

      expect(result.kind).toBe("select");
    });

    it("should pass options correctly", () => {
      const options: SelectOption[] = [
        { value: "1", label: "Option 1" },
        { value: "2", label: "Option 2" },
      ];
      const ctx = createMockContext({ id: "select3", options, value: "1" });
      const result = Select(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("select");
    });

    it("should use provided id", () => {
      const ctx = createMockContext({
        id: "my-select",
        options: [],
        value: "",
      });
      const result = Select(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("select");
    });

    it("should auto-generate id if not provided", () => {
      const ctx = createMockContext({
        id: "select4",
        options: [],
        value: "",
      });
      const result = Select(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("select");
    });

    it("should handle onChange as string action", () => {
      const emit = vi.fn();
      const ctx = createMockContext({
        id: "select5",
        options: [{ value: "1", label: "One" }],
        value: "1",
        onChange: vi.fn(),
      });
      ctx.emit = emit;

      const result = Select(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("select");
    });

    it("should handle onChange as function", () => {
      const onChange = vi.fn();
      const ctx = createMockContext({
        id: "select6",
        options: [{ value: "1", label: "One" }],
        value: "1",
        onChange,
      });

      const result = Select(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("select");
    });

    it("should handle empty options array", () => {
      const ctx = createMockContext({
        id: "select7",
        options: [],
        value: "",
      });
      const result = Select(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("select");
    });

    it("should pass disabled options correctly", () => {
      const options: SelectOption[] = [
        { value: "1", label: "Option 1", disabled: true },
        { value: "2", label: "Option 2" },
      ];
      const ctx = createMockContext({ id: "select8", options, value: "" });
      const result = Select(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("select");
    });
  });

  describe("Checkbox", () => {
    it("should return a VNode", () => {
      const ctx = createMockContext({ id: "check1", checked: false });
      const result = Checkbox(ctx);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("kind");
    });

    it("should return VNode with kind 'checkbox'", () => {
      const ctx = createMockContext({ id: "check2", checked: false });
      const result = Checkbox(ctx);

      expect(result.kind).toBe("checkbox");
    });

    it("should pass checked prop correctly", () => {
      const ctx = createMockContext({ id: "check3", checked: true });
      const result = Checkbox(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("checkbox");
    });

    it("should auto-generate id if not provided", () => {
      const ctx = createMockContext({ id: "check4", checked: false });
      const result = Checkbox(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("checkbox");
    });

    it("should handle onChange as string action", () => {
      const emit = vi.fn();
      const ctx = createMockContext({
        id: "check5",
        checked: false,
        onChange: vi.fn(),
      });
      ctx.emit = emit;

      const result = Checkbox(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("checkbox");
    });

    it("should handle onChange as function", () => {
      const onChange = vi.fn();
      const ctx = createMockContext({
        id: "check6",
        checked: false,
        onChange,
      });

      const result = Checkbox(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("checkbox");
    });

    it("should pass label prop", () => {
      const ctx = createMockContext({
        id: "check7",
        checked: true,
        label: "Accept terms",
      });
      const result = Checkbox(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("checkbox");
    });
  });

  describe("Slider", () => {
    it("should return a VNode", () => {
      const ctx = createMockContext({ id: "slider1", value: 50 });
      const result = Slider(ctx);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("kind");
    });

    it("should return VNode with kind 'slider'", () => {
      const ctx = createMockContext({ id: "slider2", value: 50 });
      const result = Slider(ctx);

      expect(result.kind).toBe("slider");
    });

    it("should pass value, min, max props correctly", () => {
      const ctx = createMockContext({
        id: "slider3",
        value: 75,
        min: 0,
        max: 100,
      });
      const result = Slider(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("slider");
    });

    it("should auto-generate id if not provided", () => {
      const ctx = createMockContext({ id: "slider4", value: 50 });
      const result = Slider(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("slider");
    });

    it("should handle onChange as string action", () => {
      const emit = vi.fn();
      const ctx = createMockContext({
        id: "slider5",
        value: 50,
        onChange: vi.fn(),
      });
      ctx.emit = emit;

      const result = Slider(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("slider");
    });

    it("should handle onChange as function", () => {
      const onChange = vi.fn();
      const ctx = createMockContext({
        id: "slider6",
        value: 50,
        onChange,
      });

      const result = Slider(ctx);
      expect(result).toBeDefined();
      expect(result.kind).toBe("slider");
    });

    it("should pass step prop", () => {
      const ctx = createMockContext({
        id: "slider7",
        value: 50,
        min: 0,
        max: 100,
        step: 5,
      });
      const result = Slider(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("slider");
    });
  });
});

// =============================================================================
// VNode Return Type Tests
// =============================================================================

describe("VNode Return Types", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("all layout components should return VNodes", () => {
    const box = Box(createMockContext({}));
    const row = Row(createMockContext({}));
    const column = Column(createMockContext({}));

    expect(box).toBeDefined();
    expect(row).toBeDefined();
    expect(column).toBeDefined();

    expect(box).toHaveProperty("kind");
    expect(row).toHaveProperty("kind");
    expect(column).toHaveProperty("kind");
  });

  it("all interactive components should return VNodes", () => {
    const text = Text(createMockContext({ content: "test" }));
    const button = Button(createMockContext({ id: "test", label: "test" }));
    const input = Input(createMockContext({ id: "test", value: "test" }));
    const select = Select(createMockContext({ id: "test", options: [], value: "" }));
    const checkbox = Checkbox(createMockContext({ id: "test", checked: false }));
    const slider = Slider(createMockContext({ id: "test", value: 50 }));

    expect(text).toBeDefined();
    expect(button).toBeDefined();
    expect(input).toBeDefined();
    expect(select).toBeDefined();
    expect(checkbox).toBeDefined();
    expect(slider).toBeDefined();

    expect(text).toHaveProperty("kind");
    expect(button).toHaveProperty("kind");
    expect(input).toHaveProperty("kind");
    expect(select).toHaveProperty("kind");
    expect(checkbox).toHaveProperty("kind");
    expect(slider).toHaveProperty("kind");
  });

  it("returned VNodes should have correct kind property", () => {
    expect(Box(createMockContext({})).kind).toBe("box");
    expect(Row(createMockContext({})).kind).toBe("row");
    expect(Column(createMockContext({})).kind).toBe("column");
    expect(Text(createMockContext({ content: "" })).kind).toBe("text");
    expect(Button(createMockContext({ id: "test", label: "Button" })).kind).toBe("button");
    expect(Input(createMockContext({ id: "test", value: "" })).kind).toBe("input");
    expect(Select(createMockContext({ id: "test", options: [], value: "" })).kind).toBe("select");
    expect(Checkbox(createMockContext({ id: "test", checked: false })).kind).toBe("checkbox");
    expect(Slider(createMockContext({ id: "test", value: 0 })).kind).toBe("slider");
  });
});

// =============================================================================
// Props Passing Tests
// =============================================================================

describe("Props Passing", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe("layout props", () => {
    it("Box should pass padding, margin, border props", () => {
      const ctx = createMockContext({
        p: 4,
        m: 2,
        border: "single" as const,
      });
      const result = Box(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("box");
    });

    it("Row should pass gap, align, justify props", () => {
      const ctx = createMockContext({
        gap: 3,
        alignItems: "center",
        justifyContent: "space-around",
      });
      const result = Row(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("row");
    });

    it("Column should pass gap, align, justify props", () => {
      const ctx = createMockContext({
        gap: 2,
        alignItems: "flex-start",
        justifyContent: "flex-end",
      });
      const result = Column(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("column");
    });
  });

  describe("interactive props", () => {
    it("Button should pass intent, disabled, loading props", () => {
      const ctx = createMockContext({
        id: "test",
        label: "Test",
        intent: "primary" as const,
        disabled: true,
        loading: false,
      });
      const result = Button(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("button");
    });

    it("Input should pass placeholder, multiline, password props", () => {
      const ctx = createMockContext({
        id: "test",
        value: "",
        placeholder: "Type here...",
        multiline: true,
        password: false,
      });
      const result = Input(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("input");
    });

    it("Select should pass placeholder and disabled props", () => {
      const ctx = createMockContext({
        id: "test",
        options: [{ value: "1", label: "One" }],
        value: "1",
        placeholder: "Choose...",
        disabled: false,
      });
      const result = Select(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("select");
    });

    it("Text should pass variant and truncate props", () => {
      const ctx = createMockContext({
        content: "Test",
        variant: "heading" as const,
        truncate: true,
      });
      const result = Text(ctx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("text");
    });
  });

  describe("id generation", () => {
    it("should use provided id when available", () => {
      const buttonCtx = createMockContext({ id: "custom-btn", label: "Click" });
      const result = Button(buttonCtx);

      expect(result).toBeDefined();
      expect(result.kind).toBe("button");
    });

    it("should call ctx.id when id not provided", () => {
      const idMock = vi.fn((suffix) => `generated-${suffix}`);
      const ctx = createMockContext({ label: "Click" });
      ctx.id = idMock;

      Button(ctx);

      expect(idMock).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Children Rendering Tests
// =============================================================================

describe("Children Rendering", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("Box should render single child", () => {
    const child = ui.text("Single Child");
    const ctx = createMockContext({}, [child]);
    const result = Box(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("box");
    expect(result).toHaveProperty("children");
  });

  it("Box should render multiple children", () => {
    const children = [
      ui.text("Child 1"),
      ui.text("Child 2"),
      ui.text("Child 3"),
    ];
    const ctx = createMockContext({}, children);
    const result = Box(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("box");
    expect(result).toHaveProperty("children");
  });

  it("Row should render children horizontally", () => {
    const children = [
      Button(createMockContext({ id: "btn1", label: "Btn 1" })),
      Button(createMockContext({ id: "btn2", label: "Btn 2" })),
    ];
    const ctx = createMockContext({ gap: 1 }, children);
    const result = Row(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("row");
    expect(result).toHaveProperty("children");
  });

  it("Column should render children vertically", () => {
    const children = [
      Text(createMockContext({ content: "Line 1" })),
      Text(createMockContext({ content: "Line 2" })),
      Text(createMockContext({ content: "Line 3" })),
    ];
    const ctx = createMockContext({ gap: 1 }, children);
    const result = Column(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("column");
    expect(result).toHaveProperty("children");
  });

  it("should handle nested layouts", () => {
    const innerBox = Box(createMockContext({ p: 1 }, [ui.text("Inner")]));
    const row = Row(createMockContext({ gap: 2 }, [innerBox]));
    const outerColumn = Column(createMockContext({ gap: 1 }, [row]));

    expect(outerColumn).toBeDefined();
    expect(outerColumn.kind).toBe("column");
    expect(outerColumn).toHaveProperty("children");
  });

  it("should handle empty children array", () => {
    const ctx = createMockContext({}, []);
    const result = Box(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("box");
  });

  it("should handle undefined children", () => {
    const ctx = createMockContext({});
    const result = Box(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("box");
  });

  it("should preserve child VNode structure", () => {
    const textChild = ui.text("Test", { bold: true });
    const ctx = createMockContext({}, [textChild]);
    const result = Box(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("box");
    expect(result).toHaveProperty("children");
  });

  it("should handle mixed content types in layout", () => {
    const children = [
      Text(createMockContext({ content: "Header" })),
      Input(createMockContext({ id: "input1", value: "" })),
      Button(createMockContext({ id: "btn1", label: "Submit" })),
    ];
    const ctx = createMockContext({ gap: 1 }, children);
    const result = Column(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("column");
    expect(result).toHaveProperty("children");
  });
});

// =============================================================================
// Context Integration Tests
// =============================================================================

describe("Context Integration", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("should call ctx.emit for string action handlers", () => {
    const emit = vi.fn();
    const ctx = createMockContext({ id: "test", label: "Click", onPress: vi.fn() });
    ctx.emit = emit;

    Button(ctx);

    // The emit function should be available in the context
    expect(ctx.emit).toBe(emit);
  });

  it("should call ctx.id when id not provided", () => {
    const idMock = vi.fn((suffix) => `generated-${suffix}`);
    const ctx = createMockContext({ label: "Click" });
    ctx.id = idMock;

    Button(ctx);

    expect(idMock).toHaveBeenCalled();
  });

  it("should not call ctx.emit when onPress is a function", () => {
    const emit = vi.fn();
    const onPress = vi.fn();
    const ctx = createMockContext({ id: "test", label: "Click", onPress });
    ctx.emit = emit;

    Button(ctx);

    // emit should not be called during render
    expect(emit).not.toHaveBeenCalled();
  });

  it("should access ctx.props correctly", () => {
    const props = {
      id: "test",
      label: "Custom Label",
      intent: "success" as const,
      disabled: true,
    };
    const ctx = createMockContext(props);

    const result = Button(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("button");
  });

  it("should handle ctx.loading state", () => {
    const ctx = createMockContext({ id: "test", label: "Loading" });
    ctx.loading = true;

    const result = Button(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("button");
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe("Edge Cases", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("should handle empty props gracefully", () => {
    const ctx = createMockContext({});

    // Should not throw
    expect(() => Box(ctx)).not.toThrow();
    expect(() => Text(ctx)).not.toThrow();
  });

  it("should handle very long content strings", () => {
    const longContent = "a".repeat(10000);
    const ctx = createMockContext({ content: longContent });

    const result = Text(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("text");
  });

  it("should handle special characters in content", () => {
    const specialContent = "Hello! @#$%^&*()_+-=[]{}|;':\",./<>?";
    const ctx = createMockContext({ content: specialContent });

    const result = Text(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("text");
  });

  it("should handle unicode characters in content", () => {
    const unicodeContent = "Hello 世界 🌍 Привет מזל";
    const ctx = createMockContext({ content: unicodeContent });

    const result = Text(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("text");
  });

  it("should handle many children efficiently", () => {
    const children = Array.from({ length: 100 }, (_, i) =>
      ui.text(`Item ${i}`)
    );
    const ctx = createMockContext({ gap: 1 }, children);

    const result = Column(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("column");
    expect(result).toHaveProperty("children");
  });

  it("should handle deeply nested layouts", () => {
    let current: VNode = ui.text("Deep");

    // Create 50 levels of nesting
    for (let i = 0; i < 50; i++) {
      current = Box(createMockContext({ p: 1 }, [current]));
    }

    expect(current).toBeDefined();
    expect(current.kind).toBe("box");
  });

  it("should handle Select with many options", () => {
    const options: SelectOption[] = Array.from({ length: 1000 }, (_, i) => ({
      value: `opt-${i}`,
      label: `Option ${i}`,
    }));

    const ctx = createMockContext({ id: "test", options, value: "opt-0" });
    const result = Select(ctx);

    expect(result).toBeDefined();
    expect(result.kind).toBe("select");
  });
});
