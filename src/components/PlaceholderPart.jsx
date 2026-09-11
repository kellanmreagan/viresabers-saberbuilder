import { useMemo } from "react";
import * as THREE from "three";
import { classifyAccessory } from "../lib/catalog.js";
import { partFit, realModel, GHOST_MODELS, PLACEHOLDER_MALE, STANDARD_THREAD_RADIUS } from "../lib/realModels.js";
import { resolveFinish } from "../lib/metal.js";
import { partMotif } from "../lib/partMotif.js";
import RealPart from "./RealPart.jsx";

const R = 0.75;

function latheGeo(profile, segments = 48) {
  const pts = profile.map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, segments);
}

function useVhcTexture(finish) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");
    const hi = finish.accent;
    const mid = finish.body;
    const dark = finish.recess;
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, hi);
    g.addColorStop(0.35, mid);
    g.addColorStop(0.55, hi);
    g.addColorStop(1, mid);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = dark;
    ctx.fillRect(0, 292, 512, 52);
    ctx.fillRect(0, 368, 512, 52);
    ctx.fillStyle = hi;
    ctx.fillRect(0, 344, 512, 24);
    ctx.fillStyle = "#0a0a0c";
    [248, 260, 428, 440].forEach((y) => ctx.fillRect(0, y, 512, 5));
    for (let i = 0; i < 9; i += 1) {
      ctx.fillStyle = i % 2 ? "#0c0c10" : "#2e3036";
      ctx.fillRect(0, 468 + i * 5, 512, 4);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }, [finish.body, finish.accent, finish.recess]);
}

