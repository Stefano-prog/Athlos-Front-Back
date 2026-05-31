import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Step = "email" | "codigo" | "password" | "exito";

const RecuperarContrasena = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>("email");
    const [correo, setCorreo] = useState("");
    const [codigo, setCodigo] = useState("");
    const [nuevaPassword, setNuevaPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Paso 1: solicitar código
    const handleSolicitarCodigo = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!correo) { setError("Por favor, ingrese su correo electrónico."); return; }
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3000/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: correo }),
            });
            const data = await res.json();
            if (data.success) {
                setStep("codigo");
            } else {
                setError(data.message || "Error al enviar el código.");
            }
        } catch {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    // Paso 2: verificar código
    const handleVerificarCodigo = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (codigo.length !== 6) { setError("El código debe tener 6 dígitos."); return; }
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3000/api/auth/verify-reset-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: correo, codigo }),
            });
            const data = await res.json();
            if (data.success) {
                setStep("password");
            } else {
                setError(data.message || "Código incorrecto.");
            }
        } catch {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    // Paso 3: nueva contraseña
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (nuevaPassword.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
        if (nuevaPassword !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3000/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: correo, codigo, nuevaPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setStep("exito");
            } else {
                setError(data.message || "Error al actualizar la contraseña.");
            }
        } catch {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="logo-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path d="M96 176C96 149.5 117.5 128 144 128C170.5 128 192 149.5 192 176L192 288L448 288L448 176C448 149.5 469.5 128 496 128C522.5 128 544 149.5 544 176L544 192L560 192C586.5 192 608 213.5 608 240L608 288C625.7 288 640 302.3 640 320C640 337.7 625.7 352 608 352L608 400C608 426.5 586.5 448 560 448L544 448L544 464C544 490.5 522.5 512 496 512C469.5 512 448 490.5 448 464L448 352L192 352L192 464C192 490.5 170.5 512 144 512C117.5 512 96 490.5 96 464L96 448L80 448C53.5 448 32 426.5 32 400L32 352C14.3 352 0 337.7 0 320C0 302.3 14.3 288 32 288L32 240C32 213.5 53.5 192 80 192L96 192L96 176z" />
                    </svg>
                </div>
                <h2 className="fw-bold page-title">Athlos</h2>
                <p className="page-subtitle">Recuperación de Acceso a su Perfil</p>
            </div>

            <div className="glass-card">

                {/* PASO 1: Ingresar correo */}
                {step === "email" && (
                    <>
                        <h4 className="fw-bold mb-1 text-start card-title">Recuperar cuenta</h4>
                        <p className="text-start mb-4 card-subtitle">
                            Ingrese su correo registrado y le enviaremos un código de verificación.
                        </p>
                        <form onSubmit={handleSolicitarCodigo}>
                            <div className="mb-4 text-start">
                                <label className="form-label fw-semibold text-label">Correo Electrónico</label>
                                <div className="input-group">
                                    <span className="input-group-text glass-input-group-text">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z" />
                                        </svg>
                                    </span>
                                    <input
                                        className="form-control glass-input"
                                        type="email"
                                        placeholder="nombre@correo.com"
                                        value={correo}
                                        onChange={e => setCorreo(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {error && <div className="alert-glass-error mb-3 text-start">{error}</div>}
                            <div className="d-grid mb-3 mt-4">
                                <button className="btn glass-btn-accent py-2" type="submit" disabled={loading}>
                                    {loading ? "Enviando..." : "Enviar Código"}
                                </button>
                            </div>
                            <div className="text-center mt-3">
                                <a href="#" className="link-teal" style={{ fontSize: "0.85rem" }}
                                    onClick={e => { e.preventDefault(); navigate("/"); }}>
                                    Volver al Inicio de Sesión
                                </a>
                            </div>
                        </form>
                    </>
                )}

                {/* PASO 2: Ingresar código */}
                {step === "codigo" && (
                    <div className="text-start">
                        <div className="success-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#28A745" viewBox="0 0 16 16">
                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z" />
                            </svg>
                        </div>
                        <h4 className="fw-bold mb-2 card-title">Código enviado</h4>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", lineHeight: "1.5" }}>
                            Revisa tu correo <strong>{correo}</strong> e ingresa el código de 6 dígitos.
                        </p>
                        <form onSubmit={handleVerificarCodigo} className="mt-4">
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-label">Código de verificación</label>
                                <input
                                    className="form-control glass-input text-center"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="123456"
                                    value={codigo}
                                    onChange={e => setCodigo(e.target.value.replace(/\D/g, ""))}
                                    style={{ fontSize: "1.5rem", letterSpacing: "6px" }}
                                    required
                                />
                            </div>
                            {error && <div className="alert-glass-error mb-3">{error}</div>}
                            <div className="d-grid mb-2">
                                <button className="btn glass-btn-accent py-2" type="submit" disabled={loading}>
                                    {loading ? "Verificando..." : "Verificar Código"}
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <a href="#" className="link-teal" style={{ fontSize: "0.82rem" }}
                                    onClick={e => { e.preventDefault(); setStep("email"); setError(""); }}>
                                    ← Cambiar correo
                                </a>
                            </div>
                        </form>
                    </div>
                )}

                {/* PASO 3: Nueva contraseña */}
                {step === "password" && (
                    <div className="text-start">
                        <h4 className="fw-bold mb-2 card-title">Nueva contraseña</h4>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem" }}>
                            Elige una nueva contraseña segura para tu cuenta.
                        </p>
                        <form onSubmit={handleResetPassword} className="mt-4">
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-label">Nueva Contraseña</label>
                                <div className="input-group">
                                    <span className="input-group-text glass-input-group-text">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" />
                                        </svg>
                                    </span>
                                    <input className="form-control glass-input" type="password" placeholder="Mínimo 6 caracteres"
                                        value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} required />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold text-label">Confirmar Contraseña</label>
                                <div className="input-group">
                                    <span className="input-group-text glass-input-group-text">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1" />
                                        </svg>
                                    </span>
                                    <input className="form-control glass-input" type="password" placeholder="Repita su nueva contraseña"
                                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                </div>
                            </div>
                            {error && <div className="alert-glass-error mb-3">{error}</div>}
                            <div className="d-grid mb-2">
                                <button className="btn glass-btn-primary py-2" type="submit" disabled={loading}>
                                    {loading ? "Actualizando..." : "Actualizar Contraseña"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* PASO FINAL: Éxito */}
                {step === "exito" && (
                    <div className="text-start">
                        <div className="success-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#28A745" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                            </svg>
                        </div>
                        <h4 className="fw-bold mb-2 card-title">¡Contraseña actualizada!</h4>
                        <p style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: "0.88rem", lineHeight: "1.5" }}>
                            Tu contraseña fue restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.
                        </p>
                        <div className="d-grid mt-4">
                            <button className="btn glass-btn-primary py-2" onClick={() => navigate("/")}>
                                Ir al Inicio de Sesión
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default RecuperarContrasena;

