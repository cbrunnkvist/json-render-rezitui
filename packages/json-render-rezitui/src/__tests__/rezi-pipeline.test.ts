/**
 * End-to-end Rezi pipeline integration tests.
 *
 * These tests validate that JSON specs rendered through our ReziRenderer
 * produce VNode trees that Rezi's layout engine and renderer accept and
 * process correctly. This catches issues that unit tests on VNode structure
 * alone cannot detect (wrong kinds, invalid props, layout crashes, missing
 * visible text, etc.).
 *
 * Uses `createTestRenderer()` from @rezi-ui/core/testing which runs the
 * full commit → layout → renderToDrawlist pipeline in-memory.
 */
import { describe, it, expect } from "vitest";
import { createRenderer, ReziRenderer } from "../renderer.js";
import { defaultComponents } from "../integration.js";
import { createActionHandlers } from "../actions.js";
import type { Spec } from "@json-render/core";
import type { VNode } from "@rezi-ui/core";
import { createTestRenderer, type TestRenderResult } from "@rezi-ui/core/testing";

// =============================================================================
// Test Helpers
// =============================================================================

const VIEWPORT = { cols: 80, rows: 24 };

/**
 * Render a JSON spec through the full pipeline:
 *   JSON Spec → ReziRenderer → VNode → Rezi layout → Rezi drawlist
 *
 * Returns the Rezi TestRenderResult with toText(), findText(), findById(), etc.
 */
function renderSpec(
    spec: Spec,
    opts: { initialState?: Record<string, unknown> } = {},
): { result: TestRenderResult; vnode: VNode; renderer: ReziRenderer } {
    const renderer = createRenderer({
        components: defaultComponents,
        actionHandlers: createActionHandlers(),
        ...(opts.initialState ? { initialState: opts.initialState } : {}),
    });
    renderer.setSpec(spec);
    const vnode = renderer.render() as VNode;

    const testRenderer = createTestRenderer({ viewport: VIEWPORT });
    const result = testRenderer.render(vnode);

    return { result, vnode, renderer };
}

/**
 * Render a spec and return the screen text. Disposes the renderer.
 */
function renderToScreen(spec: Spec, opts?: { initialState?: Record<string, unknown> }): string {
    const { result, renderer } = renderSpec(spec, opts);
    renderer.dispose();
    return result.toText();
}


// =============================================================================
// 1. Layout Components — Box, Row, Column
// =============================================================================

describe("Rezi Pipeline: Layout Components", () => {
    it("Column renders children vertically with visible text", () => {
        const screen = renderToScreen({
            root: "col",
            elements: {
                col: { type: "Column", props: { gap: 0 }, children: ["a", "b"] },
                a: { type: "Text", props: { content: "Alpha" } },
                b: { type: "Text", props: { content: "Beta" } },
            },
        });
        expect(screen).toContain("Alpha");
        expect(screen).toContain("Beta");
        // Alpha should be above Beta (its line index < Beta's line index)
        const lines = screen.split("\n");
        const alphaLine = lines.findIndex((l) => l.includes("Alpha"));
        const betaLine = lines.findIndex((l) => l.includes("Beta"));
        expect(alphaLine).toBeLessThan(betaLine);
    });

    it("Row renders children horizontally on the same line", () => {
        const screen = renderToScreen({
            root: "row",
            elements: {
                row: { type: "Row", props: { gap: 1 }, children: ["a", "b"] },
                a: { type: "Text", props: { content: "Left" } },
                b: { type: "Text", props: { content: "Right" } },
            },
        });
        expect(screen).toContain("Left");
        expect(screen).toContain("Right");
        // Both should be on the same line
        const lines = screen.split("\n");
        const bothOnOneLine = lines.some((l) => l.includes("Left") && l.includes("Right"));
        expect(bothOnOneLine).toBe(true);
    });

    it("Box wraps content and passes through VNode correctly", () => {
        const screen = renderToScreen({
            root: "box",
            elements: {
                box: { type: "Box", props: { border: "single", p: 1 }, children: ["inner"] },
                inner: { type: "Text", props: { content: "Boxed" } },
            },
        });
        expect(screen).toContain("Boxed");
        // Box with border should have border characters
        expect(screen).toContain("┌");
        expect(screen).toContain("┘");
    });

    it("Box with title renders the title text", () => {
        const screen = renderToScreen({
            root: "box",
            elements: {
                box: { type: "Box", props: { border: "single", title: "Info", width: 30 }, children: ["t"] },
                t: { type: "Text", props: { content: "Content" } },
            },
        });
        expect(screen).toContain("Info");
        expect(screen).toContain("Content");
    });

    it("Nested Column > Row > Text renders all content", () => {
        const screen = renderToScreen({
            root: "col",
            elements: {
                col: { type: "Column", props: { gap: 0 }, children: ["header", "body"] },
                header: { type: "Text", props: { content: "Header" } },
                body: { type: "Row", props: { gap: 2 }, children: ["c1", "c2"] },
                c1: { type: "Text", props: { content: "Cell1" } },
                c2: { type: "Text", props: { content: "Cell2" } },
            },
        });
        expect(screen).toContain("Header");
        expect(screen).toContain("Cell1");
        expect(screen).toContain("Cell2");
    });

    it("Column with gap produces spacing between children", () => {
        const { result, renderer } = renderSpec({
            root: "col",
            elements: {
                col: { type: "Column", props: { gap: 2 }, children: ["a", "b"] },
                a: { type: "Text", props: { content: "First" } },
                b: { type: "Text", props: { content: "Second" } },
            },
        });
        renderer.dispose();

        const firstNode = result.findText("First");
        const secondNode = result.findText("Second");
        expect(firstNode).not.toBeNull();
        expect(secondNode).not.toBeNull();
        // With gap: 2, there should be at least 2 rows between them
        expect(secondNode!.rect.y - firstNode!.rect.y).toBeGreaterThanOrEqual(3);
    });
});

