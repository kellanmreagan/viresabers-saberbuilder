import { Component, Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import PlaceholderPart, { partHeight } from "./PlaceholderPart.jsx";
import { partFit } from "../lib/realModels.js";
import { classifyAccessory } from "../lib/catalog.js";

function stackHilt(parts, extras, explode, includePommel) {
  const items = [];
  const gap = explode * 0.55;
  const vhc = includePommel ? extras.filter((e) => e.slot === "vhc") : [];
  const sequence = includePommel
    ? [
        { slot: "pommel", part: parts.pommel },
        { slot: "grip", part: parts.grip },
        { slot: "switch", part: parts.switch },
        ...vhc.map((e) => ({ slot: "vhc", part: e.part, uid: e.uid })),
        { slot: "emitter", part: parts.emitter },
      ]
    : [
        { slot: "grip", part: parts.grip },
        { slot: "switch", part: parts.switch },
        { slot: "emitter", part: parts.emitter },
      ];

  let plane = 0;
  sequence.forEach((entry) => {
    const slot = entry.slot === "vhc" ? "vhc" : entry.slot;
    const fit = partFit(entry.part, slot);
    const y = plane - fit.threadBottom;
    items.push({ ...entry, y, h: fit.height, fit });
    plane += fit.stackHeight + gap;
  });
  return { items, len: Math.max(plane, 0.01) };
}

function centerStack(items) {
  if (!items.length) return items;
  let bottom = Infinity;
  let top = -Infinity;
  items.forEach((it) => {
    bottom = Math.min(bottom, it.y);
    top = Math.max(top, it.y + it.h);
  });
  const mid = (bottom + top) / 2;
  return items.map((it) => ({ ...it, y: it.y - mid }));
}

function KeepOrbitCentered() {
  const controls = useThree((s) => s.controls);
  useFrame(() => {
    if (!controls?.target) return;
    if (controls.target.x !== 0 || controls.target.y !== 0 || controls.target.z !== 0) {
      controls.target.set(0, 0, 0);
    }
  });
  return null;
}

function decorateAccessories(hilt, extras) {
  const accessories = extras.filter((e) => e.slot === "accessory");
  accessories.forEach((e) => {
    const kind = classifyAccessory(e.part.title);
    const emitterItem = hilt.find((it) => it.slot === "emitter");
    let ay = emitterItem ? emitterItem.y : 0;
    if (kind === "clip") ay = hilt.find((it) => it.slot === "grip")?.y || 0.4;
    if (kind === "choke" || kind === "coupler" || kind === "chamber") {
      ay = (hilt.find((it) => it.slot === "switch")?.y || 0) + 0.2;
    }
    hilt.push({ slot: "accessory", part: e.part, uid: e.uid, y: ay, h: 0.1, overlay: true });
  });
}

function HiltStack({ hilt, electronics, bladeColor, activeSlot, onSelectSlot, side }) {
  const group = useRef();
  return (
    <group ref={group}>
      {hilt.map((it, i) => (
        <group key={`${side}-${it.slot}-${it.uid || it.part?.id || "ghost"}-${i}`} position={[0, it.y, 0]}>
          <PlaceholderPart
            part={it.part}
            slot={it.slot}
            ghost={!it.part}
            selected={activeSlot === it.slot}
            bladeColor={bladeColor}
            ignited={false}
            onSelect={(slot) => onSelectSlot?.(slot, side)}
          />
        </group>
      ))}
      {electronics && (
        <mesh
          position={[0, (hilt.find((it) => it.slot === "grip")?.y ?? 0) + 0.4, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectSlot?.("electronics", side);
          }}
        >
          <cylinderGeometry args={[0.07, 0.07, 0.9, 16]} />
          <meshStandardMaterial
            color="#111"
            emissive={bladeColor}
            emissiveIntensity={0.7}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      )}
    </group>
  );
}

class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

function switchTop(hilt) {
  const sw = hilt.find((it) => it.slot === "switch");
  if (sw) return sw.y + sw.h - (sw.fit?.threadTop || 0);
  const em = hilt.find((it) => it.slot === "emitter");
  return em ? em.y : 0;
}

function emitterMouth(hilt) {
  const em = hilt.find((it) => it.slot === "emitter");
  if (em) return em.y + em.h;
  return switchTop(hilt);
}

function Blade({ part, baseY, mouthY, rotation, ignited, bladeColor, selected, onSelect }) {
  if (!part || !ignited) return null;
  const through = Math.max(0, mouthY - baseY);
  const catalog = partHeight(part, "blade");
  const h = catalog + through;
  if (h <= 0) return null;
  const y = baseY;
  return (
    <group position={[0, y, 0]} rotation={rotation || [0, 0, 0]}>
      <PlaceholderPart
        part={part}
        slot="blade"
        ghost={false}
        selected={selected}
        bladeColor={bladeColor}
        ignited={ignited}
        bladeLength={h}
        onSelect={onSelect}
      />
    </group>
  );
}

export default function SaberCanvas({
  build,
  explode,
  ignited,
  bladeColor,
  activeSlot,
  onSelectSlot,
  doubleBladed,
  second,
  activeSaber,
}) {
  const layout = useMemo(() => {
    const extras = build.extras || [];
    if (!doubleBladed) {
      const stacked = stackHilt(build, extras, explode, true);
      const hilt = centerStack(stacked.items);
      decorateAccessories(hilt, extras);
      return {
        mode: "single",
        hiltA: hilt,
        bladeBaseY: switchTop(hilt),
        bladeMouthY: emitterMouth(hilt),
      };
    }

    const pommelH = partFit(build.pommel, "pommel").stackHeight;
    const a = stackHilt(
      { ...build, pommel: null },
      extras,
      explode,
      false
    );
    const b = stackHilt(second || {}, [], explode, false);
    decorateAccessories(a.items, extras);

    return {
      mode: "staff",
      pommelH,
      hiltA: a.items,
      hiltB: b.items,
      aLen: a.len,
      bLen: b.len,
    };
  }, [build, second, explode, doubleBladed]);

  const staff = layout.mode === "staff";
  const halfPommel = staff ? layout.pommelH / 2 : 0;

  return (
    <Canvas className="saber-canvas" gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
      <color attach="background" args={["#050505"]} />
      <PerspectiveCamera makeDefault position={[5.5, 0.2, 10]} fov={34} near={0.1} far={400} />
      <ambientLight intensity={0.4} />
      <spotLight position={[8, 14, 10]} angle={0.5} penumbra={0.6} intensity={2.4} color="#f2f5ff" />
      <pointLight position={[-3, 1, -2]} intensity={0.8} color="#108474" />
      <pointLight position={[2, -2, 2]} intensity={0.45} color="#40ff83" />
      {ignited && (build.blade || second?.blade) && (
        <pointLight position={[0, 0, 0]} intensity={2.2} color={bladeColor} distance={50} />
      )}
      <Suspense fallback={null}>
        <Environment preset="warehouse" />
      </Suspense>
      <CanvasErrorBoundary>
      <Suspense fallback={null}>
          {staff ? (
            <group>
              <group position={[0, -halfPommel, 0]}>
                <PlaceholderPart
                  part={build.pommel}
                  slot="pommel"
                  ghost={!build.pommel}
                  selected={activeSlot === "pommel"}
                  onSelect={(slot) => onSelectSlot?.(slot, "a")}
                />
              </group>
              <group position={[0, halfPommel, 0]}>
                <HiltStack
                  hilt={layout.hiltA}
                  electronics={build.electronics}
                  bladeColor={bladeColor}
                  activeSlot={activeSaber === "a" ? activeSlot : null}
                  onSelectSlot={onSelectSlot}
                  side="a"
                />
              </group>
              <group position={[0, -halfPommel, 0]} rotation={[Math.PI, 0, 0]}>
                <HiltStack
                  hilt={layout.hiltB}
                  electronics={second?.electronics}
                  bladeColor={bladeColor}
                  activeSlot={activeSaber === "b" ? activeSlot : null}
                  onSelectSlot={onSelectSlot}
                  side="b"
                />
              </group>
            </group>
          ) : (
            <HiltStack
              hilt={layout.hiltA}
              electronics={build.electronics}
              bladeColor={bladeColor}
              activeSlot={activeSlot}
              onSelectSlot={onSelectSlot}
              side="a"
            />
          )}
        {staff ? (
          <>
            <group position={[0, halfPommel, 0]}>
              <Blade
                part={build.blade}
                baseY={switchTop(layout.hiltA)}
                mouthY={emitterMouth(layout.hiltA)}
                ignited={ignited}
                bladeColor={bladeColor}
                selected={activeSlot === "blade" && activeSaber === "a"}
                onSelect={(slot) => onSelectSlot?.(slot, "a")}
              />
            </group>
            <group position={[0, -halfPommel, 0]} rotation={[Math.PI, 0, 0]}>
              <Blade
                part={second?.blade}
                baseY={switchTop(layout.hiltB)}
                mouthY={emitterMouth(layout.hiltB)}
                ignited={ignited}
                bladeColor={bladeColor}
                selected={activeSlot === "blade" && activeSaber === "b"}
                onSelect={(slot) => onSelectSlot?.(slot, "b")}
              />
            </group>
          </>
        ) : (
          <Blade
            part={build.blade}
            baseY={layout.bladeBaseY}
            mouthY={layout.bladeMouthY}
            ignited={ignited}
            bladeColor={bladeColor}
            selected={activeSlot === "blade"}
            onSelect={(slot) => onSelectSlot?.(slot, "a")}
          />
        )}
      </Suspense>
      </CanvasErrorBoundary>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={1.2}
        maxDistance={140}
        enablePan={false}
        target={[0, 0, 0]}
      />
      <KeepOrbitCentered />
      <EffectComposer>
        <Bloom
          intensity={ignited && (build.blade || second?.blade) ? 1.15 : 0.25}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
