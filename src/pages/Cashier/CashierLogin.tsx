import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useLogin } from "../../hooks/useAuth";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { Input } from "../../components/core/Input";
import { Button } from "../../components/core/Button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { ButtonDimensions } from "../../constant/button";
import { ThemeVariants } from "../../constant/colors";
import {
  hasSession,
  setSessionUser,
  setToken,
} from "../../services/auth/session";
import { HttpError } from "../../services/client/httpClient";

const WRONG_CREDENTIALS = "Credenziali errate";

export function CashierLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();

  //Già dentro: niente login una seconda volta
  if (hasSession()) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setError("");
    login(
      { username: username.trim(), password },
      {
        onSuccess: ({ success, token, user }) => {
          if (success && token) {
            setToken(token);
            //se il backend non lo manda, l'area del personale lo chiede con /api/auth/me
            if (user) setSessionUser(user);
            navigate("/dashboard", { replace: true });
          } else {
            setPassword("");
            setError(WRONG_CREDENTIALS);
          }
        },
        onError: (err) => {
          setPassword("");
          setError(
            err instanceof HttpError && [401, 403].includes(err.status)
              ? WRONG_CREDENTIALS
              : "Accesso non riuscito: controlla la connessione e riprova",
          );
        },
      },
    );
  };

  return (
    <Container additionalClass="flex">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm m-auto p-6 sm:p-8 flex flex-col gap-4"
      >
        <Label
          label="Accesso personale"
          tag={LabelTags.h1}
          weight={LabelWeight.bold}
          color={ThemeVariants.colors.text.brand}
          size={LabelDimensions.xlarge}
          fontFamily={ThemeVariants.fontFamily.display}
          noMargin
        />
        <Input
          type="text"
          name="username"
          placeholder="Username"
          value={username}
          setValue={setUsername}
          autoComplete="username"
          maxLength={100}
          required
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          setValue={setPassword}
          autoComplete="current-password"
          maxLength={200}
          required
        />
        {error && (
          <p
            role="alert"
            className={`font-semibold ${ThemeVariants.colors.text.danger}`}
          >
            {error}
          </p>
        )}
        <Button
          type="submit"
          label={isPending ? "Accesso…" : "Accedi"}
          dimension={ButtonDimensions.auto}
          fullWidth
          variant="primary"
          disabled={isPending}
          className="h-11 disabled:opacity-60 disabled:cursor-wait"
        />
        <Link
          to="/"
          className={`text-sm text-center underline underline-offset-4 ${ThemeVariants.colors.text.secondary}`}
        >
          Torna al sito dei clienti
        </Link>
      </form>
    </Container>
  );
}
