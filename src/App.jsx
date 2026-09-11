import { useMemo, useState } from "react";
import SaberCanvas from "./components/SaberCanvas.jsx";
import {
  CATEGORIES,
  formatPrice,
  getProducts,
  isDoubleConnectorPommel,
} from "./lib/catalog.js";
import { realModel } from "./lib/realModels.js";
import { formatHiltLength, hiltLengthInches } from "./lib/partLengths.js";
import { hasMetalChoices, metalColorOptions, swatchHex, thumbUrl } from "./lib/metal.js";

const BLADE_COLORS = [
  { id: "green", hex: "#40ff83", label: "Vire Green" },
  { id: "lime", hex: "#dfff00", label: "Lime" },
  { id: "blue", hex: "#4aa8ff", label: "Blue" },
  { id: "red", hex: "#ff3b3b", label: "Red" },
  { id: "purple", hex: "#b44dff", label: "Purple" },
  { id: "cyan", hex: "#3ef0ff", label: "Cyan" },
  { id: "white", hex: "#f4f7ff", label: "White" },
  { id: "orange", hex: "#ff8a2a", label: "Orange" },
];

const emptyBuild = {
  blade: null,
  emitter: null,
  switch: null,
  grip: null,
  pommel: null,
  electronics: null,
  extras: [],
};

const emptySecond = {
  blade: null,
  emitter: null,
  switch: null,
  grip: null,
  electronics: null,
};

const SABER_B_SLOTS = ["blade", "emitter", "switch", "grip", "electronics"];

function isSelected(source, category, part) {
  if (["vhc", "accessory"].includes(category)) {
    return (source.extras || []).some((e) => e.slot === category && e.part.id === part.id);
  }
  return source[category]?.id === part.id;
}

