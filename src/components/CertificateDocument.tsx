import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import logoFull from "@/assets/logo-myclinic.png";
import {
  formatLongDate,
  symptomLabel,
  type MedicalCertificate,
} from "@/lib/certificates";

/**
 * MC document template — STRICT, fixed layout.
 * Used for both on-screen preview and print-to-PDF.
 *
 * Do not parameterize the layout. Only data is dynamic.
 */
export function CertificateDocument({
  mc,
  verifyUrl,
}: {
  mc: MedicalCertificate;
  verifyUrl: string;
}) {
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrRef.current) {
      QRCode.toCanvas(qrRef.current, verifyUrl, {
        width: 96,
        margin: 0,
        color: { dark: "#0A2D56", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      }).catch(() => {});
    }
  }, [verifyUrl]);

  return (
    <article className="mc-document">
      {/* HEADER */}
      <header className="mc-header">
        <img src={logoFull} alt="MyClinIQ" className="mc-logo" />
        <div className="mc-header-meta">
          <p className="mc-cert-id">Certificate No.</p>
          <p className="mc-cert-id-value">{mc.id}</p>
        </div>
      </header>

      <div className="mc-rule-strong" />
      <h1 className="mc-title">MEDICAL CERTIFICATE</h1>
      <p className="mc-subtitle">Issued under registered clinical authority</p>
      <div className="mc-rule" />

      {/* CLINIC + DOCTOR */}
      <section className="mc-section">
        <div className="mc-grid-2">
          <div>
            <p className="mc-label">Issuing Clinic</p>
            <p className="mc-value-strong">{mc.clinic.name}</p>
            <p className="mc-value-muted">{mc.clinic.address}</p>
          </div>
          <div>
            <p className="mc-label">Attending Physician</p>
            <p className="mc-value-strong">{mc.doctor.name}</p>
            <p className="mc-value-muted">{mc.doctor.qualification}</p>
            <p className="mc-value-muted">Reg. No. {mc.doctor.registrationNumber}</p>
          </div>
        </div>
      </section>

      <div className="mc-rule" />

      {/* PATIENT */}
      <section className="mc-section">
        <p className="mc-section-title">Patient Particulars</p>
        <div className="mc-grid-2">
          <div>
            <p className="mc-label">Full Name</p>
            <p className="mc-value-strong">{mc.patient.fullName || "—"}</p>
          </div>
          <div>
            <p className="mc-label">IC / ID Number</p>
            <p className="mc-value-strong">{mc.patient.icNumber || "—"}</p>
          </div>
          <div>
            <p className="mc-label">Date of Examination</p>
            <p className="mc-value-strong">{formatLongDate(mc.examination.date)}</p>
          </div>
          <div>
            <p className="mc-label">Severity Assessment</p>
            <p className="mc-value-strong" style={{ textTransform: "capitalize" }}>
              {mc.examination.severity}
            </p>
          </div>
        </div>
      </section>

      <div className="mc-rule" />

      {/* CERTIFICATION */}
      <section className="mc-section">
        <p className="mc-section-title">Certification</p>
        <p className="mc-cert-text">
          This is to certify that{" "}
          <strong>{(mc.patient.fullName || "[PATIENT NAME]").toUpperCase()}</strong>{" "}
          (IC: {mc.patient.icNumber || "—"}) was examined on{" "}
          <strong>{formatLongDate(mc.examination.date)}</strong> at{" "}
          <strong>{mc.clinic.name}</strong> and is hereby advised{" "}
          <strong>medical leave for {mc.rest.days} day{mc.rest.days === 1 ? "" : "s"}</strong>,
          from <strong>{formatLongDate(mc.rest.startDate)}</strong> to{" "}
          <strong>{formatLongDate(mc.rest.endDate)}</strong>, inclusive, due to{" "}
          <strong>{mc.examination.condition}</strong>.
        </p>

        <div className="mc-details">
          <div>
            <p className="mc-label">Diagnosis / Condition</p>
            <p className="mc-value-strong">{mc.examination.condition}</p>
          </div>
          <div>
            <p className="mc-label">Reported Symptoms</p>
            <p className="mc-value-strong">
              {mc.examination.symptoms.length === 0
                ? "Not specified"
                : mc.examination.symptoms.map(symptomLabel).join(", ")}
            </p>
          </div>
          <div>
            <p className="mc-label">Days of Rest</p>
            <p className="mc-value-strong">{mc.rest.days} day{mc.rest.days === 1 ? "" : "s"}</p>
          </div>
          <div>
            <p className="mc-label">Period of Leave</p>
            <p className="mc-value-strong">
              {formatLongDate(mc.rest.startDate)} – {formatLongDate(mc.rest.endDate)}
            </p>
          </div>
        </div>
      </section>

      <div className="mc-rule" />

      {/* SIGNATURE + QR */}
      <section className="mc-section mc-sig-row">
        <div className="mc-sig-block">
          <p className="mc-signature-script">{mc.doctor.name}</p>
          <div className="mc-sig-line" />
          <p className="mc-value-strong">{mc.doctor.name}</p>
          <p className="mc-value-muted">{mc.doctor.qualification}</p>
          <p className="mc-value-muted">Reg. No. {mc.doctor.registrationNumber}</p>
          <p className="mc-issued-tag">Digitally Issued</p>
        </div>
        <div className="mc-qr-block">
          <canvas ref={qrRef} width={96} height={96} aria-label="Verification QR" />
          <p className="mc-qr-label">Scan to verify</p>
          <p className="mc-qr-id">{mc.id}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mc-footer">
        <div className="mc-rule" />
        <div className="mc-footer-row">
          <p>Date Issued: <strong>{formatLongDate(mc.issuedAt)}</strong></p>
          <p>Certificate ID: <strong>{mc.id}</strong></p>
        </div>
        <p className="mc-footer-note">
          This certificate is digitally generated and linked to a registered consultation record.
          Verify authenticity at the URL encoded in the QR code above.
        </p>
      </footer>
    </article>
  );s
}
