import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const URL_BACKEND = import.meta.env.VITE_URL_BACKEND || "http://localhost:3000";

interface EjercicioCatalogo {
  idejercicio: number;
  nombre: string;
  descripcion: string;
}

interface EjercicioInput {
  idejercicio: number;
  series: number;
  repeticiones: number;
}

interface RutinaInput {
  nombre: string;
  duracion: number;
  ejercicios: EjercicioInput[];
}

const CrearPlanManualmente = () => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState("");
  const [cantidadDias, setCantidadDias] = useState(3);
  const [rutinas, setRutinas] = useState<RutinaInput[]>([]);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState<EjercicioCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Cargar catálogo maestro de ejercicios
  useEffect(() => {
    const cargarEjercicios = async () => {
      try {
        setError("");
        const token = localStorage.getItem("athlos_token");
        const response = await fetch(`${URL_BACKEND}/api/exercises/allexercise`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Error al obtener los ejercicios.");
        }

        setEjerciciosDisponibles(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    cargarEjercicios();
  }, []);

  // Adaptar el listado de rutinas según la cantidad especificada
  useEffect(() => {
    setRutinas((prev) => {
      const next = [...prev];
      if (next.length < cantidadDias) {
        for (let i = next.length; i < cantidadDias; i++) {
          next.push({
            nombre: `Día ${i + 1}`,
            duracion: 45,
            ejercicios: []
          });
        }
      } else if (next.length > cantidadDias) {
        next.length = cantidadDias;
      }
      return next;
    });
  }, [cantidadDias]);

  const handleRoutineNameChange = (index: number, nombre: string) => {
    setRutinas((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], nombre };
      return next;
    });
  };

  const handleRoutineDurationChange = (index: number, duracion: number) => {
    setRutinas((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], duracion };
      return next;
    });
  };

  const handleAddExercise = (dayIndex: number) => {
    setRutinas((prev) => {
      const next = [...prev];
      next[dayIndex] = {
        ...next[dayIndex],
        ejercicios: [...next[dayIndex].ejercicios, { idejercicio: 0, series: 3, repeticiones: 10 }]
      };
      return next;
    });
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    setRutinas((prev) => {
      const next = [...prev];
      const nextExercises = [...next[dayIndex].ejercicios];
      nextExercises.splice(exIndex, 1);
      next[dayIndex] = {
        ...next[dayIndex],
        ejercicios: nextExercises
      };
      return next;
    });
  };

  const handleExerciseSelect = (dayIndex: number, exIndex: number, idejercicio: number) => {
    setRutinas((prev) => {
      const next = [...prev];
      const nextExercises = [...next[dayIndex].ejercicios];
      nextExercises[exIndex] = { ...nextExercises[exIndex], idejercicio };
      next[dayIndex] = {
        ...next[dayIndex],
        ejercicios: nextExercises
      };
      return next;
    });
  };

  const handleExerciseValueChange = (dayIndex: number, exIndex: number, key: 'series' | 'repeticiones', value: number) => {
    setRutinas((prev) => {
      const next = [...prev];
      const nextExercises = [...next[dayIndex].ejercicios];
      nextExercises[exIndex] = { ...nextExercises[exIndex], [key]: value };
      next[dayIndex] = {
        ...next[dayIndex],
        ejercicios: nextExercises
      };
      return next;
    });
  };

  const handleGuardarPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("Por favor ingresa un nombre para el plan.");
      return;
    }

    if (rutinas.some((r) => !r.nombre.trim())) {
      setError("Por favor ingresa un nombre para todas las rutinas.");
      return;
    }

    if (rutinas.some((r) => r.duracion <= 0)) {
      setError("La duración de la rutina debe ser mayor a 0.");
      return;
    }

    if (rutinas.some((r) => r.ejercicios.length === 0)) {
      setError("Cada día debe tener al menos un ejercicio agregado.");
      return;
    }

    if (rutinas.some((r) => r.ejercicios.some((ex) => ex.idejercicio === 0))) {
      setError("Selecciona un ejercicio válido para cada espacio.");
      return;
    }

    if (rutinas.some((r) => r.ejercicios.some((ex) => ex.series <= 0 || ex.repeticiones <= 0))) {
      setError("Las series y repeticiones deben ser mayores a 0.");
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
          rutinas,
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

  const isFormInvalid =
    !titulo.trim() ||
    rutinas.length === 0 ||
    rutinas.some(
      (r) =>
        !r.nombre.trim() ||
        r.duracion <= 0 ||
        r.ejercicios.length === 0 ||
        r.ejercicios.some((ex) => ex.idejercicio === 0 || ex.series <= 0 || ex.repeticiones <= 0)
    );

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
            <div className="plan-loader mx-auto mb-3" aria-label="Cargando ejercicios" />
            <p className="text-muted-glass">Cargando ejercicios disponibles...</p>
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
              <h4 className="fw-bold text-white mb-1" style={{ fontSize: "1.1rem" }}>Ejercicios por Día</h4>
              <p className="text-muted-glass mb-3 small">
                Nombra tu rutina, define su duración total y agrega los ejercicios que realizarás.
              </p>

              <div className="d-flex flex-column gap-4">
                {rutinas.map((rutina, dayIndex) => (
                  <div key={dayIndex} className="glass-card p-3" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "14px" }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold text-teal small">Configuración del Día {dayIndex + 1}</span>
                    </div>

                    {/* Nombre y Duración de la rutina del día */}
                    <div className="row g-2 mb-3">
                      <div className="col-8">
                        <label className="text-white-50 small mb-1">Nombre Rutina</label>
                        <input
                          type="text"
                          className="form-control glass-input py-1"
                          style={{ fontSize: "13px" }}
                          value={rutina.nombre}
                          onChange={(e) => handleRoutineNameChange(dayIndex, e.target.value)}
                          placeholder="Ej. Tren Superior"
                          required
                        />
                      </div>
                      <div className="col-4">
                        <label className="text-white-50 small mb-1">Duración (min)</label>
                        <input
                          type="number"
                          className="form-control glass-input py-1 text-center"
                          style={{ fontSize: "13px" }}
                          value={rutina.duracion}
                          min={5}
                          max={300}
                          onChange={(e) => handleRoutineDurationChange(dayIndex, Number(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    <div className="border-bottom border-secondary-subtle mb-3"></div>

                    {/* Listado de ejercicios agregados a este día */}
                    <div className="mb-3">
                      <span className="text-white-50 d-block mb-2 fw-semibold small">Ejercicios:</span>
                      
                      {rutina.ejercicios.length === 0 ? (
                        <div className="text-center py-3 text-muted-glass small" style={{ border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}>
                          No hay ejercicios agregados a este día.
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {rutina.ejercicios.map((ex, exIndex) => (
                            <div key={exIndex} className="p-2 rounded" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                              <div className="d-flex gap-2 mb-2 align-items-center">
                                <select
                                  className="form-select glass-input flex-grow-1 py-1"
                                  value={ex.idejercicio}
                                  onChange={(e) => handleExerciseSelect(dayIndex, exIndex, Number(e.target.value))}
                                  style={{ fontSize: "13px", background: "rgba(0, 0, 0, 0.25)", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px" }}
                                >
                                  <option value={0}>Selecciona un ejercicio...</option>
                                  {ejerciciosDisponibles.map((e) => (
                                    <option key={e.idejercicio} value={e.idejercicio} style={{ background: "#1c2336", color: "#fff" }}>
                                      {e.nombre}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm px-2 d-flex align-items-center justify-content-center"
                                  onClick={() => handleRemoveExercise(dayIndex, exIndex)}
                                  style={{ borderRadius: "8px", height: "34px", width: "34px" }}
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="d-flex gap-3 align-items-center px-1">
                                <div className="d-flex align-items-center gap-1">
                                  <label className="text-white-50 small" style={{ fontSize: "12px" }}>Series:</label>
                                  <input
                                    type="number"
                                    className="form-control text-center text-white p-1"
                                    style={{
                                      width: "55px",
                                      height: "32px",
                                      fontSize: "13px",
                                      background: "rgba(255, 255, 255, 0.05)",
                                      border: "1px solid rgba(255, 255, 255, 0.15)",
                                      borderRadius: "6px"
                                    }}
                                    value={ex.series}
                                    min={1}
                                    onChange={(e) => handleExerciseValueChange(dayIndex, exIndex, 'series', Number(e.target.value))}
                                  />
                                </div>
                                <div className="d-flex align-items-center gap-1">
                                  <label className="text-white-50 small" style={{ fontSize: "12px" }}>Reps:</label>
                                  <input
                                    type="number"
                                    className="form-control text-center text-white p-1"
                                    style={{
                                      width: "55px",
                                      height: "32px",
                                      fontSize: "13px",
                                      background: "rgba(255, 255, 255, 0.05)",
                                      border: "1px solid rgba(255, 255, 255, 0.15)",
                                      borderRadius: "6px"
                                    }}
                                    value={ex.repeticiones}
                                    min={1}
                                    onChange={(e) => handleExerciseValueChange(dayIndex, exIndex, 'repeticiones', Number(e.target.value))}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Botón añadir ejercicio */}
                    <button
                      type="button"
                      className="btn btn-outline-info btn-sm w-100 py-1"
                      style={{ fontSize: "12px", borderRadius: "8px", border: "1px dashed rgba(116, 195, 210, 0.4)", color: "#74c3d2" }}
                      onClick={() => handleAddExercise(dayIndex)}
                    >
                      + Añadir Ejercicio
                    </button>
                  </div>
                ))}
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