function Chrome({ finish, map, opacity = 1, extraRough = 0 }) {
  return (
    <meshStandardMaterial
      color={finish.body}
      map={map || null}
      roughness={Math.min(0.85, finish.roughness + extraRough)}
      metalness={finish.metalness}
      envMapIntensity={1.35}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

function Recess({ finish, opacity = 1 }) {
  return (
    <meshStandardMaterial
      color={finish.recess}
      roughness={0.55}
      metalness={0.7}
      envMapIntensity={0.7}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

function Threads({ y, finish, opacity }) {
  const n = 6;
  const step = PLACEHOLDER_MALE / n;
  const tr = STANDARD_THREAD_RADIUS;
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[0, i * step, 0]}>
          <cylinderGeometry args={[tr * (i % 2 ? 0.92 : 1), tr * (i % 2 ? 0.92 : 1), step, 36]} />
          <Recess finish={finish} opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

function GroovePair({ y, r, finish, opacity }) {
  return (
    <group>
      {[0, 0.04].map((d) => (
        <mesh key={d} position={[0, y + d, 0]}>
          <cylinderGeometry args={[r * 0.94, r * 0.94, 0.022, 40]} />
          <Recess finish={finish} opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

function ScrewHole({ r, y, finish, opacity }) {
  return (
    <mesh position={[r * 0.98, y, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.035, 0.035, 0.08, 12]} />
      <meshStandardMaterial color="#0b0b0d" roughness={0.7} metalness={0.4} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function VentSlots({ y, h, r, count, finish, opacity, slant = 0 }) {
  return Array.from({ length: count }).map((_, i) => {
    const a = (i / count) * Math.PI * 2;
    return (
      <mesh
        key={i}
        position={[Math.cos(a) * r * 0.97, y, Math.sin(a) * r * 0.97]}
        rotation={[slant, -a, 0]}
      >
        <boxGeometry args={[0.04, h, 0.16]} />
        {finish.twoTone ? (
          <meshStandardMaterial
            color={finish.accent}
            roughness={0.16}
            metalness={0.95}
            envMapIntensity={1.3}
            transparent={opacity < 1}
            opacity={opacity}
          />
        ) : (
          <Recess finish={finish} opacity={opacity} />
        )}
      </mesh>
    );
  });
}

export function partHeight(part, slot) {
  return partFit(part, slot).height;
}

function HiltPlaceholder({ part, slot, ghost, selected, finish, opacity, onSelect }) {
  const map = useVhcTexture(finish);
  const motif = partMotif(part, slot);
  const h = partHeight(part, slot);
  const r = R * (ghost ? 0.98 : 1);

  const bodyGeo = useMemo(() => {
    if (motif === "hourglass") {
      return latheGeo([
        [r * 0.92, 0.14],
        [r, h * 0.12],
        [r * 0.78, h * 0.5],
        [r, h * 0.88],
        [r * 0.92, h],
      ]);
    }
    if (motif === "ribs") {
      const pts = [[r * 0.9, 0.12]];
      const n = 6;
      for (let i = 0; i <= n; i += 1) {
        const yy = 0.16 + (h - 0.28) * (i / n);
        pts.push([r * (i % 2 ? 0.78 : 1), yy]);
      }
      pts.push([r * 0.9, h]);
      return latheGeo(pts);
    }
    if (motif === "cup" || motif === "cone") {
      return latheGeo([
        [r * 0.92, 0],
        [r, h * 0.22],
        [r * (motif === "cone" ? 0.72 : 0.88), h * 0.75],
        [r * 0.62, h],
      ]);
    }
    if (motif === "flare") {
      return latheGeo([
        [r * 0.88, 0.12],
        [r, h * 0.35],
        [r * 1.08, h * 0.72],
        [r * 0.7, h],
      ]);
    }
    return null;
  }, [motif, h, r]);

  return (
    <group onClick={onSelect}>
      {slot !== "pommel" && <Threads y={0} finish={finish} opacity={opacity} />}

      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[r, r, 0.12, 48, 1, true]} />
        <Chrome finish={finish} map={map} opacity={opacity} />
      </mesh>
      <GroovePair y={0.24} r={r} finish={finish} opacity={opacity} />

      {bodyGeo ? (
        <mesh geometry={bodyGeo}>
          <Chrome finish={finish} map={map} opacity={opacity} />
        </mesh>
      ) : (
        <mesh position={[0, h * 0.52, 0]}>
          <cylinderGeometry args={[r, r, Math.max(0.4, h - 0.45), 48, 1, true]} />
          <Chrome finish={finish} map={map} opacity={opacity} />
        </mesh>
      )}

      <mesh position={[0, h * 0.52, 0]}>
        <cylinderGeometry args={[STANDARD_THREAD_RADIUS + 0.04, STANDARD_THREAD_RADIUS + 0.04, Math.max(0.3, h - 0.2), 24, 1, true]} />
        <meshStandardMaterial
          color="#0b0b0d"
          roughness={0.8}
          metalness={0.2}
          side={THREE.BackSide}
          transparent={opacity < 1}
          opacity={opacity * 0.9}
        />
      </mesh>

      {motif === "knurl" &&
        Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * r * 1.01, h * 0.55, Math.sin(a) * r * 1.01]} rotation={[0, -a, 0.7]}>
              <boxGeometry args={[0.03, h * 0.35, 0.05]} />
              <Chrome finish={finish} opacity={opacity} extraRough={0.2} />
            </mesh>
          );
        })}

      {(motif === "slots" || motif === "phoenix") && (
        <VentSlots y={h * 0.58} h={h * 0.28} r={r} count={motif === "phoenix" ? 6 : 8} finish={finish} opacity={opacity} slant={motif === "phoenix" ? 0.55 : 0} />
      )}
      {motif === "helix" && (
        <VentSlots y={h * 0.55} h={h * 0.38} r={r} count={4} finish={finish} opacity={opacity} slant={0.9} />
      )}
      {motif === "windows" &&
        Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[0, 0.55 + i * 0.28, r * 0.99]}>
            <boxGeometry args={[r * 1.15, 0.18, 0.04]} />
            <meshStandardMaterial
              color={finish.accent}
              roughness={0.12}
              metalness={0.96}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
        ))}
      {motif === "rings" &&
        Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[0, 0.35 + i * ((h - 0.5) / 10), 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r * 1.01, 0.03, 8, 36]} />
            <Chrome finish={finish} opacity={opacity} extraRough={0.05} />
          </mesh>
        ))}
      {motif === "notch" && (
        <mesh position={[0, h * 0.72, r * 0.9]}>
          <boxGeometry args={[0.55, 0.22, 0.2]} />
          <Recess finish={finish} opacity={opacity} />
        </mesh>
      )}
      {motif === "crown" &&
        Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * r * 0.92, h + 0.06, Math.sin(a) * r * 0.92]}>
              <boxGeometry args={[0.12, 0.16, 0.08]} />
              <Chrome finish={finish} opacity={opacity} />
            </mesh>
          );
        })}
      {motif === "ears" &&
        [0, Math.PI].map((a) => (
          <mesh key={a} position={[Math.cos(a) * r * 0.55, h * 0.92, Math.sin(a) * r * 0.55]}>
            <boxGeometry args={[r * 1.05, h * 0.28, 0.16]} />
            <Chrome finish={finish} map={map} opacity={opacity} />
          </mesh>
        ))}
      {motif === "neck" && (
        <mesh position={[0, h * 0.82, 0]}>
          <cylinderGeometry args={[r * 0.42, r * 0.7, h * 0.28, 32, 1, true]} />
          <Chrome finish={finish} map={map} opacity={opacity} />
        </mesh>
      )}

      {(slot === "switch" || motif === "combo" || motif === "av" || motif === "box") && (
        <group position={[r * 1.02, h * 0.55, 0]}>
          <mesh>
            <boxGeometry args={[0.14, 0.42, 0.36]} />
            <Chrome finish={finish} opacity={opacity} extraRough={0.05} />
          </mesh>
          <mesh position={[0.02, 0.08, 0.0]}>
            <boxGeometry args={[0.08, 0.07, 0.16]} />
            <Recess finish={finish} opacity={opacity} />
          </mesh>
          <mesh position={[0.01, -0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.08, 20]} />
            <Recess finish={finish} opacity={opacity} />
          </mesh>
        </group>
      )}

      {motif === "disk" && (
        <group>
          <mesh position={[0, h * 0.45, 0]}>
            <cylinderGeometry args={[r * 1.15, r * 1.15, 0.22, 48]} />
            <Chrome finish={finish} map={map} opacity={opacity} />
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * r * 0.7, h * 0.58, Math.sin(a) * r * 0.7]}>
                <cylinderGeometry args={[0.06, 0.06, 0.08, 10]} />
                <Recess finish={finish} opacity={opacity} />
              </mesh>
            );
          })}
        </group>
      )}
      {motif === "dring" && (
        <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.03, 8, 20]} />
          <Chrome finish={finish} opacity={opacity} />
        </mesh>
      )}
      {motif === "sphere" && (
        <mesh position={[0, h * 0.55, 0]}>
          <sphereGeometry args={[r * 0.85, 24, 16]} />
          <Chrome finish={finish} map={map} opacity={opacity} />
        </mesh>
      )}

      <GroovePair y={h - 0.18} r={r} finish={finish} opacity={opacity} />
      <ScrewHole r={r} y={h * 0.42} finish={finish} opacity={opacity} />

      {selected && !ghost && (
        <mesh position={[0, h * 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r * 1.14, 0.016, 8, 40]} />
          <meshBasicMaterial color="#40ff83" />
        </mesh>
      )}
    </group>
  );
}

