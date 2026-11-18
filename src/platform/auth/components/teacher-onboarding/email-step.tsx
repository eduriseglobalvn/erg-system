import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import type { RecoveryEmailChallenge, RecoveryEmailVerification } from "@/platform/auth/api/account-security-api";
import { describeOnboardingError } from "@/platform/auth/components/teacher-onboarding/onboarding-helpers";
import { OnboardingSection } from "@/platform/auth/components/teacher-onboarding/onboarding-section";

export type EmailStepProps = {
  /** The sign-in address, offered as the default: most staff verify the mailbox they already use. */
  accountEmail: string;
  onRequestCode: (email: string) => Promise<RecoveryEmailChallenge>;
  onVerifyCode: (input: { challengeId: string; otp: string }) => Promise<RecoveryEmailVerification>;
  onVerified: (result: RecoveryEmailVerification) => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** First-login step 1 (owner rule 18/11): prove a mailbox works before the temporary password is replaced. */
export function EmailStep({ accountEmail, onRequestCode, onVerifyCode, onVerified }: EmailStepProps) {
  const [email, setEmail] = useState(EMAIL.test(accountEmail) ? accountEmail : "");
  const [challenge, setChallenge] = useState<RecoveryEmailChallenge | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (caught) {
      setError(describeOnboardingError(caught instanceof Error ? caught.message : "Không gửi được yêu cầu. Thử lại sau."));
    } finally {
      setBusy(false);
    }
  }

  function requestCode() {
    if (!EMAIL.test(email.trim())) return setError("Nhập một địa chỉ email hợp lệ.");
    void run(async () => {
      setChallenge(await onRequestCode(email.trim()));
      setOtp("");
    });
  }

  function verifyCode() {
    if (!challenge) return;
    if (otp.length !== 6) return setError("Mã xác minh gồm 6 chữ số.");
    void run(async () => {
      const result = await onVerifyCode({ challengeId: challenge.challengeId, otp });
      if (!result.verified) throw new Error("Mã xác minh chưa đúng.");
      onVerified(result);
    });
  }

  const expires = challenge ? formatDateTimeVi(challenge.expiresAt) : "";

  return (
    <OnboardingSection
      icon={<MarkEmailReadRoundedIcon fontSize="small" color="primary" />}
      title="Xác thực email"
      description="Email này dùng để lấy lại mật khẩu khi bạn quên. Chúng tôi gửi một mã 6 chữ số tới đó."
    >
      {error ? <Alert severity="error">{error}</Alert> : null}
      <ErgTextField
        label="Email nhận mã"
        type="email"
        value={email}
        disabled={busy}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { autoComplete: "email" } }}
        onChange={(event) => {
          setEmail(event.target.value);
          setChallenge(null);
        }}
        placeholder="ten@erg.edu.vn"
      />
      {challenge ? (
        <>
          <ErgTextField
            label="Mã xác minh"
            value={otp}
            disabled={busy}
            helperText={`Đã gửi tới ${challenge.maskedEmail}${expires ? `, có hiệu lực đến ${expires}` : ""}.`}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 6, inputMode: "numeric", pattern: "[0-9]*", autoComplete: "one-time-code" } }}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6 chữ số"
          />
          <ErgButton loading={busy} onClick={verifyCode}>Xác thực email</ErgButton>
          <Button variant="text" disabled={busy} onClick={requestCode}>Gửi lại mã</Button>
        </>
      ) : (
        <ErgButton loading={busy} onClick={requestCode}>Gửi mã xác minh</ErgButton>
      )}
    </OnboardingSection>
  );
}
