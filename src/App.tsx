import Canvas from "@/graph/Canvas";
import Palette from "@/ui/Palette";
import Inspector from "@/ui/Inspector";

export default function App() {
  return (
    <main className="h-full w-full flex">
      <Palette />
      <Canvas />
      <Inspector />
    </main>
  );
}