// =============================================================================
// 2. Text Component
// =============================================================================

describe("Rezi Pipeline: Text Component", () => {
    it("renders plain text content", () => {
        const screen = renderToScreen({
            root: "t",
            elements: { t: { type: "Text", props: { content: "Hello World" } } },
        });
        expect(screen).toContain("Hello World");
    });

    it("renders empty content without crash", () => {
        const screen = renderToScreen({
            root: "t",
            elements: { t: { type: "Text", props: { content: "" } } },
        });
        expect(screen).toBeDefined();
    });

    it("renders text with style props without crash", () => {
        const screen = renderToScreen({
            root: "t",
            elements: {
                t: { type: "Text", props: { content: "Styled", bold: true, color: "cyan" } },
            },
        });
        expect(screen).toContain("Styled");
    });

    it("splits newlines into separate lines", () => {
        const screen = renderToScreen({
            root: "t",
            elements: {
                t: { type: "Text", props: { content: "Line1\nLine2\nLine3" } },
            },
        });
        expect(screen).toContain("Line1");
        expect(screen).toContain("Line2");
        expect(screen).toContain("Line3");
        // Each line should be on a different row
        const lines = screen.split("\n");
        const line1Row = lines.findIndex((l) => l.includes("Line1"));
        const line2Row = lines.findIndex((l) => l.includes("Line2"));
        const line3Row = lines.findIndex((l) => l.includes("Line3"));
        expect(line1Row).toBeLessThan(line2Row);
        expect(line2Row).toBeLessThan(line3Row);
    });

    it("handles double newlines as paragraph breaks", () => {
        const screen = renderToScreen({
            root: "t",
            elements: {
                t: { type: "Text", props: { content: "Para1\n\nPara2" } },
            },
        });
        expect(screen).toContain("Para1");
        expect(screen).toContain("Para2");
        const lines = screen.split("\n");
        const p1 = lines.findIndex((l) => l.includes("Para1"));
        const p2 = lines.findIndex((l) => l.includes("Para2"));
        // Double newline = blank line in between
        expect(p2 - p1).toBeGreaterThanOrEqual(2);
    });

    it("layout allocates correct height for multiline text", () => {
        const { result, renderer } = renderSpec({
            root: "t",
            elements: {
                t: { type: "Text", props: { content: "A\nB\nC" } },
            },
        });
        renderer.dispose();

        // The text splits into 3 lines via our newline-splitting workaround
        // Each line should appear on a separate row in the rendered output
        const nodeA = result.findText("A");
        const nodeC = result.findText("C");
        expect(nodeA).not.toBeNull();
        expect(nodeC).not.toBeNull();
        expect(nodeC!.rect.y).toBeGreaterThanOrEqual(nodeA!.rect.y + 2);
    });
});

