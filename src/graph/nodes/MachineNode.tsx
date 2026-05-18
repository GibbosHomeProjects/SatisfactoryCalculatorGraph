import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useGraphStore } from "../store";
import { useComputed } from "../useComputed";
import { gameData } from "@/data";
import { NodeCard } from "./NodeCard";

export default function MachineNode({ id }: NodeProps) {
  const node = useGraphStore((s) => s.graph.nodes[id]);
  const computed = useComputed().nodes[id];
  if (!node || node.kind !== "machine") return null;
  const recipe = gameData.recipes[node.recipeId];
  const building = recipe ? gameData.buildings[recipe.buildingId] : undefined;
  const machineCount = computed?.machineCount ?? 0;
  const firstOutput = recipe?.outputs[0];
  const rateValue =
    firstOutput && computed?.outputsPerMin[firstOutput.itemId] !== undefined
      ? `${computed.outputsPerMin[firstOutput.itemId]!.toFixed(1)} /min`
      : "—";

  return (
    <NodeCard
      nodeId={id}
      accent="green"
      type={building?.displayName ?? "Machine"}
      name={`${recipe?.displayName ?? "(no recipe)"}${recipe?.isAlternate ? " · ALT" : ""}`}
      meta={
        <>
          {machineCount.toFixed(2)} × (ceil {Math.ceil(machineCount)}) · {node.clockPct}% clock ·
          Sloops {node.sloopsUsed}/{building?.somersloopSlots ?? 0}
          <br />
          {(computed?.totalPowerMW ?? 0).toFixed(1)} MW
        </>
      }
      rate={rateValue}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </NodeCard>
  );
}
