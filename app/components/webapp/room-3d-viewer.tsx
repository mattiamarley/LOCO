"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { WebAppLocus, WebAppRoute } from "./loco-webapp-data";

interface Room3DViewerProps {
  route: WebAppRoute;
  selectedLocusId: string | null;
  onSelectLocus: (locusId: string) => void;
  onAddLocusAtPoint: (payload: {
    surface: string;
    label: string;
    x: number;
    y: number;
    point3d: { x: number; y: number; z: number };
    question: string;
    answer: string;
    association: string;
    confirmationState: "proposed" | "confirmed";
  }) => void;
  onUpdateLocus: (
    locusId: string,
    patch: Partial<
      Pick<
        WebAppLocus,
        "label" | "question" | "answer" | "association" | "confirmationState" | "position"
      >
    >
  ) => void;
  onReorderLocus: (locusId: string, direction: "up" | "down") => void;
  onStartBlindRecall: () => void;
  onBack: () => void;
}

interface Box3D {
  name: string;
  label: string;
  cx: number;
  cy: number;
  cz: number;
  w: number;
  h: number;
  d: number;
  color: string;
  stroke: string;
}

const ROOM_FURNITURE: Box3D[] = [
  {
    name: "Porta",
    label: "Porta d'ingresso",
    cx: 0,
    cy: 1.15,
    cz: 4.85,
    w: 1.4,
    h: 2.3,
    d: 0.14,
    color: "#B89A77",
    stroke: "#181818",
  },
  {
    name: "Scrivania",
    label: "Scrivania gialla",
    cx: -2.6,
    cy: 0.55,
    cz: -2.3,
    w: 2.1,
    h: 0.9,
    d: 1.2,
    color: "#FFD014",
    stroke: "#181818",
  },
  {
    name: "Lampada",
    label: "Lampada viola sulla scrivania",
    cx: -3.2,
    cy: 1.3,
    cz: -2.3,
    w: 0.4,
    h: 0.6,
    d: 0.4,
    color: "#613BE0",
    stroke: "#181818",
  },
  {
    name: "Libreria",
    label: "Libreria in fondo",
    cx: 2.4,
    cy: 1.2,
    cz: -4.2,
    w: 2.1,
    h: 2.4,
    d: 0.7,
    color: "#D0C4F6",
    stroke: "#181818",
  },
  {
    name: "Letto",
    label: "Letto con coperta gialla",
    cx: 2.5,
    cy: 0.45,
    cz: 0.4,
    w: 1.8,
    h: 0.75,
    d: 2.8,
    color: "#9B82F3",
    stroke: "#181818",
  },
  {
    name: "Finestra",
    label: "Finestra luminosa",
    cx: -3.85,
    cy: 1.75,
    cz: 0.2,
    w: 0.15,
    h: 1.5,
    d: 2.0,
    color: "#BAE6FD",
    stroke: "#181818",
  },
];

