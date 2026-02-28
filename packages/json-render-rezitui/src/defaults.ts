import type { ReziComponents } from "./types.js";
import { Box, Row, Column } from "./components/layout.js";
import {
  Text,
  Button,
  Input,
  Select,
  Checkbox,
  Slider,
} from "./components/interactive.js";
import { Page, Panel, Table, VirtualList, Logs } from "./components/advanced.js";
import {
  Modal,
  Dialog,
  Dropdown,
  CommandPalette,
} from "./components/overlays.js";
import {
  CodeEditor,
  DiffViewer,
  Canvas,
  LineChart,
  BarChart,
  Gauge,
  Spinner,
} from "./components/visualization.js";

/**
 * Default component registry with all built-in components.
 * Includes layout, interactive, advanced, overlay, and visualization components.
 */
export const defaultComponents: ReziComponents = {
  // Layout
  Box,
  Row,
  Column,
  HStack: Row, // Alias
  VStack: Column, // Alias

  // Interactive
  Text,
  Button,
  Input,
  Select,
  Checkbox,
  Slider,

  // Advanced
  Page,
  Panel,
  Table,
  VirtualList,
  Logs,

  // Overlays
  Modal,
  Dialog,
  Dropdown,
  CommandPalette,

  // Visualization
  CodeEditor,
  DiffViewer,
  Canvas,
  LineChart,
  BarChart,
  Gauge,
  Spinner,
};
