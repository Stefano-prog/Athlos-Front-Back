import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Complexion = "ectomorfo" | "mesomorfo" | "endomorfo";
type Objetivo = "bajar_peso" | "mantener_peso" | "ganar_musculo";

const DatosUsuario = () => {
    const navigate = useNavigate();

    const [peso, setPeso] = useState<string>("");
    const [talla, setTalla] = useState<string>("");
    const [edad, setEdad] = useState<string>("");
    const [complexion, setComplexion] = useState<Complexion>("mesomorfo");
    const [objetivo, setObjetivo] = useState<Objetivo>("bajar_peso");
    const [error, setError] = useState<string>("");
    const [guardadoExitoso, setGuardadoExitoso] = useState<boolean>(false);
    const [idDatosGenerado, setIdDatosGenerado] = useState<string>("");

    const handlePesoChange = (e: React.ChangeEvent<HTMLInputElement>) => setPeso(e.currentTarget.value);
    const handleTallaChange = (e: React.ChangeEvent<HTMLInputElement>) => setTalla(e.currentTarget.value);
    const handleEdadChange = (e: React.ChangeEvent<HTMLInputElement>) => setEdad(e.currentTarget.value);

    const pesoNum = Number(peso);
    const tallaM = Number(talla) / 100;
    const imc = pesoNum > 0 && tallaM > 0 ? pesoNum / (tallaM * tallaM) : null;

    const imcTexto =
        imc === null ? "" :
        imc < 18.5 ? "Bajo peso" :
        imc < 25 ? "Peso normal" :
        imc < 30 ? "Sobrepeso" : "Obesidad";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!peso || !talla || !edad) {
            setError("Por favor, complete todos los campos obligatorios.");
            return;
        }
        if (pesoNum < 20 || pesoNum > 400) {
            setError("El peso debe estar entre 20 y 400 kg.");
            return;
        }
        const tallaNum = Number(talla);
        if (tallaNum < 80 || tallaNum > 260) {
            setError("La talla debe estar entre 80 y 260 cm.");
            return;
        }
        const edadNum = Number(edad);
        if (edadNum < 10 || edadNum > 120) {
            setError("La edad debe estar entre 10 y 120 años.");
            return;
        }

        const idGenerado = `DATOS-${Math.floor(1000 + Math.random() * 9000)}`;
        setIdDatosGenerado(idGenerado);
        localStorage.setItem("athlos_datos", JSON.stringify({ peso, talla, edad, complexion, objetivo }));
        setGuardadoExitoso(true);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="logo-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path d="M96 176C96 149.5 117.5 128 144 128C170.5 128 192 149.5 192 176L192 288L448 288L448 176C448 149.5 469.5 128 496 128C522.5 128 544 149.5 544 176L544 192L560 192C586.5 192 608 213.5 608 240L608 288C625.7 288 640 302.3 640 320C640 337.7 625.7 352 608 352L608 400C608 426.5 586.5 448 560 448L544 448L544 464C544 490.5 522.5 512 496 512C469.5 512 448 490.5 448 464L448 352L192 352L192 464C192 490.5 170.5 512 144 512C117.5 512 96 490.5 96 464L96 448L80 448C53.5 448 32 426.5 32 400L32 352C14.3 352 0 337.7 0 320C0 302.3 14.3 288 32 288L32 240C32 213.5 53.5 192 80 192L96 192L96 176z" />
                    </svg>
                </div>
                <h2 className="fw-bold page-title">Mis Datos Personales</h2>
                <p className="page-subtitle">Sus medidas físicas definen su perfil corporal en la plataforma.</p>
            </div>

            <div className="glass-card">
                {!guardadoExitoso ? (
                    <>
                        <h4 className="fw-bold mb-1 text-start card-title">Perfil Corporal</h4>
                        <p className="text-start mb-4 card-subtitle">
                            Ingrese sus mediciones obligatorias para calibrar los algoritmos de entrenamiento.
                        </p>

                        <form onSubmit={handleSubmit}>
                            {/* Peso */}
                            <div className="mb-3 text-start">
                                <label className="form-label fw-semibold text-label">Peso (kg)</label>
                                <div className="input-group">
                                    <span className="input-group-text glass-input-group-text">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                                            <path d="M8 4a3 3 0 0 1 2.599 4.5H5.4A3 3 0 0 1 8 4m1.024 2.633L9.4 5.7a.2.2 0 0 0-.36-.173l-.473.879A2 2 0 0 0 8 6a2 2 0 1 0 1.024.633" />
                                        </svg>
                                    </span>
                                    <input className="form-control glass-input" type="number" step="0.1" placeholder="Ej. 72.5" value={peso} onChange={handlePesoChange} required />
                                </div>
                            </div>

                            {/* Talla */}
                            <div className="mb-3 text-start">
                                <label className="form-label fw-semibold text-label">Talla (cm)</label>
                                <div className="input-group">
                                    <span className="input-group-text glass-input-group-text">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 0a.5.5 0 0 1 .354.146l3 3a.5.5 0 0 1-.708.708L8.5 1.707v12.586l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 14.293V1.707L5.354 3.854a.5.5 0 1 1-.708-.708l3-3A.5.5 0 0 1 8 0" />
                                        </svg>
                                    </span>
                                    <input className="form-control glass-input" type="number" placeholder="Ej. 175" value={talla} onChange={handleTallaChange} required />
                                </div>
                            </div>

                            {/* Edad */}
                            <div className="mb-3 text-start">
                                <label className="form-label fw-semibold text-label">Edad (años)</label>
                                <div className="input-group">
                                    <span className="input-group-text glass-input-group-text">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z" />
                                        </svg>
                                    </span>
                                    <input className="form-control glass-input" type="number" placeholder="Ej. 26" value={edad} onChange={handleEdadChange} required />
                                </div>
                            </div>

                            {/* IMC en vivo */}
                            {imc !== null && (
                                <div className="imc-box d-flex justify-content-between align-items-center my-4">
                                    <span className="fw-semibold text-label-sm">IMC Estimado</span>
                                    <span className="fw-bold text-teal" style={{ fontSize: "0.9rem" }}>
                                        {imc.toFixed(1)} · {imcTexto}
                                    </span>
                                </div>
                            )}

                            {/* Complexión */}
                            <div className="mb-4 text-start">
                                <label className="form-label fw-semibold text-label">Complexión</label>
                                <div className="d-flex gap-2">
                                    {(["ectomorfo", "mesomorfo", "endomorfo"] as Complexion[]).map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setComplexion(val)}
                                            className={`btn flex-fill py-2 text-capitalize btn-option${complexion === val ? " active" : ""}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Objetivo */}
                            <div className="mb-4 text-start">
                                <label className="form-label fw-semibold text-label">Objetivo Personal</label>
                                <div className="d-flex flex-column gap-2">
                                    {([
                                        ["bajar_peso", "Reducción de peso"],
                                        ["mantener_peso", "Mantenimiento físico"],
                                        ["ganar_musculo", "Ganancia de masa muscular"]
                                    ] as [Objetivo, string][]).map(([val, label]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setObjetivo(val)}
                                            className={`btn text-start py-2 px-3 btn-option${objetivo === val ? " active" : ""}`}
                                            style={{ fontSize: "0.85rem" }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="alert-glass-error mb-3 text-start">{error}</div>
                            )}

                            <div className="d-grid mt-4">
                                <button className="btn glass-btn-accent py-2" type="submit">Guardar</button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-start">
                        <div className="success-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#28A745" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                            </svg>
                        </div>
                        <h4 className="fw-bold mb-2 card-title">Mediciones registradas</h4>
                        <p style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: "0.88rem", lineHeight: "1.5" }}>
                            Datos guardados correctamente.
                        </p>

                        <div className="alert-glass-info my-3">
                            <span className="d-block text-muted" style={{ fontSize: "0.78rem" }}>
                                Identificador único asignado:
                            </span>
                            <div className="font-monospace fw-bold mt-1 text-white" style={{ fontSize: "1.1rem" }}>
                                ID: {idDatosGenerado}
                            </div>
                        </div>

                        <div className="data-display my-3" style={{ fontSize: "0.8rem" }}>
                            <div className="fw-semibold text-white mb-2">Resumen registrado:</div>
                            <div>• Peso corporal: {peso} kg</div>
                            <div>• Talla corporal: {talla} cm</div>
                            <div>• Edad actual: {edad} años</div>
                            <div className="text-capitalize">• Complexión física: {complexion}</div>
                            <div>• IMC calculado: {imc ? imc.toFixed(1) : ""} ({imcTexto})</div>
                        </div>

                        <div className="d-grid mt-4">
                            <button className="btn glass-btn-primary py-2" onClick={() => navigate("/Entorno")}>
                                Continuar al Entorno
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatosUsuario;