// =============================================================================
// 3. Interactive Components — Button, Input, Select, Checkbox, Slider
// =============================================================================

describe("Rezi Pipeline: Interactive Components", () => {
    it("Button renders with label text visible", () => {
        const { result, renderer } = renderSpec({
            root: "btn",
            elements: {
                btn: { type: "Button", props: { id: "my-btn", label: "Click Me" } },
            },
        });
        renderer.dispose();

        expect(result.toText()).toContain("Click Me");
        const node = result.findById("my-btn");
        expect(node).not.toBeNull();
        expect(node!.kind).toBe("button");
    });

    it("Input renders with placeholder when value is empty", () => {
        const { result, renderer } = renderSpec({
            root: "inp",
            elements: {
                inp: {
                    type: "Input",
                    props: { id: "my-input", value: "", placeholder: "Type here..." },
                },
            },
        });
        renderer.dispose();

        expect(result.toText()).toContain("Type here...");
        const node = result.findById("my-input");
        expect(node).not.toBeNull();
        expect(node!.kind).toBe("input");
    });

    it("Input renders with value text visible", () => {
        const screen = renderToScreen({
            root: "inp",
            elements: {
                inp: {
                    type: "Input",
                    props: { id: "my-input", value: "Hello" },
                },
            },
        });
        expect(screen).toContain("Hello");
    });

    it("Checkbox renders with label", () => {
        const screen = renderToScreen({
            root: "cb",
            elements: {
                cb: { type: "Checkbox", props: { id: "cb1", label: "Accept Terms", checked: false } },
            },
        });
        expect(screen).toContain("Accept Terms");
    });

    it("Select renders without crash", () => {
        const { result, renderer } = renderSpec({
            root: "sel",
            elements: {
                sel: {
                    type: "Select",
                    props: {
                        id: "my-select",
                        options: [
                            { label: "Option A", value: "a" },
                            { label: "Option B", value: "b" },
                        ],
                        value: "a",
                    },
                },
            },
        });
        renderer.dispose();

        // Select renders as a button showing the selected value
        const node = result.findById("my-select");
        expect(node).not.toBeNull();
    });

    it("Slider renders with label and track", () => {
        const screen = renderToScreen({
            root: "sl",
            elements: {
                sl: {
                    type: "Slider",
                    props: {
                        id: "my-slider",
                        label: "Volume",
                        value: 50,
                        min: 0,
                        max: 100,
                    },
                },
            },
        });
        expect(screen).toContain("Volume");
    });

    it("Multiple interactive components in a form layout", () => {
        const screen = renderToScreen({
            root: "form",
            elements: {
                form: { type: "Column", props: { gap: 1 }, children: ["title", "name", "agree", "submit"] },
                title: { type: "Text", props: { content: "Sign Up" } },
                name: { type: "Input", props: { id: "name", value: "", placeholder: "Your name" } },
                agree: { type: "Checkbox", props: { id: "agree", label: "I agree", checked: false } },
                submit: { type: "Button", props: { id: "submit", label: "Submit" } },
            },
        });
        expect(screen).toContain("Sign Up");
        expect(screen).toContain("Your name");
        expect(screen).toContain("I agree");
        expect(screen).toContain("Submit");
    });
});

// =============================================================================
// 4. State-Bound Rendering
// =============================================================================

