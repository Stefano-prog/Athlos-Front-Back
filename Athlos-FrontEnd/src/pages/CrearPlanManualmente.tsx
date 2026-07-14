import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CrearPlanManualmente = () => {
    const navigate = useNavigate();
    const [titulo, setTitulo] = useState("");
    

    return (
        <div className="page-container">
        <div className="d-flex align-items-center gap-3 mb-4">
            <button className="btn btn-icon-sm" onClick={() => navigate("/Menu")} title="Volver al menú">←</button>
            <div className="flex-grow-1">
            <h2 className="fw-bold page-title mb-0">Crear Plan Manualmente</h2>
            </div>
            <div className="glass-card" style={{ width: "100%", maxWidth: "420px" }}>
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 divider-bottom">
                    <h4 className="fw-bold mb-0 card-title">
                        Datos del Plan
                    </h4>
                </div>

                <p className="fw-semibold mb-3 section-label">Título del plan</p>
                <div className="input-group">
                <input className="form-control glass-input" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título del plan" />
                </div>
            </div>
            </div>
        </div>
    );
};

export default CrearPlanManualmente;