export default function App() {
  const [category, setCategory] = useState("emitter");
  const [query, setQuery] = useState("");
  const [build, setBuild] = useState(emptyBuild);
  const [explode, setExplode] = useState(0);
  const [ignited, setIgnited] = useState(false);
  const [bladeColor, setBladeColor] = useState(BLADE_COLORS[0].hex);
  const [stock, setStock] = useState("all");
  const [realOnly, setRealOnly] = useState(false);
  const [doubleBladed, setDoubleBladed] = useState(false);
  const [second, setSecond] = useState(emptySecond);
  const [activeSaber, setActiveSaber] = useState("a");

  const connectorOn = isDoubleConnectorPommel(build.pommel);
  const staffOn = doubleBladed && connectorOn;
  const visibleCats = staffOn && activeSaber === "b"
    ? CATEGORIES.filter((c) => SABER_B_SLOTS.includes(c.id))
    : CATEGORIES;
  const cat = CATEGORIES.find((c) => c.id === category);
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return getProducts(category).filter((p) => {
      if (stock === "in" && !p.available) return false;
      if (realOnly && category !== "blade" && !realModel(p)) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [category, query, stock, realOnly]);

  const lineItems = useMemo(() => {
    const core = ["blade", "emitter", "switch", "grip", "pommel", "electronics"]
      .map((slot) => (build[slot] ? { slot, part: build[slot], saber: "a" } : null))
      .filter(Boolean);
    const extras = build.extras.map((e) => ({ ...e, saber: "a" }));
    const b = staffOn
      ? SABER_B_SLOTS.map((slot) =>
          second[slot] ? { slot, part: second[slot], saber: "b" } : null
        ).filter(Boolean)
      : [];
    return [...core, ...extras, ...b];
  }, [build, second, staffOn]);

  const total = lineItems.reduce((sum, row) => sum + Number(row.part.price), 0);
  const hiltLength = hiltLengthInches(build, second, staffOn);
  const neededSlots = ["emitter", "switch", "grip", "pommel", "electronics"];
  const missingSlots = neededSlots.filter((slot) => !build[slot]);
  const coreReady = missingSlots.length === 0;

  function withColor(part, color) {
    const options = metalColorOptions(part);
    const baked = realModel(part)?.bakedColor;
    const fallback = baked && options.includes(baked) ? baked : options[0];
    const selectedColor = color || part.selectedColor || fallback || null;
    return { ...part, selectedColor };
  }

  function addPart(part, color) {
    const equipped = withColor(part, color);
    if (staffOn && activeSaber === "b" && SABER_B_SLOTS.includes(category)) {
      setSecond((prev) => {
        const current = prev[category];
        if (current?.id === part.id && !color) return { ...prev, [category]: null };
        return { ...prev, [category]: equipped };
      });
      if (category === "blade") setIgnited(true);
      return;
    }
    if (["vhc", "accessory"].includes(category)) {
      setBuild((prev) => {
        const exists = prev.extras.find((e) => e.slot === category && e.part.id === part.id);
        if (exists && !color) {
          return { ...prev, extras: prev.extras.filter((e) => e !== exists) };
        }
        if (exists && color) {
          return {
            ...prev,
            extras: prev.extras.map((e) =>
              e === exists ? { ...e, part: equipped } : e
            ),
          };
        }
        return {
          ...prev,
          extras: [...prev.extras, { slot: category, part: equipped, uid: `${part.id}-${Date.now()}` }],
        };
      });
      return;
    }
    setBuild((prev) => {
      const current = prev[category];
      if (current?.id === part.id && !color) {
        const next = { ...prev, [category]: null };
        if (category === "pommel") {
          setDoubleBladed(false);
          setActiveSaber("a");
        }
        return next;
      }
      if (category === "pommel" && !isDoubleConnectorPommel(equipped)) {
        setDoubleBladed(false);
        setActiveSaber("a");
      }
      return { ...prev, [category]: equipped };
    });
    if (category === "blade") setIgnited(true);
  }

  function setLineColor(row, color) {
    if (row.saber === "b") {
      setSecond((prev) => ({
        ...prev,
        [row.slot]: prev[row.slot] ? { ...prev[row.slot], selectedColor: color } : prev[row.slot],
      }));
      return;
    }
    if (row.uid) {
      setBuild((prev) => ({
        ...prev,
        extras: prev.extras.map((e) =>
          e.uid === row.uid ? { ...e, part: { ...e.part, selectedColor: color } } : e
        ),
      }));
      return;
    }
    setBuild((prev) => ({
      ...prev,
      [row.slot]: prev[row.slot] ? { ...prev[row.slot], selectedColor: color } : prev[row.slot],
    }));
  }

  function removeLine(row) {
    if (row.saber === "b") {
      setSecond((prev) => ({ ...prev, [row.slot]: null }));
      return;
    }
    if (row.uid) {
      setBuild((prev) => ({ ...prev, extras: prev.extras.filter((e) => e.uid !== row.uid) }));
      return;
    }
    if (row.slot === "pommel") {
      setDoubleBladed(false);
      setActiveSaber("a");
    }
    setBuild((prev) => ({ ...prev, [row.slot]: null }));
  }

  function clearBuild() {
    setBuild(emptyBuild);
    setSecond(emptySecond);
    setDoubleBladed(false);
    setActiveSaber("a");
    setIgnited(false);
  }

  function toggleStaff() {
    if (staffOn) {
      setDoubleBladed(false);
      setActiveSaber("a");
      return;
    }
    if (!connectorOn) return;
    setSecond((prev) => {
      if (prev.grip || prev.emitter || prev.switch || prev.blade || prev.electronics) return prev;
      return {
        blade: build.blade,
        emitter: build.emitter,
        switch: build.switch,
        grip: build.grip,
        electronics: build.electronics,
      };
    });
    setDoubleBladed(true);
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="https://viresabers.com" target="_blank" rel="noreferrer">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Vire Sabers" />
        </a>
        <div className="topbar-copy">
          <p className="kicker">Variable Hilt Components</p>
          <h1>Saber Builder</h1>
        </div>
        <nav className="top-links">
          <a href="https://viresabers.com/pages/faqs" target="_blank" rel="noreferrer">
            FAQ
          </a>
          <a href="https://viresabers.com/pages/how-to-build" target="_blank" rel="noreferrer">
            Learn to Build
          </a>
          <span className="cart-pill">{lineItems.length} parts</span>
        </nav>
      </header>

      <main className="layout">
        <section className="catalog">
          {staffOn && (
            <div className="saber-toggle">
              <button
                className={activeSaber === "a" ? "on" : ""}
                onClick={() => setActiveSaber("a")}
              >
                Saber A
              </button>
              <button
                className={activeSaber === "b" ? "on" : ""}
                onClick={() => {
                  setActiveSaber("b");
                  if (!SABER_B_SLOTS.includes(category)) setCategory("grip");
                }}
              >
                Saber B
              </button>
            </div>
          )}
          <div className="slot-row">
            {visibleCats.map((c) => {
              const src = staffOn && activeSaber === "b" ? second : build;
              const filled = c.single
                ? Boolean(src[c.id])
                : (src.extras || []).some((e) => e.slot === c.id);
              return (
                <button
                  key={c.id}
                  className={`slot-btn ${category === c.id ? "active" : ""} ${filled ? "filled" : ""}`}
                  onClick={() => {
                    setCategory(c.id);
                    setQuery("");
                  }}
                >
                  <span className="slot-dot" />
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="catalog-head">
            <div>
              <h2>{cat.label}</h2>
              <p>{cat.hint}. Click a part to add it to the 3D mockup.</p>
            </div>
            <div className="filters">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${cat.label.toLowerCase()}…`}
              />
              <select value={stock} onChange={(e) => setStock(e.target.value)}>
                <option value="all">All stock</option>
                <option value="in">In stock</option>
              </select>
              <label className="real-filter">
                <input
                  type="checkbox"
                  checked={realOnly}
                  onChange={(e) => setRealOnly(e.target.checked)}
                />
                Real models (beta only)
              </label>
            </div>
          </div>

          <div className="grid">
            {items.map((part) => {
              const src = staffOn && activeSaber === "b" ? second : build;
              const on = isSelected(src, category, part);
              const colors = metalColorOptions(part);
              const activeColor = ["vhc", "accessory"].includes(category)
                ? (src.extras || []).find((e) => e.slot === category && e.part.id === part.id)?.part.selectedColor
                : src[category]?.id === part.id
                  ? src[category].selectedColor
                  : null;
              return (
                <div
                  key={part.id}
                  className={`card ${on ? "on" : ""} ${part.available ? "" : "oos"}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => addPart(part)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") addPart(part);
                  }}
                >
                  <div className="thumb">
                    {part.image ? (
                      <img
                        src={thumbUrl(part.image)}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="thumb-fallback">{part.title[0]}</div>
                    )}
                    {!part.available && <span className="badge">Sold out</span>}
                    {realModel(part) && <span className="badge real">Real 3D</span>}
                    {isDoubleConnectorPommel(part) && <span className="badge real">Staff</span>}
                    {on && <span className="badge live">On saber</span>}
                  </div>
                  <div className="card-meta">
                    <strong>{part.title}</strong>
                    <span>{formatPrice(part.price)}</span>
                    {hasMetalChoices(part) && (
                      <div className="metal-row">
                        {colors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`metal-swatch ${activeColor === c ? "on" : ""}`}
                            title={c}
                            style={{ background: swatchHex(c) }}
                            onClick={(e) => {
                              e.stopPropagation();
                              addPart(part, c);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {items.length === 0 && <p className="empty">No parts match that filter.</p>}
          </div>
        </section>

        <section className="stage">
          <SaberCanvas
            build={build}
            second={second}
            doubleBladed={staffOn}
            activeSaber={activeSaber}
            explode={explode}
            ignited={ignited}
            bladeColor={bladeColor}
            activeSlot={category}
            onSelectSlot={(slot, side) => {
              if (side === "a" || side === "b") setActiveSaber(side);
              setCategory(slot);
            }}
          />
          <div className="placeholder-chip">
            {(() => {
              const names = [];
              if (build.emitter?.id === "fang-emitter") names.push("Fang emitter");
              if (build.emitter?.id === "a-emitter-guardian-black") names.push("Guardian emitter");
              if (build.emitter?.id === "mantis-emitter") names.push("Mantis emitter");
              if (build.emitter?.id === "slicer-emitter") names.push("Slicer emitter");
              if (build.grip?.id === "fang-grip") names.push("Fang grip");
              if (build.grip?.id === "sentinel-handle") names.push("Sentinel grip");
              if (build.grip?.id === "throttle-grip") names.push("Throttle grip");
              if (build.grip?.id === "padawan-grip") names.push("Padawan grip");
              if (build.switch?.id === "type-c-sentinel-2-0-switch") names.push("Sentinel switch");
              if (build.switch?.id === "rook-switch-usb-c") names.push("Rook switch");
              if (build.pommel?.id === "rook-pommel") names.push("Rook pommel");
              if (build.pommel?.id === "kam-pommel") names.push("KAM pommel");
              if (build.pommel?.id === "sentinel-pommel") names.push("Sentinel pommel");
              if (build.pommel?.id === "d-guardian-double-connector-pommel") names.push("Guardian connector");
              return names.length ? `Real 3D: ${names.join(" · ")}` : "Placeholder 3D models";
            })()}
          </div>
          <div className="stage-hint">Drag to rotate · Scroll to zoom · Right-drag to move</div>
          <div className="stage-tools">
            <label>
              Explode
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explode}
                onChange={(e) => setExplode(Number(e.target.value))}
              />
            </label>
            {connectorOn && (
              <button onClick={toggleStaff}>
                {staffOn ? "Single saber" : "Make double bladed"}
              </button>
            )}
            {(build.blade || (staffOn && second.blade)) && (
              <>
                <button onClick={() => setIgnited((v) => !v)}>
                  {ignited
                    ? staffOn
                      ? "Retract blades"
                      : "Retract blade"
                    : staffOn
                      ? "Ignite blades"
                      : "Ignite blade"}
                </button>
                <div className="swatches">
                  {BLADE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      title={c.label}
                      className={`swatch ${bladeColor === c.hex ? "on" : ""}`}
                      style={{ background: c.hex }}
                      onClick={() => setBladeColor(c.hex)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="build">
          <div className="build-head">
            <h2>Your saber</h2>
            <span className={`ready ${coreReady ? "yes" : ""}`}>
              {coreReady ? "Complete" : `Pick ${missingSlots.join(", ")}`}
            </span>
            <div className="hilt-length">
              <span>Hilt length</span>
              <strong>{formatHiltLength(hiltLength)}</strong>
            </div>
          </div>
          <p className="intro">
            Welcome to the Vire Sabers Builder. We use Saber Studio Variable Hilt Components (VHC)
            to create easily customizable sabers. Click a part to add it to the mockup. Placeholder
            3D models stand in for each inventory piece.
          </p>
          <ul className="lines">
            {lineItems.length === 0 && <li className="muted">Nothing on the saber yet.</li>}
            {lineItems.map((row) => {
              const colors = metalColorOptions(row.part);
              return (
                <li key={row.uid || `${row.saber}-${row.slot}-${row.part.id}`}>
                  <img src={thumbUrl(row.part.image)} alt="" referrerPolicy="no-referrer" />
                  <div>
                    <em>{row.saber === "b" ? `saber b ${row.slot}` : row.slot}</em>
                    <strong>{row.part.title}</strong>
                    {colors.length > 1 && (
                      <select
                        className="metal-select"
                        value={row.part.selectedColor || colors[0]}
                        onChange={(e) => setLineColor(row, e.target.value)}
                      >
                        {colors.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <span>{formatPrice(row.part.price)}</span>
                  <button className="x" onClick={() => removeLine(row)} aria-label="Remove">
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="total">
            <span>Build total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <p className="fine">
            One of our team members will assemble your saber and send it out within a few days of
            your order. Don’t forget a blade if you need one. Electronics ship with instructions and
            a charging cable.
          </p>
          <div className="build-actions">
            <button className="ghost" onClick={clearBuild}>
              Clear
            </button>
            <a
              className="primary"
              href="https://viresabers.com/pages/saberbuilder"
              target="_blank"
              rel="noreferrer"
            >
              Checkout on Vire
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}
