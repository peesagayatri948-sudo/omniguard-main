import { useState } from 'react';
import { Package, Search, Info, AlertTriangle, ShieldCheck, Download, Share2 } from 'lucide-react';

interface DependencyNode {
  name: string;
  version: string;
  license: string;
  cves: string[];
  x: number;
  y: number;
  parent?: string;
  children?: DependencyNode[];
}

const DEPS_DATA: DependencyNode[] = [
  { name: "omniguard-root", version: "1.0.0", license: "Apache-2.0", cves: [], x: 300, y: 50 },
  // Level 1
  { name: "lodash", version: "4.17.20", license: "MIT", cves: ["CVE-2020-8203 (High)"], x: 100, y: 180, parent: "omniguard-root" },
  { name: "axios", version: "1.5.0", license: "MIT", cves: ["CVE-2023-45857 (High)"], x: 300, y: 180, parent: "omniguard-root" },
  { name: "express", version: "4.18.2", license: "MIT", cves: [], x: 500, y: 180, parent: "omniguard-root" },
  // Level 2 (children of lodash)
  { name: "object-assign", version: "4.1.1", license: "MIT", cves: [], x: 50, y: 310, parent: "lodash" },
  // Level 2 (children of axios)
  { name: "follow-redirects", version: "1.15.2", license: "MIT", cves: [], x: 220, y: 310, parent: "axios" },
  { name: "form-data", version: "4.0.0", license: "MIT", cves: [], x: 380, y: 310, parent: "axios" },
  // Level 2 (children of express)
  { name: "body-parser", version: "1.20.1", license: "MIT", cves: [], x: 480, y: 310, parent: "express" },
  { name: "send", version: "0.18.0", license: "MIT", cves: [], x: 600, y: 310, parent: "express" }
];

export function SBOMInventory() {
  const [selectedNode, setSelectedNode] = useState<DependencyNode>(DEPS_DATA[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = DEPS_DATA.filter(node => 
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConnections = () => {
    const lines: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];
    DEPS_DATA.forEach(node => {
      if (node.parent) {
        const parentNode = DEPS_DATA.find(p => p.name === node.parent);
        if (parentNode) {
          lines.push({
            x1: parentNode.x,
            y1: parentNode.y,
            x2: node.x,
            y2: node.y,
            id: `${parentNode.name}-${node.name}`
          });
        }
      }
    });
    return lines;
  };

  const isMatched = (node: DependencyNode) => {
    if (!searchQuery) return false;
    return node.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">SBOM Inventory</h1>
        <p className="text-slate-600 mt-1">
          Interactive software bill of materials dependency mapping and software supply-chain risk analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Dependency Graph Panel */}
        <div className="card p-6 lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search dependencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Export CycloneDX
              </button>
              <button className="btn btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs">
                <Share2 className="w-3.5 h-3.5" /> Share Report
              </button>
            </div>
          </div>

          {/* Interactive SVG Graph Area */}
          <div className="relative border border-slate-100 rounded-xl bg-slate-50/50 p-4 h-[420px] overflow-hidden flex items-center justify-center">
            <svg className="w-full h-full min-w-[650px] min-h-[400px]">
              {/* Connection Lines */}
              {getConnections().map(line => (
                <line
                  key={line.id}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              ))}

              {/* Node Circles */}
              {DEPS_DATA.map(node => {
                const active = selectedNode.name === node.name;
                const match = isMatched(node);
                const hasVulnerabilities = node.cves.length > 0;
                
                let circleColor = "fill-emerald-500 stroke-emerald-600";
                if (node.name === "omniguard-root") {
                  circleColor = "fill-blue-500 stroke-blue-600";
                } else if (hasVulnerabilities) {
                  circleColor = "fill-red-500 stroke-red-600";
                }

                return (
                  <g
                    key={node.name}
                    className="cursor-pointer group"
                    onClick={() => setSelectedNode(node)}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={active ? 20 : match ? 18 : 15}
                      className={`${circleColor} transition-all duration-300 ${
                        active ? 'stroke-[4px]' : 'stroke-2 hover:stroke-[3px]'
                      }`}
                    />
                    <text
                      x={node.x}
                      y={node.y + 35}
                      textAnchor="middle"
                      className={`text-[11px] select-none font-semibold ${
                        active ? 'fill-blue-600 font-bold text-xs' : 'fill-slate-700'
                      }`}
                    >
                      {node.name}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 47}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 select-none"
                    >
                      v{node.version}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-100 rounded-lg p-2.5 text-[10px] space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600">Application Root</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Secure Dependency</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-slate-600">Vulnerable (Action Needed)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Node Details Panel */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Package className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-900">Dependency Profile</h2>
          </div>

          {selectedNode ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">Package Name</p>
                <p className="text-lg font-bold text-slate-800">{selectedNode.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Active Version</p>
                  <p className="text-sm font-semibold font-mono text-slate-700">{selectedNode.version}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">License Type</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 rounded">
                    {selectedNode.license}
                  </span>
                </div>
              </div>

              {selectedNode.parent && (
                <div>
                  <p className="text-xs text-slate-500 font-medium">Parent Module</p>
                  <p className="text-sm font-semibold text-slate-700">`{selectedNode.parent}`</p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 font-medium mb-1.5">Security Status</p>
                {selectedNode.cves.length > 0 ? (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 text-red-800 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Vulnerability Detected
                    </div>
                    <ul className="text-xs text-red-700 space-y-1 font-mono">
                      {selectedNode.cves.map(cve => (
                        <li key={cve}>• {cve}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-red-600 pt-1">
                      Upgrade to latest secure version using <code>omniguard explain</code>.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Clean & Audited (No CVEs)
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => alert(`Running remediation patch generation for ${selectedNode.name}`)}
                  disabled={selectedNode.cves.length === 0}
                  className={`w-full py-2 text-center rounded-lg text-xs font-semibold transition-all ${
                    selectedNode.cves.length > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Generate Remediation Patch
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Info className="w-8 h-8 mb-2" />
              <p className="text-sm">Click a package node to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
