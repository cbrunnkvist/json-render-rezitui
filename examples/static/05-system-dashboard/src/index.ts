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
  const cpuPercent = Math.round(Math.random() * 100); // Simulated
  const memPercent = Math.round((usedMem / totalMem) * 100);

  return {
    cpu: cpuPercent,
    memory: {
      total: Math.round(totalMem / 1024 / 1024 / 1024), // GB
      used: Math.round(usedMem / 1024 / 1024 / 1024),
      percent: memPercent
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

function makeBar(percent: number, width = 20): string {
  const filled = Math.round((percent / 100) * width);
  return "[" + "#".repeat(filled) + "-".repeat(width - filled) + "]";
}

function cpuColor(cpu: number): string {
  if (cpu > 80) return "red";
  if (cpu > 50) return "yellow";
  return "green";
}

function memColor(percent: number): string {
  if (percent > 80) return "red";
  if (percent > 60) return "yellow";
  return "green";
}

function createSpec(platform: string, stats: ReturnType<typeof getSystemStats>) {
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
          content: { $template: "Platform: ${/platform} | Uptime: ${/uptime}" },
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
          content: { $template: "${/cpu}%" },
          bold: true,
          color: { $state: "/cpuColor" }
        }
      },
      "cpu-bar": {
        type: "Text",
        props: {
          content: { $state: "/cpuBar" }
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
          content: { $template: "${/memory/used}GB / ${/memory/total}GB" },
          bold: true,
          color: { $state: "/memColor" }
        }
      },
      "mem-bar": {
        type: "Text",
        props: {
          content: { $state: "/memBar" }
        }
      },
      "processes-header": {
        type: "Box",
        props: {
          padding: 1
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
          padding: 1
        },
        children: ["refresh-info"]
      },
      "refresh-info": {
        type: "Text",
        props: {
          content: "⏱️  Refreshing every 1000ms | Press Ctrl+C to exit",
          color: "dim",
          align: "center"
        }
      }
    },
    state: {
      platform,
      cpu: stats.cpu,
      memory: stats.memory,
      uptime: formatUptime(stats.uptime),
      processes: stats.processes,
      cpuColor: cpuColor(stats.cpu),
      cpuBar: makeBar(stats.cpu),
      memColor: memColor(stats.memory.percent),
      memBar: makeBar(stats.memory.percent),
      refreshRate: 1000
    }
  };
}

async function main() {
  const platform = os.platform();
  const initialStats = getSystemStats();

  const app = createReziApp({
    spec: createSpec(platform, initialStats),
    initialState: {
      platform,
      cpu: initialStats.cpu,
      memory: initialStats.memory,
      uptime: formatUptime(initialStats.uptime),
      processes: initialStats.processes,
      cpuColor: cpuColor(initialStats.cpu),
      cpuBar: makeBar(initialStats.cpu),
      memColor: memColor(initialStats.memory.percent),
      memBar: makeBar(initialStats.memory.percent),
      refreshRate: 1000
    },
    debug: false
  });

  // Update stats every second
  const interval = setInterval(() => {
    const stats = getSystemStats();
    app.renderer.setState("/cpu", stats.cpu);
    app.renderer.setState("/memory", stats.memory);
    app.renderer.setState("/uptime", formatUptime(stats.uptime));
    app.renderer.setState("/processes", stats.processes);
    // Pre-compute derived display values
    app.renderer.setState("/cpuColor", cpuColor(stats.cpu));
    app.renderer.setState("/cpuBar", makeBar(stats.cpu));
    app.renderer.setState("/memColor", memColor(stats.memory.percent));
    app.renderer.setState("/memBar", makeBar(stats.memory.percent));
  }, 1000);

  await app.run();

  // Clean up interval after app stops so the process can exit
  clearInterval(interval);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
