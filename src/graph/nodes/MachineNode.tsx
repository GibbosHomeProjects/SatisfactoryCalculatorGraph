import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import { sampleGameData } from "@/data/sample";

export default function MachineNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  const computed = useComputed().nodes[id];
  if (!node || node.kind !== "machine") return null;
  const recipe = sampleGameData.recipes[node.recipeId];
  const building = recipe ? sampleGameData.buildings[recipe.buildingId] : undefined;
  const machineCount = computed?.machineCount ?? 0;

  return (
    <div className="rounded-lg border border-emerald-400/40 bg-neutral-900/90 p-3 text-sm min-w-[200px]">
      <Handle type="target" position={Position.Left} />
      <div className="text-emerald-300 font-semibold">{building?.displayName ?? "Machine"}</div>
      <div className="text-xs opacity-80">
        {recipe?.displayName ?? "(no recipe)"}
        {recipe?.isAlternate ? " · ALT" : ""}
      </div>
      <div className="text-xs opacity-80">
        Clock {node.clockPct}% · Sloops {node.sloopsUsed}/{building?.somersloopSlots ?? 0}
      </div>
      <div className="text-xs mt-1">
        Machines: {machineCount.toFixed(2)} (ceil {Math.ceil(machineCount)})
      </div>
      <div className="text-xs">Power: {(computed?.totalPowerMW ?? 0).toFixed(1)} MW</div>
      {Object.entries(computed?.outputsPerMin ?? {}).map(([k, v]) => (
        <div key={k} className="text-xs">
          {sampleGameData.items[k]?.displayName ?? k}: {v.toFixed(1)}/min
        </div>
      ))}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
