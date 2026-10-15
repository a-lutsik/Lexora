import { useI18n } from "../../hooks/useI18n";
import { Button } from "./Button";

type ErrorFallbackProps = {
  onRetry: () => void;
  onReload: () => void;
};

export function ErrorFallback({ onRetry, onReload }: ErrorFallbackProps) {
  const { t: tUi } = useI18n();
    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary-card">
          <h2 className="error-boundary-title">{tUi("Something went wrong")}</h2>
          <p className="error-boundary-text">{tUi("This screen hit an unexpected error. Your words and progress are safe.")}</p>
          <div className="error-boundary-actions">
            <Button variant="primary" onClick={onRetry}>{tUi("Try again")}</Button>
            <Button onClick={onReload}>{tUi("Reload window")}</Button>
          </div>
        </div>
      </div>
    );
}