describe("Rezi Pipeline: State-Bound Rendering", () => {
    it("$state binding resolves into rendered text", () => {
        const screen = renderToScreen(
            {
                root: "t",
                elements: {
                    t: { type: "Text", props: { content: { $state: "/greeting" } } },
                },
                state: { greeting: "Hello from state!" },
            },
        );
        expect(screen).toContain("Hello from state!");
    });

    it("re-render after setState reflects new value", () => {
        const { renderer } = renderSpec({
            root: "t",
            elements: {
                t: { type: "Text", props: { content: { $state: "/message" } } },
            },
            state: { message: "Before" },
        });

        // Update state
        renderer.setState("/message", "After");
        const vnode2 = renderer.render() as VNode;
        const testRenderer2 = createTestRenderer({ viewport: VIEWPORT });
        const result2 = testRenderer2.render(vnode2);

        expect(result2.toText()).toContain("After");
        expect(result2.toText()).not.toContain("Before");
        renderer.dispose();
    });

    it("visibility condition hides element when false", () => {
        const screen = renderToScreen({
            root: "col",
            elements: {
                col: { type: "Column", props: {}, children: ["always", "maybe"] },
                always: { type: "Text", props: { content: "Always Visible" } },
                maybe: {
                    type: "Text",
                    props: { content: "Conditionally Visible" },
                    visible: { $state: "/show", eq: true },
                },
            },
            state: { show: false },
        });
        expect(screen).toContain("Always Visible");
        expect(screen).not.toContain("Conditionally Visible");
    });

    it("visibility condition shows element when true", () => {
        const screen = renderToScreen({
            root: "col",
            elements: {
                col: { type: "Column", props: {}, children: ["always", "maybe"] },
                always: { type: "Text", props: { content: "Always Visible" } },
                maybe: {
                    type: "Text",
                    props: { content: "Conditionally Visible" },
                    visible: { $state: "/show", eq: true },
                },
            },
            state: { show: true },
        });
        expect(screen).toContain("Always Visible");
        expect(screen).toContain("Conditionally Visible");
    });

    it("Button label with $state binding resolves", () => {
        const screen = renderToScreen({
            root: "btn",
            elements: {
                btn: {
                    type: "Button",
                    props: { id: "dynamic-btn", label: { $state: "/buttonLabel" } },
                },
            },
            state: { buttonLabel: "Dynamic Label" },
        });
        expect(screen).toContain("Dynamic Label");
    });
});

// =============================================================================
// 5. Nested Real-World Specs
// =============================================================================

describe("Rezi Pipeline: Real-World Specs", () => {
    it("form spec with inputs and submit button renders correctly", () => {
        const screen = renderToScreen({
            root: "form",
            elements: {
                form: {
                    type: "Column",
                    props: { gap: 1 },
                    children: ["title", "name-input", "email-input", "submit-btn"],
                },
                title: { type: "Text", props: { content: "Registration Form" } },
                "name-input": {
                    type: "Input",
                    props: { id: "name", value: "", placeholder: "Name" },
                },
                "email-input": {
                    type: "Input",
                    props: { id: "email", value: "", placeholder: "Email" },
                },
                "submit-btn": {
                    type: "Button",
                    props: { id: "submit", label: "Register" },
                },
            },
        });
        expect(screen).toContain("Registration Form");
        expect(screen).toContain("Name");
        expect(screen).toContain("Email");
        expect(screen).toContain("Register");
    });

    it("counter spec with increment/decrement buttons", () => {
        const screen = renderToScreen({
            root: "counter",
            elements: {
                counter: {
                    type: "Column",
                    props: { gap: 1 },
                    children: ["display", "controls"],
                },
                display: {
                    type: "Text",
                    props: { content: { $state: "/label" } },
                },
                controls: {
                    type: "Row",
                    props: { gap: 1 },
                    children: ["dec", "inc"],
                },
                dec: { type: "Button", props: { id: "dec", label: "-" } },
                inc: { type: "Button", props: { id: "inc", label: "+" } },
            },
            state: { label: "Count: 0", count: 0 },
        });
        expect(screen).toContain("Count: 0");
        expect(screen).toContain("-");
        expect(screen).toContain("+");
    });

    it("dashboard-style layout with boxes and nested content", () => {
        const screen = renderToScreen({
            root: "dashboard",
            elements: {
                dashboard: {
                    type: "Column",
                    props: { gap: 1 },
                    children: ["header", "panels"],
                },
                header: { type: "Text", props: { content: "Dashboard" } },
                panels: {
                    type: "Row",
                    props: { gap: 2 },
                    children: ["left-panel", "right-panel"],
                },
                "left-panel": {
                    type: "Box",
                    props: { border: "single", title: "Stats" },
                    children: ["stat-text"],
                },
                "stat-text": { type: "Text", props: { content: "CPU: 42%" } },
                "right-panel": {
                    type: "Box",
                    props: { border: "single", title: "Logs" },
                    children: ["log-text"],
                },
                "log-text": { type: "Text", props: { content: "All systems OK" } },
            },
        });
        expect(screen).toContain("Dashboard");
        expect(screen).toContain("Stats");
        expect(screen).toContain("CPU: 42%");
        expect(screen).toContain("Logs");
        expect(screen).toContain("All systems OK");
    });
});

// =============================================================================
// 6. Layout Validation
// =============================================================================

