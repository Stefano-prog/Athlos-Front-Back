import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const URL_BACKEND = import.meta.env.VITE_URL_BACKEND || "http://localhost:3000";

interface EjercicioPlan {
  idejercicio: number;
  nombre: string;
  descripcion: string;
  link: string;
  series: number;
  repeticiones: number;
}

interface AvailableRoutine {
  idrutina: number;
  nombre: string;
  duracion: number;
  ejercicios: EjercicioPlan[];
}

const CrearPlanManualmente = () => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState("");
  const [cantidadDias, setCantidadDias] = useState(3);
  const [diasSeleccionados, setDiasSeleccionados] = useState<Array<{ dia: string; idrutina: number }>>([]);
  const [rutinasDisponibles, setRutinasDisponibles] = useState<AvailableRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Cargar rutinas pre-existentes del backend
  useEffect(() => {
    const cargarRutinas = async () => {
      try {
        setError("");
        const token = localStorage.getItem("athlos_token");
        const response = await fetch(`${URL_BACKEND}/api/plans/routines`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Error al obtener las rutinas.");
        }

        setRutinasDisponibles(data.data.routines || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    cargarRutinas();
  }, []);

  // Adaptar el listado de días seleccionados según la cantidad especificada
  useEffect(() => {
    setDiasSeleccionados((prev) => {
      const next = [...prev];
      if (next.length < cantidadDias) {
        for (let i = next.length; i < cantidadDias; i++) {
          next.push({ dia: `Día ${i + 1}`, idrutina: 0 });
        }
      } else if (next.length > cantidadDias) {
        next.length = cantidadDias;
      }
      return next;
    });
  }, [cantidadDias]);

  const handleRoutineChange = (index: number, idrutina: number) => {
    setDiasSeleccionados((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], idrutina };
      return next;
    });
  };

  const getRoutineById = (id: number) => {
    return rutinasDisponibles.find((r) => r.idrutina === id);
  };

  const handleGuardarPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("Por favor ingresa un nombre para el plan.");
      return;
    }

    if (diasSeleccionados.some((d) => d.idrutina === 0)) {
      setError("Por favor selecciona una rutina para todos los días.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      const token = localStorage.getItem("athlos_token");

      const response = await fetch(`${URL_BACKEND}/api/plans/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nombreplan: titulo,
          diasSeleccionados,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al crear el plan.");
      }

      // Redireccionar al detalle del nuevo plan creado
      navigate(`/MisPlanes/${data.data.plan.idplan}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el plan.");
    } finally {
      setGuardando(false);
    }
  };

  const isFormInvalid = !titulo.trim() || diasSeleccionados.some((d) => d.idrutina === 0);

  return (
    <div className="page-container plan-page px-2 py-3 w-100">
      <div className="glass-card plan-shell mx-auto">
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4 pb-2 divider-bottom">
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate("/Menu")}
            title="Volver al menú"
            style={{ borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255, 255, 255, 0.2)" }}
          >
            ←
          </button>
          <div>
            <span className="plan-eyebrow">CREADOR MANUAL</span>
            <h2 className="fw-bold text-white mt-1 mb-0" style={{ fontSize: "1.45rem" }}>Crear Plan</h2>
          </div>
        </div>

        {error && <div className="alert-glass-error mb-4">{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="plan-loader mx-auto mb-3" aria-label="Cargando rutinas" />
            <p className="text-muted-glass">Cargando rutinas disponibles...</p>
          </div>
        ) : (
          <form onSubmit={handleGuardarPlan} className="d-flex flex-column gap-4">
            {/* Input Nombre Plan */}
            <div className="w-100">
              <label className="fw-semibold text-white-50 mb-2 small">Nombre del Plan</label>
              <input
                className="form-control glass-input w-100"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Mi Plan de Hipertrofia, Reto de Verano"
                maxLength={50}
                required
              />
            </div>

            {/* Cantidad de Días */}
            <div className="w-100">
              <label className="fw-semibold text-white-50 mb-2 small">Cantidad de Días</label>
              <div className="d-flex justify-content-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    type="button"
                    key={num}
                    className={`btn d-flex align-items-center justify-content-center flex-fill ${cantidadDias === num ? "glass-btn-primary text-dark" : "btn-outline-light text-white"}`}
                    style={{
                      height: "36px",
                      borderRadius: "50%",
                      fontSize: "13px",
                      fontWeight: "bold",
                      border: cantidadDias === num ? "none" : "1px solid rgba(255,255,255,0.15)",
                      padding: "0"
                    }}
                    onClick={() => setCantidadDias(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider-bottom"></div>

            {/* Rutinas por Día */}
            <div>
              <h4 className="fw-bold text-white mb-1" style={{ fontSize: "1.1rem" }}>Rutinas por Día</h4>
              <p className="text-muted-glass mb-3 small">
                Elige una rutina pre-existente para cada día de tu plan.
              </p>

              <div className="d-flex flex-column gap-3">
                {diasSeleccionados.map((diaSel, index) => {
                  const selectedRoutine = getRoutineById(diaSel.idrutina);

                  return (
                    <div key={index} className="glass-card p-3" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "14px" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-teal small">{diaSel.dia}</span>
                        {selectedRoutine && (
                          <span className="badge bg-secondary-subtle text-dark-emphasis small">
                            ⏱️ {selectedRoutine.duracion}m
                          </span>
                        )}
                      </div>

                      <select
                        className="form-select glass-input w-100"
                        style={{
                          background: "rgba(0, 0, 0, 0.25)",
                          color: "#fff",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "10px",
                          fontSize: "14px"
                        }}
                        value={diaSel.idrutina}
                        onChange={(e) => handleRoutineChange(index, Number(e.target.value))}
                      >
                        <option value={0}>Selecciona una rutina...</option>
                        {rutinasDisponibles.map((r) => (
                          <option key={r.idrutina} value={r.idrutina} style={{ background: "#1c2336", color: "#fff" }}>
                            {r.nombre}
                          </option>
                        ))}
                      </select>

                      {selectedRoutine ? (
                        <div className="mt-3 p-2 rounded text-start" style={{ background: "rgba(255, 255, 255, 0.03)", fontSize: "13px" }}>
                          <span className="text-muted-glass d-block mb-1 fw-semibold small">Ejercicios:</span>
                          <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                            {selectedRoutine.ejercicios.map((ex) => (
                              <div key={ex.idejercicio} className="d-flex justify-content-between text-muted-glass border-bottom border-secondary-subtle py-1" style={{ fontSize: "12px" }}>
                                <span>• {ex.nombre}</span>
                                <span className="text-white-50">{ex.series}x{ex.repeticiones}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 text-center py-2 text-muted-glass small" style={{ border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}>
                          Ninguna rutina seleccionada
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Acciones */}
            <div className="d-flex flex-column gap-2 mt-3">
              <button
                type="submit"
                className="btn glass-btn-primary w-100"
                disabled={isFormInvalid || guardando}
              >
                {guardando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Guardando plan...
                  </>
                ) : (
                  `Crear Plan Manual`
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-light w-100"
                onClick={() => navigate("/Menu")}
                disabled={guardando}
              >
                Cancelar y Volver
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CrearPlanManualmente;
