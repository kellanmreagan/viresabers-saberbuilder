import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { REAL_MODELS, partFit } from "../lib/realModels.js";
import { resolveFinish } from "../lib/metal.js";

export default function RealPart({ partId, selected = false, metalColor, onSelect }) {
  const spec = REAL_MODELS[partId];
  const fit = partFit({ id: partId }, spec.slot);
  const gltf = useGLTF(spec.url);
  const finish = resolveFinish(metalColor);

  const scene = useMemo(() => {
    const root = gltf.scene.clone(true);
    const tint = new THREE.Color(finish.body);
    root.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry = child.geometry.clone();
      child.geometry.computeVertexNormals();
      const mat = child.material.clone();
      mat.metalness = finish.metalness;
      mat.roughness = Math.min(mat.roughness ?? 1, finish.roughness);
      mat.envMapIntensity = 1.25;
      if (spec.doubleSide) mat.side = THREE.DoubleSide;
      const baked = spec.keepMap && mat.map && (!metalColor || metalColor === spec.bakedColor);
      if (baked) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.color = new THREE.Color(0xffffff);
      } else if (metalColor) {
        if (spec.solidRecolor && mat.map) {
          mat.map = null;
          mat.roughness = finish.roughness;
          mat.metalness = finish.metalness;
        }
        mat.color = tint;
      }
      child.material = mat;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    return root;
  }, [gltf, finish.body, finish.metalness, finish.roughness, metalColor, spec]);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <group rotation={spec.rotation || [0, 0, 0]} scale={fit.scale} position={spec.position || [0, 0, 0]}>
        <primitive object={scene} />
      </group>
      {selected && (
        <mesh position={[0, fit.height * 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[fit.radius * 1.2, 0.018, 8, 40]} />
          <meshBasicMaterial color="#40ff83" />
        </mesh>
      )}
    </group>
  );
}

Object.values(REAL_MODELS).forEach((spec) => useGLTF.preload(spec.url));
