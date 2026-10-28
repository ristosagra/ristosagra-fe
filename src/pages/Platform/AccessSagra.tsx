import { useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { Input } from "../../components/core/Input";
import { Button } from "../../components/core/Button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { ButtonDimensions } from "../../constant/button";
import { ThemeVariants } from "../../constant/colors";
import { ROOT_DOMAIN } from "../../constant/env";
import { sagraUrl } from "../../helpers/site";
import { normalizeSlugInput } from "../../features/platform/utils/slug";

//Accesso a una sagra già registrata: si scrive il suo indirizzo e si va alla sua login
export const AccessSagra = () => {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const slug = normalizeSlugInput(address, ROOT_DOMAIN);
    if (!slug) return setError("Scrivi l'indirizzo della tua sagra");
    window.location.assign(sagraUrl(slug, "/login"));
  };

  return (
    <Container additionalClass="flex">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm m-auto p-6 sm:p-8 flex flex-col gap-4"
      >
        <Label
          label="Accedi alla tua sagra"
          tag={LabelTags.h1}
          weight={LabelWeight.bold}
          color={ThemeVariants.colors.text.brand}
          size={LabelDimensions.xlarge}
          fontFamily={ThemeVariants.fontFamily.display}
          noMargin
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              name="sagra"
              placeholder="nomesagra"
              ariaLabel="Indirizzo della tua sagra"
              value={address}
              setValue={(v) => {
                setAddress(v);
                setError("");
              }}
              autoComplete="off"
              maxLength={200}
              className="flex-1 min-w-0"
              required
            />
            <span className={`shrink-0 ${ThemeVariants.colors.text.secondary}`}>
              .{ROOT_DOMAIN}
            </span>
          </div>
          {error && (
            <p
              role="alert"
              className={`text-sm font-semibold ${ThemeVariants.colors.text.danger}`}
            >
              {error}
            </p>
          )}
        </div>
        <Button
          type="submit"
          label="Vai alla login"
          dimension={ButtonDimensions.auto}
          fullWidth
          variant="primary"
          className="h-11"
        />
        <Link
          to="/registrati"
          className={`text-sm text-center underline underline-offset-4 ${ThemeVariants.colors.text.secondary}`}
        >
          Non hai ancora una sagra? Registrala
        </Link>
        <Link
          to="/"
          className={`text-sm text-center underline underline-offset-4 ${ThemeVariants.colors.text.secondary}`}
        >
          Torna alla presentazione
        </Link>
      </form>
    </Container>
  );
};