describe("Rezi Pipeline: Layout Validation", () => {
    it("VNode from simple spec passes Rezi layout without error", () => {
        const { result, renderer } = renderSpec({
            root: "t",
            elements: { t: { type: "Text", props: { content: "Test" } } },
        });
        renderer.dispose();
        const textNode = result.findText("Test");
        expect(textNode).not.toBeNull();
        expect(textNode!.rect.w).toBeGreaterThan(0);
        expect(textNode!.rect.h).toBeGreaterThan(0);
    });

    it("Column children are stacked with correct y offsets", () => {
        const { result, renderer } = renderSpec({
            root: "col",
            elements: {
                col: { type: "Column", props: { gap: 0 }, children: ["a", "b", "c"] },
                a: { type: "Text", props: { content: "AAA" } },
                b: { type: "Text", props: { content: "BBB" } },
                c: { type: "Text", props: { content: "CCC" } },
            },
        });
        renderer.dispose();

        const nodeA = result.findText("AAA");
        const nodeB = result.findText("BBB");
        const nodeC = result.findText("CCC");
        expect(nodeA).not.toBeNull();
        expect(nodeB).not.toBeNull();
        expect(nodeC).not.toBeNull();
        // Children stacked vertically: each on a successive row
        expect(nodeA!.rect.y).toBeLessThan(nodeB!.rect.y);
        expect(nodeB!.rect.y).toBeLessThan(nodeC!.rect.y);
    });

    it("Row children share the same y position", () => {
        const { result, renderer } = renderSpec({
            root: "row",
            elements: {
                row: { type: "Row", props: { gap: 0 }, children: ["a", "b"] },
                a: { type: "Text", props: { content: "Left" } },
                b: { type: "Text", props: { content: "Right" } },
            },
        });
        renderer.dispose();

        const nodeLeft = result.findText("Left");
        const nodeRight = result.findText("Right");
        expect(nodeLeft).not.toBeNull();
        expect(nodeRight).not.toBeNull();
        expect(nodeLeft!.rect.y).toBe(nodeRight!.rect.y);
        expect(nodeRight!.rect.x).toBeGreaterThan(nodeLeft!.rect.x);
    });

    it("Box with border has dimensions larger than content", () => {
        const { result, renderer } = renderSpec({
            root: "box",
            elements: {
                box: { type: "Box", props: { border: "single" }, children: ["t"] },
                t: { type: "Text", props: { content: "Hi" } },
            },
        });
        renderer.dispose();

        const textNode = result.findText("Hi");
        const boxNode = result.nodes[0]; // root node = box
        expect(textNode).not.toBeNull();
        expect(boxNode).toBeDefined();
        // Box with border should be wider and taller than the text content
        expect(boxNode!.rect.w).toBeGreaterThan(textNode!.rect.w);
        expect(boxNode!.rect.h).toBeGreaterThan(textNode!.rect.h);
    });

    it("Box with padding offsets content position", () => {
        const { result, renderer } = renderSpec({
            root: "box",
            elements: {
                box: { type: "Box", props: { p: 2 }, children: ["t"] },
                t: { type: "Text", props: { content: "Padded" } },
            },
        });
        renderer.dispose();

        const textNode = result.findText("Padded");
        expect(textNode).not.toBeNull();
        // Content should be offset by padding
        expect(textNode!.rect.x).toBeGreaterThanOrEqual(2);
        expect(textNode!.rect.y).toBeGreaterThanOrEqual(2);
    });
});

// =============================================================================
// 7. Edge Cases and Stress Tests
// =============================================================================

