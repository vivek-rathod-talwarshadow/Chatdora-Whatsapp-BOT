import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const nextBuildDir = join(projectRoot, ".next");
const port = "3000";

function run(command, args) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
}

function killExistingProjectProcesses() {
  if (process.platform === "win32") {
    const script = `
$root = ${JSON.stringify(projectRoot.replace(/\\/g, "\\\\"))}
$currentPid = ${process.pid}
$procs = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'node.exe' -and
  $_.ProcessId -ne $currentPid -and
  $_.CommandLine -like "*$root*"
}
foreach ($proc in $procs) {
  try { Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop } catch {}
}
`;

    run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]);

    const portScript = `
$listeners = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue
foreach ($listener in $listeners) {
  try { Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop } catch {}
}
`;

    run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", portScript]);
    return;
  }

  const ps = run("bash", [
    "-lc",
    `ps -ax -o pid=,command= | grep ${JSON.stringify(projectRoot)} | grep node | grep -v grep`
  ]);

  const output = `${ps.stdout || ""}`.trim();
  if (!output) return;

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    const spaceIndex = trimmed.indexOf(" ");
    if (spaceIndex === -1) continue;
    const pid = Number(trimmed.slice(0, spaceIndex));
    if (!Number.isFinite(pid) || pid === process.pid) continue;
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  }
}

function cleanNextArtifacts() {
  if (existsSync(nextBuildDir)) {
    rmSync(nextBuildDir, { recursive: true, force: true });
  }
}

function runOrExit(args, label) {
  process.stdout.write(`[chatdora] ${label}\n`);
  const result = spawnSync(process.execPath, [nextBin, ...args], {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
    windowsHide: false
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

killExistingProjectProcesses();
cleanNextArtifacts();
runOrExit(["build"], "Building app for a stable local run...");

process.stdout.write("[chatdora] Starting production server on http://localhost:3000\n");

const child = spawn(process.execPath, [nextBin, "start", "-p", port], {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
