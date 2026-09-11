export function partMotif(part, slot) {
  const t = (part?.title || "").toLowerCase();
  if (slot === "emitter") {
    if (t.includes("phoenix")) return "phoenix";
    if (t.includes("slicer") || t.includes("vent")) return "slots";
    if (t.includes("helix")) return "helix";
    if (t.includes("whirlwind") || t.includes("knurl")) return "knurl";
    if (t.includes("sentinel") || t.includes("window") || t.includes("bishop")) return "windows";
    if (t.includes("crown") || t.includes("jester") || t.includes("gatekeeper")) return "crown";
    if (t.includes("thin neck") || t.includes("tavros") || t.includes("ronin")) return "neck";
    if (t.includes("combo") || t.includes("switch")) return "combo";
    if (t.includes("darkthorn") || t.includes("fang") || t.includes("spire")) return "ears";
    if (t.includes("mantis") || t.includes("lotus")) return "flare";
    return "standard";
  }
  if (slot === "grip") {
    if (t.includes("vortex") || t.includes("hourglass") || t.includes("throttle")) return "hourglass";
    if (t.includes("inquisitor") || t.includes("ring") || t.includes("stacked")) return "rings";
    if (t.includes("padawan") || t.includes("wave") || t.includes("rib")) return "ribs";
    if (t.includes("cyborg") || t.includes("helix") || t.includes("claw")) return "notch";
    if (t.includes("wrap") || t.includes("leather")) return "wrap";
    if (t.includes("covertec") || t.includes("grappler")) return "clip";
    if (t.includes("fluted") || t.includes("sidewinder")) return "flutes";
    return "standard";
  }
  if (slot === "switch") {
    if (t.includes("combo") || t.includes("emitter") || t.includes("grip")) return "combo";
    if (t.includes("box") || t.includes("control")) return "box";
    return "av";
  }
  if (slot === "pommel") {
    if (t.includes("disk") || t.includes("disc")) return "disk";
    if (t.includes("ion") || t.includes("cone") || t.includes("taper")) return "cone";
    if (t.includes("sphere") || t.includes("claw") || t.includes("ball")) return "sphere";
    if (t.includes("d-ring") || t.includes("dring") || t.includes("ring")) return "dring";
    if (t.includes("staff") || t.includes("double") || t.includes("connector")) return "coupler";
    if (t.includes("spike") || t.includes("rev")) return "spike";
    return "cup";
  }
  if (slot === "vhc" || slot === "accessory") {
    if (t.includes("tsuba") || t.includes("bunny")) return "tsuba";
    if (t.includes("shroud") || t.includes("sleeve")) return "shroud";
    if (t.includes("clip") || t.includes("covertec") || t.includes("wheel")) return "clip";
    if (t.includes("choke")) return "choke";
    if (t.includes("chamber")) return "chamber";
    return "ext";
  }
  return "standard";
}
