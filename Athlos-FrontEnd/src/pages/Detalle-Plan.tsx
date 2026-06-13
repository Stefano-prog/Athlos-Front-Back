import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerPlan, type PlanEntrenamiento } from "../data/planesLocal";

const DetallePlan = () => {
  const navigate = useNavigate();
  const { planId = "" } = useParams();
  const [plan, setPlan] = useState<PlanEntrenamiento | null>(null);
  const [rutinaAbierta, setRutinaAbierta] = useState<number | null>(null);
  const [ejercicioAbierto, setEjercicioAbierto] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerPlan(planId)
      .then((data) => { setPlan(data); setRutinaAbierta(data.rutinas[0]?.idrutina || null); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "No se pudo cargar el plan."));
  }, [planId]);

  if (error) return <div className="page-container plan-page"><div className="glass-card plan-shell text-center"><h3 className="text-white">{error}</h3><button className="btn glass-btn-primary mt-3" onClick={() => navigate("/MisPlanes")}>Volver</button></div></div>;
  if (!plan) return <div className="page-container plan-page"><div className="glass-card plan-shell text-center text-muted-glass">Cargando plan...</div></div>;

  return (
    <div className="page-container plan-page">
      <div className="plan-shell w-100">
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn btn-icon-sm" onClick={() => navigate("/MisPlanes")}>←</button>
          <div><span className="plan-eyebrow">PLAN PERSONALIZADO</span><h2 className="fw-bold page-title mb-0">{plan.nombre}</h2></div>
        </div>
        <div className="glass-card mb-4">
          <div className="d-flex flex-wrap gap-2">
            <span className="badge badge-glass">{plan.duracionSemanas} semanas</span>
            <span className="badge badge-glass">{plan.diasPorSemana} rutinas</span>
            <span className="badge badge-glass">{plan.totalEjercicios} ejercicios</span>
          </div>
        </div>

        <div className="d-flex flex-column gap-3">
          {plan.rutinas.map((rutina) => {
            const abierta = rutinaAbierta === rutina.idrutina;
            return (
              <div key={rutina.idrutina} className="glass-card">
                <button className="w-100 border-0 bg-transparent text-start p-0" onClick={() => setRutinaAbierta(abierta ? null : rutina.idrutina)}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div><span className="plan-eyebrow">{rutina.estado}</span><h4 className="text-white mt-2 mb-1">{rutina.nombre}</h4><p className="text-muted-glass mb-0">{rutina.duracion} min · {rutina.ejercicios.length} ejercicios</p></div>
                    <span className="exercise-toggle">{abierta ? "−" : "+"}</span>
                  </div>
                </button>
                {abierta && <div className="plan-exercise-grid mt-3">
                  {rutina.ejercicios.map((ejercicio) => {
                    const ejercicioVisible = ejercicioAbierto === ejercicio.idejercicio;
                    return <button key={ejercicio.idejercicio} className={`exercise-card ${ejercicioVisible ? "exercise-card-open" : ""}`} onClick={() => setEjercicioAbierto(ejercicioVisible ? null : ejercicio.idejercicio)}>
                      <div className="d-flex justify-content-between"><h5 className="text-white mb-2">{ejercicio.nombre}</h5><span className="exercise-toggle">{ejercicioVisible ? "−" : "+"}</span></div>
                      <div className="d-flex gap-2"><span className="badge badge-glass">{ejercicio.series} series</span><span className="badge badge-glass">{ejercicio.repeticiones} repeticiones</span></div>
                      {ejercicioVisible && <div className="exercise-details mt-3 pt-3">{ejercicio.descripcion || "Sin descripción disponible."}</div>}
                    </button>;
                  })}
                </div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DetallePlan;