export default function PlaceholderPart({
  part,
  slot,
  ghost = false,
  selected = false,
  bladeColor = "#40ff83",
  ignited = false,
  bladeLength,
  onSelect,
}) {
  const opacity = ghost ? 0.28 : 1;
  const finish = resolveFinish(part?.selectedColor, part?.title || "");
  const handle = (e) => {
    e.stopPropagation();
    onSelect?.(slot);
  };

  if (!ghost && realModel(part)) {
    return (
      <RealPart
        partId={part.id}
        selected={selected}
        metalColor={part.selectedColor}
        onSelect={() => onSelect?.(slot)}
      />
    );
  }

  if (ghost && GHOST_MODELS[slot]) {
    return (
      <RealPart
        partId={GHOST_MODELS[slot]}
        ghost
        selected={selected}
        onSelect={() => onSelect?.(slot)}
      />
    );
  }

  if (slot === "blade") {
    const t = part?.title.toLowerCase() || "";
    const pixel = t.includes("pixel");
    const heavy = t.includes("heavy");
    const thin = t.includes("7/8");
    const whip = /whip|noodle/.test(t);
    const r = heavy ? 0.58 : thin ? 0.44 : 0.5;
    const h = bladeLength ?? partHeight(part, slot);
    const glow = ignited && !ghost;
    return (
      <group onClick={handle}>
        <mesh position={[0, h / 2, 0]} rotation={whip ? [0, 0, 0.18] : [0, 0, 0]}>
          <cylinderGeometry args={[r * 0.72, r * 0.78, h, 24, 1, true]} />
          <meshPhysicalMaterial
            color={bladeColor}
            emissive={bladeColor}
            emissiveIntensity={glow ? (pixel ? 4.2 : 2.6) : 0.15}
            transparent
            opacity={ghost ? 0.12 : glow ? 0.55 : 0.22}
            roughness={0.15}
            metalness={0}
            transmission={glow ? 0.35 : 0.05}
          />
        </mesh>
        <mesh position={[0, h / 2, 0]}>
          <cylinderGeometry args={[r * 0.22, r * 0.22, h * 0.98, 12]} />
          <meshBasicMaterial color={bladeColor} transparent opacity={glow ? 0.95 : 0.15} />
        </mesh>
        {glow && (
          <mesh position={[0, h + 0.04, 0]}>
            <sphereGeometry args={[r * 0.78, 16, 12]} />
            <meshPhysicalMaterial
              color={bladeColor}
              emissive={bladeColor}
              emissiveIntensity={2}
              transparent
              opacity={0.7}
            />
          </mesh>
        )}
      </group>
    );
  }

  if (slot === "electronics") return null;

  if ((slot === "accessory" || slot === "vhc") && part) {
    const kind = classifyAccessory(part.title);
    if (kind === "tsuba") {
      return (
        <group onClick={handle}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.95, 0.055, 10, 40]} />
            <Chrome finish={finish} opacity={opacity} />
          </mesh>
        </group>
      );
    }
    if (kind === "shroud") {
      return (
        <mesh onClick={handle} position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.84, 0.9, 1.15, 24, 1, true]} />
          <Chrome finish={finish} opacity={ghost ? 0.15 : 0.85} extraRough={0.1} />
        </mesh>
      );
    }
    if (kind === "clip") {
      return (
        <group onClick={handle} position={[0.82, 0.25, 0]}>
          <mesh>
            <boxGeometry args={[0.12, 0.34, 0.2]} />
            <Chrome finish={finish} opacity={opacity} />
          </mesh>
          <mesh position={[0.07, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.08, 0.016, 8, 16]} />
            <Chrome finish={finish} opacity={opacity} />
          </mesh>
        </group>
      );
    }
  }

  return (
    <HiltPlaceholder
      part={part}
      slot={slot}
      ghost={ghost}
      selected={selected}
      finish={ghost ? resolveFinish("Frosted") : finish}
      opacity={opacity}
      onSelect={handle}
    />
  );
}