export function Room3DViewer({
  route,
  selectedLocusId,
  onSelectLocus,
  onAddLocusAtPoint,
  onUpdateLocus,
  onReorderLocus,
  onStartBlindRecall,
  onBack,
}: Room3DViewerProps) {
  const [sceneMode, setSceneMode] = useState<"3d-room" | "map-3d" | "street-photo">(
    route.environment === "3D SCAN" ? "3d-room" : "map-3d"
  );

  // Camera state for 3D room
  const [cam, setCam] = useState({ x: 0, y: 1.65, z: 3.3, yaw: 0, pitch: -0.08 });
  const [placingMode, setPlacingMode] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<{
    surface: string;
    label: string;
    x: number;
    y: number;
    point3d: { x: number; y: number; z: number };
  } | null>(null);

  // New locus creation form inside the scene
  const [newLabel, setNewLabel] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newAssociation, setNewAssociation] = useState("");
  const [newIsAiSuggested, setNewIsAiSuggested] = useState(false);
  const [voiceActiveField, setVoiceActiveField] = useState<"question" | "answer" | "association" | null>(
    null
  );
  const [statusBanner, setStatusBanner] = useState<string>(
    "Esplora l'ambiente: trascina per guardarti attorno, usa WASD o tocca un punto per fissare un locus."
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);
  const projectedMarkersRef = useRef<
    { id: string; sx: number; sy: number; r: number; label: string }[]
  >([]);
  const projectedSurfacesRef = useRef<
    {
      name: string;
      label: string;
      sx: number;
      sy: number;
      point3d: { x: number; y: number; z: number };
    }[]
  >([]);

  const selectedLocus = route.loci.find((l) => l.id === selectedLocusId) ?? null;

  const moveCamera = useCallback((dir: "forward" | "back" | "left" | "right") => {
    setCam((prev) => {
      const speed = 0.42;
      let dx = 0;
      let dz = 0;
      if (dir === "forward") {
        dx = -Math.sin(prev.yaw) * speed;
        dz = -Math.cos(prev.yaw) * speed;
      } else if (dir === "back") {
        dx = Math.sin(prev.yaw) * speed;
        dz = Math.cos(prev.yaw) * speed;
      } else if (dir === "left") {
        dx = -Math.cos(prev.yaw) * speed;
        dz = Math.sin(prev.yaw) * speed;
      } else if (dir === "right") {
        dx = Math.cos(prev.yaw) * speed;
        dz = -Math.sin(prev.yaw) * speed;
      }
      const nx = Math.max(-3.3, Math.min(3.3, prev.x + dx));
      const nz = Math.max(-4.1, Math.min(4.2, prev.z + dz));
      return { ...prev, x: nx, z: nz };
    });
  }, []);

  // Project 3D point (wx, wy, wz) into 2D canvas coordinates
  const projectPoint = useCallback(
    (wx: number, wy: number, wz: number, width: number, height: number) => {
      const dx = wx - cam.x;
      const dy = wy - cam.y;
      const dz = wz - cam.z;

      const cosY = Math.cos(cam.yaw);
      const sinY = Math.sin(cam.yaw);
      // Rotate around Y
      const rx = dx * cosY - dz * sinY;
      const rz = dx * sinY + dz * cosY;

      const cosP = Math.cos(cam.pitch);
      const sinP = Math.sin(cam.pitch);
      // Rotate around X
      const ry = dy * cosP - rz * sinP;
      const cz = dy * sinP + rz * cosP;

      // Camera looks down -Z
      const depth = -cz;
      if (depth <= 0.15) return null;

      const fovScale = (height * 0.88) / depth;
      const sx = width / 2 + rx * fovScale;
      const sy = height / 2 - ry * fovScale;
      return { sx, sy, depth };
    },
    [cam]
  );

  // Render interactive 3D room canvas
  useEffect(() => {
    if (sceneMode !== "3d-room") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Sky/Ceiling & Floor background gradient in LOCO palette
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#EFE9FC");
    grad.addColorStop(0.52, "#DFD5F9");
    grad.addColorStop(0.53, "#E7D8C5");
    grad.addColorStop(1, "#D2B99B");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Room wireframe boundary lines (-4..4 X, 0..3.2 Y, -5..5 Z)
    const roomCorners = [
      [-4, 0, -5],
      [4, 0, -5],
      [4, 3.2, -5],
      [-4, 3.2, -5],
      [-4, 0, 5],
      [4, 0, 5],
      [4, 3.2, 5],
      [-4, 3.2, 5],
    ];
    const roomEdges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
    ctx.strokeStyle = "rgba(97, 59, 224, 0.28)";
    ctx.lineWidth = 2;
    roomEdges.forEach(([a, b]) => {
      const pa = projectPoint(
        roomCorners[a][0],
        roomCorners[a][1],
        roomCorners[a][2],
        width,
        height
      );
      const pb = projectPoint(
        roomCorners[b][0],
        roomCorners[b][1],
        roomCorners[b][2],
        width,
        height
      );
      if (pa && pb) {
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.stroke();
      }
    });

    // Sort furniture back-to-front by distance to camera
    const sortedFurniture = [...ROOM_FURNITURE]
      .map((box) => {
        const dist = Math.hypot(box.cx - cam.x, box.cy - cam.y, box.cz - cam.z);
        return { box, dist };
      })
      .sort((a, b) => b.dist - a.dist);

    const surfaceCenters: {
      name: string;
      label: string;
      sx: number;
      sy: number;
      point3d: { x: number; y: number; z: number };
    }[] = [];

    sortedFurniture.forEach(({ box }) => {
      const hw = box.w / 2;
      const hh = box.h / 2;
      const hd = box.d / 2;
      const vertices = [
        [box.cx - hw, box.cy - hh, box.cz - hd],
        [box.cx + hw, box.cy - hh, box.cz - hd],
        [box.cx + hw, box.cy + hh, box.cz - hd],
        [box.cx - hw, box.cy + hh, box.cz - hd],
        [box.cx - hw, box.cy - hh, box.cz + hd],
        [box.cx + hw, box.cy - hh, box.cz + hd],
        [box.cx + hw, box.cy + hh, box.cz + hd],
        [box.cx - hw, box.cy + hh, box.cz + hd],
      ];
      const faces = [
        [0, 1, 2, 3], // back
        [4, 5, 6, 7], // front
        [0, 4, 7, 3], // left
        [1, 5, 6, 2], // right
        [3, 2, 6, 7], // top
      ];

      faces.forEach((face) => {
        const pts = face
          .map((idx) =>
            projectPoint(vertices[idx][0], vertices[idx][1], vertices[idx][2], width, height)
          )
          .filter((p): p is NonNullable<typeof p> => p !== null);
        if (pts.length === 4) {
          ctx.fillStyle = box.color;
          ctx.strokeStyle = box.stroke;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pts[0].sx, pts[0].sy);
          pts.slice(1).forEach((p) => ctx.lineTo(p.sx, p.sy));
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });

      const centerProj = projectPoint(box.cx, box.cy + hh * 0.4, box.cz, width, height);
      if (centerProj) {
        surfaceCenters.push({
          name: box.name,
          label: box.label,
          sx: centerProj.sx,
          sy: centerProj.sy,
          point3d: { x: box.cx, y: Number((box.cy + hh * 0.5).toFixed(2)), z: box.cz },
        });
        // Subtle surface tag
        ctx.fillStyle = "rgba(24, 24, 24, 0.78)";
        ctx.beginPath();
        ctx.roundRect(centerProj.sx - 46, centerProj.sy - 11, 92, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "600 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(box.name, centerProj.sx, centerProj.sy);
      }
    });
    projectedSurfacesRef.current = surfaceCenters;

    // Draw saved loci markers in 3D space
    const drawnMarkers: { id: string; sx: number; sy: number; r: number; label: string }[] = [];
    route.loci.forEach((locus, idx) => {
      const p3 = locus.point3d ?? {
        x: ((locus.x - 50) / 50) * 3.2,
        y: 1.2,
        z: ((locus.y - 50) / 50) * 3.8,
      };
      const proj = projectPoint(p3.x, p3.y, p3.z, width, height);
      if (!proj) return;
      const isSelected = locus.id === selectedLocusId;
      const radius = isSelected ? 24 : 20;

      // Outer pulse ring if selected or proposed
      if (isSelected || locus.confirmationState === "proposed") {
        ctx.strokeStyle =
          locus.confirmationState === "proposed" ? "#FFD014" : "rgba(255, 208, 20, 0.85)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = isSelected ? "#FFD014" : "#613BE0";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(proj.sx, proj.sy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? "#181818" : "#FFFFFF";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(locus.position || idx + 1), proj.sx, proj.sy);

      drawnMarkers.push({
        id: locus.id,
        sx: proj.sx,
        sy: proj.sy,
        r: radius + 6,
        label: locus.label,
      });
    });

    // Pending anchor marker (+)
    if (pendingAnchor) {
      const proj = projectPoint(
        pendingAnchor.point3d.x,
        pendingAnchor.point3d.y,
        pendingAnchor.point3d.z,
        width,
        height
      );
      if (proj) {
        ctx.fillStyle = "#FFD014";
        ctx.strokeStyle = "#181818";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#181818";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", proj.sx, proj.sy);
      }
    }

    // Center gaze crosshair
    ctx.strokeStyle = placingMode ? "#FFD014" : "rgba(97, 59, 224, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width / 2 - 16, height / 2);
    ctx.lineTo(width / 2 + 16, height / 2);
    ctx.moveTo(width / 2, height / 2 - 16);
    ctx.lineTo(width / 2, height / 2 + 16);
    ctx.stroke();

    projectedMarkersRef.current = drawnMarkers;
  }, [sceneMode, cam, route.loci, selectedLocusId, pendingAnchor, placingMode, projectPoint]);

  const handleCanvasClick = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * canvas.width;
    const sy = ((clientY - rect.top) / rect.height) * canvas.height;

    // 1. Check if user clicked an existing locus marker
    if (!placingMode) {
      const hitMarker = projectedMarkersRef.current.find(
        (m) => Math.hypot(m.sx - sx, m.sy - sy) <= m.r
      );
      if (hitMarker) {
        onSelectLocus(hitMarker.id);
        setPendingAnchor(null);
        setStatusBanner(`Locus selezionato: ${hitMarker.label}. Modifica nozione o associazione in scena.`);
        return;
      }
    }

    // 2. Find nearest 3D furniture surface or project ray into room
    let nearestSurface = projectedSurfacesRef.current[0];
    let minDist = Infinity;
    for (const s of projectedSurfacesRef.current) {
      const d = Math.hypot(s.sx - sx, s.sy - sy);
      if (d < minDist) {
        minDist = d;
        nearestSurface = s;
      }
    }

    const chosenSurface =
      nearestSurface && minDist < 150
        ? nearestSurface
        : {
            name: "Ambiente",
            label: `Punto stanza (${route.loci.length + 1})`,
            sx,
            sy,
            point3d: {
              x: Number((cam.x - Math.sin(cam.yaw) * 2.4).toFixed(2)),
              y: 1.25,
              z: Number((cam.z - Math.cos(cam.yaw) * 2.4).toFixed(2)),
            },
          };

    const normX = Math.round((sx / canvas.width) * 80 + 10);
    const normY = Math.round((sy / canvas.height) * 80 + 10);

    setPendingAnchor({
      surface: chosenSurface.name,
      label: chosenSurface.label,
      x: normX,
      y: normY,
      point3d: chosenSurface.point3d,
    });
    setNewLabel(chosenSurface.label);
    setPlacingMode(false);
    setStatusBanner(
      `Ancora spaziale fissata su "${chosenSurface.label}". Inserisci Nozione e Associazione qui in scena.`
    );
  };

  // Voice dictation helper using Web Speech API (optional, with graceful fallback)
  const triggerVoiceInput = (field: "question" | "answer" | "association") => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setStatusBanner(
        "Dettatura vocale non supportata da questo browser: puoi digitare direttamente nel campo in scena."
      );
      return;
    }

    try {
      setVoiceActiveField(field);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = new (SpeechRec as any)();
      rec.lang = "it-IT";
      rec.interimResults = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript ?? "";
        if (!transcript) return;
        if (pendingAnchor) {
          if (field === "question") setNewQuestion((q) => (q ? `${q} ${transcript}` : transcript));
          if (field === "answer") setNewAnswer((a) => (a ? `${a} ${transcript}` : transcript));
          if (field === "association")
            setNewAssociation((m) => (m ? `${m} ${transcript}` : transcript));
        } else if (selectedLocus) {
          onUpdateLocus(selectedLocus.id, { [field]: transcript });
        }
        setVoiceActiveField(null);
      };
      rec.onerror = () => setVoiceActiveField(null);
      rec.onend = () => setVoiceActiveField(null);
      rec.start();
    } catch {
      setVoiceActiveField(null);
    }
  };

  const handleAiSuggestLocus = () => {
    const surfaceName = pendingAnchor?.label ?? selectedLocus?.label ?? "questo punto";
    const suggestedQ = `Qual è il concetto chiave ancorato a "${surfaceName}"?`;
    const suggestedA = `Concetto verificato per ${route.title} (${route.topic}).`;
    const suggestedM = `Un'oca gigante con il cappello giallo interagisce con ${surfaceName} facendo scintille viola.`;
    if (pendingAnchor) {
      setNewQuestion(suggestedQ);
      setNewAnswer(suggestedA);
      setNewAssociation(suggestedM);
      setNewIsAiSuggested(true);
      setStatusBanner(
        "Suggerimento AI generato come 'Proposto': richiede conferma umana esplicita per diventare attivo."
      );
    } else if (selectedLocus) {
      onUpdateLocus(selectedLocus.id, {
        question: suggestedQ,
        answer: suggestedA,
        association: suggestedM,
        confirmationState: "proposed",
      });
    }
  };

  const handleSaveNewLocus = (confirmImmediately: boolean) => {
    if (!pendingAnchor) return;
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setStatusBanner("Inserisci almeno la domanda/stimolo e la nozione/risposta corretta.");
      return;
    }
    onAddLocusAtPoint({
      surface: pendingAnchor.surface,
      label: newLabel.trim() || pendingAnchor.label,
      x: pendingAnchor.x,
      y: pendingAnchor.y,
      point3d: pendingAnchor.point3d,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      association:
        newAssociation.trim() ||
        `Immagine vivida ancorata a ${newLabel.trim() || pendingAnchor.label}`,
      confirmationState: newIsAiSuggested && !confirmImmediately ? "proposed" : "confirmed",
    });
    setPendingAnchor(null);
    setNewLabel("");
    setNewQuestion("");
    setNewAnswer("");
    setNewAssociation("");
    setNewIsAiSuggested(false);
    setStatusBanner("Nuovo locus salvato nell'ambiente con versione scena v" + route.sceneVersion);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top header aligned with Figma single-level navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Torna indietro"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#613BE0] text-white transition hover:opacity-90"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="loco-display text-[32px] font-bold leading-none text-[#181818]">
                {route.title}
              </h1>
              <span className="rounded-full bg-[#D0C4F6] px-3 py-1 text-xs font-bold text-[#613BE0]">
                {route.environment} • v{route.sceneVersion}
              </span>
              <span className="rounded-full bg-[#FFD014] px-3 py-1 text-xs font-bold text-[#181818]">
                {route.loci.length} Loci
              </span>
            </div>
            <p className="mt-1 text-sm text-[#181818]/75">{statusBanner}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-[#181818]/20 bg-[#D0C4F6]/50 p-1">
            <button
              type="button"
              onClick={() => setSceneMode("3d-room")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                sceneMode === "3d-room"
                  ? "bg-[#613BE0] text-white"
                  : "text-[#181818] hover:bg-white/60"
              }`}
            >
              Stanza 3D
            </button>
            <button
              type="button"
              onClick={() => setSceneMode("map-3d")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                sceneMode === "map-3d"
                  ? "bg-[#613BE0] text-white"
                  : "text-[#181818] hover:bg-white/60"
              }`}
            >
              Mappa 3D
            </button>
            <button
              type="button"
              onClick={() => setSceneMode("street-photo")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                sceneMode === "street-photo"
                  ? "bg-[#613BE0] text-white"
                  : "text-[#181818] hover:bg-white/60"
              }`}
            >
              Vista Strada
            </button>
          </div>

          <button
            type="button"
            onClick={onStartBlindRecall}
            className="inline-flex items-center gap-2 rounded-full bg-[#613BE0] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
          >
            <span>▷</span> Avvia Blind Recall ({route.loci.length})
          </button>
        </div>
      </div>

      {/* Main Environment-First Viewport + In-Scene Contextual Overlay */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-[25px] border-2 border-[#181818] bg-[#EFE9FC] shadow-sm lg:col-span-8">
          {sceneMode === "3d-room" ? (
            <div className="relative h-[490px] w-full">
              <canvas
                ref={canvasRef}
                width={820}
                height={490}
                tabIndex={0}
                aria-label="Ambiente 3D interattivo LOCO"
                onKeyDown={(e) => {
                  if (e.key === "w" || e.key === "ArrowUp") moveCamera("forward");
                  if (e.key === "s" || e.key === "ArrowDown") moveCamera("back");
                  if (e.key === "a") moveCamera("left");
                  if (e.key === "d") moveCamera("right");
                  if (e.key === "ArrowLeft")
                    setCam((c) => ({ ...c, yaw: c.yaw + 0.14 }));
                  if (e.key === "ArrowRight")
                    setCam((c) => ({ ...c, yaw: c.yaw - 0.14 }));
                }}
                onPointerDown={(e) => {
                  dragRef.current = {
                    startX: e.clientX,
                    startY: e.clientY,
                    lastX: e.clientX,
                    lastY: e.clientY,
                    moved: false,
                  };
                }}
                onPointerMove={(e) => {
                  if (!dragRef.current) return;
                  const dx = e.clientX - dragRef.current.lastX;
                  const dy = e.clientY - dragRef.current.lastY;
                  if (
                    Math.hypot(
                      e.clientX - dragRef.current.startX,
                      e.clientY - dragRef.current.startY
                    ) > 6
                  ) {
                    dragRef.current.moved = true;
                  }
                  if (dragRef.current.moved) {
                    setCam((prev) => ({
                      ...prev,
                      yaw: prev.yaw - dx * 0.0055,
                      pitch: Math.max(-0.65, Math.min(0.65, prev.pitch - dy * 0.0045)),
                    }));
                  }
                  dragRef.current.lastX = e.clientX;
                  dragRef.current.lastY = e.clientY;
                }}
                onPointerUp={(e) => {
                  if (dragRef.current && !dragRef.current.moved) {
                    handleCanvasClick(e.clientX, e.clientY);
                  }
                  dragRef.current = null;
                }}
                className="h-full w-full cursor-crosshair object-cover outline-none"
              />

              {/* Bottom In-Scene Navigation & Spatial Anchor Bar */}
              <div className="
                absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2
                rounded-[20px] border border-[#181818]/20 bg-white/90 px-4 py-2.5 backdrop-blur-sm
              ">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveCamera("forward")}
                    className="h-8 w-8 rounded-full bg-[#D0C4F6] text-xs font-bold text-[#181818] hover:bg-[#613BE0] hover:text-white"
                    title="Cammina avanti (W)"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCamera("back")}
                    className="h-8 w-8 rounded-full bg-[#D0C4F6] text-xs font-bold text-[#181818] hover:bg-[#613BE0] hover:text-white"
                    title="Cammina indietro (S)"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCamera("left")}
                    className="h-8 w-8 rounded-full bg-[#D0C4F6] text-xs font-bold text-[#181818] hover:bg-[#613BE0] hover:text-white"
                    title="Passo a sinistra (A)"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCamera("right")}
                    className="h-8 w-8 rounded-full bg-[#D0C4F6] text-xs font-bold text-[#181818] hover:bg-[#613BE0] hover:text-white"
                    title="Passo a destra (D)"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => setCam({ x: 0, y: 1.65, z: 3.3, yaw: 0, pitch: -0.08 })}
                    className="ml-1 rounded-full border border-[#613BE0] px-3 py-1 text-xs font-bold text-[#613BE0] hover:bg-[#D0C4F6]/40"
                  >
                    Torna all&apos;ingresso
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      handleCanvasClick(rect.left + rect.width / 2, rect.top + rect.height / 2);
                    }}
                    className="rounded-full bg-[#FFD014] px-4 py-1.5 text-xs font-bold text-[#181818] shadow-sm hover:opacity-95"
                  >
                    + Fissa Locus al mirino
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Street View / Map 3D Mode using exact Figma MAPPETE assets + cloud locus pins */
            <div
              className="relative h-[490px] w-full cursor-crosshair select-none overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const normX = Math.round(((e.clientX - rect.left) / rect.width) * 84 + 8);
                const normY = Math.round(((e.clientY - rect.top) / rect.height) * 80 + 10);
                setPendingAnchor({
                  surface: sceneMode === "map-3d" ? "Mappa Politecnico" : "Street View Ingresso",
                  label: `Tappa ${route.loci.length + 1} (${route.locationLabel})`,
                  x: normX,
                  y: normY,
                  point3d: {
                    x: Number((((normX - 50) / 50) * 3).toFixed(2)),
                    y: 1.2,
                    z: Number((((normY - 50) / 50) * 3).toFixed(2)),
                  },
                });
                setNewLabel(`Tappa ${route.loci.length + 1}`);
                setStatusBanner(
                  "Tappa selezionata sulla mappa! Compila Nozione e Associazione nel pannello in scena."
                );
              }}
            >
              <img
                src={
                  sceneMode === "map-3d"
                    ? "/assets/figma-curated/map-politecnico-3d.webp"
                    : "/assets/figma-curated/photo-politecnico-ingresso.webp"
                }
                alt={route.locationLabel}
                className="h-full w-full object-cover"
              />

              {/* Dashed path connecting loci in order */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                {route.loci.map((loc, idx) => {
                  const next = route.loci[idx + 1];
                  if (!next) return null;
                  return (
                    <line
                      key={`${loc.id}-${next.id}`}
                      x1={`${loc.x}%`}
                      y1={`${loc.y}%`}
                      x2={`${next.x}%`}
                      y2={`${next.y}%`}
                      stroke="#613BE0"
                      strokeWidth="4"
                      strokeDasharray="8 6"
                    />
                  );
                })}
              </svg>

              {/* Cloud markers from Figma MAPPETE */}
              {route.loci.map((loc) => {
                const active = loc.id === selectedLocusId;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLocus(loc.id);
                      setPendingAnchor(null);
                    }}
                    style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                    className={`
                      group absolute -translate-x-1/2 -translate-y-1/2 transition-transform
                      ${active ? "scale-125 z-20" : "hover:scale-110 z-10"}
                    `}
                  >
                    <div className="relative flex items-center justify-center">
                      <img
                        src="/assets/figma-curated/marker-locus-cloud.svg"
                        alt=""
                        className="h-12 w-12 drop-shadow-md"
                      />
                      <span className="
                        absolute flex h-6 w-6 items-center justify-center rounded-full
                        bg-[#613BE0] text-xs font-bold text-white
                      ">
                        {loc.position}
                      </span>
                    </div>
                    <span className="
                      mt-0.5 block whitespace-nowrap rounded-full bg-white/95 px-2.5 py-0.5
                      text-[11px] font-bold text-[#181818] shadow
                    ">
                      {loc.label}
                    </span>
                  </button>
                );
              })}

              {pendingAnchor && (
                <div
                  style={{ left: `${pendingAnchor.x}%`, top: `${pendingAnchor.y}%` }}
                  className="
                    absolute -translate-x-1/2 -translate-y-1/2 z-30 flex h-11 w-11
                    items-center justify-center rounded-full border-2 border-[#181818]
                    bg-[#FFD014] text-lg font-bold text-[#181818] shadow-lg
                  "
                >
                  +
                </div>
              )}

              <div className="
                absolute bottom-4 left-4 right-4 flex items-center justify-between
                rounded-[18px] bg-white/90 px-4 py-2 text-xs font-semibold text-[#181818] backdrop-blur-sm
              ">
                <span>
                  Tocca qualsiasi punto su <strong>{route.locationLabel}</strong> per ancorare un nuovo
                  Locus.
                </span>
                <span className="rounded-full bg-[#D0C4F6] px-3 py-1 font-bold text-[#613BE0]">
                  Coordinate stabili v{route.sceneVersion}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right In-Scene Contextual Inspector & Authoring Card (Lavanda #D0C4F6) */}
        <div className="flex flex-col justify-between rounded-[25px] bg-[#D0C4F6] p-5 lg:col-span-4">
          {pendingAnchor ? (
            /* New Locus In-Scene Creation */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#FFD014] px-3 py-1 text-xs font-bold text-[#181818]">
                  Nuova Ancora Spaziale #{route.loci.length + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPendingAnchor(null)}
                  className="text-xs font-bold text-[#613BE0] underline"
                >
                  Annulla
                </button>
              </div>

              <h2 className="loco-display text-2xl font-bold text-[#181818]">
                Fissa Nozione nel Locus
              </h2>
              <p className="text-xs text-[#181818]/80">
                Superficie: <strong>{pendingAnchor.surface}</strong> • Coord:{" "}
                <code>
                  ({pendingAnchor.point3d.x}, {pendingAnchor.point3d.y}, {pendingAnchor.point3d.z})
                </code>
              </p>

              <label className="text-xs font-bold text-[#181818]">
                Etichetta ancora spaziale
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Es. Scrivania gialla"
                  className="mt-1 w-full rounded-[15px] border border-[#613BE0] bg-white px-3 py-2 text-sm text-[#181818]"
                />
              </label>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#181818]">
                    Domanda / Stimolo di recupero
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerVoiceInput("question")}
                    className="text-[11px] font-bold text-[#613BE0] hover:underline"
                  >
                    {voiceActiveField === "question" ? "🎙️ Ascolto..." : "🎙️ Dettatura voce"}
                  </button>
                </div>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Cosa dovrai ricordare guardando questo punto?"
                  className="w-full rounded-[15px] border border-[#613BE0] bg-white px-3 py-2 text-sm text-[#181818]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#181818]">
                    Nozione verificata (Risposta corretta)
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerVoiceInput("answer")}
                    className="text-[11px] font-bold text-[#613BE0] hover:underline"
                  >
                    {voiceActiveField === "answer" ? "🎙️ Ascolto..." : "🎙️ Voce"}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Il fatto o concetto esatto da verificare nel Blind Recall"
                  className="w-full rounded-[15px] border border-[#613BE0] bg-white px-3 py-2 text-sm text-[#181818]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#181818]">
                    Associazione immaginaria personale (PAV)
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerVoiceInput("association")}
                    className="text-[11px] font-bold text-[#613BE0] hover:underline"
                  >
                    {voiceActiveField === "association" ? "🎙️ Ascolto..." : "🎙️ Voce"}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={newAssociation}
                  onChange={(e) => setNewAssociation(e.target.value)}
                  placeholder="Immagine paradossale, vivida e in movimento sul punto..."
                  className="w-full rounded-[15px] border border-[#613BE0] bg-white px-3 py-2 text-sm text-[#181818]"
                />
              </div>

              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAiSuggestLocus}
                  className="rounded-full border border-[#613BE0] bg-white px-3 py-1.5 text-xs font-bold text-[#613BE0] hover:bg-[#613BE0]/10"
                >
                  ✨ Suggerisci con AI (Proposto)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveNewLocus(true)}
                  className="flex-1 rounded-full bg-[#613BE0] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95"
                >
                  Conferma e Salva nel Locus
                </button>
              </div>
            </div>
          ) : selectedLocus ? (
            /* Selected Locus In-Scene Editor */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#613BE0] px-3 py-1 text-xs font-bold text-white">
                  Locus #{selectedLocus.position} • {selectedLocus.surface}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onReorderLocus(selectedLocus.id, "up")}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#181818] hover:bg-[#FFD014]"
                    title="Sposta prima nel percorso"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorderLocus(selectedLocus.id, "down")}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#181818] hover:bg-[#FFD014]"
                    title="Sposta dopo nel percorso"
                  >
                    ↓
                  </button>
                </div>
              </div>

              {selectedLocus.confirmationState === "proposed" && (
                <div className="rounded-[16px] border-2 border-[#FFD014] bg-white p-3">
                  <p className="text-xs font-bold text-[#181818]">
                    ⚠️ Elemento suggerito da AI (Stato: Proposto)
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#181818]/75">
                    Richiede conferma umana esplicita prima di entrare come target attivo nello
                    scheduler SRS.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateLocus(selectedLocus.id, { confirmationState: "confirmed" })
                    }
                    className="mt-2 rounded-full bg-[#FFD014] px-3.5 py-1 text-xs font-bold text-[#181818]"
                  >
                    ✓ Conferma Nozione e Attiva
                  </button>
                </div>
              )}

              <label className="text-xs font-bold text-[#181818]">
                Ancora spaziale (Locus)
                <input
                  type="text"
                  value={selectedLocus.label}
                  onChange={(e) => onUpdateLocus(selectedLocus.id, { label: e.target.value })}
                  className="mt-1 w-full rounded-[15px] border border-[#613BE0] bg-white px-3 py-1.5 text-sm font-semibold text-[#181818]"
                />
              </label>

              <label className="text-xs font-bold text-[#181818]">
                Domanda / Stimolo
                <input
                  type="text"
                  value={selectedLocus.question}
                  onChange={(e) => onUpdateLocus(selectedLocus.id, { question: e.target.value })}
                  className="mt-1 w-full rounded-[15px] border border-[#613BE0] bg-white px-3 py-1.5 text-sm text-[#181818]"
                />
              </label>

              <label className="text-xs font-bold text-[#181818]">
                Nozione verificata (Risposta corretta)
                <textarea
                  rows={2}
                  value={selectedLocus.answer}
                  onChange={(e) => onUpdateLocus(selectedLocus.id, { answer: e.target.value })}
                  className="mt-1 w-full rounded-[15px] border border-[#613BE0] bg-white px-3 py-1.5 text-sm text-[#181818]"
                />
              </label>

              <label className="text-xs font-bold text-[#181818]">
                Associazione immaginaria personale
                <textarea
                  rows={2}
                  value={selectedLocus.association}
                  onChange={(e) =>
                    onUpdateLocus(selectedLocus.id, { association: e.target.value })
                  }
                  className="mt-1 w-full rounded-[15px] border border-[#613BE0] bg-white px-3 py-1.5 text-sm text-[#181818]"
                />
              </label>

              <div className="grid grid-cols-3 gap-2 rounded-[16px] bg-white/80 p-2.5 text-center text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#181818]/60">
                    Stabilità FSRS
                  </span>
                  <span className="font-bold text-[#613BE0]">
                    {selectedLocus.stability.toFixed(1)} gg
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#181818]/60">
                    Serie
                  </span>
                  <span className="font-bold text-[#181818]">{selectedLocus.streak}x</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#181818]/60">
                    Stato
                  </span>
                  <span className="font-bold text-[#613BE0]">
                    {selectedLocus.confirmationState === "confirmed" ? "Confermato" : "Proposto"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="loco-display text-2xl font-bold text-[#181818]">
                Tocca l&apos;ambiente per aggiungere un Locus
              </h2>
              <p className="text-sm text-[#181818]/80">
                In LOCO l&apos;ambiente viene sempre aperto per primo: clicca un mobile nella Stanza
                3D o un punto della mappa per ancorare nozione e associazione direttamente in scena.
              </p>
            </div>
          )}

          {/* Ordered Loci Sequence Pill Strip */}
          <div className="mt-4 border-t border-[#181818]/15 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#181818]">
                Ordine Loci nel percorso ({route.loci.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setPendingAnchor({
                    surface: "Nuova superficie",
                    label: `Locus ${route.loci.length + 1}`,
                    x: 48,
                    y: 48,
                    point3d: { x: 0, y: 1.2, z: 0 },
                  });
                  setNewLabel(`Locus ${route.loci.length + 1}`);
                }}
                className="text-xs font-bold text-[#613BE0] hover:underline"
              >
                + Nuovo Locus
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {route.loci.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    onSelectLocus(loc.id);
                    setPendingAnchor(null);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    loc.id === selectedLocusId
                      ? "bg-[#FFD014] text-[#181818] ring-2 ring-[#181818]"
                      : loc.confirmationState === "proposed"
                        ? "border border-dashed border-[#613BE0] bg-white text-[#613BE0]"
                        : "bg-white text-[#181818] hover:bg-[#613BE0] hover:text-white"
                  }`}
                >
                  {loc.position}. {loc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
