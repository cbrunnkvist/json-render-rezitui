/**
 * System Dashboard Example
 * 
 * Real-time system monitoring dashboard showing CPU, memory, 
 * and process information with live updates.
 */

import { createReziApp } from "@cbrunnkvist/json-render-rezitui";
import { execSync } from "child_process";
import os from "os";

// Get system info
function getSystemStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    cpu: Math.round(Math.random() * 100), // Simulated - use actual CPU stats in production
    memory: {
      total: Math.round(totalMem / 1024 / 1024 / 1024), // GB
      used: Math.round(usedMem / 1024 / 1024 / 1024),
      percent: Math.round((usedMem / totalMem) * 100)
    },
    uptime: os.uptime(),
    processes: getProcessList()
  };
}

function getProcessList() {
  try {
    const output = execSync("ps aux | head -20", { encoding: "utf-8" });
    return output
      .split("\n")
      .slice(1, 11)
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        return {
          pid: parts[1] || "-",
          cpu: parts[2] || "0",
          mem: parts[3] || "0",
          command: parts.slice(10).join(" ").substring(0, 30) || "-"
        };
      });
  } catch {
    return [
      { pid: "1234", cpu: "5.2", mem: "2.1", command: "node" },
      { pid: "5678", cpu: "3.1", mem: "1.5", command: "chrome" }
    ];
  }
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function createSpec(stats: ReturnType<typeof getSystemStats>) {
  return {
    root: "main",
    elements: {
      main: {
        type: "Column",
        props: {},
        children: ["header", "metrics", "processes-header", "processes-table", "footer"]
      },
      header: {
        type: "Box",
        props: {
          padding: 1,
          border: "double"
        },
        children: ["title", "subtitle"]
      },
      title: {
        type: "Text",
        props: {
          content: "🖥️  System Dashboard",
          bold: true,
          color: "cyan",
          align: "center"
        }
      },
      subtitle: {
        type: "Text",
        props: {
          content: { $template: "Platform: ${platform} | Uptime: ${uptime}" },
          color: "gray",
          align: "center"
        }
      },
      metrics: {
        type: "Row",
        props: {
          gap: 2,
          padding: 1
        },
        children: ["cpu-metric", "mem-metric"]
      },
      "cpu-metric": {
        type: "Box",
        props: {
          padding: 1,
          border: "single",
          minWidth: 20
        },
        children: ["cpu-label", "cpu-value", "cpu-bar"]
      },
      "cpu-label": {
        type: "Text",
        props: {
          content: "CPU Usage",
          color: "gray"
        }
      },
      "cpu-value": {
        type: "Text",
        props: {
          content: { $template: "${cpu}%" },
          bold: true,
          color: { $cond: { $state: "/cpu", gt: 80, then: "red", else: { $cond: { $state: "/cpu", gt: 50, then: "yellow", else: "green" } } } }
        }
      },
      "cpu-bar": {
        type: "Text",
        props: {
          content: { $template: "[${'#'.repeat(Math.round(cpu/5))}${'-'.repeat(20-Math.round(cpu/5))}]" }
        }
      },
      "mem-metric": {
        type: "Box",
        props: {
          padding: 1,
          border: "single",
          minWidth: 20
        },
        children: ["mem-label", "mem-value", "mem-bar"]
      },
      "mem-label": {
        type: "Text",
        props: {
          content: "Memory",
          color: "gray"
        }
      },
      "mem-value": {
        type: "Text",
        props: {
          content: { $template: "${memory.used}GB / ${memory.total}GB" },
          bold: true,
          color: { $cond: { $state: "/memory/percent", gt: 80, then: "red", else: { $cond: { $state: "/memory/percent", gt: 60, then: "yellow", else: "green" } } } }
        }
      },
      "mem-bar": {
        type: "Text",
        props: {
          content: { $template: "[${'#'.repeat(Math.round(memory.percent/5))}${'-'.repeat(20-Math.round(memory.percent/5))}]" }
        }
      },
      "processes-header": {
        type: "Box",
        props: {
          padding: 1,
          border: "bottom"
        },
        children: ["processes-title"]
      },
      "processes-title": {
        type: "Text",
        props: {
          content: "🔝 Top Processes",
          bold: true
        }
      },
      "processes-table": {
        type: "Table",
        props: {
          id: "processes-table",
          columns: [
            { key: "pid", header: "PID", width: 8 },
            { key: "cpu", header: "CPU%", width: 8 },
            { key: "mem", header: "MEM%", width: 8 },
            { key: "command", header: "Command", width: 30 }
          ],
          rows: { $state: "/processes" }
        }
      },
      footer: {
        type: "Box",
        props: {
          padding: 1,
          border: "top"
        },
        children: ["refresh-info"]
      },
      "refresh-info": {
        type: "Text",
        props: {
          content: { $template: "⏱️  Refreshing every ${refreshRate}ms | Press Ctrl+C to exit" },
          color: "dim",
          align: "center"
        }
      }
    }
  };
}

async function main() {
  console.log("Starting System Dashboard...\n");
  console.log("Press Ctrl+C to exit\n");

  const initialStats = getSystemStats();
  
  const app = createReziApp({
    spec: createSpec(initialStats),
    initialState: {
      platform: os.platform(),
      ...initialStats
    }
  });

  // Update stats every second
  const interval = setInterval(() => {
    const stats = getSystemStats();
    app.renderer.setState("/cpu", stats.cpu);
    app.renderer.setState("/memory", stats.memory);
    app.renderer.setState("/uptime", formatUptime(stats.uptime));
    app.renderer.setState("/processes", stats.processes);
  }, 1000);

  // Cleanup on exit
  process.on("SIGINT", () => {
    clearInterval(interval);
    process.exit(0);
  });

  await app.run();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