describe("Rezi Pipeline: Edge Cases", () => {
    it("empty Column renders without crash", () => {
        const screen = renderToScreen({
            root: "col",
            elements: {
                col: { type: "Column", props: {}, children: [] },
            },
        });
        expect(screen).toBeDefined();
    });

    it("deeply nested layouts (5 levels) render without crash", () => {
        const screen = renderToScreen({
            root: "l1",
            elements: {
                l1: { type: "Box", props: {}, children: ["l2"] },
                l2: { type: "Column", props: {}, children: ["l3"] },
                l3: { type: "Row", props: {}, children: ["l4"] },
                l4: { type: "Box", props: {}, children: ["l5"] },
                l5: { type: "Text", props: { content: "Deep Content" } },
            },
        });
        expect(screen).toContain("Deep Content");
    });

    it("very long text content does not crash layout", () => {
        const longText = "word ".repeat(200).trim();
        const { result, renderer } = renderSpec({
            root: "t",
            elements: { t: { type: "Text", props: { content: longText } } },
        });
        renderer.dispose();

        // Should not throw and should produce visible text
        expect(result.toText()).toContain("word");
    });

    it("spec with only a root element renders", () => {
        const screen = renderToScreen({
            root: "solo",
            elements: {
                solo: { type: "Text", props: { content: "Just me" } },
            },
        });
        expect(screen).toContain("Just me");
    });

    it("all component types in one spec render without crash", () => {
        const screen = renderToScreen({
            root: "all",
            elements: {
                all: {
                    type: "Column",
                    props: { gap: 0 },
                    children: ["txt", "btn", "inp", "cb", "bx", "rw"],
                },
                txt: { type: "Text", props: { content: "TextComp" } },
                btn: { type: "Button", props: { id: "b1", label: "BtnComp" } },
                inp: { type: "Input", props: { id: "i1", value: "InputComp" } },
                cb: { type: "Checkbox", props: { id: "c1", label: "CheckComp", checked: true } },
                bx: {
                    type: "Box",
                    props: { border: "single" },
                    children: ["bx-inner"],
                },
                "bx-inner": { type: "Text", props: { content: "BoxContent" } },
                rw: {
                    type: "Row",
                    props: { gap: 1 },
                    children: ["r1", "r2"],
                },
                r1: { type: "Text", props: { content: "RowL" } },
                r2: { type: "Text", props: { content: "RowR" } },
            },
        });
        expect(screen).toContain("TextComp");
        expect(screen).toContain("BtnComp");
        expect(screen).toContain("InputComp");
        expect(screen).toContain("CheckComp");
        expect(screen).toContain("BoxContent");
        expect(screen).toContain("RowL");
        expect(screen).toContain("RowR");
    });

    it("re-render produces consistent output", () => {
        const spec: Spec = {
            root: "t",
            elements: { t: { type: "Text", props: { content: "Consistent" } } },
        };
        const screen1 = renderToScreen(spec);
        const screen2 = renderToScreen(spec);
        expect(screen1).toBe(screen2);
    });
});

// =============================================================================
// 8. Draw Operations Validation
// =============================================================================

describe("Rezi Pipeline: Draw Operations", () => {
    it("text content appears in drawText ops", () => {
        const { result, renderer } = renderSpec({
            root: "t",
            elements: { t: { type: "Text", props: { content: "DrawMe" } } },
        });
        renderer.dispose();

        const drawTextOps = result.ops.filter((op) => op.kind === "drawText");
        const hasOurText = drawTextOps.some(
            (op) => op.kind === "drawText" && op.text.includes("DrawMe"),
        );
        expect(hasOurText).toBe(true);
    });

    it("bordered Box produces border draw ops", () => {
        const { result, renderer } = renderSpec({
            root: "box",
            elements: {
                box: { type: "Box", props: { border: "single" }, children: ["t"] },
                t: { type: "Text", props: { content: "Inside" } },
            },
        });
        renderer.dispose();

        // A bordered box should produce drawText ops containing border characters
        const drawTextOps = result.ops.filter((op) => op.kind === "drawText");
        const hasBorderChar = drawTextOps.some(
            (op) => op.kind === "drawText" && (op.text.includes("┌") || op.text.includes("─") || op.text.includes("│")),
        );
        expect(hasBorderChar).toBe(true);
        // Content should also be drawn
        const hasContent = drawTextOps.some(
            (op) => op.kind === "drawText" && op.text.includes("Inside"),
        );
        expect(hasContent).toBe(true);
    });

    it("multiple text nodes produce separate drawText ops", () => {
        const { result, renderer } = renderSpec({
            root: "col",
            elements: {
                col: { type: "Column", props: {}, children: ["a", "b"] },
                a: { type: "Text", props: { content: "First" } },
                b: { type: "Text", props: { content: "Second" } },
            },
        });
        renderer.dispose();

        const drawTextOps = result.ops.filter((op) => op.kind === "drawText");
        const hasFirst = drawTextOps.some((op) => op.kind === "drawText" && op.text.includes("First"));
        const hasSecond = drawTextOps.some(
            (op) => op.kind === "drawText" && op.text.includes("Second"),
        );
        expect(hasFirst).toBe(true);
        expect(hasSecond).toBe(true);
    });
});
