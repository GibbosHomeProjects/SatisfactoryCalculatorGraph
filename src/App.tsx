import Canvas from "@/graph/Canvas";
import Palette from "@/ui/Palette";

export default function App() {
  return (
    <main className="h-full w-full flex">
      <Palette />
      <Canvas />
    </main>
  );
}
